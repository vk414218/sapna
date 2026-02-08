
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, Chat } from '../types';
import { COLORS, AI_USER } from '../constants';

interface ChatSidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onOpenNewChat: () => void;
  onOpenProfile: () => void;
  onPostStatus: (data: string) => void;
  currentUser: User;
  isDarkMode: boolean;
  toggleTheme: () => void;
  activeTab?: 'chats' | 'status';
  onTabChange?: (tab: 'chats' | 'status') => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ 
  chats, 
  activeChatId, 
  onSelectChat, 
  onOpenNewChat,
  onOpenProfile,
  onPostStatus,
  currentUser, 
  isDarkMode, 
  toggleTheme,
  activeTab: externalActiveTab,
  onTabChange
}) => {
  const [search, setSearch] = useState('');
  const [localActiveTab, setLocalActiveTab] = useState<'chats' | 'status'>('chats');
  const [viewingStatus, setViewingStatus] = useState<User | null>(null);
  const [isSidebarMenuOpen, setIsSidebarMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const colors = isDarkMode ? COLORS.whatsappDark : COLORS.whatsappLight;

  const activeTab = externalActiveTab || localActiveTab;

  // Handle outside click for menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsSidebarMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredChats = chats.filter(chat => {
    const otherParticipant = chat.participants.find(p => p.id !== currentUser.id);
    const name = chat.type === 'group' ? chat.name : otherParticipant?.name;
    return (name || '').toLowerCase().includes(search.toLowerCase());
  });

  const globalUsersWithStories = useMemo(() => {
    const raw = localStorage.getItem('global_registered_users');
    const users: User[] = raw ? JSON.parse(raw) : [];
    // Only users who have a story set and are not current user
    return users.filter(u => u.story && u.id !== currentUser.id && u.story.startsWith('data:image'));
  }, [currentUser, activeTab]);

  const handleStatusUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => onPostStatus(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const setTab = (tab: 'chats' | 'status') => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setLocalActiveTab(tab);
    }
  };

  return (
    <div 
      className="w-full h-full flex flex-col border-r relative"
      style={{ backgroundColor: colors.sidebar, borderColor: isDarkMode ? '#313d45' : '#e9edef' }}
    >
      {/* Status Fullscreen Viewer */}
      {viewingStatus && (
        <div className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center animate-in zoom-in duration-300">
          <div className="absolute top-5 left-5 flex items-center gap-3">
             <img src={viewingStatus.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
             <div className="text-white">
                <p className="font-semibold text-sm">{viewingStatus.name}</p>
                <p className="text-xs opacity-60">Today</p>
             </div>
          </div>
          <button 
            onClick={() => setViewingStatus(null)}
            className="absolute top-5 right-5 text-white/60 hover:text-white z-[101]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <img src={viewingStatus.story} className="max-h-[80%] max-w-full object-contain" alt="Story" />
          <div className="absolute top-0 left-0 w-full h-1 bg-white/20">
            <div className="h-full bg-white animate-[statusProgress_5s_linear_forwards]"></div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-2 md:p-3 flex justify-between items-center" style={{ backgroundColor: colors.panel }}>
        <img 
          src={currentUser.avatar} 
          alt="Profile" 
          className="w-9 h-9 md:w-10 md:h-10 rounded-full cursor-pointer object-cover border border-white/10" 
          onClick={onOpenProfile}
        />
        <div className="flex gap-2 md:gap-4 items-center">
          <button onClick={() => setTab('status')} className={`transition hover:bg-white/5 p-1.5 md:p-2 rounded-full ${activeTab === 'status' ? 'text-[#00a884]' : 'text-[#8696a0]'}`}>
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 22a10 10 0 0 1-10-10"/></svg>
          </button>
          <button onClick={() => setTab('chats')} className={`transition hover:bg-white/5 p-1.5 md:p-2 rounded-full ${activeTab === 'chats' ? 'text-[#00a884]' : 'text-[#8696a0]'}`}>
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </button>
          <button onClick={onOpenNewChat} className="text-[#8696a0] hover:bg-white/5 p-1.5 md:p-2 rounded-full hover:text-[#00a884] transition">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setIsSidebarMenuOpen(!isSidebarMenuOpen)} className="text-[#8696a0] hover:bg-white/5 p-1.5 md:p-2 rounded-full hover:text-[#00a884]">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
            </button>
            {isSidebarMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 py-2 rounded shadow-xl bg-[#233138] z-50 border border-white/5 animate-in fade-in zoom-in duration-200">
                 <button onClick={() => { onOpenProfile(); setIsSidebarMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-[#182229] text-[#e9edef] text-sm">Profile Settings</button>
                 <button onClick={() => { toggleTheme(); setIsSidebarMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-[#182229] text-[#e9edef] text-sm">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</button>
                 <button onClick={() => { 
                   localStorage.removeItem('gemini_current_profile');
                   window.location.reload();
                 }} className="w-full text-left px-4 py-2 hover:bg-[#182229] text-red-400 text-sm">Logout</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeTab === 'chats' ? (
        <>
          {/* Search */}
          <div className="p-2 px-2 md:px-3">
            <div className="flex items-center rounded-lg px-2 md:px-3 py-1.5 gap-2 md:gap-4" style={{ backgroundColor: isDarkMode ? '#202c33' : '#f0f2f5' }}>
              <svg className="text-[#8696a0]" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input 
                type="text" 
                placeholder="Search or start new chat" 
                className="bg-transparent border-none outline-none w-full py-0.5 text-xs md:text-sm placeholder-[#8696a0]"
                style={{ color: colors.textPrimary }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {filteredChats.length > 0 ? filteredChats.map(chat => {
              const otherUser = chat.type === 'individual' ? chat.participants.find(p => p.id !== currentUser.id)! : null;
              const name = chat.type === 'group' ? chat.name : otherUser?.name;
              const avatar = chat.type === 'group' ? chat.avatar : (otherUser?.id === AI_USER.id ? AI_USER.avatar : otherUser?.avatar);
              const isActive = chat.id === activeChatId;
              const lastMsg = chat.messages[chat.messages.length - 1];

              return (
                <div 
                  key={chat.id} 
                  onClick={() => onSelectChat(chat.id)}
                  className={`flex p-2 md:p-3 px-3 md:px-4 cursor-pointer items-center transition-colors border-b ${isActive ? '' : 'hover:bg-black/5'}`}
                  style={{ 
                    backgroundColor: isActive ? colors.active : 'transparent',
                    borderColor: isDarkMode ? '#222d34' : '#f0f2f5',
                  }}
                >
                  <div className="relative">
                    <img src={avatar} alt={name} className="w-11 h-11 md:w-12 md:h-12 rounded-full mr-3 md:mr-4 object-cover border border-white/10" />
                    {otherUser?.status === 'online' && (
                      <div className="absolute bottom-0 right-3 md:right-4 w-3 h-3 md:w-3.5 md:h-3.5 bg-[#00a884] rounded-full border-2 border-[#111b21]"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-semibold truncate text-sm md:text-base" style={{ color: colors.textPrimary }}>{name}</h3>
                      <span className="text-[10px] md:text-xs" style={{ color: colors.textSecondary }}>
                        {lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <p className="text-xs md:text-sm truncate flex-1" style={{ color: colors.textSecondary }}>
                        {lastMsg?.type === 'text' ? lastMsg.content : lastMsg ? `Sent a ${lastMsg?.type}` : 'No messages yet'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="p-8 text-center opacity-40">
                <p className="text-sm" style={{ color: colors.textSecondary }}>No chats yet. Start a new one!</p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Status Tab */
        <div className="flex-1 overflow-y-auto animate-in slide-in-from-right duration-300">
          <div className="p-4 flex items-center gap-4 cursor-pointer hover:bg-black/5 transition-all">
            <label className="relative cursor-pointer group">
              <img src={currentUser.avatar} className="w-14 h-14 rounded-full border-2 border-[#00a884] object-cover" alt="Me" />
              <div className="absolute bottom-0 right-0 bg-[#00a884] rounded-full p-1 border-2 border-[#111b21] group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleStatusUpload} />
            </label>
            <div onClick={() => currentUser.story && setViewingStatus(currentUser)} className="flex-1">
              <h3 className="font-semibold" style={{ color: colors.textPrimary }}>My Status</h3>
              <p className="text-sm" style={{ color: colors.textSecondary }}>{currentUser.story && currentUser.story.startsWith('data') ? 'Tap to view your status' : 'Tap to add status update'}</p>
            </div>
          </div>
          
          <div className="p-4 px-6 text-xs font-semibold uppercase tracking-wider opacity-60 mt-2" style={{ color: colors.accent }}>Recent updates</div>
          
          {globalUsersWithStories.length > 0 ? globalUsersWithStories.map(contact => (
            <div 
              key={contact.id} 
              onClick={() => setViewingStatus(contact)}
              className="p-3 px-4 flex items-center gap-4 cursor-pointer hover:bg-black/5"
            >
              <div className="p-0.5 rounded-full border-2 border-[#00a884]">
                <img src={contact.avatar} className="w-12 h-12 rounded-full border-2 border-[#111b21] object-cover" alt={contact.name} />
              </div>
              <div className="border-b flex-1 pb-3" style={{ borderColor: isDarkMode ? '#222d34' : '#f0f2f5' }}>
                <h3 className="font-semibold" style={{ color: colors.textPrimary }}>{contact.name}</h3>
                <p className="text-xs" style={{ color: colors.textSecondary }}>Just now</p>
              </div>
            </div>
          )) : (
             <div className="p-12 text-center opacity-40">
                <svg className="mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 22a10 10 0 0 1-10-10"/></svg>
                <p className="text-sm" style={{ color: colors.textSecondary }}>No status updates found.</p>
             </div>
          )}
        </div>
      )}
      <style>{`
        @keyframes statusProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default ChatSidebar;
