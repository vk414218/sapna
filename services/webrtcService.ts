import Peer, { MediaConnection } from 'peerjs';

export interface CallOptions {
  video: boolean;
  audio: boolean;
}

export interface CallerInfo {
  from: {
    id: string;
    name: string;
    avatar: string;
  };
  to: string;
  type: 'video' | 'audio';
  peerId: string;
  timestamp: number;
}

export class WebRTCService {
  private peer: Peer | null = null;
  private currentCall: MediaConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;

  constructor() {
    this.initializePeer();
  }

  // Initialize PeerJS with free public server
  private initializePeer() {
    this.peer = new Peer({
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
        ]
      }
    });

    this.peer.on('open', (id) => {
      console.log('My peer ID is: ' + id);
      // Save peer ID to localStorage for other users to find
      const currentUser = JSON.parse(localStorage.getItem('gemini_current_profile') || '{}');
      if (currentUser.id) {
        localStorage.setItem(`peer_id_${currentUser.id}`, id);
      }
    });

    this.peer.on('error', (err) => {
      console.error('PeerJS error:', err);
    });
  }

  // Get user media (camera/microphone)
  async getLocalStream(options: CallOptions): Promise<MediaStream> {
    // Reuse existing stream if it matches the requirements
    if (this.localStream) {
      const hasVideo = this.localStream.getVideoTracks().length > 0;
      const hasAudio = this.localStream.getAudioTracks().length > 0;
      
      if ((options.video === hasVideo || !options.video) && hasAudio) {
        return this.localStream;
      }
    }

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: options.video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } : false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      return this.localStream;
    } catch (error) {
      console.error('Failed to get local stream:', error);
      throw error;
    }
  }

  // Make outgoing call
  async makeCall(
    targetUserId: string, 
    options: CallOptions,
    onRemoteStream: (stream: MediaStream) => void
  ): Promise<void> {
    if (!this.peer) {
      throw new Error('Peer not initialized');
    }

    // Get target user's peer ID
    const targetPeerId = localStorage.getItem(`peer_id_${targetUserId}`);
    if (!targetPeerId) {
      throw new Error('Target user is not online or peer ID not found');
    }

    // Get local media
    const localStream = await this.getLocalStream(options);

    // Send call signal via localStorage
    const callSignal = {
      from: JSON.parse(localStorage.getItem('gemini_current_profile') || '{}'),
      to: targetUserId,
      type: options.video ? 'video' : 'audio',
      peerId: this.peer.id,
      timestamp: Date.now()
    };
    localStorage.setItem('incoming_call_signal', JSON.stringify(callSignal));
    window.dispatchEvent(new Event('storage'));

    // Make the call
    this.currentCall = this.peer.call(targetPeerId, localStream);

    // Handle remote stream
    this.currentCall.on('stream', (remoteStream: MediaStream) => {
      this.remoteStream = remoteStream;
      onRemoteStream(remoteStream);
    });

    this.currentCall.on('close', () => {
      this.endCall();
    });

    this.currentCall.on('error', (err: any) => {
      console.error('Call error:', err);
      this.endCall();
    });
  }

  // Answer incoming call
  async answerCall(
    incomingCall: MediaConnection,
    options: CallOptions,
    onRemoteStream: (stream: MediaStream) => void
  ): Promise<void> {
    // Get local media
    const localStream = await this.getLocalStream(options);

    // Answer the call
    incomingCall.answer(localStream);

    // Handle remote stream
    incomingCall.on('stream', (remoteStream: MediaStream) => {
      this.remoteStream = remoteStream;
      onRemoteStream(remoteStream);
    });

    incomingCall.on('close', () => {
      this.endCall();
    });

    this.currentCall = incomingCall;
  }

  // Listen for incoming calls
  onIncomingCall(callback: (call: MediaConnection, callerInfo: CallerInfo | null) => void) {
    if (!this.peer) return;

    this.peer.on('call', (call) => {
      // Get caller info from localStorage signal
      const signal = localStorage.getItem('incoming_call_signal');
      const callerInfo: CallerInfo | null = signal ? JSON.parse(signal) : null;
      callback(call, callerInfo);
    });
  }

  // End current call
  endCall() {
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Stop remote stream
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = null;
    }

    // Close call
    if (this.currentCall) {
      this.currentCall.close();
      this.currentCall = null;
    }

    // Clear signal
    localStorage.removeItem('incoming_call_signal');
  }

  // Toggle audio
  toggleAudio() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }

  // Toggle video
  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }

  // Switch camera (front/back)
  async switchCamera() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        // Stop current track
        videoTrack.stop();
        
        // Get opposite camera
        const currentFacingMode = videoTrack.getSettings().facingMode;
        const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
        
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: newFacingMode }
        });
        
        const newVideoTrack = newStream.getVideoTracks()[0];
        this.localStream.removeTrack(videoTrack);
        this.localStream.addTrack(newVideoTrack);
        
        // Update peer connection
        if (this.currentCall && this.currentCall.peerConnection) {
          const sender = this.currentCall.peerConnection
            .getSenders()
            .find((s: any) => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(newVideoTrack);
          }
        }
      }
    }
  }

  // Get current local stream (synchronous)
  getCurrentLocalStream(): MediaStream | null {
    return this.localStream;
  }

  // Get remote stream for display
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  // Check if peer is initialized
  isInitialized(): boolean {
    return this.peer !== null && this.peer.id !== undefined;
  }

  // Get connection stats
  async getConnectionStats(): Promise<any> {
    if (this.currentCall && this.currentCall.peerConnection) {
      const stats = await this.currentCall.peerConnection.getStats();
      return stats;
    }
    return null;
  }

  // Cleanup
  destroy() {
    this.endCall();
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }
}

export const webrtcService = new WebRTCService();
