
import React, { useState, useEffect, useRef } from 'react';
import { CallSession } from '../types';
import { webrtcService } from '../services/webrtcService';

interface CallScreenProps {
  session: CallSession;
  onEnd: () => void;
}

const CallScreen: React.FC<CallScreenProps> = ({ session, onEnd }) => {
  const [callDuration, setCallDuration] = useState(0);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeCall();
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      webrtcService.endCall();
    };
  }, []);

  const initializeCall = async () => {
    try {
      const isVideoCall = session.type === 'video';
      const currentUser = JSON.parse(localStorage.getItem('gemini_current_profile') || '{}');
      const isCaller = session.caller.id === currentUser.id;
      
      // Handle remote stream callback
      const handleRemoteStream = (stream: MediaStream) => {
        console.log('Displaying remote stream');
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
        setIsConnecting(false);
        startTimer();
      };

      if (isCaller) {
        // We're the caller - need to get media and make the call
        console.log('Initiating call as caller');
        
        // Get and display local stream
        const localStream = await webrtcService.getLocalStream({
          video: isVideoCall,
          audio: true
        });
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
        
        // Make the call
        await webrtcService.makeCall(
          session.receiver.id,
          { video: isVideoCall, audio: true },
          handleRemoteStream
        );
      } else {
        // We're the receiver - call was already answered, just display streams
        console.log('Displaying streams as receiver');
        
        // Get local stream from service (already obtained during answerCall)
        const localStream = webrtcService.getCurrentLocalStream();
        if (localStream && localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
        
        // Get remote stream from service (will be set via callback from answerCall)
        const remoteStream = webrtcService.getRemoteStream();
        if (remoteStream && remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          setIsConnecting(false);
          startTimer();
        } else {
          // Wait for remote stream to arrive
          const checkInterval = setInterval(() => {
            const rs = webrtcService.getRemoteStream();
            if (rs && remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = rs;
              setIsConnecting(false);
              startTimer();
              clearInterval(checkInterval);
            }
          }, 100);
          
          // Clear interval after 10 seconds
          setTimeout(() => clearInterval(checkInterval), 10000);
        }
      }

    } catch (error: any) {
      console.error('Failed to initialize call:', error);
      alert(error.message || 'Failed to start call. Please check camera/microphone permissions.');
      onEnd();
    }
  };

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setCallDuration(d => d + 1);
    }, 1000);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleAudio = () => {
    const enabled = webrtcService.toggleAudio();
    setIsAudioMuted(!enabled);
  };

  const handleToggleVideo = () => {
    const enabled = webrtcService.toggleVideo();
    setIsVideoOff(!enabled);
  };

  const handleSwitchCamera = async () => {
    try {
      await webrtcService.switchCamera();
    } catch (error) {
      console.error('Failed to switch camera:', error);
    }
  };

  const handleEndCall = () => {
    webrtcService.endCall();
    onEnd();
  };

  const isVideoCall = session.type === 'video';

  return (
    <div className="fixed inset-0 z-[200] bg-gray-900 flex flex-col">
      {/* Video containers */}
      <div className="flex-1 relative">
        {/* Remote video (full screen) */}
        {isVideoCall && (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Audio call UI */}
        {!isVideoCall && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
            <img 
              src={session.receiver.avatar} 
              className="w-32 h-32 rounded-full mb-6 border-4 border-white/20 animate-pulse"
              alt={session.receiver.name}
            />
            <h2 className="text-white text-2xl font-bold mb-2">
              {session.receiver.name}
            </h2>
            <p className="text-gray-300 text-lg">
              {isConnecting ? 'Calling...' : formatDuration(callDuration)}
            </p>
          </div>
        )}

        {/* Local video (picture-in-picture) */}
        {isVideoCall && (
          <div className="absolute top-4 right-4 w-32 h-48 md:w-40 md:h-60 rounded-lg overflow-hidden border-2 border-white/30 shadow-2xl bg-black">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
          </div>
        )}

        {/* Call info overlay (for video calls) */}
        {isVideoCall && (
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
            <p className="text-white text-sm font-medium">
              {isConnecting ? 'Connecting...' : formatDuration(callDuration)}
            </p>
          </div>
        )}

        {/* Connecting indicator */}
        {isConnecting && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white text-lg">Connecting...</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 md:p-8 bg-gradient-to-t from-black/90 to-transparent">
        <div className="flex items-center justify-center gap-4 md:gap-6 max-w-md mx-auto">
          {/* Toggle Audio */}
          <button
            onClick={handleToggleAudio}
            className={`p-4 md:p-5 rounded-full transition-all shadow-lg ${
              isAudioMuted 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-gray-700/80 hover:bg-gray-600'
            }`}
            title={isAudioMuted ? 'Unmute' : 'Mute'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              {isAudioMuted ? (
                <>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                  <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
                  <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </>
              ) : (
                <>
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </>
              )}
            </svg>
          </button>

          {/* Toggle Video (only for video calls) */}
          {isVideoCall && (
            <button
              onClick={handleToggleVideo}
              className={`p-4 md:p-5 rounded-full transition-all shadow-lg ${
                isVideoOff 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-gray-700/80 hover:bg-gray-600'
              }`}
              title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                {isVideoOff ? (
                  <>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                    <path d="M10.66 5H14a2 2 0 0 1 2 2v2.34l1 1L23 7v10"/>
                    <path d="M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2l10 10z"/>
                  </>
                ) : (
                  <>
                    <polygon points="23 7 16 12 23 17 23 7"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </>
                )}
              </svg>
            </button>
          )}

          {/* End Call */}
          <button
            onClick={handleEndCall}
            className="p-5 md:p-6 bg-red-500 hover:bg-red-600 rounded-full transition-all shadow-lg transform hover:scale-105"
            title="End call"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="white">
              <path d="M23 15.5C23 16.3 22.3 17 21.5 17C20.7 17 20 16.3 20 15.5C20 14.7 20.7 14 21.5 14C22.3 14 23 14.7 23 15.5M2.5 17C1.7 17 1 16.3 1 15.5C1 14.7 1.7 14 2.5 14C3.3 14 4 14.7 4 15.5C4 16.3 3.3 17 2.5 17M12 2C6.5 2 2 6.5 2 12C2 13.8 2.5 15.5 3.4 16.9L2.3 21.7L7.1 20.6C8.5 21.5 10.2 22 12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2M16.6 14.6C16.3 14.8 16 15 15.6 15C15 15 14.4 14.8 13.9 14.5C12.7 13.9 11.3 12.9 10.1 11.7C8.9 10.5 7.9 9.1 7.3 7.9C7 7.4 6.8 6.8 6.8 6.2C6.8 5.8 6.9 5.5 7.2 5.2C7.4 5 7.7 4.8 8 4.8C8.1 4.8 8.3 4.8 8.4 4.8C8.6 4.8 8.8 4.9 8.9 5.3C9.1 5.7 9.6 6.9 9.6 7C9.7 7.1 9.7 7.2 9.6 7.4C9.6 7.5 9.5 7.6 9.4 7.8C9.3 7.9 9.2 8 9.1 8.2C9 8.3 8.9 8.4 9 8.6C9.4 9.2 9.9 9.8 10.5 10.4C11.1 11 11.7 11.5 12.3 11.9C12.5 12 12.6 12 12.8 11.9C12.9 11.8 13.5 11.2 13.7 11C13.8 10.8 14 10.8 14.2 10.9C14.4 11 15.6 11.5 15.8 11.6C16 11.7 16.1 11.7 16.2 11.8C16.2 12 16.2 12.6 16 13.1C15.9 13.6 15.8 14.1 16.6 14.6Z"/>
            </svg>
          </button>

          {/* Switch Camera (only for video calls on mobile) */}
          {isVideoCall && (
            <button
              onClick={handleSwitchCamera}
              className="p-4 md:p-5 bg-gray-700/80 hover:bg-gray-600 rounded-full transition-all shadow-lg md:hidden"
              title="Switch camera"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <polyline points="17 1 21 5 17 9"/>
                <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                <polyline points="7 23 3 19 7 15"/>
                <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallScreen;
