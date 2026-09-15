import React, { useContext, useEffect, useState } from 'react';
import { useVoiceAgent } from '../../hooks/useVoiceAgent';
import { UserProfileContext } from '../../context/UserProfileContext';
import './LatencyHUD.css';

export const LatencyHUD = () => {
  const { latencyMetrics } = useVoiceAgent();
  const { profile } = useContext(UserProfileContext);
  
  const [history, setHistory] = useState([]);
  
  useEffect(() => {
    if (latencyMetrics.turnId > 0 && latencyMetrics.firstAudioMs > 0 && latencyMetrics.totalTurnMs > 0) {
      setHistory(prev => {
        // Only add if it's a new turn
        if (prev.find(m => m.turnId === latencyMetrics.turnId)) return prev;
        const next = [...prev, latencyMetrics];
        return next.slice(-5); // keep last 5
      });
    }
  }, [latencyMetrics]);

  if (!profile?.preferences?.showLatencyHUD) return null;

  const avgFirstAudio = history.length > 0 
    ? Math.round(history.reduce((acc, curr) => acc + curr.firstAudioMs, 0) / history.length) 
    : 0;

  return (
    <div className="latency-hud">
      <div className="hud-title">Latency Monitor</div>
      <div className="hud-metric">
        <span>Turn ID:</span> <span>{latencyMetrics.turnId}</span>
      </div>
      <div className="hud-metric">
        <span>TTFB:</span> 
        <span className={latencyMetrics.firstAudioMs > 800 ? 'text-red' : 'text-green'}>
          {latencyMetrics.firstAudioMs}ms
        </span>
      </div>
      <div className="hud-metric">
        <span>Total:</span> <span>{latencyMetrics.totalTurnMs}ms</span>
      </div>
      {history.length > 0 && (
        <div className="hud-metric hud-avg">
          <span>Avg TTFB:</span> <span>{avgFirstAudio}ms</span>
        </div>
      )}
    </div>
  );
};
