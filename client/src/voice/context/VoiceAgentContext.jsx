import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MicStreamer } from '../audio/MicStreamer';
import { AgentAudioPlayer } from '../audio/AgentAudioPlayer';
import { VoiceAgentSocket } from '../net/VoiceAgentSocket';
import { executeClientTool } from '../tools/clientToolExecutor';
import { UserProfileContext } from './UserProfileContext';
import { API_BASE } from '../config';
import { buildDashboardSnapshot } from './dashboardSnapshot';

export const VoiceAgentContext = createContext(null);

export const VoiceAgentProvider = ({ children }) => {
  const { profile, updateProfile } = useContext(UserProfileContext);
  const navigate = useNavigate();

  const [state, setState] = useState('idle');
  const [transcript, setTranscript] = useState([]);
  const [error, setError] = useState(null);
  
  const [agentLevel, setAgentLevel] = useState(0);
  const [latencyMetrics, setLatencyMetrics] = useState({ turnId: 0, firstAudioMs: 0, totalTurnMs: 0 });

  const socketRef = useRef(null);
  const micRef = useRef(null);
  const playerRef = useRef(null);
  const sessionIdRef = useRef(null);
  const lastContextUpdateRef = useRef(0);
  
  // Latency trackers
  const timingRef = useRef({
    thinkingStart: 0,
    firstAudio: 0,
    turnId: 0
  });

  // Initialize refs
  if (!socketRef.current) socketRef.current = new VoiceAgentSocket();
  if (!micRef.current) micRef.current = new MicStreamer();
  if (!playerRef.current) playerRef.current = new AgentAudioPlayer();

  // Load Transcript History on session change
  useEffect(() => {
    if (sessionIdRef.current) {
      const saved = localStorage.getItem(`ailifeos_agent_history_${sessionIdRef.current}`);
      if (saved) {
        try { setTranscript(JSON.parse(saved)); } catch (e) {}
      }
    }
  }, [sessionIdRef.current]);

  // Persist Transcript History
  useEffect(() => {
    if (sessionIdRef.current && transcript.length > 0) {
      // Keep last 50 turns
      const recent = transcript.slice(-50);
      localStorage.setItem(`ailifeos_agent_history_${sessionIdRef.current}`, JSON.stringify(recent));
    }
  }, [transcript]);

  // Context Syncing (throttled)
  useEffect(() => {
    if (state === 'listening' && socketRef.current?.socket?.readyState === WebSocket.OPEN) {
      const now = Date.now();
      if (now - lastContextUpdateRef.current > 4000) {
        const snapshot = buildDashboardSnapshot();
        socketRef.current.sendJSON({
          type: 'update_prompt_context',
          snapshot
        });
        lastContextUpdateRef.current = now;
      }
    }
  }, [transcript, state]);

  // Main Socket & Audio Event Wiring
  useEffect(() => {
    const socket = socketRef.current;
    const player = playerRef.current;
    const mic = micRef.current;

    player.onLevel(setAgentLevel);

    const onConnected = () => setState('connecting');
    const onReady = () => setState('listening');
    const onStateChange = (e) => {
      const newState = e.detail;
      setState(newState);
      
      const now = Date.now();
      if (newState === 'thinking') {
        timingRef.current.thinkingStart = now;
        timingRef.current.firstAudio = 0;
        timingRef.current.turnId++;
      } else if (newState === 'speaking' && timingRef.current.thinkingStart > 0 && timingRef.current.firstAudio === 0) {
        timingRef.current.firstAudio = now;
        const firstAudioMs = now - timingRef.current.thinkingStart;
        if (firstAudioMs > 800) console.warn(`[Latency] High TTFB: ${firstAudioMs}ms`);
        setLatencyMetrics(prev => ({ ...prev, turnId: timingRef.current.turnId, firstAudioMs }));
      } else if (newState === 'listening' && timingRef.current.firstAudio > 0) {
        const totalTurnMs = now - timingRef.current.thinkingStart;
        setLatencyMetrics(prev => ({ ...prev, totalTurnMs }));
        console.log(`[Latency] Turn ${timingRef.current.turnId}: TTFB=${timingRef.current.firstAudio - timingRef.current.thinkingStart}ms, Total=${totalTurnMs}ms`);
        timingRef.current.thinkingStart = 0;
      }

      if (newState === 'idle') {
        // If agent just finished speaking a first-login greeting
        if (!profile.firstLoginDone) {
          updateProfile({ firstLoginDone: true });
        }
      }
    };
    
    const onBargeIn = () => {
      player.flush();
      setState('listening');
    };

    const onAudio = (e) => player.enqueue(e.detail);

    const onTranscript = (e) => {
      const msg = e.detail;
      setTranscript(prev => [...prev, {
        id: msg.id || Date.now().toString(),
        role: msg.role,
        text: msg.content,
        ts: Date.now(),
        toolCalls: msg.toolCalls
      }]);
    };

    const onToolRequest = async (e) => {
      const req = e.detail;
      const res = await executeClientTool(req.call_id, req.name, req.args, navigate);
      
      // If it's set_user_name, update profile
      if (req.name === 'set_user_name' && req.args?.name) {
        updateProfile({ userName: req.args.name });
      }

      setTranscript(prev => [...prev, {
        id: req.call_id || Date.now().toString(),
        role: 'tool',
        name: req.name,
        args: req.args,
        result: res?.result,
        actionId: res?.actionId,
        ts: Date.now()
      }]);

      socket.sendJSON({
        type: 'client_tool_result',
        ...res
      });
    };

    const onError = (e) => {
      setState('error');
      setError(e.detail.message || 'Unknown voice error');
    };

    const onDisconnected = () => {
      if (state !== 'error') setState('idle');
    };

    const onTestVoiceInjection = (e) => {
      if (socketRef.current?.ws?.readyState === WebSocket.OPEN) {
        socketRef.current.sendJSON({
          type: 'InjectAgentMessage',
          content: e.detail
        });
      }
    };

    window.addEventListener('test-voice-injection', onTestVoiceInjection);
    socket.addEventListener('connected', onConnected);
    socket.addEventListener('ready', onReady);
    socket.addEventListener('state', onStateChange);
    socket.addEventListener('barge_in', onBargeIn);
    socket.addEventListener('audio', onAudio);
    socket.addEventListener('transcript', onTranscript);
    socket.addEventListener('tool_request', onToolRequest);
    socket.addEventListener('error', onError);
    socket.addEventListener('disconnected', onDisconnected);

    return () => {
      window.removeEventListener('test-voice-injection', onTestVoiceInjection);
      socket.removeEventListener('connected', onConnected);
      socket.removeEventListener('ready', onReady);
      socket.removeEventListener('state', onStateChange);
      socket.removeEventListener('barge_in', onBargeIn);
      socket.removeEventListener('audio', onAudio);
      socket.removeEventListener('transcript', onTranscript);
      socket.removeEventListener('tool_request', onToolRequest);
      socket.removeEventListener('error', onError);
      socket.removeEventListener('disconnected', onDisconnected);
    };
  }, [navigate, state, profile.firstLoginDone]);

  const connect = async () => {
    try {
      setError(null);
      setState('connecting');
      
      const isFirstLogin = !profile.firstLoginDone;
      const todayDateStr = new Date().toDateString();
      const lastGreetDate = localStorage.getItem('ailifeos_last_greet_date');
      const needsDailyGreet = !isFirstLogin && (lastGreetDate !== todayDateStr);
      
      const snapshot = buildDashboardSnapshot();

      const res = await fetch(`${API_BASE}/api/voice/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'local-user',
          userName: profile.userName,
          context: snapshot,
          isFirstLogin
        })
      });

      if (!res.ok) throw new Error('Failed to create voice session');
      
      const data = await res.json();
      sessionIdRef.current = data.sessionId;

      const bargeInFramesRequired = Math.ceil(180 / 20); // 180ms at 20ms chunks = 9 frames
      let loudFramesCount = 0;
      let lastAgentSpeakTime = 0;

      playerRef.current.onAudioPlayed = () => {
        lastAgentSpeakTime = Date.now();
      };

      micRef.current.onEnergy((rms) => {
        // Debounce: wait 300ms after agent stops speaking
        if (state === 'speaking' && Date.now() - lastAgentSpeakTime > 300) {
          if (rms > 0.05) {
            loudFramesCount++;
            if (loudFramesCount >= bargeInFramesRequired) {
              console.log('[VoiceAgentContext] Local barge-in triggered via RMS');
              playerRef.current.flush();
              setState('listening');
              socketRef.current.sendJSON({ type: 'stop' });
              loudFramesCount = 0;
            }
          } else {
            loudFramesCount = 0;
          }
        } else {
          loudFramesCount = 0;
        }
      });

      micRef.current.onFrame((buffer) => {
        if (state === 'listening' || state === 'thinking' || state === 'speaking') {
          socketRef.current.sendAudio(buffer);
        }
      });
      await micRef.current.start();

      socketRef.current.connect(data.initialSettings);

      // Handle greetings after a short delay so connection stabilizes
      if (isFirstLogin || needsDailyGreet) {
        setTimeout(async () => {
          try {
            const greetRes = await fetch(`${API_BASE}/api/agent/greet`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: 'local-user',
                isFirstLogin,
                userName: profile.userName,
                context: snapshot
              })
            });
            const greetData = await greetRes.json();
            
            if (greetData.reply) {
              socketRef.current.sendJSON({
                type: 'InjectAgentMessage',
                content: greetData.reply
              });
              if (!isFirstLogin) {
                localStorage.setItem('ailifeos_last_greet_date', todayDateStr);
              }
            }
          } catch (e) {
            console.error("Failed to fetch greeting:", e);
          }
        }, 1200);
      }

    } catch (err) {
      console.error(err);
      let errorMsg = err.message;
      if (err.message.includes('Microphone access denied')) {
        errorMsg = 'MIC_PERMISSION_DENIED';
      } else if (err.message.includes('No microphone found')) {
        errorMsg = 'MIC_DEVICE_MISSING';
      }
      setError(errorMsg);
      setState('error');
    }
  };

  const disconnect = () => {
    socketRef.current.disconnect();
    micRef.current.stop();
    playerRef.current.flush();
    setState('idle');
  };

  const toggleMic = () => {
    if (state === 'idle' || state === 'error') {
      connect();
    } else {
      disconnect();
    }
  };

  const interrupt = () => {
    playerRef.current.flush();
    socketRef.current.sendJSON({ type: 'stop' });
    setState('listening');
  };

  const clearTranscript = () => {
    setTranscript([]);
    if (sessionIdRef.current) {
      localStorage.removeItem(`ailifeos_agent_history_${sessionIdRef.current}`);
    }
  };

  const undoToolAction = (actionId) => {
    import('../tools/dataStore').then(({ DataStore }) => {
      const success = DataStore.revert(actionId);
      if (success && socketRef.current?.ws?.readyState === WebSocket.OPEN) {
        // Send a hidden message to agent about the undo
        socketRef.current.sendJSON({
          type: 'InjectAgentMessage',
          content: "System note: User undid your last action."
        });
        
        // Mark the action as undone in the transcript
        setTranscript(prev => prev.map(t => 
          t.actionId === actionId 
            ? { ...t, result: { ...t.result, undone: true } } 
            : t
        ));
      }
    });
  };

  return (
    <VoiceAgentContext.Provider value={{
      state,
      transcript,
      error,
      agentLevel,
      latencyMetrics,
      toggleMic,
      connect,
      disconnect,
      interrupt,
      clearTranscript,
      undoToolAction,
      micStreamer: micRef.current
    }}>
      {children}
    </VoiceAgentContext.Provider>
  );
};
