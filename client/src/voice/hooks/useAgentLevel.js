import { useVoiceAgent } from './useVoiceAgent';

/**
 * Returns the current audio level of the agent (0.0 to 1.0)
 * for use in orb animations or visualizers.
 */
export const useAgentLevel = () => {
  const { agentLevel } = useVoiceAgent();
  return agentLevel;
};
