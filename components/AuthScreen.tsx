
import React, { useState } from 'react';
import { User } from '../types';

interface AuthScreenProps {
  onLogin: (user: User) => void;
  isDarkMode: boolean;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, isDarkMode }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPhone = phone.trim();
    const isAdmin = trimmedPhone.toLowerCase() === 'admin' || trimmedPhone === '9999999999';

    if (name.trim() && trimmedPhone) {
      const globalUsersRaw = localStorage.getItem('global_registered_users');
      let globalUsers: User[] = globalUsersRaw ? JSON.parse(globalUsersRaw) : [];
      
      let user = globalUsers.find(u => u.phone === trimmedPhone);
      
      if (!user) {
        user = {
          id: `user-${trimmedPhone.replace(/[^a-zA-Z0-9]/g, '') || `t${Date.now()}`}`,
          name: name.trim(),
          phone: trimmedPhone,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.trim()}`,
          status: 'online',
          isAdmin: isAdmin
        };
        globalUsers.push(user);
      } else {
        user.name = name.trim();
        user.status = 'online';
        user.isAdmin = isAdmin;
        globalUsers = globalUsers.map(u => u.id === user?.id ? user : u);
      }

      // Save to global registry and trigger a storage event for Admin
      localStorage.setItem('global_registered_users', JSON.stringify(globalUsers));
      // Force an update for other tabs
      window.dispatchEvent(new Event('storage'));
      
      onLogin(user);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${isDarkMode ? 'bg-[#111b21]' : 'bg-[#f0f2f5]'}`}>
      <div className="mb-12 text-center flex flex-col items-center">
        <div className="w-20 h-20 bg-[#25d366] rounded-full flex items-center justify-center mb-4 shadow-xl animate-pulse">
           <svg className="text-white w-12 h-12" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-[#41525d]'}`}>WhatsApp Pro</h1>
        <p className={`mt-2 ${isDarkMode ? 'text-[#8696a0]' : 'text-[#667781]'}`}>End-to-end encrypted messaging</p>
      </div>

      <form 
        onSubmit={handleSubmit}
        className={`w-full max-w-md p-8 rounded-2xl shadow-2xl ${isDarkMode ? 'bg-[#202c33]' : 'bg-white'}`}
      >
        <h2 className={`text-2xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-[#41525d]'}`}>Login</h2>
        
        <div className="space-y-5">
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-[#8696a0]' : 'text-[#667781]'}`}>Display Name</label>
            <input 
              autoFocus
              type="text" 
              placeholder="Your name"
              className={`w-full px-4 py-3 rounded-lg outline-none transition-all ${
                isDarkMode 
                  ? 'bg-[#2a3942] text-white border-transparent focus:bg-[#3b4a54]' 
                  : 'bg-[#f0f2f5] text-[#111b21] border-[#e9edef] focus:bg-white border'
              }`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-[#8696a0]' : 'text-[#667781]'}`}>Phone Number</label>
            <input 
              type="tel" 
              placeholder="e.g. 9988776655"
              className={`w-full px-4 py-3 rounded-lg outline-none transition-all ${
                isDarkMode 
                  ? 'bg-[#2a3942] text-white border-transparent focus:bg-[#3b4a54]' 
                  : 'bg-[#f0f2f5] text-[#111b21] border-[#e9edef] focus:bg-white border'
              }`}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-[#00a884] hover:bg-[#06cf9c] text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md mt-4"
          >
            Start Chatting
          </button>
        </div>

        <div className={`mt-8 pt-6 border-t ${isDarkMode ? 'border-[#2a3942]' : 'border-[#f0f2f5]'} text-center text-sm`}>
          <p className={isDarkMode ? 'text-[#8696a0]' : 'text-[#667781]'}>
            Hint: Number 'admin' for Management Tools.
          </p>
        </div>
      </form>
    </div>
  );
};

export default AuthScreen;
