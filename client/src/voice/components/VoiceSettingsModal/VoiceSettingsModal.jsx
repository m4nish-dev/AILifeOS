import React, { useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play } from 'lucide-react';
import { UserProfileContext } from '../../context/UserProfileContext';
import { AVAILABLE_VOICES } from '../../config';
import './VoiceSettingsModal.css';

export const VoiceSettingsModal = ({ isOpen, onClose }) => {
  const { profile, updateProfile } = useContext(UserProfileContext);
  
  // Local state for immediate form UI
  const [userName, setUserName] = useState(profile.userName);
  const [agentName, setAgentName] = useState(profile.agentName);
  const [selectedVoice, setSelectedVoice] = useState(profile.preferences?.voice || AVAILABLE_VOICES[0].id);
  const [languageMix, setLanguageMix] = useState(profile.preferences?.languageMix || 0.5);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(profile.preferences?.wakeWordEnabled || false);

  const handleSave = () => {
    updateProfile({
      userName,
      agentName,
      preferences: {
        ...profile.preferences,
        voice: selectedVoice,
        languageMix,
        wakeWordEnabled
      }
    });
    onClose();
  };

  const testVoice = () => {
    // For Phase 3 MVP, use browser speech synthesis as a quick mock to verify settings UI works
    if ('speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance("Namaste, I am ready to assist you.");
      // Try to find a Hindi voice if available
      const voices = window.speechSynthesis.getVoices();
      const hiVoice = voices.find(v => v.lang.includes('hi'));
      if (hiVoice) msg.voice = hiVoice;
      window.speechSynthesis.speak(msg);
    }
  };

  const testConnection = async () => {
    alert("Connection test initiated... (Check console)");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-backdrop">
          <motion.div 
            className="settings-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
          >
            <div className="modal-header">
              <h2>Voice Settings</h2>
              <button className="close-btn" onClick={onClose}><X size={20} /></button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Your Name</label>
                <input 
                  type="text" 
                  value={userName} 
                  onChange={e => setUserName(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label>Agent Name</label>
                <input 
                  type="text" 
                  value={agentName} 
                  onChange={e => setAgentName(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label>Voice Model</label>
                <div className="voice-picker">
                  <select 
                    value={selectedVoice} 
                    onChange={e => setSelectedVoice(e.target.value)}
                  >
                    {AVAILABLE_VOICES.map(v => (
                      <option key={v.id} value={v.id}>{v.label}</option>
                    ))}
                  </select>
                  <button className="test-btn" onClick={testVoice}>
                    <Play size={16} /> Test
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Language Mix (Hindi ↔ English)</label>
                <input 
                  type="range" 
                  min="0" max="1" step="0.1" 
                  value={languageMix} 
                  onChange={e => setLanguageMix(parseFloat(e.target.value))} 
                />
                <div className="range-labels">
                  <span>Mostly Hindi</span>
                  <span>Mostly English</span>
                </div>
              </div>

              <div className="form-group">
                <label>Speech Rate (Deepgram Aura API Pending)</label>
                <input type="range" disabled value="0.5" min="0" max="1" />
              </div>

              <div className="form-group toggle-group">
                <label>Wake Word ("Jarvis")</label>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={wakeWordEnabled}
                    onChange={e => setWakeWordEnabled(e.target.checked)}
                  />
                  <span className="slider round"></span>
                </label>
              </div>

              <div className="modal-actions-secondary">
                <button className="btn-secondary" onClick={testConnection}>Test Connection</button>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn-primary" onClick={handleSave}>Save Changes</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
