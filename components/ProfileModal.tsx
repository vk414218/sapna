
import React, { useState } from 'react';
import { User } from '../types';
import { COLORS } from '../constants';

interface ProfileModalProps {
  user: User;
  onUpdate: (name: string, status: string, avatar: string) => void;
  onClose: () => void;
  isDarkMode: boolean;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onUpdate, onClose, isDarkMode }) => {
  const [name, setName] = useState(user.name);
  const [status, setStatus] = useState(user.lastSeen || 'Hey there! I am using GeminiChat.');
  const [avatar, setAvatar] = useState(user.avatar);
  const colors = isDarkMode ? COLORS.whatsappDark : COLORS.whatsappLight;

  const handleSave = () => {
    onUpdate(name, status, avatar);
    onClose();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="absolute inset-0 z-[60] flex flex-col animate-in slide-in-from-left duration-300" style={{ backgroundColor: colors.bg }}>
      <div className="h-[108px] flex flex-col justify-end p-5 pb-4" style={{ backgroundColor: isDarkMode ? '#202c33' : '#008069' }}>
        <div className="flex items-center gap-6 text-white mb-2">
          <button onClick={onClose} className="hover:opacity-80">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          <h2 className="text-lg font-medium">Profile</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center">
        <div className="relative group mb-8">
          <img src={avatar} className="w-48 h-48 rounded-full object-cover border-4 border-white/10 shadow-xl" alt="Avatar" />
          <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
            <svg className="text-white w-10 h-10" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
          </label>
        </div>

        <div className="w-full space-y-8">
          <div>
            <label className="block text-sm font-medium mb-1 opacity-60" style={{ color: colors.accent }}>Your Name</label>
            <div className="flex items-center border-b-2 border-transparent focus-within:border-[#00a884] py-2">
              <input 
                type="text" 
                className="bg-transparent w-full outline-none text-lg" 
                style={{ color: colors.textPrimary }}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <svg className="opacity-40" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </div>
            <p className="mt-2 text-xs opacity-50" style={{ color: colors.textSecondary }}>This is not your username or pin. This name will be visible to your GeminiChat contacts.</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 opacity-60" style={{ color: colors.accent }}>About</label>
            <div className="flex items-center border-b-2 border-transparent focus-within:border-[#00a884] py-2">
              <input 
                type="text" 
                className="bg-transparent w-full outline-none" 
                style={{ color: colors.textPrimary }}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              />
              <svg className="opacity-40" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </div>
          </div>

          <button 
            onClick={handleSave}
            className="w-full bg-[#00a884] py-3 rounded-lg text-white font-bold hover:bg-[#06cf9c] transition shadow-lg"
          >
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
