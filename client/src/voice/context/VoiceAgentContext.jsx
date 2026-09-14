import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MicStreamer } from '../audio/MicStreamer';
import { AgentAudioPlayer } from '../audio/AgentAudioPlayer';
import { VoiceAgentSocket } from '../net/VoiceAgentSocket';
import { executeClientTool } from '../tools/clientToolExecutor';
import { UserProfileContext } from './UserProfileContext';
import { API_BASE } from '../config';

export const VoiceAgentContext = createContext(null);

export const VoiceAgentProvider = ({ children }) => {
  const { profile } = useContext(UserProfileContext);
  const navigate = useNavigate();

  const [state, setState] = useState('idle'); // idle, connecting, listening, thinking, speaking, error
  const [transcript, setTranscript] = useState([]);
  const [error, setError] = useState(null);
  
  const [agentLevel, setAgentLevel] = useState(0);

  const socketRef = useRef(null);
  const micRef = useRef(null);
  const playerRef = useRef(null);
  const sessionIdRef = useRef(null);

  // Initialize refs
  if (!socketRef.current) socketRef.current = new VoiceAgentSocket();
  if (!micRef.current) micRef.current = new MicStreamer();
  if (!playerRef.current) playerRef.current = new AgentAudioPlayer();

  useEffect(() => {
    const socket = socketRef.current;
    const player = playerRef.current;
    const mic = micRef.current;

    // --- Audio Player Events ---
    player.onLevel(setAgentLevel);

    // --- Socket Events ---
    const onConnected = () => setState('connecting');
    const onReady = () => setState('listening');
    const onStateChange = (e) => setState(e.detail);
    
    const onBargeIn = () => {
      player.flush();
      setState('listening');
    };

    const onAudio = (e) => {
      // Audio buffer from server (Deepgram -> Server -> Client)
      player.enqueue(e.detail);
    };

    const onTranscript = (e) => {
      const msg = e.detail;
      setTranscript(prev => [...prev, {
        id: msg.id || Date.now().toString(),
        role: msg.role,
        text: msg.content,
        ts: Date.now()
      }]);
    };

    const onToolRequest = async (e) => {
      const req = e.detail;
      // req = { call_id, name, args }
      const res = await executeClientTool(req.call_id, req.name, req.args, navigate);
      // Send result back
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
  }, [navigate, state]);

  const connect = async () => {
    try {
      setError(null);
      setState('connecting');
      
      // 1. Fetch initial session settings from HTTP
      const res = await fetch(`${API_BASE}/api/voice/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'local-user', // Mock user for now
          userName: profile.userName,
          context: {}, // Ideally, inject current dashboard state
          isFirstLogin: !profile.firstLoginDone
        })
      });

      if (!res.ok) throw new Error('Failed to create voice session');
      
      const data = await res.json();
      sessionIdRef.current = data.sessionId;

      // 2. Start Microphone
      micRef.current.onFrame((buffer) => {
        if (state === 'listening' || state === 'thinking' || state === 'speaking') {
          socketRef.current.sendAudio(buffer);
        }
      });
      await micRef.current.start();

      // 3. Connect WebSocket with the settings payload Deepgram needs
      socketRef.current.connect(data.initialSettings);

    } catch (err) {
      console.error(err);
      setError(err.message);
      setState('error');
    }
  };

  const disconnect = () => {
    socketRef.current.disconnect();
    micRef.current.stop();
    playerRef.current.flush();
    setState('idle');
    sessionIdRef.current = null;
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
    socketRef.current.sendJSON({ type: 'stop' }); // Signals backend/Deepgram to halt generation
    setState('listening');
  };

  const clearTranscript = () => setTranscript([]);

  return (
    <VoiceAgentContext.Provider value={{
      state,
      transcript,
      error,
      agentLevel,
      toggleMic,
      connect,
      disconnect,
      interrupt,
      clearTranscript
    }}>
      {children}
    </VoiceAgentContext.Provider>
  );
};
