
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';

export interface User {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  status: 'online' | 'offline';
  lastSeen?: string;
  story?: string;
  location?: {
    lat: number;
    lng: number;
  };
  isAdmin?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: number;
  status: MessageStatus;
  type: 'text' | 'image' | 'file' | 'voice' | 'screen';
  mediaUrl?: string;
  isAi?: boolean;
  duration?: number;
}

export interface Chat {
  id: string;
  participants: User[];
  messages: Message[];
  lastMessage?: Message;
  unreadCount: number;
  type: 'individual' | 'group';
  name?: string;
  avatar?: string;
}

export interface CallSession {
  type: 'audio' | 'video';
  caller: User;
  receiver: User;
  isActive: boolean;
  startTime?: number;
  isScreenSharing?: boolean;
}
