import { useContext } from 'react';
import { VoiceAgentContext } from '../context/VoiceAgentContext';

export const useVoiceAgent = () => {
  const context = useContext(VoiceAgentContext);
  if (context === null) {
    throw new Error('useVoiceAgent must be used within a VoiceAgentProvider');
  }
  return context;
};
