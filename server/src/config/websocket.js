const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('./env');
const logger = require('./logger');

let io = null;
const onlineUsers = new Map(); // userId -> Set of socket IDs

const { isOriginAllowed } = require('./corsOptions');

/**
 * Initialize Socket.IO with HTTP Server
 */
const initWebSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          return callback(null, true);
        }
        return callback(new Error('WebSocket Blocked by CORS'));
      },
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Socket Authentication Middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1] || socket.handshake.query?.token;
      
      if (!token) {
        // Allow unauthenticated connection as guest or reject
        // We reject if auth is required, or attach guest
        return next();
      }

      const decoded = jwt.verify(token, env.JWT.SECRET);
      socket.user = decoded;
      return next();
    } catch (err) {
      logger.warn(`WebSocket auth failed: ${err.message}`);
      return next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    logger.info(`Socket connected: ${socket.id} (User: ${user ? user.email : 'Guest'})`);

    if (user && user.id) {
      // Add socket to user's set of active connections
      if (!onlineUsers.has(user.id)) {
        onlineUsers.set(user.id, new Set());
      }
      onlineUsers.get(user.id).add(socket.id);

      // Join individual user room
      socket.join(`user:${user.id}`);

      // Automatically join all existing conversation rooms for this user
      try {
        const { ConversationParticipant } = require('../models');
        ConversationParticipant.findAll({
          where: { userId: user.id },
          attributes: ['conversationId']
        }).then((myParticipations) => {
          myParticipations.forEach((p) => {
            socket.join(`conv:${p.conversationId}`);
          });
        }).catch(() => {});
      } catch {}

      // Join role room (e.g., role:admin, role:hr)
      if (user.role) {
        socket.join(`role:${user.role}`);
        socket.join(`role:${user.role.toLowerCase()}`);
        socket.join(`role:${user.role.toUpperCase()}`);
      }

      // Join department room if available
      if (user.department) {
        socket.join(`dept:${user.department}`);
      }

      // Broadcast online status
      io.emit('user:presence', {
        userId: user.id,
        status: 'online',
        timestamp: new Date().toISOString()
      });
    }

    // Ping / Pong heartbeat
    socket.on('ping', () => {
      socket.emit('pong', { time: Date.now() });
    });

    // ==========================================
    // CHAT REAL-TIME EVENT HANDLERS
    // ==========================================
    socket.on('chat:join', ({ conversationId }) => {
      if (conversationId) {
        socket.join(`conv:${conversationId}`);
      }
    });

    socket.on('chat:leave', ({ conversationId }) => {
      if (conversationId) {
        socket.leave(`conv:${conversationId}`);
      }
    });

    socket.on('chat:typing', async ({ conversationId, isTyping, userName }) => {
      if (!user || !user.id || !conversationId) return;
      const senderName = userName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
      const typingPayload = {
        conversationId,
        userId: user.id,
        userName: senderName,
        isTyping: Boolean(isTyping)
      };

      socket.to(`conv:${conversationId}`).emit('chat:user_typing', typingPayload);

      try {
        const { ConversationParticipant } = require('../models');
        const parts = await ConversationParticipant.findAll({
          where: { conversationId },
          attributes: ['userId']
        });
        parts.forEach((p) => {
          if (p.userId !== user.id) {
            io.to(`user:${p.userId}`).emit('chat:user_typing', typingPayload);
          }
        });
      } catch {}
    });

    socket.on('chat:send', async (payload, callback) => {
      try {
        if (!user || !user.id) throw new Error('Unauthorized');
        const chatService = require('../services/chat.service');
        const saved = await chatService.saveMessage(user.id, payload);

        // Acknowledge back to sender
        if (typeof callback === 'function') {
          callback({ success: true, message: saved, tempId: payload?.tempId });
        } else {
          socket.emit('chat:ack', { tempId: payload?.tempId, message: saved, status: 'sent' });
        }

        // Broadcast to all other room members
        socket.to(`conv:${payload.conversationId}`).emit('chat:receive', { message: saved });

        // Also deliver to individual user rooms in case any participant is in the sidebar or another tab
        const { ConversationParticipant } = require('../models');
        const parts = await ConversationParticipant.findAll({
          where: { conversationId: payload.conversationId },
          attributes: ['userId']
        });
        parts.forEach((p) => {
          if (p.userId !== user.id) {
            io.to(`user:${p.userId}`).emit('chat:receive', { message: saved });
          }
        });
      } catch (err) {
        logger.warn(`Failed to process chat:send from user ${user?.id}: ${err.message}`);
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    });

    socket.on('chat:mark_read', async ({ conversationId, messageId }) => {
      try {
        if (!user || !user.id || !conversationId) return;
        const chatService = require('../services/chat.service');
        await chatService.markConversationAsRead(user.id, conversationId);

        const receiptPayload = {
          conversationId,
          readerId: user.id,
          messageId,
          readAt: new Date().toISOString()
        };

        socket.to(`conv:${conversationId}`).emit('chat:read_receipt', receiptPayload);

        const { ConversationParticipant } = require('../models');
        const parts = await ConversationParticipant.findAll({
          where: { conversationId },
          attributes: ['userId']
        });
        parts.forEach((p) => {
          if (p.userId !== user.id) {
            io.to(`user:${p.userId}`).emit('chat:read_receipt', receiptPayload);
          }
        });
      } catch (err) {
        logger.warn(`Failed to process chat:mark_read: ${err.message}`);
      }
    });

    socket.on('chat:get_online_users', (callback) => {
      const activeUserIds = Array.from(onlineUsers.keys());
      if (typeof callback === 'function') {
        callback(activeUserIds);
      } else {
        socket.emit('chat:online_users', activeUserIds);
      }
    });

    // Custom notification event listener from client
    socket.on('client:message', (payload) => {
      logger.info(`Message received from socket ${socket.id}:`, payload);
    });

    // Disconnect handler
    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} (${reason})`);
      if (user && user.id && onlineUsers.has(user.id)) {
        const userSockets = onlineUsers.get(user.id);
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(user.id);
          io.emit('user:presence', {
            userId: user.id,
            status: 'offline',
            timestamp: new Date().toISOString()
          });
        }
      }
    });
  });

  logger.success('WebSocket server initialized.');
  return io;
};

/**
 * Get Socket.IO instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized. Please call initWebSocket first.');
  }
  return io;
};

/**
 * Get list of currently online user IDs
 */
const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};

module.exports = {
  initWebSocket,
  getIO,
  getOnlineUsers
};
