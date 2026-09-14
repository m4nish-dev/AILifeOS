import React, { useState, useEffect, useRef } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { useVoiceAgent } from '../../hooks/useVoiceAgent';
import { useAgentLevel } from '../../hooks/useAgentLevel';
import './VoiceOrb.css';

export const VoiceOrb = ({ onTogglePanel, onOpenSettings }) => {
  const { state, toggleMic } = useVoiceAgent();
  const agentLevel = useAgentLevel();
  const orbRef = useRef(null);
  
  // Persisted position
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('ailifeos_orb_pos');
    return saved ? JSON.parse(saved) : { x: 0, y: 0 };
  });

  const handleDragEnd = (event, info) => {
    const newPos = { x: position.x + info.offset.x, y: position.y + info.offset.y };
    setPosition(newPos);
    localStorage.setItem('ailifeos_orb_pos', JSON.stringify(newPos));
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

  let statusClass = `orb--${state}`;
  
  return (
    <motion.div
      ref={orbRef}
      className={`voice-orb-container ${statusClass}`}
      drag
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      initial={position}
      animate={position}
      style={{ zIndex: 1000 }}
    >
      <div 
        className="voice-orb"
        role="button"
        aria-label={`Voice Agent: ${state}`}
        tabIndex={0}
        onClick={(e) => {
          // If panel is closed, this opens panel. 
          // Our prop togglePanel is designed to open it. 
          // We can also toggle mic if user double clicks or based on requirement. 
          // Requirement: "On click → toggle mic (or open panel if closed)."
          onTogglePanel();
        }}
        onContextMenu={(e) => {
          e.preventDefault(); // long press / right click
          onOpenSettings();
        }}
        // Keyboard accessibility
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onTogglePanel();
          }
        }}
      >
        <div className="orb-core" />
        
        {state === 'thinking' && (
          <>
            <div className="particle p1" />
            <div className="particle p2" />
            <div className="particle p3" />
          </>
        )}

        {state === 'speaking' && (
          <div className="orb-rings">
            {/* The scale is modulated by agentLevel */}
            <div className="ring r1" style={{ transform: `scale(${1 + agentLevel * 0.8})` }} />
            <div className="ring r2" style={{ transform: `scale(${1 + agentLevel * 0.5})` }} />
            <div className="ring r3" style={{ transform: `scale(${1 + agentLevel * 0.3})` }} />
          </div>
        )}
      </div>
    </motion.div>
  );
};
