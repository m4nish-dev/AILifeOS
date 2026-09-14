import { logger } from './logger.js';

export const measureLatency = (startTime, label = 'Operation') => {
  const duration = Date.now() - startTime;
  
  if (duration > 800 && label.includes('First Audio')) {
    logger.warn(`[Latency Warning] ${label} took ${duration}ms (Target: <500ms)`);
  } else {
    logger.debug(`[Latency] ${label}: ${duration}ms`);
  }
  
  return duration;
};

export const startTimer = () => Date.now();
