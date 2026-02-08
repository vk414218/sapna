
import React, { useState, useRef, useEffect } from 'react';
import { User, Chat, Message } from '../types';
import { COLORS } from '../constants';
import MessageItem from './MessageItem';

interface ChatWindowProps {
  activeChat: Chat | null;
  onSendMessage: (content: string, type?: Message['type'], mediaUrl?: string, duration?: number) => void;
  currentUser: User;
  isDarkMode: boolean;
  onStartCall: (type: 'audio' | 'video') => void;
  onBackToSidebar?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  activeChat, 
  onSendMessage, 
  currentUser, 
  isDarkMode,
  onStartCall,
  onBackToSidebar
}) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const timerRef = useRef<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colors = isDarkMode ? COLORS.whatsappDark : COLORS.whatsappLight;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setRecordDuration(d => d + 1), 1000);
    } else {
      clearInterval(timerRef.current);
      setRecordDuration(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input, 'text');
      setInput('');
    }
  };

  const handleSendVoice = () => {
    setIsRecording(false);
    onSendMessage('Voice Note', 'voice', undefined, recordDuration);
  };

  const handleScreenShare = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error("Screen sharing is not supported by this browser.");
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: { cursor: "always" } as any 
      });
      onSendMessage('Shared Screen Stream', 'screen');
      stream.getTracks().forEach(t => t.stop());
    } catch (err: any) {
      console.error("Screen share error:", err);
      if (err.name === 'NotAllowedError') {
        if (err.message.includes('permission') || err.message.includes('policy')) {
          alert("Permission Denied: Screen sharing is blocked by browser policy. Ensure you are not in a restricted frame.");
        } else {
          // User likely cancelled
          console.log("Screen share was cancelled by user.");
        }
      } else if (err.name === 'SecurityError') {
        alert("Security Error: Screen sharing is disallowed in this environment.");
      } else {
        alert("Could not start screen share: " + err.message);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        onSendMessage(file.name, file.type.startsWith('image') ? 'image' : 'file', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!activeChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-12" style={{ backgroundColor: colors.bg }}>
        <div className="mb-8 w-64 h-64 flex items-center justify-center rounded-full bg-black bg-opacity-5">
           <svg className="w-48 h-48 opacity-20" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        <h2 className="text-3xl font-light mb-2" style={{ color: colors.textPrimary }}>WhatsApp for Web</h2>
        <p className="max-w-md text-sm leading-relaxed" style={{ color: colors.textSecondary }}>
          Send and receive messages without keeping your phone online.
        </p>
      </div>
    );
  }

  const otherUser = activeChat.type === 'individual' ? activeChat.participants.find(p => p.id !== currentUser.id)! : null;
  const chatName = activeChat.type === 'group' ? activeChat.name : otherUser?.name;
  const chatAvatar = activeChat.type === 'group' ? activeChat.avatar : otherUser?.avatar;

  return (
    <div className="flex-1 flex flex-col relative" style={{ backgroundColor: colors.bg }}>
      {/* Header */}
      <div className="p-2 md:p-3 px-3 md:px-4 flex justify-between items-center z-10 shadow-sm" style={{ backgroundColor: colors.panel }}>
        <div className="flex items-center gap-2 md:gap-3 cursor-pointer">
          {onBackToSidebar && (
            <button onClick={onBackToSidebar} className="md:hidden text-[#8696a0] hover:text-white mr-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            </button>
          )}
          <img src={chatAvatar} alt={chatName} className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover shadow-sm" />
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold truncate max-w-[150px] md:max-w-[200px]" style={{ color: colors.textPrimary }}>{chatName}</h3>
            <span className="text-[10px] md:text-[11px]" style={{ color: colors.textSecondary }}>
              {activeChat.type === 'group' ? `${activeChat.participants.length} members` : (otherUser?.status || 'offline')}
            </span>
          </div>
        </div>
        <div className="flex gap-3 md:gap-6 items-center">
          <button onClick={() => onStartCall('video')} className="text-[#8696a0] hover:text-[#00a884] transition active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
          </button>
          <button onClick={() => onStartCall('audio')} className="text-[#8696a0] hover:text-[#00a884] transition active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/></svg>
          </button>
          <div className="hidden md:block h-4 w-[1px] bg-[#3b4a54]"></div>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-[#8696a0] hover:text-white p-1">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 py-2 rounded shadow-xl bg-[#233138] z-50 border border-white/5 animate-in fade-in zoom-in duration-200">
                <button className="w-full text-left px-4 py-2 hover:bg-[#182229] text-[#e9edef] text-sm">Contact info</button>
                <button className="w-full text-left px-4 py-2 hover:bg-[#182229] text-[#e9edef] text-sm">Clear messages</button>
                <button className="w-full text-left px-4 py-2 hover:bg-[#182229] text-red-400 text-sm">Delete chat</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 md:px-16" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundBlendMode: isDarkMode ? 'overlay' : 'multiply', backgroundColor: isDarkMode ? '#0b141a' : '#e5ddd5' }}>
        <div className="flex flex-col space-y-1">
          {activeChat.messages.map((msg, idx) => (
            <MessageItem 
              key={msg.id} 
              message={msg} 
              isOwn={msg.senderId === currentUser.id} 
              isDarkMode={isDarkMode} 
              showTail={idx === 0 || activeChat.messages[idx-1].senderId !== msg.senderId}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Footer */}
      <div className="p-1.5 md:p-2 flex items-center gap-0.5 md:gap-1" style={{ backgroundColor: colors.panel }}>
        {isRecording ? (
          <div className="flex-1 flex items-center justify-between px-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
              <span className="text-white font-mono">{Math.floor(recordDuration / 60)}:{(recordDuration % 60).toString().padStart(2, '0')}</span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setIsRecording(false)} className="text-red-500 font-semibold text-sm">Cancel</button>
              <button onClick={handleSendVoice} className="bg-[#00a884] p-3 rounded-full text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </div>
        ) : (
          <>
            <button className="p-1.5 md:p-2 text-[#8696a0] hover:text-white transition" title="Emojis">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
            </button>
            <button onClick={handleScreenShare} className="hidden md:block p-2 text-[#8696a0] hover:text-white transition" title="Share Screen">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="p-1.5 md:p-2 text-[#8696a0] hover:text-white transition" title="Attach Files">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
            <div className="flex-1">
              <input 
                type="text" 
                placeholder="Type a message" 
                className="w-full py-2 md:py-2.5 px-3 md:px-4 rounded-lg outline-none text-sm"
                style={{ backgroundColor: isDarkMode ? '#2a3942' : '#ffffff', color: colors.textPrimary }}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
            </div>
            {input ? (
              <button onClick={handleSend} className="p-1.5 md:p-2 text-[#8696a0] hover:text-[#00a884] transition active:scale-90">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            ) : (
              <button onClick={() => setIsRecording(true)} className="p-1.5 md:p-2 text-[#8696a0] hover:text-[#00a884] transition active:scale-90">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
