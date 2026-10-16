const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const roleRoutes = require('./role.routes');
const permissionRoutes = require('./permission.routes');
const designationRoutes = require('./designation.routes');
const notificationRoutes = require('./notification.routes');
const employeeRoutes = require('./employee.routes');
const departmentRoutes = require('./department.routes');
const attendanceRoutes = require('./attendance.routes');
const leaveRoutes = require('./leave.routes');
const dashboardRoutes = require('./dashboard.routes');
const reportsRoutes = require('./reports.routes');
const payrollRoutes = require('./payroll.routes');
const policyRoutes = require('./policy.routes');
const resignationRoutes = require('./resignation.routes');
const referralRoutes = require('./referral.routes');
const appraisalRoutes = require('./appraisal.routes');
const assetRoutes = require('./asset.routes');
const chatRoutes = require('./chat.routes');
const { sequelize, sequelize2 } = require('../config/db');

// Health Check Endpoint
router.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let db2Status = 'not_configured';

  try {
    await sequelize.authenticate();
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = `error: ${err.message}`;
  }

  if (sequelize2) {
    try {
      await sequelize2.authenticate();
      db2Status = 'connected';
    } catch (err) {
      db2Status = `error: ${err.message}`;
    }
  }

  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: dbStatus,
    database_secondary: db2Status,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mount modular sub-routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/employees', employeeRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leaves', leaveRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/designations', designationRoutes);
router.use('/departments', departmentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportsRoutes);
router.use('/payroll', payrollRoutes);
router.use('/policies', policyRoutes);
router.use('/resignations', resignationRoutes);
router.use('/referrals', referralRoutes);
router.use('/appraisals', appraisalRoutes);
router.use('/assets', assetRoutes);
router.use('/chat', chatRoutes);

module.exports = router;
