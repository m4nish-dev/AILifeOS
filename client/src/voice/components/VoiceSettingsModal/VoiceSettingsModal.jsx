import React, { useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Trash2, Download } from 'lucide-react';
import { UserProfileContext } from '../../context/UserProfileContext';
import { useVoiceAgent } from '../../hooks/useVoiceAgent';
import { AVAILABLE_VOICES, API_BASE } from '../../config';
import './VoiceSettingsModal.css';

export const VoiceSettingsModal = ({ isOpen, onClose }) => {
  const { profile, updateProfile } = useContext(UserProfileContext);
  const { clearTranscript, transcript, connect, state } = useVoiceAgent();
  
  // Local state for immediate form UI
  const [userName, setUserName] = useState(profile.userName);
  const [agentName, setAgentName] = useState(profile.agentName);
  const [selectedVoice, setSelectedVoice] = useState(profile.preferences?.voice || AVAILABLE_VOICES[0].id);
  const [languageMix, setLanguageMix] = useState(profile.preferences?.languageMix || 0.5);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(profile.preferences?.wakeWordEnabled || false);
  const [showLatencyHUD, setShowLatencyHUD] = useState(profile.preferences?.showLatencyHUD || false);

  const handleSave = () => {
    updateProfile({
      userName,
      agentName,
      preferences: {
        ...profile.preferences,
        voice: selectedVoice,
        languageMix,
        wakeWordEnabled,
        showLatencyHUD
      }
    });
    onClose();
  };

  const testVoice = async () => {
    if (state === 'idle' || state === 'error') {
      await connect();
    }
    // Deepgram injection
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('test-voice-injection', {
        detail: "Namaste, main Nova hoon — kya haal hai?"
      }));
    }, 1000);
  };

  const exportTranscript = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transcript, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `jarvis_transcript_${new Date().toISOString()}.json`);
    dlAnchorElem.click();
  };

  const testConnection = async () => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (res.ok) alert("Connection test successful! Backend is healthy.");
      else alert("Connection test failed. Backend returned error.");
    } catch (e) {
      alert("Connection test failed. Backend unreachable.");
    }
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

              <div className="form-group toggle-group">
                <label>Wake Word ("Nova")</label>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={wakeWordEnabled}
                    onChange={e => setWakeWordEnabled(e.target.checked)}
                  />
                  <span className="slider round"></span>
                </label>
              </div>

              <div className="form-group toggle-group">
                <label>Show Latency HUD</label>
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={showLatencyHUD}
                    onChange={e => setShowLatencyHUD(e.target.checked)}
                  />
                  <span className="slider round"></span>
                </label>
              </div>

              <div className="modal-actions-secondary">
                <button className="btn-secondary" onClick={testConnection}>Test Connection</button>
                <button className="btn-secondary" onClick={clearTranscript}>
                  <Trash2 size={16} /> Clear Conversation
                </button>
                <button className="btn-secondary" onClick={exportTranscript}>
                  <Download size={16} /> Export Transcript
                </button>
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
