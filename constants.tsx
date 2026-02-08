
import React from 'react';

export const COLORS = {
  whatsappDark: {
    bg: '#0b141a',
    sidebar: '#111b21',
    messageOut: '#005c4b',
    messageIn: '#202c33',
    panel: '#202c33',
    active: '#2a3942',
    textPrimary: '#e9edef',
    textSecondary: '#8696a0',
    accent: '#00a884'
  },
  whatsappLight: {
    bg: '#f0f2f5',
    sidebar: '#ffffff',
    messageOut: '#dcf8c6',
    messageIn: '#ffffff',
    panel: '#f0f2f5',
    active: '#ebebeb',
    textPrimary: '#111b21',
    textSecondary: '#667781',
    accent: '#008069'
  }
};

export const INITIAL_USER: any = {
  id: 'me',
  name: 'John Doe',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  status: 'online',
};

export const AI_USER: any = {
  id: 'gemini-ai',
  name: 'Gemini Assistant',
  avatar: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304fb62aa2586a3b.svg',
  status: 'online',
  phone: '000-AI-GEMINI'
};

export const MOCK_CONTACTS: any[] = [
  { id: 'user-1', name: 'Alice Smith', phone: '9876543210', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice', status: 'online', story: 'https://picsum.photos/seed/s1/400/600' },
  { id: 'user-2', name: 'Bob Wilson', phone: '9123456789', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob', status: 'offline' },
  { id: 'user-3', name: 'Sarah Connor', phone: '8887776665', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', status: 'online', story: 'https://picsum.photos/seed/s2/400/600' },
  { id: 'user-4', name: 'David Miller', phone: '7776665554', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David', status: 'online' },
];
