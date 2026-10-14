const { Op } = require('sequelize');
const { Notification, User } = require('../models');
const { NotFoundError, ForbiddenError } = require('../utils/apiError');
const logger = require('../config/logger');

/**
 * 1. Get all notifications for a user (paginated)
 */
const getMyNotifications = async (userId, query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 20;
  const offset = (page - 1) * limit;

  const whereClause = { userId };
  if (query.type && query.type.toLowerCase() !== 'all') {
    const rawType = query.type.toLowerCase();
    if (rawType === 'leaves' || rawType === 'leave') {
      whereClause.type = 'leave';
    } else if (rawType === 'attendance') {
      whereClause.type = 'attendance';
    } else if (rawType === 'personnel' || rawType === 'profile') {
      whereClause[Op.or] = [
        { type: { [Op.in]: ['info', 'warning'] } },
        { title: { [Op.like]: '%profile%' } },
        { title: { [Op.like]: '%kyc%' } },
        { message: { [Op.like]: '%profile%' } }
      ];
    } else if (rawType === 'company') {
      whereClause.type = { [Op.in]: ['announcement', 'info', 'success', 'warning'] };
    } else {
      whereClause.type = { [Op.like]: `%${query.type}%` };
    }
  }
  if (query.isRead !== undefined) {
    whereClause.isRead = query.isRead === 'true' || query.isRead === true;
  }

  const { rows, count } = await Notification.findAndCountAll({
    where: whereClause,
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  return {
    notifications: rows,
    pagination: {
      totalCount: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      hasNextPage: page * limit < count
    }
  };
};

/**
 * 2. Get unread notification count for a user
 */
const getUnreadCount = async (userId) => {
  const count = await Notification.count({
    where: { userId, isRead: false }
  });
  return { unreadCount: count };
};

/**
 * 3. Mark a single notification as read
 */
const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findByPk(notificationId);

  if (!notification) {
    throw new NotFoundError(`Notification with ID ${notificationId} not found`);
  }

  if (notification.userId !== userId) {
    throw new ForbiddenError('You do not have access to this notification');
  }

  notification.isRead = true;
  notification.readAt = new Date();
  await notification.save();

  return notification;
};

/**
 * 4. Mark all notifications as read for a user
 */
const markAllAsRead = async (userId) => {
  const [updatedCount] = await Notification.update(
    { isRead: true, readAt: new Date() },
    { where: { userId, isRead: false } }
  );
  return { updated: updatedCount };
};

/**
 * 5. Create a notification (internal — called by other services)
 */
const createNotification = async (userId, { title, message, type = 'info', actionUrl = null }) => {
  try {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      actionUrl,
      isRead: false
    });

    // Emit real-time WebSocket event to individual user room
    try {
      const socketService = require('./socket.service');
      if (socketService) {
        socketService.emitToUser(userId, 'notification', {
          id: notification.id,
          title,
          message,
          type,
          actionUrl,
          createdAt: notification.createdAt
        });
      }
    } catch {
      // socket emission is optional
    }

    return notification;
  } catch (err) {
    logger.warn('Notification creation warning:', err.message);
    return null;
  }
};

/**
 * 6. Send notification to all active HR and Admin personnel
 */
const notifyHRAndAdmins = async ({ title, message, type = 'info', actionUrl = null, excludeUserId = null }) => {
  try {
    const hrUsers = await User.findAll({
      where: {
        role: { [Op.in]: ['hr', 'admin', 'HR', 'ADMIN'] },
        status: { [Op.ne]: 'terminated' }
      },
      attributes: ['id', 'email', 'firstName', 'lastName', 'role']
    });

    if (!hrUsers || hrUsers.length === 0) return [];

    const recipients = hrUsers.filter((u) => !excludeUserId || u.id !== excludeUserId);
    if (recipients.length === 0) return [];

    const records = recipients.map((u) => ({
      userId: u.id,
      title,
      message,
      type,
      actionUrl,
      isRead: false
    }));

    const created = await Notification.bulkCreate(records);

    // Also emit real-time WebSocket events to HR and Admin rooms and user rooms
    try {
      const socketService = require('./socket.service');
      if (socketService) {
        socketService.emitToRole('hr', 'notification', { title, message, type, actionUrl });
        socketService.emitToRole('admin', 'notification', { title, message, type, actionUrl });
        socketService.emitToRole('HR', 'notification', { title, message, type, actionUrl });
        socketService.emitToRole('ADMIN', 'notification', { title, message, type, actionUrl });
        recipients.forEach((u) => {
          socketService.emitToUser(u.id, 'notification', { title, message, type, actionUrl });
        });
      }
    } catch {
      // socket emission is optional
    }

    return created;
  } catch (err) {
    logger.warn('Failed to notify HR and Admins:', err.message);
    return [];
  }
};

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification,
  notifyHRAndAdmins
};
