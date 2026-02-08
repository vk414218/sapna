
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
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  
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
      
      // Handle remote stream
      const handleRemoteStream = (stream: MediaStream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
        setIsConnecting(false);
        startTimer();
      };

      // Get local stream and display it
      const localStream = await webrtcService.getLocalStream({
        video: isVideoCall,
        audio: true
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }

      // If we're the caller, make the call
      const currentUser = JSON.parse(localStorage.getItem('gemini_current_profile') || '{}');
      if (session.caller.id === currentUser.id) {
        await webrtcService.makeCall(
          session.receiver.id,
          { video: isVideoCall, audio: true },
          handleRemoteStream
        );
      }
    } catch (error) {
      console.error('Failed to initialize call:', error);
      alert('Failed to access camera/microphone. Please check permissions.');
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
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-cover ${!isVideoCall && 'hidden'}`}
        />
        
        {/* Remote audio indicator (for audio calls) */}
        {!isVideoCall && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <img 
              src={session.receiver.avatar} 
              className="w-32 h-32 rounded-full mb-6 border-4 border-white/20"
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
          <div className="absolute top-4 right-4 w-32 h-48 rounded-lg overflow-hidden border-2 border-white/30 shadow-2xl">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
            />
          </div>
        )}

        {/* Call info overlay (for video calls) */}
        {isVideoCall && (
          <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
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
      <div className="p-6 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-center gap-4 max-w-md mx-auto">
          {/* Toggle Audio */}
          <button
            onClick={handleToggleAudio}
            className={`p-4 rounded-full transition-all ${
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
              className={`p-4 rounded-full transition-all ${
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
            className="p-6 bg-red-500 hover:bg-red-600 rounded-full transition-all shadow-lg"
            title="End call"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="white">
              <path d="M23 15.5C23 16.3 22.3 17 21.5 17C20.7 17 20 16.3 20 15.5C20 14.7 20.7 14 21.5 14C22.3 14 23 14.7 23 15.5M2.5 17C1.7 17 1 16.3 1 15.5C1 14.7 1.7 14 2.5 14C3.3 14 4 14.7 4 15.5C4 16.3 3.3 17 2.5 17M21.5 10H21.3C21.1 9.4 20.8 8.8 20.5 8.3L20.6 8.2C21 7.8 21 7.2 20.6 6.8L19.2 5.4C18.8 5 18.2 5 17.8 5.4L17.7 5.5C17.2 5.2 16.6 4.9 16 4.7V4.5C16 3.7 15.3 3 14.5 3H12.5C11.7 3 11 3.7 11 4.5V4.7C10.4 4.9 9.8 5.2 9.3 5.5L9.2 5.4C8.8 5 8.2 5 7.8 5.4L6.4 6.8C6 7.2 6 7.8 6.4 8.2L6.5 8.3C6.2 8.8 5.9 9.4 5.7 10H5.5C4.7 10 4 10.7 4 11.5V13.5C4 14.3 4.7 15 5.5 15H5.7C5.9 15.6 6.2 16.2 6.5 16.7L6.4 16.8C6 17.2 6 17.8 6.4 18.2L7.8 19.6C8.2 20 8.8 20 9.2 19.6L9.3 19.5C9.8 19.8 10.4 20.1 11 20.3V20.5C11 21.3 11.7 22 12.5 22H14.5C15.3 22 16 21.3 16 20.5V20.3C16.6 20.1 17.2 19.8 17.7 19.5L17.8 19.6C18.2 20 18.8 20 19.2 19.6L20.6 18.2C21 17.8 21 17.2 20.6 16.8L20.5 16.7C20.8 16.2 21.1 15.6 21.3 15H21.5C22.3 15 23 14.3 23 13.5V11.5C23 10.7 22.3 10 21.5 10M13.5 18C10.5 18 8 15.5 8 12.5C8 9.5 10.5 7 13.5 7C16.5 7 19 9.5 19 12.5C19 15.5 16.5 18 13.5 18Z"/>
            </svg>
          </button>

          {/* Switch Camera (only for video calls on mobile) */}
          {isVideoCall && (
            <button
              onClick={handleSwitchCamera}
              className="p-4 bg-gray-700/80 hover:bg-gray-600 rounded-full transition-all md:hidden"
              title="Switch camera"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M17 8l4-4m0 0l-4-4m4 4H3"/>
                <path d="M7 16l-4 4m0 0l4 4m-4-4h18"/>
              </svg>
            </button>
          )}

          {/* Speaker toggle (only for audio calls) */}
          {!isVideoCall && (
            <button
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`p-4 rounded-full transition-all ${
                isSpeakerOn 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-gray-700/80 hover:bg-gray-600'
              }`}
              title={isSpeakerOn ? 'Speaker on' : 'Speaker off'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                {isSpeakerOn && (
                  <>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                  </>
                )}
              </svg>
            </button>
          )}
        </div>
      </div>
      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
};

export default CallScreen;
