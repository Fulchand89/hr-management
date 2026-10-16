import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Users,
  User,
  MessageSquarePlus,
  MessageSquare,
  Check,
  CheckCheck,
  Loader2,
  X,
  Shield,
  Briefcase
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { getEmployeeDirectory } from '../../services/chatService';

export const ChatSidebar = ({
  conversations = [],
  activeId,
  onSelectConversation,
  onNewChatClick,
  search = '',
  onSearchChange,
  onStartDirectChat
}) => {
  const { user } = useAuth();
  const { isUserOnline, getTypingInfo } = useSocket();
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'chats' | 'colleagues'
  const [directory, setDirectory] = useState([]);
  const [loadingDirectory, setLoadingDirectory] = useState(false);

  // Load employee & HR directory on mount and whenever search changes
  useEffect(() => {
    let isMounted = true;
    setLoadingDirectory(true);

    const query = (search || '').trim();
    const timer = setTimeout(
      async () => {
        try {
          const list = await getEmployeeDirectory(query);
          if (isMounted) setDirectory(list || []);
        } catch (err) {
          console.error('Failed to load employee/HR directory:', err);
        } finally {
          if (isMounted) setLoadingDirectory(false);
        }
      },
      query ? 200 : 0
    );

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [search]);

  const formatMessageTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const query = (search || '').trim().toLowerCase();

  // Active conversations matching search
  const filteredConversations = conversations.filter((c) => {
    if (!query) return true;
    const name = (c.name || c.otherParticipant?.name || '').toLowerCase();
    const email = (c.otherParticipant?.email || '').toLowerCase();
    const lastMsg = (c.lastMessage?.content || c.lastMessage?.fileName || '').toLowerCase();
    return name.includes(query) || email.includes(query) || lastMsg.includes(query);
  });

  // User IDs of other participants in active conversations
  const existingOtherUserIds = new Set(
    conversations
      .filter((c) => c.type === 'direct' && c.otherParticipant?.id)
      .map((c) => c.otherParticipant.id)
  );

  // Colleagues & HR from directory who don't have an active conversation yet
  const availableColleagues = directory.filter(
    (emp) => !existingOtherUserIds.has(emp.id)
  );

  // For the 'colleagues' tab, show all matching directory members
  const directoryListToShow =
    filterTab === 'colleagues'
      ? directory
      : availableColleagues;

  const showConversations = filterTab === 'all' || filterTab === 'chats';
  const showDirectory = filterTab === 'all' || filterTab === 'colleagues';
  const isSearching = Boolean(query);

  return (
    <div className="w-full lg:w-80 xl:w-96 h-full flex flex-col bg-white border-r border-slate-200 shrink-0">
      {/* Top Header - WhatsApp Style */}
      <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-slate-800">Messages</h2>
          {conversations.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#8B1D2C]/10 text-[#8B1D2C]">
              {conversations.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onNewChatClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-semibold shadow-xs cursor-pointer transition-all active:scale-95"
          title="New Chat"
        >
          <MessageSquarePlus className="w-3.5 h-3.5" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Search Input (Names, Emails, or Messages) */}
      <div className="p-2.5 border-b border-slate-100 bg-white">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search employee, HR, email or chat..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-100/90 rounded-xl focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-[#8B1D2C] transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Tabs: All | Chats | Colleagues & HR */}
        <div className="flex items-center gap-1.5 mt-2">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              filterTab === 'all'
                ? 'bg-[#8B1D2C] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('chats')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filterTab === 'chats'
                ? 'bg-[#8B1D2C] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Chats
            {conversations.length > 0 && (
              <span
                className={`text-[9px] px-1 rounded-full ${
                  filterTab === 'chats' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {conversations.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('colleagues')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filterTab === 'colleagues'
                ? 'bg-[#8B1D2C] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Colleagues & HR
            {directory.length > 0 && (
              <span
                className={`text-[9px] px-1 rounded-full ${
                  filterTab === 'colleagues' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {directory.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main List Area */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {loadingDirectory && (
          <div className="p-2.5 flex items-center justify-center gap-2 bg-slate-50/50 text-[11px] text-slate-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8B1D2C]" />
            <span>Updating directory...</span>
          </div>
        )}

        {/* SECTION 1: Active Conversations */}
        {showConversations && filteredConversations.length > 0 && (
          <div>
            <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/80 sticky top-0 z-10 border-b border-slate-100 flex items-center justify-between">
              <span>Chats ({filteredConversations.length})</span>
            </div>
            {filteredConversations.map((conv) => {
              const isSelected = conv.id === activeId;
              const otherUser = conv.otherParticipant;
              const isOnline = otherUser ? isUserOnline(otherUser.id) : false;
              const typingInfo = getTypingInfo(conv.id);
              const isTyping = Boolean(typingInfo && typingInfo.isTyping);

              const displayName = conv.name || otherUser?.name || 'Chat';
              const fullAvatar = conv.avatar || otherUser?.avatar || null;
              const isOtherHR = otherUser?.role === 'hr';

              return (
                <div
                  key={conv.id}
                  onClick={() => onSelectConversation(conv)}
                  className={`flex items-center gap-3 p-3.5 cursor-pointer transition-colors select-none ${
                    isSelected ? 'bg-slate-100/90' : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Avatar with Online Badge */}
                  <div className="relative shrink-0">
                    {fullAvatar ? (
                      <img
                        src={fullAvatar}
                        alt={displayName}
                        className="w-12 h-12 rounded-2xl object-cover ring-1 ring-slate-200"
                      />
                    ) : (
                      <div
                        className={`w-12 h-12 rounded-2xl ${
                          isOtherHR ? 'bg-purple-700' : 'bg-[#8B1D2C]'
                        } text-white flex items-center justify-center font-bold text-base shadow-xs uppercase`}
                      >
                        {displayName.charAt(0)}
                      </div>
                    )}
                    {isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                    )}
                  </div>

                  {/* Info & Last Message Snippet */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h4
                          className={`text-xs font-extrabold truncate ${
                            isSelected ? 'text-[#8B1D2C]' : 'text-slate-900'
                          }`}
                        >
                          {displayName}
                        </h4>
                        {isOtherHR && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-purple-100 text-purple-700 tracking-wide uppercase shrink-0">
                            HR
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                        {formatMessageTime(conv.lastMessageAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      {isTyping ? (
                        <span className="text-emerald-600 font-semibold italic text-xs flex items-center gap-1.5 animate-pulse truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                          typing...
                        </span>
                      ) : (
                        <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                          {conv.lastMessage?.status === 'read' && (
                            <CheckCheck className="w-3.5 h-3.5 text-sky-500 shrink-0 inline" />
                          )}
                          {conv.lastMessage?.status === 'delivered' && (
                            <CheckCheck className="w-3.5 h-3.5 text-slate-400 shrink-0 inline" />
                          )}
                          {conv.lastMessage?.status === 'sent' && (
                            <Check className="w-3.5 h-3.5 text-slate-400 shrink-0 inline" />
                          )}
                          <span className="truncate">
                            {conv.lastMessage ? (
                              <>
                                {conv.lastMessage.senderId === user?.id ? (
                                  <span className="font-semibold text-slate-700">You: </span>
                                ) : conv.type === 'group' && conv.lastMessage.senderName ? (
                                  <span className="font-semibold text-slate-700">
                                    {conv.lastMessage.senderName}:{' '}
                                  </span>
                                ) : null}
                                {conv.lastMessage.isDeletedForEveryone ? (
                                  <span className="italic text-slate-400">
                                    🚫 This message was deleted
                                  </span>
                                ) : conv.lastMessage.messageType === 'image' ? (
                                  <span>📷 Photo</span>
                                ) : conv.lastMessage.messageType === 'document' ||
                                  conv.lastMessage.messageType === 'file' ? (
                                  <span>📄 {conv.lastMessage.fileName || 'Attachment'}</span>
                                ) : (
                                  conv.lastMessage.content ||
                                  conv.lastMessage.fileName ||
                                  'Attachment'
                                )}
                              </>
                            ) : (
                              <span className="italic text-slate-400">No messages yet</span>
                            )}
                          </span>
                        </p>
                      )}

                      {/* Unread Counter Pill */}
                      {conv.unreadCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-[#8B1D2C] text-white text-[10px] font-extrabold flex items-center justify-center shrink-0 shadow-xs">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SECTION 2: Colleagues & HR Directory (Always accessible!) */}
        {showDirectory && directoryListToShow.length > 0 && (
          <div>
            <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50/90 sticky top-0 z-10 border-b border-slate-100 flex items-center justify-between">
              <span>
                {filterTab === 'colleagues'
                  ? `All Staff & HR (${directoryListToShow.length})`
                  : `Colleagues & HR (${directoryListToShow.length})`}
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Click to chat</span>
            </div>
            {directoryListToShow.map((emp) => {
              const isOnline = isUserOnline(emp.id);
              const isHR = emp.role === 'hr';

              return (
                <div
                  key={emp.id}
                  onClick={() => onStartDirectChat && onStartDirectChat(emp)}
                  className="flex items-center gap-3 p-3.5 hover:bg-slate-50 cursor-pointer transition-colors group select-none"
                >
                  {/* Avatar with Online Status */}
                  <div className="relative shrink-0">
                    {emp.avatar ? (
                      <img
                        src={emp.avatar}
                        alt={emp.name}
                        className="w-12 h-12 rounded-2xl object-cover ring-1 ring-slate-200"
                      />
                    ) : (
                      <div
                        className={`w-12 h-12 rounded-2xl ${
                          isHR ? 'bg-purple-700' : 'bg-[#8B1D2C]'
                        } text-white flex items-center justify-center font-bold text-base shadow-xs uppercase`}
                      >
                        {emp.name ? emp.name.charAt(0) : 'U'}
                      </div>
                    )}
                    {isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#8B1D2C] transition-colors truncate">
                          {emp.name}
                        </h4>
                        {isHR ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-purple-100 text-purple-700 uppercase shrink-0">
                            HR
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-100 text-slate-600 capitalize shrink-0">
                            Employee
                          </span>
                        )}
                      </div>
                      {isOnline ? (
                        <span className="text-[10px] text-emerald-600 font-semibold shrink-0">
                          Online
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 shrink-0">Offline</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      {emp.designation ? `${emp.designation} • ${emp.email}` : emp.email}
                    </p>
                  </div>

                  {/* Action Icon */}
                  <button
                    type="button"
                    title="Start Chat"
                    className="p-2 rounded-xl bg-slate-100 group-hover:bg-[#8B1D2C] group-hover:text-white text-slate-400 transition-colors shrink-0"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty Search Results */}
        {isSearching &&
          !loadingDirectory &&
          filteredConversations.length === 0 &&
          directoryListToShow.length === 0 && (
            <div className="py-14 text-center text-slate-400 text-xs px-4 flex flex-col items-center">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                <Search className="w-5 h-5" />
              </div>
              <p className="font-bold text-slate-700">No results found</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[220px]">
                No chat, employee, or HR matches "{search}"
              </p>
            </div>
          )}

        {/* Completely Empty State */}
        {!isSearching &&
          !loadingDirectory &&
          filteredConversations.length === 0 &&
          directoryListToShow.length === 0 && (
            <div className="py-14 text-center text-slate-400 px-4 flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-[#8B1D2C] mb-3">
                <MessageSquarePlus className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-700">No colleagues available</p>
              <p className="text-[11px] text-slate-400 mt-1 mb-4 max-w-[200px]">
                Click below to start a new chat
              </p>
              <button
                type="button"
                onClick={onNewChatClick}
                className="px-4 py-2 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-2 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" /> Start New Chat
              </button>
            </div>
          )}
      </div>
    </div>
  );
};
