const { getIO } = require('../config/websocket');
const logger = require('../config/logger');

/**
 * Emit an event to a specific user by user ID
 */
const emitToUser = (userId, event, payload) => {
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit(event, {
      ...payload,
      timestamp: new Date().toISOString()
    });
    return true;
  } catch (error) {
    logger.warn(`Failed to emit socket event to user ${userId}:`, error.message);
    return false;
  }
};

/**
 * Emit an event to a specific role (e.g. 'admin', 'hr')
 */
const emitToRole = (role, event, payload) => {
  try {
    const io = getIO();
    io.to(`role:${role}`).emit(event, {
      ...payload,
      timestamp: new Date().toISOString()
    });
    return true;
  } catch (error) {
    logger.warn(`Failed to emit socket event to role ${role}:`, error.message);
    return false;
  }
};

/**
 * Emit an event to a department (e.g. 'Engineering', 'Human Resources')
 */
const emitToDepartment = (department, event, payload) => {
  try {
    const io = getIO();
    io.to(`dept:${department}`).emit(event, {
      ...payload,
      timestamp: new Date().toISOString()
    });
    return true;
  } catch (error) {
    logger.warn(`Failed to emit socket event to department ${department}:`, error.message);
    return false;
  }
};

/**
 * Broadcast an announcement or notification to all connected clients
 */
const broadcastNotification = (payload) => {
  try {
    const io = getIO();
    io.emit('notification:broadcast', {
      ...payload,
      timestamp: new Date().toISOString()
    });
    return true;
  } catch (error) {
    logger.warn('Failed to broadcast socket notification:', error.message);
    return false;
  }
};

/**
 * Broadcast an announcement or event to a specific room (e.g. role:hr, role:admin)
 */
const broadcastToRoom = (room, event, payload) => {
  try {
    const io = getIO();
    io.to(room).emit(event, {
      ...payload,
      timestamp: new Date().toISOString()
    });
    return true;
  } catch (error) {
    logger.warn(`Failed to broadcast socket event to room ${room}:`, error.message);
    return false;
  }
};

/**
 * Alias for emitToUser
 */
const sendToUser = (userId, event, payload) => emitToUser(userId, event, payload);

module.exports = {
  emitToUser,
  sendToUser,
  emitToRole,
  emitToDepartment,
  broadcastNotification,
  broadcastToRoom
};
