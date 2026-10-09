const cron = require('node-cron');
const env = require('./env');
const logger = require('./logger');

const scheduledTasks = [];

/**
 * Initialize all cron jobs
 */
const initCronJobs = () => {
  if (!env.CRON.ENABLED) {
    logger.info('Cron jobs are disabled via CRON_ENABLED=false');
    return;
  }

  // 1. Daily Attendance Reminder (Mon-Fri 10:00 AM)
  const attendanceJob = cron.schedule(env.CRON.ATTENDANCE_SCHEDULE, () => {
    logger.info('[CRON] Running daily attendance reminder job...');
    try {
      // Lazy load socket service to broadcast event to online employees
      const socketService = require('../services/socket.service');
      socketService.broadcastNotification({
        title: 'Morning Attendance Reminder',
        message: 'Please remember to clock in your attendance for today.',
        type: 'attendance',
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      logger.error('[CRON] Attendance reminder error:', err.message);
    }
  });
  scheduledTasks.push(attendanceJob);

  // 2. Daily Leave & Activity Summary for HR (Mon-Fri 07:00 PM)
  const leaveAlertJob = cron.schedule(env.CRON.LEAVE_ALERT_SCHEDULE, () => {
    logger.info('[CRON] Running end-of-day HR leave alert & summary job...');
    try {
      const socketService = require('../services/socket.service');
      socketService.emitToRole('hr', 'notification', {
        title: 'Daily HR Leave Summary',
        message: 'Review pending employee leave requests before the end of the day.',
        type: 'leave_summary',
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      logger.error('[CRON] Leave alert error:', err.message);
    }
  });
  scheduledTasks.push(leaveAlertJob);

  // 3. Weekly Maintenance & Token Cleanup (Sunday at Midnight)
  const cleanupJob = cron.schedule(env.CRON.CLEANUP_SCHEDULE, async () => {
    logger.info('[CRON] Running weekly database token & maintenance cleanup job...');
    try {
      const { User } = require('../models');
      const { Op } = require('sequelize');

      if (User) {
        // Clear expired password reset tokens
        const [updatedRows] = await User.update(
          { resetPasswordToken: null, resetPasswordExpires: null },
          {
            where: {
              resetPasswordExpires: {
                [Op.lt]: new Date()
              }
            }
          }
        );
        logger.info(`[CRON] Cleaned up ${updatedRows} expired password reset tokens.`);
      }
    } catch (err) {
      logger.error('[CRON] Cleanup error:', err.message);
    }
  });
  scheduledTasks.push(cleanupJob);

  // 4. Midnight Attendance Auto-Close & Anomaly Detection (Daily at 23:59)
  const autoCloseJob = cron.schedule('59 23 * * *', async () => {
    logger.info('[CRON] Running midnight unpunched attendance auto-close job...');
    try {
      const { Attendance, Notification } = require('../models');
      const { Op } = require('sequelize');
      const today = new Date().toISOString().split('T')[0];

      // Find any shifts punched in today that were never clocked out
      const unclosed = await Attendance.findAll({
        where: {
          date: today,
          clockOut: null,
          status: { [Op.in]: ['working', 'WORKING', 'on_break', 'ON_BREAK'] }
        }
      });

      for (const record of unclosed) {
        await record.update({
          status: 'half_day',
          notes: (record.notes ? record.notes + ' | ' : '') + 'Auto-closed at midnight due to missing clock out.'
        });

        await Notification.create({
          userId: record.userId,
          title: 'Missing Punch Out Detected',
          message: `Your shift for ${today} was not clocked out. Please raise an Attendance Correction if needed.`,
          type: 'ATTENDANCE_CORRECTION_REQUIRED'
        }).catch(() => {});
      }

      if (unclosed.length > 0) {
        logger.info(`[CRON] Auto-closed ${unclosed.length} open shift(s) at midnight.`);
      }
    } catch (err) {
      logger.error('[CRON] Midnight attendance auto-close error:', err.message);
    }
  });
  scheduledTasks.push(autoCloseJob);

  logger.success(`Scheduled ${scheduledTasks.length} cron background tasks.`);
};

/**
 * Stop all running cron jobs (useful for graceful shutdown and tests)
 */
const stopCronJobs = () => {
  scheduledTasks.forEach((task) => task.stop());
  scheduledTasks.length = 0;
  logger.info('All cron jobs stopped.');
};

module.exports = {
  initCronJobs,
  stopCronJobs
};
