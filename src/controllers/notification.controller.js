const socketService = require('../services/socket.service');
const emailService = require('../services/email.service');
const { getOnlineUsers } = require('../config/websocket');
const { User } = require('../models');
const ApiResponse = require('../utils/apiResponse');
const { NotFoundError } = require('../utils/apiError');

/**
 * Broadcast an announcement via real-time WebSocket and optional email
 */
const broadcastAnnouncement = async (req, res, next) => {
  try {
    const { title, message, sendEmail = false, targetRole = null, targetDepartment = null } = req.body;

    const payload = {
      title,
      message,
      sender: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'System Admin',
      timestamp: new Date().toISOString()
    };

    // Emit via WebSocket
    if (targetRole) {
      socketService.emitToRole(targetRole, 'notification:announcement', payload);
    } else if (targetDepartment) {
      socketService.emitToDepartment(targetDepartment, 'notification:announcement', payload);
    } else {
      socketService.broadcastNotification(payload);
    }

    // Optionally send email to matching users
    if (sendEmail) {
      const where = {};
      if (targetRole) where.role = targetRole;
      if (targetDepartment) where.department = targetDepartment;

      const users = await User.findAll({ where, attributes: ['email', 'firstName', 'lastName'] });
      users.forEach((u) => {
        emailService.sendHRNotificationEmail({
          to: u.email,
          name: `${u.firstName} ${u.lastName}`,
          subject: title,
          message
        }).catch(() => {});
      });
    }

    return ApiResponse.success(res, {
      message: 'Announcement broadcasted successfully',
      data: {
        payload,
        emailDispatched: sendEmail,
        targetRole,
        targetDepartment
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send real-time notification to a specific user
 */
const sendDirectNotification = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { title, message, type = 'info' } = req.body;

    const targetUser = await User.findByPk(userId);
    if (!targetUser) {
      throw new NotFoundError(`User ${userId} not found`);
    }

    const payload = {
      title,
      message,
      type,
      sender: `${req.user.firstName} ${req.user.lastName}`
    };

    socketService.emitToUser(userId, 'notification:direct', payload);

    return ApiResponse.success(res, {
      message: 'Direct notification dispatched',
      data: payload
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get system status and online websocket connections
 */
const getStatus = async (req, res) => {
  const onlineUserIds = getOnlineUsers();
  return ApiResponse.success(res, {
    message: 'System and WebSocket status',
    data: {
      onlineCount: onlineUserIds.length,
      onlineUsers: onlineUserIds,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    }
  });
};

module.exports = {
  broadcastAnnouncement,
  sendDirectNotification,
  getStatus
};
