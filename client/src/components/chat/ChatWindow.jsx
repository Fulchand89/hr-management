import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Paperclip,
  Smile,
  X,
  FileText,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { ChatHeader } from './ChatHeader';
import { MessageBubble } from './MessageBubble';
import { ImageLightboxModal } from './ImageLightboxModal';
import { useSocket } from '../../context/SocketContext';
import {
  getMessages,
  sendMessage,
  uploadAttachment,
  markConversationAsRead,
  deleteMessageForEveryone
} from '../../services/chatService';

export const ChatWindow = ({
  conversation,
  currentUser,
  onBack,
  onMessageSent
}) => {
  const { socket, getTypingInfo, playSendSound } = useSocket();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const feedRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimerRef = useRef(null);
  const isTypingRef = useRef(false);

  const conversationId = conversation?.id;
  const typingInfo = getTypingInfo(conversationId);
  const isTyping = Boolean(typingInfo && typingInfo.isTyping);

  // Load message history
  const loadInitialMessages = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const data = await getMessages(conversationId, { limit: 50 });
      setMessages(data.messages || []);
      setHasMore(data.hasMore || false);
      markConversationAsRead(conversationId).catch(() => {});
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadInitialMessages();
  }, [loadInitialMessages]);

  // Scroll to bottom helper
  const scrollToBottom = (smooth = true) => {
    if (feedRef.current) {
      feedRef.current.scrollTo({
        top: feedRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [messages.length]);

  // Join Socket.IO Room for active conversation
  useEffect(() => {
    if (!socket || !conversationId) return;

    socket.emit('chat:join', { conversationId });

    // Listen for incoming messages in this conversation
    const handleReceiveMessage = ({ message }) => {
      if (message && message.conversationId === conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
        // Acknowledge read immediately since chat is active
        socket.emit('chat:mark_read', { conversationId, messageId: message.id });
      }
    };

    // Listen for read receipts
    const handleReadReceipt = ({ conversationId: cId }) => {
      if (cId === conversationId) {
        setMessages((prev) =>
          prev.map((m) => (m.senderId === currentUser.id ? { ...m, status: 'read' } : m))
        );
      }
    };

    // Listen for deleted messages
    const handleMessageDeleted = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, isDeletedForEveryone: true, content: '🚫 This message was deleted', fileUrl: null, fileName: null }
            : m
        )
      );
    };

    socket.on('chat:receive', handleReceiveMessage);
    socket.on('chat:read_receipt', handleReadReceipt);
    socket.on('chat:msg_deleted', handleMessageDeleted);

    return () => {
      socket.emit('chat:leave', { conversationId });
      socket.off('chat:receive', handleReceiveMessage);
      socket.off('chat:read_receipt', handleReadReceipt);
      socket.off('chat:msg_deleted', handleMessageDeleted);
    };
  }, [socket, conversationId, currentUser?.id]);

  // Handle typing debounce
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);

    if (!socket || !conversationId) return;

    const senderDisplayName = `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || currentUser?.name || currentUser?.email;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('chat:typing', { conversationId, isTyping: true, userName: senderDisplayName });
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit('chat:typing', { conversationId, isTyping: false, userName: senderDisplayName });
    }, 2500);
  };

  const stopTypingNow = () => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (isTypingRef.current && socket && conversationId) {
      isTypingRef.current = false;
      const senderDisplayName = `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || currentUser?.name || currentUser?.email;
      socket.emit('chat:typing', { conversationId, isTyping: false, userName: senderDisplayName });
    }
  };

  // Send text message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const content = inputText.trim();
    if (!content && !replyingTo) return;

    stopTypingNow();
    setInputText('');
    const tempReplyTo = replyingTo;
    setReplyingTo(null);

    // Optimistic message with temporary ID
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      conversationId,
      senderId: currentUser.id,
      senderName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim(),
      messageType: 'text',
      content,
      status: 'pending',
      replyTo: tempReplyTo ? { id: tempReplyTo.id, content: tempReplyTo.content, senderName: tempReplyTo.senderName } : null,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    playSendSound();

    try {
      if (socket && socket.connected) {
        let ackReceived = false;
        socket.emit(
          'chat:send',
          {
            conversationId,
            content,
            messageType: 'text',
            replyToId: tempReplyTo?.id,
            tempId
          },
          (res) => {
            ackReceived = true;
            if (res && res.success && res.message) {
              setMessages((prev) =>
                prev.map((m) => (m.id === tempId ? res.message : m))
              );
              if (onMessageSent) onMessageSent(res.message);
            }
          }
        );

        // Fallback: If socket ack not received in 2.5s, submit via REST
        setTimeout(async () => {
          if (!ackReceived) {
            try {
              const saved = await sendMessage(conversationId, {
                content,
                messageType: 'text',
                replyToId: tempReplyTo?.id
              });
              setMessages((prev) => prev.map((m) => (m.id === tempId ? saved : m)));
              if (onMessageSent) onMessageSent(saved);
            } catch (fallbackErr) {
              console.error('Fallback send failed:', fallbackErr);
            }
          }
        }, 2500);
      } else {
        // Direct REST API
        const saved = await sendMessage(conversationId, {
          content,
          messageType: 'text',
          replyToId: tempReplyTo?.id
        });
        setMessages((prev) => prev.map((m) => (m.id === tempId ? saved : m)));
        if (onMessageSent) onMessageSent(saved);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // Handle file attachment
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploadResult = await uploadAttachment(file);
      const isImg = file.type.startsWith('image/');

      const savedMsg = await sendMessage(conversationId, {
        conversationId,
        content: '',
        messageType: isImg ? 'image' : 'document',
        fileUrl: uploadResult.fileUrl,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
        mimeType: uploadResult.mimeType,
        replyToId: replyingTo?.id
      });

      setMessages((prev) => [...prev, savedMsg]);
      playSendSound();
      setReplyingTo(null);
      if (onMessageSent) onMessageSent(savedMsg);
    } catch (err) {
      alert(err?.response?.data?.message || 'File upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message for everyone?')) return;
    try {
      await deleteMessageForEveryone(messageId);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, isDeletedForEveryone: true, content: '🚫 This message was deleted', fileUrl: null, fileName: null }
            : m
        )
      );
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete message');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Group messages by date
  const renderMessageFeedWithDates = () => {
    let lastDate = null;
    return messages.map((m) => {
      const msgDate = new Date(m.createdAt).toLocaleDateString([], {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });

      const showDateDivider = msgDate !== lastDate;
      lastDate = msgDate;

      return (
        <React.Fragment key={m.id}>
          {showDateDivider && (
            <div className="flex justify-center my-3 select-none">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-white/90 border border-slate-200/80 text-slate-500 shadow-2xs">
                {msgDate}
              </span>
            </div>
          )}
          <MessageBubble
            message={m}
            isOwn={m.senderId === currentUser.id}
            onReply={(msg) => setReplyingTo(msg)}
            onDelete={handleDeleteMessage}
            onImageClick={(url) => setLightboxImage(url)}
          />
        </React.Fragment>
      );
    });
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#EFEAE2] relative overflow-hidden">
      {/* Background WhatsApp Subtle Pattern */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none bg-repeat"
        style={{
          backgroundImage: `radial-gradient(#8B1D2C 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Top Header */}
      <ChatHeader
        conversation={conversation}
        onBack={onBack}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(!isMuted)}
      />

      {/* Message Feed Area */}
      <div ref={feedRef} className="flex-1 overflow-y-auto p-4 z-10 flex flex-col">
        {loading ? (
          <div className="my-auto flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#8B1D2C]" />
            <span className="text-xs font-semibold">Loading messages...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="my-auto text-center text-slate-400 px-4">
            <div className="w-16 h-16 rounded-full bg-white/80 shadow-xs flex items-center justify-center mx-auto mb-3 text-[#8B1D2C]">
              <FileText className="w-8 h-8" />
            </div>
            <p className="text-xs font-bold text-slate-600">No messages here yet</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Say hello to start the conversation!
            </p>
          </div>
        ) : (
          renderMessageFeedWithDates()
        )}

        {/* WhatsApp-Style Floating Bouncing Dots Typing Bubble */}
        {isTyping && (
          <div className="flex items-center gap-2 mb-2 animate-fade-in select-none">
            <div className="bg-white border border-slate-200/90 px-3.5 py-2.5 rounded-2xl rounded-bl-xs shadow-2xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
            </div>
          </div>
        )}
      </div>

      {/* Quoted Message Preview Bar */}
      {replyingTo && (
        <div className="px-4 py-2 bg-white/95 border-t border-slate-200 flex items-center justify-between gap-3 z-10 animate-slide-up">
          <div className="flex-1 min-w-0 border-l-4 border-[#8B1D2C] pl-2 text-xs">
            <span className="font-extrabold text-[#8B1D2C] block">
              Replying to {replyingTo.senderName || 'Message'}
            </span>
            <span className="text-slate-500 truncate block text-[11px]">
              {replyingTo.content || replyingTo.fileName || 'Attachment'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bottom Chat Input Bar */}
      <div className="p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 z-10 shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2 max-w-5xl mx-auto">
          {/* File Attachment Hidden Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
          />

          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer transition-colors shrink-0 disabled:opacity-50"
            title="Attach file or photo"
          >
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-[#8B1D2C]" /> : <Paperclip className="w-5 h-5" />}
          </button>

          {/* Message Textarea Input */}
          <div className="flex-1 relative bg-slate-100/90 rounded-2xl border border-transparent focus-within:border-[#8B1D2C] focus-within:bg-white transition-all">
            <textarea
              rows={1}
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onBlur={stopTypingNow}
              placeholder="Type a message (Press Enter to send)..."
              className="w-full px-4 py-2.5 text-xs sm:text-sm bg-transparent border-0 focus:outline-none resize-none max-h-32 leading-relaxed"
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-2xl bg-[#8B1D2C] hover:bg-[#731724] text-white shadow-xs cursor-pointer transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
            title="Send Message"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <ImageLightboxModal imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />
      )}
    </div>
  );
};
