export class AgentAudioPlayer {
  constructor() {
    this.context = null;
    this.nextTime = 0;
    this.activeNodes = [];
    this.onPlaybackStartCallback = null;
    this.onPlaybackEndCallback = null;
    this.onLevelCallback = null;
    
    this.isPlaying = false;
    this.levelInterval = null;
  }

  init() {
    if (!this.context) {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.nextTime = this.context.currentTime;
    }
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  onPlaybackStart(cb) { this.onPlaybackStartCallback = cb; }
  onPlaybackEnd(cb) { this.onPlaybackEndCallback = cb; }
  onLevel(cb) { this.onLevelCallback = cb; }

  enqueue(arrayBuffer) {
    this.init();
    
    // Deepgram sends 24000Hz linear16 PCM. We must decode Int16 to Float32.
    const int16Array = new Int16Array(arrayBuffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }

    const audioBuffer = this.context.createBuffer(1, float32Array.length, 24000);
    audioBuffer.getChannelData(0).set(float32Array);

    const source = this.context.createBufferSource();
    source.buffer = audioBuffer;
    
    // Use a GainNode for smooth ramping on barge-in
    const gainNode = this.context.createGain();
    source.connect(gainNode);
    gainNode.connect(this.context.destination);

    // Schedule gap-free
    if (this.nextTime < this.context.currentTime) {
      this.nextTime = this.context.currentTime;
    }
    
    source.start(this.nextTime);
    this.nextTime += audioBuffer.duration;
    
    const nodeRef = { source, gainNode, endTime: this.nextTime };
    this.activeNodes.push(nodeRef);
    
    // Manage playback state
    if (!this.isPlaying) {
      this.isPlaying = true;
      if (this.onPlaybackStartCallback) this.onPlaybackStartCallback();
      this.startLevelMeter();
    }

    // Cleanup node after playback
    source.onended = () => {
      if (this.onAudioPlayed) this.onAudioPlayed();
      
      const idx = this.activeNodes.indexOf(nodeRef);
      if (idx > -1) {
        this.activeNodes.splice(idx, 1);
      }
      
      // If we are out of nodes, trigger end
      if (this.activeNodes.length === 0 && this.isPlaying) {
        // Debounce slightly in case chunks are just arriving
        setTimeout(() => {
          if (this.activeNodes.length === 0 && this.isPlaying) {
            this.isPlaying = false;
            this.stopLevelMeter();
            if (this.onPlaybackEndCallback) this.onPlaybackEndCallback();
          }
        }, 100);
      }
    };
  }

  flush() {
    if (!this.context) return;
    
    const now = this.context.currentTime;
    this.activeNodes.forEach(node => {
      // Ramp down over 30ms to prevent clicks
      node.gainNode.gain.setValueAtTime(node.gainNode.gain.value, now);
      node.gainNode.gain.linearRampToValueAtTime(0, now + 0.03);
      node.source.stop(now + 0.04);
    });
    this.activeNodes = [];
    this.nextTime = now;
    
    this.isPlaying = false;
    this.stopLevelMeter();
  }
  
  startLevelMeter() {
    this.stopLevelMeter();
    // Simulate level for orb since Web Audio AnalyserNode doesn't work well with scheduled sources ahead of time
    // For MVP, we mock an energetic RMS when playing
    this.levelInterval = setInterval(() => {
      if (this.onLevelCallback) {
        const fakeRms = 0.3 + (Math.random() * 0.4); 
        this.onLevelCallback(fakeRms);
      }
    }, 50);
  }

  stopLevelMeter() {
    if (this.levelInterval) {
      clearInterval(this.levelInterval);
      this.levelInterval = null;
    }
    if (this.onLevelCallback) {
      this.onLevelCallback(0);
    }
  }
}
