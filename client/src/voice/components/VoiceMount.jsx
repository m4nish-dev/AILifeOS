import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { VoiceOrb } from './VoiceOrb/VoiceOrb';
import { VoicePanel } from './VoicePanel/VoicePanel';
import { VoiceSettingsModal } from './VoiceSettingsModal/VoiceSettingsModal';
import { NoteOverlay } from './NoteOverlay/NoteOverlay';

export const VoiceMount = () => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return createPortal(
    <>
      <VoiceOrb 
        onTogglePanel={() => setIsPanelOpen(p => !p)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      
      <VoicePanel 
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      
      <VoiceSettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <NoteOverlay />
    </>,
    document.body
  );
};
