
import React, { useState, useMemo, useEffect } from 'react';
import { User } from '../types';
import { COLORS } from '../constants';

interface NewChatModalProps {
  onSelectUser: (user: User) => void;
  onCreateGroup: (name: string, members: User[]) => void;
  onClose: () => void;
  isDarkMode: boolean;
  currentUser: User | null;
}

const NewChatModal: React.FC<NewChatModalProps> = ({ onSelectUser, onCreateGroup, onClose, isDarkMode, currentUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
  const [userListVersion, setUserListVersion] = useState(0);
  
  const colors = isDarkMode ? COLORS.whatsappDark : COLORS.whatsappLight;

  // Listen for storage changes to update user list in real-time
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'global_registered_users') {
        setUserListVersion(v => v + 1);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also poll every 5 seconds for same-window updates
    const interval = setInterval(() => {
      setUserListVersion(v => v + 1);
    }, 5000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const allUsers = useMemo(() => {
    const raw = localStorage.getItem('global_registered_users');
    const users: User[] = raw ? JSON.parse(raw) : [];
    // Filter out self
    return users.filter(u => u.id !== currentUser?.id);
  }, [currentUser, userListVersion]);

  const filteredContacts = allUsers.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery)
  );

  const toggleMember = (user: User) => {
    if (selectedMembers.find(m => m.id === user.id)) {
      setSelectedMembers(selectedMembers.filter(m => m.id !== user.id));
    } else {
      setSelectedMembers([...selectedMembers, user]);
    }
  };

  const handleCreateGroup = () => {
    if (groupName.trim() && selectedMembers.length > 0) {
      onCreateGroup(groupName, selectedMembers);
      onClose();
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col animate-in slide-in-from-left duration-300" style={{ backgroundColor: colors.bg }}>
      <div className="h-[108px] flex flex-col justify-end p-5 pb-4" style={{ backgroundColor: isDarkMode ? '#202c33' : '#008069' }}>
        <div className="flex items-center gap-6 text-white mb-2">
          <button onClick={isCreatingGroup ? () => setIsCreatingGroup(false) : onClose} className="hover:opacity-80">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          <h2 className="text-lg font-medium">{isCreatingGroup ? 'Add Group Members' : 'New Chat'}</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!isCreatingGroup ? (
          <>
            <div className="p-2 border-b" style={{ borderColor: isDarkMode ? '#222d34' : '#f0f2f5' }}>
              <div className="flex items-center rounded-lg px-3 py-1.5 gap-4" style={{ backgroundColor: isDarkMode ? '#202c33' : '#f0f2f5' }}>
                <svg className="text-[#8696a0]" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Search name or mobile number..." 
                  className="bg-transparent border-none outline-none w-full py-0.5 text-sm placeholder-[#8696a0]"
                  style={{ color: colors.textPrimary }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div 
              onClick={() => setIsCreatingGroup(true)}
              className="flex items-center p-4 cursor-pointer hover:bg-black/5 border-b"
              style={{ borderColor: isDarkMode ? '#222d34' : '#f0f2f5' }}
            >
              <div className="w-12 h-12 rounded-full bg-[#00a884] flex items-center justify-center mr-4 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <h3 className="font-medium" style={{ color: colors.textPrimary }}>New Group</h3>
            </div>

            <div className="p-4 uppercase text-xs tracking-wider opacity-60 font-semibold" style={{ color: colors.textSecondary }}>People on WhatsApp Pro</div>
            {filteredContacts.length > 0 ? filteredContacts.map(contact => (
              <div 
                key={contact.id}
                onClick={() => { onSelectUser(contact); onClose(); }}
                className="flex items-center p-3 px-4 cursor-pointer hover:bg-black/5"
              >
                <img src={contact.avatar} className="w-12 h-12 rounded-full mr-4" />
                <div className="flex flex-col">
                  <h3 className="font-medium" style={{ color: colors.textPrimary }}>{contact.name}</h3>
                  <p className="text-xs opacity-60" style={{ color: colors.textSecondary }}>{contact.phone}</p>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center">
                <p className="text-sm opacity-60" style={{ color: colors.textSecondary }}>No users found with that name or number.</p>
              </div>
            )}
          </>
        ) : (
          <div className="p-4 flex flex-col gap-4">
            <input 
              type="text" 
              placeholder="Group Subject" 
              className="w-full bg-transparent border-b-2 border-[#00a884] py-2 outline-none text-lg"
              style={{ color: colors.textPrimary }}
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
            
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedMembers.map(m => (
                <div key={m.id} className="bg-[#00a884]/20 text-[#00a884] px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  {m.name}
                  <button onClick={() => toggleMember(m)}>×</button>
                </div>
              ))}
            </div>

            <div className="mt-4">
              {allUsers.map(contact => (
                <div 
                  key={contact.id} 
                  onClick={() => toggleMember(contact)}
                  className="flex items-center p-3 cursor-pointer hover:bg-black/5 rounded-lg"
                >
                  <input type="checkbox" checked={!!selectedMembers.find(m => m.id === contact.id)} readOnly className="mr-4 accent-[#00a884]" />
                  <img src={contact.avatar} className="w-10 h-10 rounded-full mr-3" />
                  <div className="flex flex-col">
                    <h3 style={{ color: colors.textPrimary }}>{contact.name}</h3>
                    <span className="text-[10px] opacity-60" style={{ color: colors.textSecondary }}>{contact.phone}</span>
                  </div>
                </div>
              ))}
            </div>

            <button 
              disabled={!groupName || selectedMembers.length === 0}
              onClick={handleCreateGroup}
              className="mt-6 w-14 h-14 rounded-full bg-[#00a884] self-center flex items-center justify-center text-white shadow-xl disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewChatModal;
