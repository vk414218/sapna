
import React from 'react';
import { Message } from '../types';
import { COLORS } from '../constants';

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  isDarkMode: boolean;
  showTail: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isOwn, isDarkMode, showTail }) => {
  const colors = isDarkMode ? COLORS.whatsappDark : COLORS.whatsappLight;

  return (
    <div className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
      <div 
        className={`max-w-[85%] md:max-w-[65%] rounded-lg p-1.5 px-3 shadow-sm relative group`}
        style={{ 
          backgroundColor: isOwn ? colors.messageOut : colors.messageIn,
          color: colors.textPrimary,
          borderTopRightRadius: (isOwn && showTail) ? '0' : '10px',
          borderTopLeftRadius: (!isOwn && showTail) ? '0' : '10px',
          borderBottomLeftRadius: '10px',
          borderBottomRightRadius: '10px',
        }}
      >
        {showTail && (
           <div 
             className="absolute top-0 w-3 h-3"
             style={{ 
               [isOwn ? 'right' : 'left']: '-5px',
               backgroundColor: isOwn ? colors.messageOut : colors.messageIn,
               clipPath: isOwn ? 'polygon(0 0, 100% 0, 0 100%)' : 'polygon(0 0, 100% 0, 100% 100%)',
               transform: isOwn ? 'scaleX(-1)' : 'none'
             }}
           />
        )}

        <div className="flex flex-col relative pb-3 min-w-[60px]">
          {message.type === 'voice' ? (
            <div className="flex items-center gap-3 py-1 pr-12 min-w-[200px]">
              <div className="text-[#00a884] cursor-pointer">
                 <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <div className="h-4 flex items-center gap-0.5">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="w-[3px] bg-[#8696a0]" style={{ height: `${20 + Math.random() * 80}%` }}></div>
                  ))}
                </div>
                <span className="text-[10px] opacity-60">
                   {message.duration ? `${Math.floor(message.duration / 60)}:${(message.duration % 60).toString().padStart(2, '0')}` : '0:12'}
                </span>
              </div>
            </div>
          ) : message.type === 'image' ? (
            <div className="flex flex-col gap-1 mb-1">
              <img src={message.mediaUrl} className="rounded-lg max-h-80 object-cover w-full shadow-sm" alt="Media" />
              {message.content && message.content !== message.mediaUrl && (
                <p className="text-[14px] leading-relaxed whitespace-pre-wrap pr-12 mt-1">{message.content}</p>
              )}
            </div>
          ) : message.type === 'screen' ? (
            <div className="flex items-center gap-3 py-2 pr-12 text-[#00a884] font-mono">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              <span className="text-[11px] font-bold">REMOTELY VERIFIED</span>
            </div>
          ) : (
            <p className="text-[14.5px] leading-relaxed whitespace-pre-wrap break-words pr-12">
              {message.content}
            </p>
          )}

          {/* Timestamp Container - Absolute positioned to avoid overlap */}
          <div className="absolute right-0 bottom-[-4px] flex items-center gap-1 bg-inherit px-1 rounded-sm">
            <span className="text-[10px] opacity-50 font-medium whitespace-nowrap">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {isOwn && (
              <span className={`text-[14px] ${message.status === 'read' ? 'text-[#53bdeb]' : 'opacity-40'}`}>
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/><polyline points="20 12 12 20 7 15"/></svg>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
