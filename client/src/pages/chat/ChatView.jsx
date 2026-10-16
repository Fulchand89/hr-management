import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import { ChatSidebar } from '../../components/chat/ChatSidebar';
import { ChatWindow } from '../../components/chat/ChatWindow';
import { NewChatModal } from '../../components/chat/NewChatModal';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import {
  getConversations,
  getOrCreateDirectChat
} from '../../services/chatService';

export const ChatView = () => {
  const { user } = useAuth();
  const { socket, activeConversationId, setActiveConversationId, refreshUnreadCount } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);

  // Load conversations list
  const loadConversations = useCallback(async () => {
    try {
      const data = await getConversations();
      setConversations(data);
      // If active conversation exists, update its reference
      if (activeConversationId) {
        const found = data.find((c) => c.id === activeConversationId);
        if (found) setSelectedConversation(found);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [activeConversationId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Handle incoming real-time message to update sidebar order & snippet
  useEffect(() => {
    if (!socket) return;

    const handleIncomingMessage = ({ message }) => {
      if (!message) return;
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === message.conversationId);
        if (exists) {
          const updated = {
            ...exists,
            lastMessageAt: message.createdAt,
            lastMessage: {
              id: message.id,
              content: message.content,
              messageType: message.messageType,
              fileName: message.fileName,
              senderId: message.senderId,
              senderName: message.senderName,
              status: message.status,
              createdAt: message.createdAt
            },
            unreadCount:
              message.conversationId === activeConversationId
                ? 0
                : (exists.unreadCount || 0) + 1
          };
          // Move to top of list (WhatsApp style)
          return [updated, ...prev.filter((c) => c.id !== message.conversationId)];
        }
        // If brand new conversation not yet in sidebar, refresh
        loadConversations();
        return prev;
      });
    };

    socket.on('chat:receive', handleIncomingMessage);
    return () => {
      socket.off('chat:receive', handleIncomingMessage);
    };
  }, [socket, activeConversationId, loadConversations]);

  const handleSelectConversation = (conv) => {
    setSelectedConversation(conv);
    setActiveConversationId(conv.id);
    // Optimistically mark unread as 0 in sidebar and guarantee presence in list
    setConversations((prev) => {
      const exists = prev.some((c) => c.id === conv.id);
      if (exists) {
        return prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c));
      }
      return [{ ...conv, unreadCount: 0 }, ...prev];
    });
    refreshUnreadCount();
  };

  const handleStartDirectChat = async (targetUser) => {
    setIsNewChatModalOpen(false);
    setSearch('');
    try {
      const res = await getOrCreateDirectChat(targetUser.id);
      if (res && res.conversation) {
        await loadConversations();
        const otherUser = res.otherParticipant || targetUser;
        const displayName =
          otherUser.name ||
          `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() ||
          otherUser.email;
        const convObj = {
          ...res.conversation,
          name: displayName,
          avatar: otherUser.avatar,
          otherParticipant: otherUser
        };
        handleSelectConversation(convObj);
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to start chat');
    }
  };

  return (
    <div className="flex-1 h-[calc(100vh-7rem)] min-h-0 flex overflow-hidden bg-white border border-slate-200/90 rounded-2xl shadow-sm">
      {/* Left Column: Sidebar (Visible on desktop or when no chat is selected on mobile) */}
      <div
        className={`${
          selectedConversation ? 'hidden lg:flex' : 'flex'
        } w-full lg:w-80 xl:w-96 h-full`}
      >
        <ChatSidebar
          conversations={conversations}
          activeId={selectedConversation?.id}
          onSelectConversation={handleSelectConversation}
          onNewChatClick={() => setIsNewChatModalOpen(true)}
          search={search}
          onSearchChange={setSearch}
          onStartDirectChat={handleStartDirectChat}
        />
      </div>

      {/* Right Column: Chat Window or Empty State */}
      <div
        className={`${
          selectedConversation ? 'flex' : 'hidden lg:flex'
        } flex-1 h-full min-w-0`}
      >
        {selectedConversation ? (
          <ChatWindow
            key={selectedConversation.id}
            conversation={selectedConversation}
            currentUser={user}
            onBack={() => {
              setSelectedConversation(null);
              setActiveConversationId(null);
            }}
            onMessageSent={(savedMsg) => {
              // Update last message preview in sidebar
              setConversations((prev) => {
                const found = prev.find((c) => c.id === savedMsg.conversationId);
                if (!found) return prev;
                const updated = {
                  ...found,
                  lastMessageAt: savedMsg.createdAt,
                  lastMessage: {
                    id: savedMsg.id,
                    content: savedMsg.content,
                    messageType: savedMsg.messageType,
                    fileName: savedMsg.fileName,
                    senderId: savedMsg.senderId,
                    senderName: savedMsg.senderName,
                    status: savedMsg.status,
                    createdAt: savedMsg.createdAt
                  }
                };
                return [updated, ...prev.filter((c) => c.id !== savedMsg.conversationId)];
              });
            }}
          />
        ) : (
          /* Empty State Placeholder (Clean WhatsApp Web Style) */
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#F8FAFC] text-center select-none border-l border-slate-200">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-[#8B1D2C] mb-4">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Select a chat to start messaging
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mb-4 leading-relaxed">
              Choose a colleague from the list on the left or start a new conversation.
            </p>
            <button
              type="button"
              onClick={() => setIsNewChatModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-2 transition-all active:scale-95"
            >
              <span>New Conversation</span>
            </button>
          </div>
        )}
      </div>

      {/* New Chat Employee Directory Modal */}
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        onSelectUser={handleStartDirectChat}
      />
    </div>
  );
};

export default ChatView;
