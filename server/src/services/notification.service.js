const { Op } = require('sequelize');
const { Notification } = require('../models');
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
    whereClause.type = { [Op.like]: `%${query.type}%` };
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
const createNotification = async (userId, { title, message, type = 'info' }) => {
  try {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      isRead: false
    });
    return notification;
  } catch (err) {
    logger.warn('Notification creation warning:', err.message);
    return null;
  }
};

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification
};
