export class MicStreamer {
  constructor() {
    this.stream = null;
    this.context = null;
    this.source = null;
    this.workletNode = null;
    this.onFrameCallback = null;
    this.onEnergyCallback = null;
  }

  onFrame(cb) {
    this.onFrameCallback = cb;
  }

  onEnergy(cb) {
    this.onEnergyCallback = cb;
  }

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.context = new (window.AudioContext || window.webkitAudioContext)();
      
      // Load the worklet
      // Note: we can create an ObjectURL to bypass path issues in Vite
      const workletCode = `
        class MicProcessor extends AudioWorkletProcessor {
          constructor() {
            super();
            this.buffer = new Int16Array(320);
            this.bufferIndex = 0;
            this.sampleRateOutput = 16000;
            this.lastSample = 0;
          }
          process(inputs) {
            const input = inputs[0];
            if (input.length > 0 && input[0].length > 0) {
              const channelData = input[0];
              const ratio = sampleRate / this.sampleRateOutput;
              let energySum = 0;
              for (let i = 0; i < channelData.length; i += ratio) {
                const index = Math.floor(i);
                const fraction = i - index;
                const s1 = channelData[index];
                const s2 = index + 1 < channelData.length ? channelData[index + 1] : this.lastSample;
                let sample = s1 + fraction * (s2 - s1);
                energySum += sample * sample;
                sample = Math.max(-1, Math.min(1, sample));
                sample = sample < 0 ? sample * 32768 : sample * 32767;
                this.buffer[this.bufferIndex++] = sample;
                if (this.bufferIndex >= 320) {
                  const rms = Math.sqrt(energySum / 320);
                  const bufferCopy = this.buffer.slice().buffer;
                  this.port.postMessage({ event: 'data', buffer: bufferCopy, rms }, [bufferCopy]);
                  this.bufferIndex = 0;
                  energySum = 0;
                }
              }
              this.lastSample = channelData[channelData.length - 1];
            }
            return true;
          }
        }
        registerProcessor('mic-processor', MicProcessor);
      `;
      const blob = new Blob([workletCode], { type: 'application/javascript' });
      const workletUrl = URL.createObjectURL(blob);

      await this.context.audioWorklet.addModule(workletUrl);
      
      this.source = this.context.createMediaStreamSource(this.stream);
      this.workletNode = new AudioWorkletNode(this.context, 'mic-processor');
      
      this.workletNode.port.onmessage = (e) => {
        if (e.data.event === 'data') {
          if (this.onFrameCallback) this.onFrameCallback(e.data.buffer);
          if (this.onEnergyCallback) this.onEnergyCallback(e.data.rms);
        }
      };

      this.source.connect(this.workletNode);
      this.workletNode.connect(this.context.destination); // Required to pull data in Chrome
      
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Microphone access denied. Please allow access.');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No microphone found on this device.');
      } else {
        throw new Error(`Mic error: ${error.message}`);
      }
    }
  }

  stop() {
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.context) {
      this.context.close();
      this.context = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
  }
}
