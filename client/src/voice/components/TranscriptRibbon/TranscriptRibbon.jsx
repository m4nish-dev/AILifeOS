import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoiceAgent } from '../../hooks/useVoiceAgent';
import './TranscriptRibbon.css';

export const TranscriptRibbon = () => {
  const { transcript, state } = useVoiceAgent();
  const [visibleLines, setVisibleLines] = useState([]);
  const [showInput, setShowInput] = useState(false);
  const [inputText, setInputText] = useState('');

  // Update visible lines based on transcript changes
  useEffect(() => {
    if (transcript.length === 0) return;
    
    // Get last 2 lines
    const recent = transcript.slice(-2);
    setVisibleLines(recent);

    // Auto-hide after 4 seconds
    const timer = setTimeout(() => {
      setVisibleLines([]);
    }, 4000);

    return () => clearTimeout(timer);
  }, [transcript]);

  // Keyboard shortcut to show input (Ctrl+Shift+T)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setShowInput(true);
        setVisibleLines([]); // Clear lines to make room
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleInputSubmit = async (e) => {
    if (e.key === 'Enter' && inputText.trim()) {
      // Basic fallback since sendTextMessage isn't in context
      try {
        await fetch('http://localhost:5001/api/agent/text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: inputText.trim(), sessionId: 'local' })
        });
      } catch (err) {}
      setInputText('');
      setShowInput(false);
    }
    if (e.key === 'Escape') {
      setShowInput(false);
    }
  };

  const toolCalls = transcript.filter(t => t.role === 'tool');

  // if not showing input and no visible lines and no active tool, hide ribbon entirely
  if (!showInput && visibleLines.length === 0 && toolCalls.length === 0 && state === 'idle') {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div 
        className="transcript-ribbon"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
      >
        {showInput ? (
          <input
            autoFocus
            type="text"
            className="ribbon-text-input"
            placeholder="Type to Nova (Press Enter to send)..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleInputSubmit}
            onBlur={() => setShowInput(false)}
          />
        ) : (
          <>
            {visibleLines.map((line) => (
              <div key={line.id} className={`ribbon-line ${line.role}-line`}>
                <div className="ribbon-icon">
                  {line.role === 'user' ? <div className="mic-dot" /> : <div className="agent-dot" />}
                </div>
                <div className="ribbon-text">
                  {line.text}
                </div>
              </div>
            ))}
            
            {/* Show recent tool calls inline */}
            {toolCalls.slice(-1).map(tc => (
              <div key={tc.call_id} className="ribbon-line agent-line">
                <div className="ribbon-tool-chip">
                  ✓ Task: {tc.name}
                  {tc.status === 'success' && <button className="ribbon-undo-btn">Undo</button>}
                </div>
              </div>
            ))}
            
            {state === 'thinking' && visibleLines.length > 0 && visibleLines[visibleLines.length-1].role === 'user' && (
              <div className="ribbon-line agent-line">
                <div className="ribbon-icon"><div className="agent-dot" /></div>
                <div className="ribbon-text" style={{ color: 'var(--text-tertiary)' }}>thinking...</div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
