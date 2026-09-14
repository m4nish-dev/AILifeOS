// AudioWorklet for downsampling and converting to 16kHz linear16 PCM

class MicProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Int16Array(320); // 20ms at 16000Hz = 320 samples
    this.bufferIndex = 0;
    this.sampleRateOutput = 16000;
    this.lastSample = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0 && input[0].length > 0) {
      const channelData = input[0];
      const inputSampleRate = sampleRate; // provided by AudioWorkletGlobalScope
      
      const ratio = inputSampleRate / this.sampleRateOutput;
      
      let energySum = 0;

      for (let i = 0; i < channelData.length; i += ratio) {
        // Simple linear interpolation
        const index = Math.floor(i);
        const fraction = i - index;
        const s1 = channelData[index];
        const s2 = index + 1 < channelData.length ? channelData[index + 1] : this.lastSample;
        
        let sample = s1 + fraction * (s2 - s1);
        
        // Calculate energy
        energySum += sample * sample;

        // Convert to int16
        sample = Math.max(-1, Math.min(1, sample)); // clamp
        sample = sample < 0 ? sample * 32768 : sample * 32767;
        
        this.buffer[this.bufferIndex++] = sample;
        
        if (this.bufferIndex >= 320) {
          // Calculate RMS for the frame
          const rms = Math.sqrt(energySum / 320);
          
          // Send to main thread
          this.port.postMessage({
            event: 'data',
            buffer: this.buffer.slice().buffer,
            rms: rms
          }, [this.buffer.slice().buffer]);
          
          this.bufferIndex = 0;
          energySum = 0;
        }
      }
      
      this.lastSample = channelData[channelData.length - 1];
    }
    
    return true; // Keep alive
  }
}

registerProcessor('mic-processor', MicProcessor);
