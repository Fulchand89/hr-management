const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('./env');
const logger = require('./logger');

let io = null;
const onlineUsers = new Map(); // userId -> Set of socket IDs

/**
 * Initialize Socket.IO with HTTP Server
 */
const initWebSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.WS_CORS_ORIGIN,
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

      // Join role room (e.g., role:admin, role:hr)
      if (user.role) {
        socket.join(`role:${user.role}`);
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
