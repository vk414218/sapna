
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
          let attempts = 0;
          const maxAttempts = 100; // 10 seconds total (100 * 100ms)
          const checkInterval = setInterval(() => {
            attempts++;
            const rs = webrtcService.getRemoteStream();
            if (rs && remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = rs;
              setIsConnecting(false);
              startTimer();
              clearInterval(checkInterval);
            } else if (attempts >= maxAttempts) {
              clearInterval(checkInterval);
              console.warn('Remote stream not received within timeout');
            }
          }, 100);
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
              <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.68-1.36-2.66-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
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
