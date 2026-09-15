import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useVoiceAgent } from '../../hooks/useVoiceAgent';
import { useAgentLevel } from '../../hooks/useAgentLevel';
import './VoiceOrb.css';

export const VoiceOrb = ({ onOpenSettings }) => {
  const { state, toggleMic, micStreamer } = useVoiceAgent();
  const agentLevel = useAgentLevel();
  const orbRef = useRef(null);
  const [micEnergy, setMicEnergy] = useState(0);
  
  // Persisted position
  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem('ailifeos_orb_position');
      return saved ? JSON.parse(saved) : { x: 0, y: 0 };
    } catch (e) {
      return { x: 0, y: 0 };
    }
  });

  const handleDragEnd = (event, info) => {
    const newPos = { x: position.x + info.offset.x, y: position.y + info.offset.y };
    setPosition(newPos);
    localStorage.setItem('ailifeos_orb_position', JSON.stringify(newPos));
  };

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        toggleMic();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleMic]);

  // Mic Energy for Listening State
  useEffect(() => {
    if (state === 'listening' && micStreamer) {
      const handleEnergy = (e) => setMicEnergy(e.detail);
      micStreamer.addEventListener('onEnergy', handleEnergy);
      return () => micStreamer.removeEventListener('onEnergy', handleEnergy);
    }
  }, [state, micStreamer]);

  // Long press for settings
  let pressTimer = null;
  const handlePointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return; // Only left click
    pressTimer = setTimeout(() => {
      onOpenSettings();
      pressTimer = null;
    }, 500);
  };
  const handlePointerUp = (e) => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
      // It was a short click
      if (Math.abs(e.movementX || 0) < 5 && Math.abs(e.movementY || 0) < 5) {
        toggleMic();
      }
    }
  };

  const statusColorMap = {
    idle: 'gray',
    listening: 'green',
    speaking: 'green',
    thinking: 'amber',
    error: 'red',
    connecting: 'amber'
  };
  const pillColor = statusColorMap[state] || 'gray';

  // Amplitude scaling for speaking rings
  const r1Scale = 1 + agentLevel * 0.9;
  const r2Scale = 1 + agentLevel * 0.6;
  const r3Scale = 1 + agentLevel * 0.3;

  // Micro-shiver for orb core when speaking
  const coreScale = state === 'speaking' ? 1 + (agentLevel * 0.05) : 1;

  // Mic energy scaling for listening rings
  const listenScale = 0.8 + (micEnergy * 2);

  return (
    <motion.div
      ref={orbRef}
      className={`voice-orb-container state-${state}`}
      drag
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      initial={position}
      animate={position}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onContextMenu={(e) => {
        e.preventDefault();
        onOpenSettings();
      }}
    >
      <div 
        className="orb-core"
        style={{ transform: `scale(${coreScale})` }}
      >
        <div className="orb-highlight" />
        
        {state === 'thinking' && (
          <div className="particle-container">
            <div className="particle p1" />
            <div className="particle p2" />
            <div className="particle p3" />
          </div>
        )}
      </div>

      {state === 'speaking' && (
        <div className="speaking-rings">
          <div className="ring" style={{ transform: `scale(${r1Scale})`, opacity: Math.max(0.1, 1 - r1Scale/2) }} />
          <div className="ring" style={{ transform: `scale(${r2Scale})`, opacity: Math.max(0.1, 1 - r2Scale/2) }} />
          <div className="ring" style={{ transform: `scale(${r3Scale})`, opacity: Math.max(0.1, 1 - r3Scale/2) }} />
        </div>
      )}

      {state === 'listening' && (
        <div className="listening-rings">
          <div className="ring" style={{ transform: `scale(${listenScale})` }} />
          <div className="ring" style={{ transform: `scale(${Math.max(0.8, listenScale - 0.5)})` }} />
        </div>
      )}

      <div className={`orb-status-pill status-${pillColor}`} />
    </motion.div>
  );
};
