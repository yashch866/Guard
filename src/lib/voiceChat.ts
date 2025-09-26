import { io, Socket } from 'socket.io-client';
import { getAdaptiveConfig } from './config';

class VoiceChat {
  private socket: Socket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private micStream: MediaStream | null = null;
  private isActive: boolean = false;
  private isTransmitting: boolean = false;
  private volume: number = 1.0;
  private gainNode: GainNode | null = null;

  constructor() {
    this.setupSocket();
    this.setupAudioContext();
  }

  private setupSocket() {
    const config = getAdaptiveConfig();
    const voiceUrl = `${config.apiUrl}/voice`;
    console.log('🔌 Setting up voice chat socket connection to:', voiceUrl);
    console.log('🌐 Config:', config);
    
    this.socket = io(voiceUrl, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 5000
    });

    this.socket.on('connect', () => {
      console.log('🔗 Voice chat socket connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Voice chat socket disconnected:', reason);
      this.stopVoiceChat();  // Stop voice chat on disconnect
    });

    this.socket.on('connect_error', (error) => {
      console.error('💥 Voice chat socket connection error:', error);
    });

    this.socket.on('voice_data', this.handleIncomingVoice.bind(this));
    this.socket.on('status_update', (status: { connected_clients: number, active_voice: number }) => {
      console.log('Voice chat status:', status);
    });
  }

  private async setupAudioContext() {
    try {
      this.audioContext = new AudioContext();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.setVolume(this.volume);
    } catch (error) {
      console.error('Failed to create AudioContext:', error);
    }
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume;
    }
  }

  private async setupMicStream() {
    // Clean up any existing streams first
    this.cleanupAudioResources();

    try {
      console.log('Requesting microphone access...');
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
          sampleRate: 44100,
        },
        video: false
      });
      console.log('Microphone access granted');

      // Create a new audio context if needed
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }

      const source = this.audioContext.createMediaStreamSource(this.micStream);
      
      // Check for supported codecs
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      console.log('Using MIME type:', mimeType);
      
      this.mediaRecorder = new MediaRecorder(this.micStream, {
        mimeType: mimeType,
        audioBitsPerSecond: 32000,
      });

      this.mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && this.isTransmitting && this.socket?.connected) {
          try {
            const buffer = await event.data.arrayBuffer();
            const uint8Array = new Uint8Array(buffer);
            console.log(`🎤 TRANSMITTING VOICE: ${uint8Array.length} bytes, socket connected: ${this.socket.connected}`);
            this.socket.emit('voice_data', uint8Array);
          } catch (error) {
            console.error('Error processing audio data:', error);
          }
        } else {
          console.log(`🔇 NOT transmitting - size: ${event.data.size}, transmitting: ${this.isTransmitting}, socket: ${this.socket?.connected}`);
        }
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        this.stopVoiceChat();
      };

      console.log('Starting MediaRecorder...');
      this.mediaRecorder.start(100); // Capture in 100ms chunks
      console.log('MediaRecorder started successfully');
    } catch (error) {
      console.error('Failed to setup mic stream:', error);
      this.cleanupAudioResources();
      throw error;
    }
  }

  private cleanupAudioResources() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {
        console.warn('Error stopping MediaRecorder:', e);
      }
      this.mediaRecorder = null;
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping audio track:', e);
        }
      });
      this.micStream = null;
    }
  }

  private async handleIncomingVoice(data: Uint8Array) {
    if (!this.isActive || this.isTransmitting || !this.audioContext || !this.gainNode) {
      console.log('🔇 Ignoring incoming voice - active:', this.isActive, 'transmitting:', this.isTransmitting);
      return;
    }

    try {
      console.log('🔊 RECEIVING VOICE: ', data.byteLength, 'bytes');
      // Create a new ArrayBuffer and copy the data
      const arrayBuffer = new ArrayBuffer(data.byteLength);
      new Uint8Array(arrayBuffer).set(data);
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.gainNode);
      source.start(0);
      console.log('✅ Voice played successfully');
    } catch (error) {
      console.error('❌ Failed to play incoming voice:', error);
    }
  }

  public async startVoiceChat() {
    if (this.isActive) return;
    
    try {
      await this.setupMicStream();
      this.isActive = true;
      return true;
    } catch (error) {
      console.error('Failed to start voice chat:', error);
      return false;
    }
  }

  public stopVoiceChat() {
    console.log('🛑 Stopping voice chat - was active:', this.isActive, 'was transmitting:', this.isTransmitting);
    this.isActive = false;
    this.isTransmitting = false;
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
        console.log('✅ MediaRecorder stopped');
      } catch (e) {
        console.warn('⚠️ Error stopping MediaRecorder:', e);
      }
      this.mediaRecorder = null;
    }

    if (this.micStream) {
      this.micStream.getTracks().forEach(track => {
        try {
          track.stop();
          console.log('✅ Audio track stopped');
        } catch (e) {
          console.warn('⚠️ Error stopping audio track:', e);
        }
      });
      this.micStream = null;
    }
    
    console.log('✅ Voice chat fully stopped');
  }

  public startTransmitting() {
    if (!this.isActive || !this.socket?.connected) {
      console.log('⚠️ Cannot start transmitting - active:', this.isActive, 'socket connected:', this.socket?.connected);
      return;
    }
    this.isTransmitting = true;
    console.log('🎙️ STARTING voice transmission...');
    this.socket.emit('start_voice');
  }

  public stopTransmitting() {
    if (!this.socket?.connected) {
      console.log('⚠️ Cannot stop transmitting - socket not connected');
      return;
    }
    this.isTransmitting = false;
    console.log('🛑 STOPPING voice transmission...');
    this.socket.emit('stop_voice');
  }

  public isVoiceChatActive() {
    return this.isActive;
  }

  public isSocketConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

// Create a singleton instance
export const voiceChat = new VoiceChat();