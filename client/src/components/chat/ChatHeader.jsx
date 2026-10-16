import React from 'react';
import { ArrowLeft, Volume2, VolumeX, MoreVertical, Phone, Video, Search } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export const ChatHeader = ({
  conversation,
  onBack,
  isMuted,
  onToggleMute,
  onSearchClick
}) => {
  const { isUserOnline, getTypingInfo } = useSocket();

  if (!conversation) return null;

  const otherUser = conversation.otherParticipant;
  const isOnline = otherUser ? isUserOnline(otherUser.id) : false;
  const typingInfo = getTypingInfo(conversation.id);
  const isTyping = Boolean(typingInfo && typingInfo.isTyping);

  const displayName = conversation.name || otherUser?.name || 'Chat';
  const fullAvatar = conversation.avatar || otherUser?.avatar || null;

  return (
    <div className="h-16 px-4 border-b border-slate-200/80 bg-white/95 backdrop-blur-md flex items-center justify-between shrink-0 shadow-2xs z-10">
      {/* Left: Mobile Back Button & Profile Info */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onBack}
          className="lg:hidden p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="relative">
          {fullAvatar ? (
            <img
              src={fullAvatar}
              alt={displayName}
              className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-[#8B1D2C] text-white flex items-center justify-center font-bold text-sm shadow-xs uppercase">
              {displayName.charAt(0)}
            </div>
          )}
          {isOnline && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
          )}
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="font-extrabold text-sm text-slate-900 truncate">{displayName}</h3>
            {otherUser?.role === 'hr' && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-purple-100 text-purple-700 uppercase shrink-0">
                HR
              </span>
            )}
            {otherUser?.role === 'employee' && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-100 text-slate-600 capitalize shrink-0">
                Employee
              </span>
            )}
          </div>
          
          {/* Live WhatsApp Status & Typing Indicator */}
          {isTyping ? (
            <span className="text-emerald-600 font-semibold text-xs animate-pulse flex items-center gap-1">
              typing...
            </span>
          ) : isOnline ? (
            <span className="text-emerald-600 font-medium text-xs flex items-center gap-1">
              Online
            </span>
          ) : (
            <span className="text-slate-400 text-xs truncate">
              {otherUser?.designation || (conversation.type === 'group' ? `${conversation.participantsCount} members` : 'Offline')}
            </span>
          )}
        </div>
      </div>

      {/* Right: Sound & Action Tools */}
      <div className="flex items-center gap-1.5 text-slate-500">
        <button
          type="button"
          onClick={onToggleMute}
          className="p-2 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          title={isMuted ? 'Unmute chat sounds' : 'Mute chat sounds'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
