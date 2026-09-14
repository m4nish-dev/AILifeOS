import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useVoiceAgent } from '../../hooks/useVoiceAgent';
import { ToolCallChip } from './ToolCallChip';

export const TranscriptFeed = () => {
  const { transcript, state } = useVoiceAgent();
  const feedRef = useRef(null);
  
  // Auto-scroll logic
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [transcript, state]);

  return (
    <div 
      className="transcript-feed" 
      ref={feedRef}
      aria-live="polite"
    >
      {transcript.map((msg, i) => (
        <motion.div 
          key={msg.id || i}
          className={`chat-bubble bubble-${msg.role}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.14 }}
        >
          {msg.role === 'agent' ? (
            <TypewriterText text={msg.text} />
          ) : (
            msg.text
          )}
          {msg.toolCalls && msg.toolCalls.map(tc => (
            <ToolCallChip key={tc.id} toolName={tc.name} />
          ))}
        </motion.div>
      ))}

      {state === 'thinking' && (
        <div className="chat-bubble bubble-agent typing-indicator">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      )}
    </div>
  );
};

// Simple typewriter effect matching TTS roughly
const TypewriterText = ({ text }) => {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    let index = 0;
    setDisplayed('');
    
    // Roughly 40ms per character to mimic speech rate
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayed(text.substring(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [text]);

  return <span>{displayed}</span>;
};
