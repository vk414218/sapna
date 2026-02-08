
import { useState, useCallback, useEffect } from 'react';
import { User, Message, Chat } from '../types';
import { AI_USER } from '../constants';
import { geminiService } from '../services/geminiService';

const CHATS_KEY = 'gemini_chat_data';
const PROFILE_KEY = 'gemini_current_profile';

export const useChat = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(PROFILE_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  
  const [chats, setChats] = useState<Chat[]>(() => {
    const saved = localStorage.getItem(CHATS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load chats", e);
      }
    }
    return [];
  });

  useEffect(() => {
    if (currentUser && chats.length === 0) {
      const initialChat: Chat = {
        id: 'chat-ai',
        type: 'individual',
        participants: [currentUser, AI_USER],
        messages: [{
          id: 'm1',
          senderId: 'gemini-ai',
          receiverId: currentUser.id,
          content: `Hi ${currentUser.name}! I'm your Gemini assistant. Search for other users by name or number to start chatting!`,
          timestamp: Date.now(),
          status: 'read',
          type: 'text',
        }],
        unreadCount: 0,
      };
      setChats([initialChat]);
    }
  }, [currentUser]);

  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
    }
  }, [chats]);

  const loginUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(user));
    
    // Register globally
    const globalUsersRaw = localStorage.getItem('global_registered_users');
    let globalUsers: User[] = globalUsersRaw ? JSON.parse(globalUsersRaw) : [];
    if (!globalUsers.find(u => u.phone === user.phone)) {
      globalUsers.push(user);
      localStorage.setItem('global_registered_users', JSON.stringify(globalUsers));
    }
  };

  const updateProfile = (name: string, statusText: string, avatar: string) => {
    if (!currentUser) return;
    const updated = { ...currentUser, name, story: statusText, avatar };
    setCurrentUser(updated);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
    
    // Update global registry
    const globalUsersRaw = localStorage.getItem('global_registered_users');
    if (globalUsersRaw) {
      let globalUsers: User[] = JSON.parse(globalUsersRaw);
      globalUsers = globalUsers.map(u => u.phone === currentUser.phone ? updated : u);
      localStorage.setItem('global_registered_users', JSON.stringify(globalUsers));
    }
  };

  const postStatus = (imageData: string) => {
    if (!currentUser) return;
    const updated = { ...currentUser, story: imageData };
    setCurrentUser(updated);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
    
    // Update global registry
    const globalUsersRaw = localStorage.getItem('global_registered_users');
    if (globalUsersRaw) {
      let globalUsers: User[] = JSON.parse(globalUsersRaw);
      globalUsers = globalUsers.map(u => u.phone === currentUser.phone ? updated : u);
      localStorage.setItem('global_registered_users', JSON.stringify(globalUsers));
    }
  };

  const activeChat = chats.find(c => c.id === activeChatId) || null;

  const startNewChat = (user: User) => {
    if (!currentUser) return;
    const existingChat = chats.find(c => 
      c.type === 'individual' && 
      c.participants.some(p => p.id === user.id)
    );

    if (existingChat) {
      setActiveChatId(existingChat.id);
      return;
    }

    const newChat: Chat = {
      id: `chat-${Date.now()}`,
      type: 'individual',
      participants: [currentUser, user],
      messages: [],
      unreadCount: 0,
    };

    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
  };

  const createGroup = (name: string, members: User[]) => {
    if (!currentUser) return;
    const newGroup: Chat = {
      id: `group-${Date.now()}`,
      type: 'group',
      name: name,
      participants: [currentUser, ...members],
      messages: [{
        id: `sys-${Date.now()}`,
        senderId: 'system',
        receiverId: 'group',
        content: `You created group "${name}"`,
        timestamp: Date.now(),
        status: 'sent',
        type: 'text'
      }],
      unreadCount: 0,
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${name}`
    };
    setChats(prev => [newGroup, ...prev]);
    setActiveChatId(newGroup.id);
  };

  const sendMessage = useCallback(async (content: string, type: Message['type'] = 'text', mediaUrl?: string, duration?: number) => {
    if (!activeChatId || !currentUser) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      receiverId: activeChatId,
      content,
      timestamp: Date.now(),
      status: 'sent',
      type,
      mediaUrl,
      duration
    };

    setChats(prev => prev.map(chat => {
      if (chat.id === activeChatId) {
        return {
          ...chat,
          messages: [...chat.messages, newMessage],
          lastMessage: newMessage,
        };
      }
      return chat;
    }));

    if (activeChatId === 'chat-ai' && type === 'text') {
      const response = await geminiService.getResponse(content);
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        senderId: 'gemini-ai',
        receiverId: currentUser.id,
        content: response || 'Thinking...',
        timestamp: Date.now(),
        status: 'delivered',
        type: 'text',
        isAi: true,
      };
      setChats(prev => prev.map(chat => {
        if (chat.id === activeChatId) {
          return { ...chat, messages: [...chat.messages, aiMessage], lastMessage: aiMessage };
        }
        return chat;
      }));
    }
  }, [activeChatId, chats, currentUser]);

  return {
    chats,
    activeChat,
    setActiveChatId,
    startNewChat,
    createGroup,
    sendMessage,
    currentUser,
    loginUser,
    updateProfile,
    postStatus
  };
};
