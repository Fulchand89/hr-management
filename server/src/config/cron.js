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

      // Find any shifts punched in that were never clocked out
      const unclosed = await Attendance.findAll({
        where: {
          date: { [Op.lte]: today },
          clockIn: { [Op.ne]: null },
          clockOut: null
        }
      });

      for (const record of unclosed) {
        const clockInDate = new Date(record.clockIn);
        const breakMins = Number(record.totalBreakMinutes) || 0;
        const totalMs = Math.round((8.0 * 60 + breakMins) * 60 * 1000);
        const autoClockOut = new Date(clockInDate.getTime() + totalMs);

        let timeline = [];
        if (Array.isArray(record.timeline)) {
          timeline = [...record.timeline];
        } else if (typeof record.timeline === 'string') {
          try { timeline = JSON.parse(record.timeline) || []; } catch {}
        }

        const formatTime = (d) => {
          try {
            return d.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
          } catch {
            return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          }
        };

        if (!timeline.some((t) => t.label === 'Punch Out' || t.status === 'punched_out')) {
          timeline.push({
            label: 'Punch Out',
            time: formatTime(autoClockOut),
            timestamp: autoClockOut.toISOString(),
            status: 'punched_out'
          });
        }

        record.clockOut = autoClockOut;
        record.totalHours = 8.0;
        record.timeline = timeline;
        record.remarks = (record.remarks ? record.remarks + ' | ' : '') + 'Auto-closed at midnight due to missing clock out.';
        record.changed('timeline', true);
        await record.save();

        await Notification.create({
          userId: record.userId,
          title: 'Shift Auto-Closed',
          message: `Your shift for ${record.date} was auto-closed. Clock-out set to ${formatTime(autoClockOut)}. Please raise an Attendance Correction if needed.`,
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
  // 5. Monthly Automated Payroll Calculation (1st of month at 01:00 AM)
  if (env.CRON.PAYROLL_ENABLED) {
    const payrollJob = cron.schedule(env.CRON.PAYROLL_SCHEDULE, async () => {
      logger.info('[CRON] Running automated monthly payroll batch generation...');
      try {
        const payrollService = require('../services/payroll.service');
        const now = new Date();
        // Calculate prior month when running on the 1st
        let targetMonth = now.getMonth(); // 0-indexed, so getMonth() is precisely the 1-indexed previous month
        let targetYear = now.getFullYear();
        if (targetMonth === 0) {
          targetMonth = 12;
          targetYear -= 1;
        }

        const result = await payrollService.generateMonthlyPayroll({
          month: targetMonth,
          year: targetYear,
          generatedBy: null,
          isAutomatedCron: true
        });

        logger.info(`[CRON] Automated payroll batch completed: ${result.totalProcessed || 0} employees processed for ${targetMonth}/${targetYear}.`);

        try {
          const socketService = require('../services/socket.service');
          socketService.emitToRole('hr', 'notification', {
            title: 'Automated Monthly Payroll Completed',
            message: `Automated payroll for ${targetMonth}/${targetYear} calculated for ${result.totalProcessed || 0} employees (${result.totalEligible || result.totalProcessed} eligible).`,
            type: 'payroll_automated',
            timestamp: new Date().toISOString(),
            data: { month: targetMonth, year: targetYear, totalProcessed: result.totalProcessed }
          });
        } catch (sErr) {
          logger.warn('[CRON] Socket notification error for payroll cron:', sErr.message);
        }
      } catch (err) {
        logger.error('[CRON] Automated monthly payroll error:', err.message);
      }
    });
    scheduledTasks.push(payrollJob);
  }

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
