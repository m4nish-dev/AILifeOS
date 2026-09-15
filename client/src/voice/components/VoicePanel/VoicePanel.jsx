import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoiceAgent } from '../../hooks/useVoiceAgent';
import { TranscriptFeed } from './TranscriptFeed';
import './VoicePanel.css';
import { Settings, Minimize2, Mic, MicOff, Square, Send } from 'lucide-react';

export const VoicePanel = ({ isOpen, onClose, onOpenSettings }) => {
  const { state, error, toggleMic, interrupt, disconnect } = useVoiceAgent();
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

  const getErrorMessage = (errCode) => {
    switch(errCode) {
      case 'MIC_PERMISSION_DENIED':
        return 'Microphone access denied. Please enable it in your browser settings (usually the lock icon in the URL bar).';
      case 'MIC_DEVICE_MISSING':
        return 'No microphone detected. Please plug one in.';
      case 'MIC_DEVICE_BUSY':
        return 'Microphone is being used by another app.';
      case 'WS_CONNECT_FAILED':
        return 'Connection to voice server failed.';
      default:
        return errCode || 'Voice connection failed.';
    }
  };

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
              <span className="agent-name">Nova</span>
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

          {state === 'error' && (
            <div className="voice-error-banner">
              <p>{getErrorMessage(error)}</p>
              <button className="retry-btn" onClick={toggleMic}>Retry</button>
            </div>
          )}

          <TranscriptFeed />

          <div className="panel-footer">
            <form 
              className="text-input-form"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target;
                const input = form.elements.textInput;
                const text = input.value.trim();
                if (text) {
                  // If we want to send text fallback, dispatch a custom event or call a context method
                  // For now, let's just trigger a custom event that VoiceAgentContext can listen to
                  window.dispatchEvent(new CustomEvent('test-voice-injection', { detail: text }));
                  input.value = '';
                }
              }}
            >
              <input 
                type="text" 
                name="textInput"
                placeholder="Message Nova..." 
                className="voice-text-input"
                aria-label="Text input"
              />
              <button type="submit" className="icon-btn send-btn" aria-label="Send">
                <Send size={18} />
              </button>
            </form>

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
