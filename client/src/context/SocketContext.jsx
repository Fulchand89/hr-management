import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getAuthToken, getAuthUser } from '../services/authStorage';
import { chatSounds } from '../utils/chatSounds';
import { getConversations } from '../services/chatService';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token: authToken, user: authUser } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [typingMap, setTypingMap] = useState({}); // conversationId -> { userId, userName, isTyping }
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const activeConvRef = useRef(null);

  // Sync ref with state
  useEffect(() => {
    activeConvRef.current = activeConversationId;
  }, [activeConversationId]);

  // Fetch initial total unread count across conversations
  const refreshUnreadCount = useCallback(async () => {
    try {
      const token = authToken || getAuthToken();
      if (!token) return;
      const convs = await getConversations();
      const sum = convs.reduce((acc, curr) => acc + (curr.unreadCount || 0), 0);
      setTotalUnreadCount(sum);
    } catch {
      // Ignore background error
    }
  }, [authToken]);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  // Connect to Socket.IO
  useEffect(() => {
    const token = authToken || getAuthToken();
    const user = authUser || getAuthUser();
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Determine backend socket host dynamically
    let socketHost = window.location.origin;
    if (import.meta.env.VITE_API_URL && typeof import.meta.env.VITE_API_URL === 'string' && import.meta.env.VITE_API_URL.startsWith('http')) {
      socketHost = import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '');
    }

    const newSocket = io(socketHost, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      refreshUnreadCount();
      // Query initial online users list
      newSocket.emit('chat:get_online_users', (ids) => {
        if (Array.isArray(ids)) {
          setOnlineUserIds(new Set(ids));
        }
      });
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Online presence listener
    newSocket.on('user:presence', ({ userId, status }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        if (status === 'online') {
          next.add(userId);
        } else {
          next.delete(userId);
        }
        return next;
      });
    });

    // Real-time typing listener (Proper WhatsApp behavior)
    newSocket.on('chat:user_typing', ({ conversationId, userId, userName, isTyping }) => {
      setTypingMap((prev) => {
        const updated = { ...prev };
        if (isTyping) {
          updated[conversationId] = { userId, userName, isTyping: true };
        } else {
          delete updated[conversationId];
        }
        return updated;
      });
    });

    // Global incoming message sound & unread update
    newSocket.on('chat:receive', ({ message }) => {
      if (!message) return;
      
      const currentActiveId = activeConvRef.current;
      // Play audio chime
      chatSounds.playReceive();

      // If user is not currently in this conversation, increment unread badge
      if (message.conversationId !== currentActiveId) {
        setTotalUnreadCount((prev) => prev + 1);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [authToken, authUser?.id, refreshUnreadCount]);

  const isUserOnline = useCallback(
    (userId) => {
      if (!userId) return false;
      return onlineUserIds.has(userId);
    },
    [onlineUserIds]
  );

  const getTypingInfo = useCallback(
    (conversationId) => {
      if (!conversationId) return null;
      return typingMap[conversationId] || null;
    },
    [typingMap]
  );

  const value = {
    socket,
    isConnected,
    isUserOnline,
    onlineUserIds,
    getTypingInfo,
    typingMap,
    totalUnreadCount,
    setTotalUnreadCount,
    refreshUnreadCount,
    activeConversationId,
    setActiveConversationId,
    playSendSound: () => chatSounds.playSend(),
    playReceiveSound: () => chatSounds.playReceive()
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    return {
      socket: null,
      isConnected: false,
      isUserOnline: () => false,
      onlineUserIds: new Set(),
      getTypingInfo: () => null,
      typingMap: {},
      totalUnreadCount: 0,
      setTotalUnreadCount: () => {},
      refreshUnreadCount: () => {},
      activeConversationId: null,
      setActiveConversationId: () => {},
      playSendSound: () => {},
      playReceiveSound: () => {}
    };
  }
  return context;
};
