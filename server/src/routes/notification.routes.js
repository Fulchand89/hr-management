const express = require('express');
const router = express.Router();

const notificationController = require('../controllers/notification.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const { ROLES } = require('../constants/roles');

// All notification routes require authentication
router.use(authenticate);

// =============================================
// EMPLOYEE SELF-SERVICE ROUTES
// =============================================

// Get my notifications (paginated)
router.get('/my', notificationController.getMyNotifications);

// Get unread count for header badge
router.get('/unread-count', notificationController.getUnreadCount);

// Mark all as read
router.put('/mark-all-read', notificationController.markAllAsRead);

// Mark single notification as read
router.put('/:id/mark-read', notificationController.markAsRead);

// =============================================
// ADMIN / HR ROUTES
// =============================================

// Realtime announcement to all users or role/department
router.post('/broadcast', authorize(ROLES.ADMIN, ROLES.HR), notificationController.broadcastAnnouncement);

// Direct notification to a specific employee
router.post('/user/:userId', authorize(ROLES.ADMIN, ROLES.HR), notificationController.sendDirectNotification);

// WebSocket server statistics and connected users
router.get('/status', notificationController.getStatus);

module.exports = router;
