import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoiceAgent } from '../../hooks/useVoiceAgent';
import { X } from 'lucide-react';
import './OrbSettingsPopover.css';

export const OrbSettingsPopover = ({ isOpen, onClose }) => {
  const { clearTranscript } = useVoiceAgent();
  const [mics, setMics] = useState([]);
  const [selectedMic, setSelectedMic] = useState('');
  const [voiceModel, setVoiceModel] = useState('aura-2-asteria-en');

  useEffect(() => {
    if (isOpen) {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        const audioInputs = devices.filter(d => d.kind === 'audioinput');
        setMics(audioInputs);
        if (audioInputs.length > 0) setSelectedMic(audioInputs[0].deviceId);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="orb-settings-popover"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.15 }}
      >
        <div className="orb-settings-header">
          <h3>Nova Settings</h3>
          <button className="close-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="orb-settings-body">
          <div className="setting-row">
            <label>Microphone</label>
            <select value={selectedMic} onChange={e => setSelectedMic(e.target.value)}>
              {mics.map(m => (
                <option key={m.deviceId} value={m.deviceId}>{m.label || `Mic ${m.deviceId.slice(0,5)}`}</option>
              ))}
            </select>
          </div>

          <div className="setting-row">
            <label>Voice Model</label>
            <select value={voiceModel} onChange={(e) => setVoiceModel(e.target.value)}>
              <option value="aura-2-asteria-en">Asteria (Warm Female)</option>
              <option value="aura-2-luna-en">Luna (Bright Female)</option>
            </select>
          </div>

          <button className="danger-btn" onClick={() => {
            if(window.confirm('Clear conversation history?')) {
              clearTranscript();
              onClose();
            }
          }}>
            Clear Conversation
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
