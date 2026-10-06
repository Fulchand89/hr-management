const socketService = require('../services/socket.service');
const emailService = require('../services/email.service');
const notificationService = require('../services/notification.service');
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

// =============================================
// EMPLOYEE SELF-SERVICE NOTIFICATION CONTROLLERS
// =============================================

/**
 * GET /api/v1/notifications/my - Get logged-in user's notifications
 */
const getMyNotifications = async (req, res, next) => {
  try {
    const result = await notificationService.getMyNotifications(req.user.id, req.query);
    return ApiResponse.success(res, {
      message: 'Notifications retrieved successfully',
      data: result.notifications,
      meta: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/notifications/unread-count - Get unread count for badge
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const result = await notificationService.getUnreadCount(req.user.id);
    return ApiResponse.success(res, {
      message: 'Unread count retrieved',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/notifications/:id/mark-read - Mark one notification as read
 */
const markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user.id);
    return ApiResponse.success(res, {
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/notifications/mark-all-read - Mark all as read
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.id);
    return ApiResponse.success(res, {
      message: `${result.updated} notifications marked as read`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  broadcastAnnouncement,
  sendDirectNotification,
  getStatus,
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
};
