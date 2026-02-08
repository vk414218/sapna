
import React, { useState, useEffect, useRef } from 'react';
import { CallSession } from '../types';

interface CallScreenProps {
  session: CallSession;
  onEnd: () => void;
}

const CallScreen: React.FC<CallScreenProps> = ({ session, onEnd }) => {
  const [status, setStatus] = useState<'Calling' | 'Ringing' | 'Connected'>('Calling');
  const [duration, setDuration] = useState(0);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenRef = useRef<HTMLVideoElement>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const ringTimeout = setTimeout(() => setStatus('Ringing'), 1500);
    const connectTimeout = setTimeout(() => setStatus('Connected'), 3500);

    return () => {
      clearTimeout(ringTimeout);
      clearTimeout(connectTimeout);
      stopAllStreams();
    };
  }, []);

  useEffect(() => {
    let timer: any;
    if (status === 'Connected') {
      timer = setInterval(() => setDuration(prev => prev + 1), 1000);
      
      if (session.type === 'video' && !isScreenSharing && !localStreamRef.current) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then(stream => {
            localStreamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
            stream.getAudioTracks().forEach(track => track.enabled = !isMuted);
          })
          .catch(err => console.error("Camera access denied", err));
      } else if (session.type === 'audio' && !localStreamRef.current) {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(stream => {
            localStreamRef.current = stream;
            stream.getAudioTracks().forEach(track => track.enabled = !isMuted);
          })
          .catch(err => console.error("Mic access denied", err));
      }
    }
    return () => clearInterval(timer);
  }, [status, session.type, isScreenSharing]);

  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
      setIsScreenSharing(false);
    } else {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
          throw new Error("Screen sharing not supported.");
        }
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        if (screenRef.current) screenRef.current.srcObject = stream;
        setIsScreenSharing(true);
        
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          screenStreamRef.current = null;
        };
      } catch (err: any) {
        console.error("Screen share error:", err);
        if (err.name === 'NotAllowedError') {
          if (err.message.includes('policy') || err.message.includes('permission')) {
             alert("Screen sharing is disallowed by current frame permissions policy.");
          }
        } else {
          alert("Screen sharing failed: " + err.message);
        }
      }
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
  };

  const stopAllStreams = () => {
    stopScreenShare();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[#0b141a] animate-in fade-in duration-300">
      {session.type === 'video' ? (
        <div className="w-full h-full relative overflow-hidden">
          {status === 'Connected' ? (
             isScreenSharing ? (
               <video ref={screenRef} autoPlay playsInline className="w-full h-full object-contain bg-black" />
             ) : (
               <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror" />
             )
          ) : (
            <div className="w-full h-full bg-[#111b21] flex items-center justify-center">
              <div className="relative">
                <img src={session.receiver.avatar} className="w-48 h-48 rounded-full border-4 border-white/10 blur-md opacity-40 object-cover" alt="" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-[#00a884] border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
            </div>
          )}
          
          <div className="absolute top-12 left-0 w-full text-center drop-shadow-2xl z-10">
            <h2 className="text-white text-3xl font-bold mb-2">{session.receiver.name}</h2>
            <p className="text-[#8696a0] font-medium tracking-wide">
              {status === 'Connected' ? formatTime(duration) : status}
            </p>
          </div>

          {status === 'Connected' && !isScreenSharing && (
            <div className="absolute bottom-32 right-8 w-40 h-56 border-2 border-white/20 rounded-2xl overflow-hidden shadow-2xl bg-black animate-in slide-in-from-right duration-500">
               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${session.receiver.name}`} className="w-full h-full object-cover" alt="Remote" />
            </div>
          )}

          <div className="absolute bottom-10 left-0 w-full flex justify-center gap-6 z-20">
             <button 
               onClick={() => setIsMuted(!isMuted)}
               className={`p-4 rounded-full transition-all shadow-xl active:scale-95 ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
             >
               {isMuted ? (
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
               ) : (
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
               )}
             </button>

             <button 
               onClick={toggleScreenShare}
               className={`p-4 rounded-full transition-all shadow-xl active:scale-95 ${isScreenSharing ? 'bg-[#00a884] text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
               title="Share Screen"
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
             </button>

             <button 
               onClick={onEnd}
               className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition shadow-2xl active:scale-90"
             >
                <svg className="rotate-[135deg]" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/></svg>
             </button>
          </div>
        </div>
      ) : (
        <div className="text-center w-full px-8 flex flex-col items-center">
          <div className="relative mb-10 w-48 h-48">
            <img src={session.receiver.avatar} className="w-full h-full rounded-full border-4 border-[#00a884] object-cover shadow-2xl transition-all" alt="Avatar" />
            {status !== 'Connected' && (
              <div className="absolute inset-0 rounded-full border-4 border-[#00a884] animate-ping opacity-25"></div>
            )}
          </div>
          <h2 className="text-white text-4xl font-bold mb-4">{session.receiver.name}</h2>
          <p className="text-[#8696a0] mb-20 text-2xl font-medium tracking-wide">
            {status === 'Connected' ? formatTime(duration) : status}
          </p>
          
          <div className="flex gap-8 mb-16">
             <button 
               onClick={() => setIsMuted(!isMuted)}
               className="flex flex-col items-center gap-2 group"
             >
                <div className={`p-5 rounded-full transition-all shadow-lg active:scale-95 ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white group-hover:bg-white/20'}`}>
                  {isMuted ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
                  )}
                </div>
                <span className={`text-sm ${isMuted ? 'text-red-500 font-bold' : 'text-[#8696a0]'}`}>{isMuted ? 'Muted' : 'Mute'}</span>
             </button>
             <button className="flex flex-col items-center gap-2 group">
                <div className="p-5 rounded-full bg-white/10 text-white group-hover:bg-white/20 transition-all shadow-lg active:scale-95">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                </div>
                <span className="text-sm text-[#8696a0]">Speaker</span>
             </button>
             <button onClick={onEnd} className="flex flex-col items-center gap-2 group">
                <div className="p-5 rounded-full bg-red-600 text-white hover:bg-red-700 transition-all shadow-2xl active:scale-90">
                  <svg className="rotate-[135deg]" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/></svg>
                </div>
                <span className="text-sm text-red-500 font-bold">End Call</span>
             </button>
          </div>
        </div>
      )}
      <style>{`
        .mirror { transform: scaleX(-1); }
      `}</style>
    </div>
  );
};

export default CallScreen;
