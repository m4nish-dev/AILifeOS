import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { VoiceAgentProvider } from '../context/VoiceAgentContext';
import { UserProfileProvider } from '../context/UserProfileContext';
import { VoiceOrb } from './VoiceOrb/VoiceOrb';
import { TranscriptRibbon } from './TranscriptRibbon/TranscriptRibbon';
import { OrbSettingsPopover } from './OrbSettingsPopover/OrbSettingsPopover';
import { NoteOverlay } from './NoteOverlay/NoteOverlay';
import { LatencyHUD } from './LatencyHUD/LatencyHUD';
import { useVoiceAgent } from '../hooks/useVoiceAgent';

const GlobalShortcuts = () => {
  const { toggleMic } = useVoiceAgent();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Spacebar to toggle mic if focus is not on input
      if (e.code === 'Space') {
        const activeTag = document.activeElement?.tagName?.toLowerCase();
        const isInput = activeTag === 'input' || activeTag === 'textarea' || document.activeElement?.isContentEditable;
        
        if (!isInput) {
          e.preventDefault();
          toggleMic();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleMic]);
  
  return null;
};

export const VoiceMount = () => {
  const [mounted, setMounted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <UserProfileProvider>
      <VoiceAgentProvider>
        <GlobalShortcuts />
        
        {/* Floating Voice UI Wrapper */}
        <div className="voice-orb-wrapper">
          <TranscriptRibbon />
          
          <div style={{ position: 'relative' }}>
            <OrbSettingsPopover 
              isOpen={settingsOpen}
              onClose={() => setSettingsOpen(false)}
            />
            <VoiceOrb 
              onOpenSettings={() => setSettingsOpen(prev => !prev)}
            />
          </div>
        </div>

        <NoteOverlay />
        <LatencyHUD />
      </VoiceAgentProvider>
    </UserProfileProvider>,
    document.body
  );
};
