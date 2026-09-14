import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import './NoteOverlay.css';

// Using a custom event pattern for Phase 3 since we don't have the full DataStore yet
// The clientToolExecutor will dispatch a 'voice-open-note' event.
export const NoteOverlay = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteTitle, setNoteTitle] = useState('');

  useEffect(() => {
    const handleOpenNote = (e) => {
      setNoteTitle(e.detail?.title || 'Voice Note');
      setNoteContent(e.detail?.content || 'Loading content...');
      setIsOpen(true);
    };

    window.addEventListener('voice-open-note', handleOpenNote);
    return () => window.removeEventListener('voice-open-note', handleOpenNote);
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="note-overlay-backdrop">
          <motion.div 
            className="note-overlay-panel"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
          >
            <div className="note-overlay-header">
              <h3>{noteTitle}</h3>
              <button onClick={() => setIsOpen(false)}><X size={24} /></button>
            </div>
            <div className="note-overlay-body">
              <p>{noteContent}</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
