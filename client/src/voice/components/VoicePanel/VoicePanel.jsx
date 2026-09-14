import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoiceAgent } from '../../hooks/useVoiceAgent';
import { TranscriptFeed } from './TranscriptFeed';
import './VoicePanel.css';
import { Settings, Minimize2, Mic, MicOff, Square, Send } from 'lucide-react';

export const VoicePanel = ({ isOpen, onClose, onOpenSettings }) => {
  const { state, toggleMic, interrupt, disconnect } = useVoiceAgent();
  const isMobile = window.innerWidth < 768;

  // Animation variants
  const panelVariants = {
    hidden: isMobile 
      ? { y: '100%', opacity: 0 }
      : { y: 20, opacity: 0, scale: 0.96 },
    visible: isMobile
      ? { y: 0, opacity: 1 }
      : { y: 0, opacity: 1, scale: 1 },
    exit: isMobile
      ? { y: '100%', opacity: 0 }
      : { y: 20, opacity: 0, scale: 0.96 }
  };

  const dragProps = isMobile ? {
    drag: "y",
    dragConstraints: { top: 0 },
    dragElastic: 0.2,
    onDragEnd: (e, { offset, velocity }) => {
      if (offset.y > 150 || velocity.y > 500) {
        onClose();
      }
    }
  } : {};

  // Keyboard shortcut to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`voice-panel ${isMobile ? 'mobile-sheet' : 'desktop-panel'}`}
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{ zIndex: 999 }}
          {...dragProps}
        >
          {isMobile && <div className="drag-handle" />}
          
          <div className="panel-header">
            <div className="header-left">
              <div className={`status-indicator status-${state}`} />
              <span className="agent-name">Jarvis</span>
            </div>
            <div className="header-right">
              <button className="icon-btn" onClick={onOpenSettings} aria-label="Settings">
                <Settings size={18} />
              </button>
              <button className="icon-btn" onClick={onClose} aria-label="Minimize">
                <Minimize2 size={18} />
              </button>
            </div>
          </div>

          <TranscriptFeed />

          <div className="panel-footer">
            <div className="main-actions">
              <button 
                className={`big-mic-btn ${state !== 'idle' && state !== 'error' ? 'active' : ''}`}
                onClick={toggleMic}
                aria-label={state === 'idle' ? 'Start Voice Agent' : 'Stop Voice Agent'}
              >
                {state === 'idle' || state === 'error' ? <Mic size={24} /> : <MicOff size={24} />}
              </button>
              
              {state === 'speaking' && (
                <button className="interrupt-btn" onClick={interrupt} aria-label="Interrupt">
                  <Square size={20} />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
