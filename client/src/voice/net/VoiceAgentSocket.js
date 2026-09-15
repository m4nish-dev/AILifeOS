import { WS_URL } from '../config';

export class VoiceAgentSocket extends EventTarget {
  constructor() {
    super();
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxRetries = 4;
    this.keepAliveInterval = null;
    this.pingInterval = null;
    this.intentionalClose = false;
    this.lastPong = Date.now();
  }

  connect(initialSettingsPayload = null) {
    this.intentionalClose = false;
    this.lastPong = Date.now();
    
    try {
      this.ws = new WebSocket(WS_URL);
      this.ws.binaryType = 'arraybuffer';
      
      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.emit('connected');
        
        // Start Deepgram KeepAlive
        this.keepAliveInterval = setInterval(() => {
          this.sendJSON({ type: 'KeepAlive' });
        }, 8000);

        // Start Client-Server Ping
        this.pingInterval = setInterval(() => {
          if (Date.now() - this.lastPong > 35000) {
            // Stale connection detected (>35s without pong)
            console.warn('[VoiceAgentSocket] Stale connection, forcing reconnect');
            this.ws.close();
          } else {
            this.sendJSON({ type: 'ping' });
          }
        }, 15000);

        // If we have an initial payload (e.g. from /session), send it now
        if (initialSettingsPayload) {
          this.ws.send(JSON.stringify(initialSettingsPayload));
        }
      };

      this.ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          this.emit('audio', event.data);
        } else {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'pong') {
              this.lastPong = Date.now();
            } else {
              this.handleJSONMessage(msg);
            }
          } catch (e) {
            console.error('[VoiceAgentSocket] Failed to parse message', e);
          }
        }
      };

      this.ws.onclose = (e) => {
        this.cleanup();
        this.emit('disconnected');
        
        if (!this.intentionalClose && this.reconnectAttempts < this.maxRetries) {
          const backoff = Math.pow(2, this.reconnectAttempts) * 400;
          this.reconnectAttempts++;
          setTimeout(() => this.connect(initialSettingsPayload), backoff);
        } else if (!this.intentionalClose) {
          this.emit('error', new Error('WS_CONNECT_FAILED'));
        }
      };

      this.ws.onerror = (e) => {
        this.emit('error', new Error('WebSocket connection error'));
      };

    } catch (e) {
      this.emit('error', e);
    }
  }

  handleJSONMessage(msg) {
    switch (msg.type) {
      case 'Welcome':
      case 'SettingsApplied':
        this.emit('ready');
        break;
      
      case 'UserStartedSpeaking':
        this.emit('barge_in');
        break;
        
      case 'ConversationText':
        this.emit('transcript', msg);
        break;
        
      case 'AgentThinking':
        this.emit('state', 'thinking');
        break;
        
      case 'AgentStartedSpeaking':
        this.emit('state', 'speaking');
        break;
        
      case 'AgentAudioDone':
        this.emit('state', 'listening');
        break;
        
      case 'client_tool_request':
        this.emit('tool_request', msg);
        break;
        
      case 'Error':
        this.emit('error', new Error(msg.message || 'Deepgram Error'));
        break;
        
      case 'Warning':
        console.warn('[VoiceAgentSocket] Warning:', msg);
        break;
    }
  }

  sendAudio(arrayBuffer) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(arrayBuffer);
    }
  }

  sendJSON(obj) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj));
    }
  }

  disconnect() {
    this.intentionalClose = true;
    this.cleanup();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  cleanup() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  emit(eventName, detail = null) {
    this.dispatchEvent(new CustomEvent(eventName, { detail }));
  }
}
