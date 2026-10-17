const { Op } = require('sequelize');
const {
  sequelize,
  ResignationRequest,
  ExitClearance,
  User,
  Department,
  Designation,
  Notification,
  ActivityLog
} = require('../models');
const { BadRequestError, NotFoundError, ConflictError } = require('../utils/apiError');
const { USER_STATUS } = require('../constants/status');
const logger = require('../config/logger');
const socketService = require('./socket.service');
const { notifyHRAndAdmins } = require('./notification.service');

const CLEARANCE_DEPTS = ['it', 'finance', 'hr', 'admin', 'manager'];

/**
 * Submit employee resignation
 */
const submitResignation = async (userId, payload) => {
  const activeResignation = await ResignationRequest.findOne({
    where: {
      userId,
      status: {
        [Op.in]: ['pending', 'under_review', 'approved']
      }
    }
  });

  if (activeResignation) {
    throw new ConflictError('You already have an active resignation request under processing');
  }

  const transaction = await sequelize.transaction();
  try {
    const resignation = await ResignationRequest.create(
      {
        userId,
        resignationDate: payload.resignationDate || new Date(),
        requestedLastWorkingDay: payload.requestedLastWorkingDay,
        reason: payload.reason,
        personalEmail: payload.personalEmail || null,
        contactPhone: payload.contactPhone || null,
        status: 'pending'
      },
      { transaction }
    );

    // Initialize the 5 standard departmental exit clearances
    const clearancesData = CLEARANCE_DEPTS.map((dept) => ({
      resignationId: resignation.id,
      department: dept,
      status: 'pending'
    }));

    await ExitClearance.bulkCreate(clearancesData, { transaction });

    await ActivityLog.create(
      {
        userId,
        action: 'RESIGNATION_SUBMITTED',
        module: 'resignation',
        details: `Submitted resignation requesting LWD: ${payload.requestedLastWorkingDay}`
      },
      { transaction }
    );

    await transaction.commit();

    // Dispatch notification & WebSocket alerts to HR and Admins
    try {
      const applicant = await User.findByPk(userId, {
        attributes: ['id', 'firstName', 'lastName', 'email', 'employeeCode']
      });
      const applicantName = `${applicant?.firstName || ''} ${applicant?.lastName || ''}`.trim() || applicant?.email || 'An employee';
      const empCodeStr = applicant?.employeeCode ? ` (${applicant.employeeCode})` : '';
      const lwd = payload.requestedLastWorkingDay || 'N/A';
      const reasonText = (payload.reason || '').trim();

      await notifyHRAndAdmins({
        title: 'New Resignation Request',
        message: `${applicantName}${empCodeStr} has submitted a resignation request (Requested LWD: ${lwd})${reasonText ? `. Reason: "${reasonText}"` : ''}.`,
        type: 'resignation',
        actionUrl: '/hr/resignations',
        excludeUserId: userId
      });

      if (socketService) {
        const wsPayload = {
          resignationId: resignation.id,
          employeeId: userId,
          employeeName: applicantName,
          employeeCode: applicant?.employeeCode || null,
          requestedLastWorkingDay: lwd,
          reason: reasonText,
          status: 'pending',
          actionUrl: '/hr/resignations'
        };
        if (typeof socketService.emitToRole === 'function') {
          socketService.emitToRole('hr', 'notification:resignation_submitted', wsPayload);
          socketService.emitToRole('admin', 'notification:resignation_submitted', wsPayload);
          socketService.emitToRole('HR', 'notification:resignation_submitted', wsPayload);
          socketService.emitToRole('ADMIN', 'notification:resignation_submitted', wsPayload);
          socketService.emitToRole('hr', 'notification', {
            title: 'New Resignation Request',
            message: `${applicantName}${empCodeStr} has submitted a resignation request.`,
            type: 'resignation',
            actionUrl: '/hr/resignations'
          });
          socketService.emitToRole('admin', 'notification', {
            title: 'New Resignation Request',
            message: `${applicantName}${empCodeStr} has submitted a resignation request.`,
            type: 'resignation',
            actionUrl: '/hr/resignations'
          });
        }
        if (typeof socketService.broadcastToRoom === 'function') {
          socketService.broadcastToRoom('role:admin', 'notification:resignation_submitted', wsPayload);
          socketService.broadcastToRoom('role:hr', 'notification:resignation_submitted', wsPayload);
        }
      }
    } catch (notifErr) {
      logger.warn('Failed to dispatch resignation notification to HR/Admins:', notifErr.message);
    }

    return await getResignationById(resignation.id);
  } catch (err) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    logger.error('Error submitting resignation:', err);
    throw err;
  }
};

/**
 * Get single resignation with clearances and employee details
 */
const getResignationById = async (id) => {
  const record = await ResignationRequest.findByPk(id, {
    include: [
      {
        model: User,
        as: 'employee',
        attributes: ['id', 'firstName', 'lastName', 'email', 'employeeCode', 'joiningDate', 'status'],
        include: [
          { model: Department, as: 'departmentDetails', attributes: ['id', 'name'] },
          { model: Designation, as: 'designationDetails', attributes: ['id', 'title'] }
        ]
      },
      {
        model: User,
        as: 'reviewer',
        attributes: ['id', 'firstName', 'lastName', 'email']
      },
      {
        model: ExitClearance,
        as: 'clearances',
        include: [
          {
            model: User,
            as: 'clearedByUser',
            attributes: ['id', 'firstName', 'lastName']
          }
        ]
      }
    ]
  });

  if (!record) {
    throw new NotFoundError('Resignation request not found');
  }

  return record;
};

/**
 * Get current employee's resignation
 */
const getMyResignation = async (userId) => {
  return await ResignationRequest.findOne({
    where: { userId },
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: User,
        as: 'employee',
        attributes: ['id', 'firstName', 'lastName', 'email', 'employeeCode', 'joiningDate', 'status'],
        include: [
          { model: Department, as: 'departmentDetails', attributes: ['id', 'name'] },
          { model: Designation, as: 'designationDetails', attributes: ['id', 'title'] }
        ]
      },
      {
        model: User,
        as: 'reviewer',
        attributes: ['id', 'firstName', 'lastName', 'email']
      },
      {
        model: ExitClearance,
        as: 'clearances',
        include: [
          {
            model: User,
            as: 'clearedByUser',
            attributes: ['id', 'firstName', 'lastName']
          }
        ]
      }
    ]
  });
};

/**
 * Get all resignations (HR/Admin)
 */
const getAllResignations = async (query = {}) => {
  const { status, search } = query;
  const where = {};

  if (status && status !== 'all') {
    where.status = status;
  }

  const userWhere = {};
  if (search) {
    userWhere[Op.or] = [
      { firstName: { [Op.like]: `%${search}%` } },
      { lastName: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { employeeCode: { [Op.like]: `%${search}%` } }
    ];
  }

  return await ResignationRequest.findAll({
    where,
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: User,
        as: 'employee',
        where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
        attributes: ['id', 'firstName', 'lastName', 'email', 'employeeCode', 'joiningDate', 'status'],
        include: [
          { model: Department, as: 'departmentDetails', attributes: ['id', 'name'] },
          { model: Designation, as: 'designationDetails', attributes: ['id', 'title'] }
        ]
      },
      {
        model: User,
        as: 'reviewer',
        attributes: ['id', 'firstName', 'lastName', 'email']
      },
      {
        model: ExitClearance,
        as: 'clearances'
      }
    ]
  });
};

/**
 * Update resignation status (Approve, Reject, Complete, etc.)
 */
const updateResignationStatus = async (id, payload, actor) => {
  const resignation = await ResignationRequest.findByPk(id, {
    include: [{ model: ExitClearance, as: 'clearances' }]
  });

  if (!resignation) {
    throw new NotFoundError('Resignation request not found');
  }

  const { status, approvedLastWorkingDay, rejectionReason, settlementAmount, settlementRemarks } = payload;

  const transaction = await sequelize.transaction();
  try {
    const updateData = {
      reviewedBy: actor.id,
      reviewedAt: new Date()
    };

    if (status) updateData.status = status;
    if (approvedLastWorkingDay) updateData.approvedLastWorkingDay = approvedLastWorkingDay;
    if (rejectionReason !== undefined) updateData.rejectionReason = rejectionReason;
    if (settlementAmount !== undefined) updateData.settlementAmount = settlementAmount;
    if (settlementRemarks !== undefined) updateData.settlementRemarks = settlementRemarks;

    await resignation.update(updateData, { transaction });

    // Status-specific cascading user state changes
    const applicantUser = await User.findByPk(resignation.userId, { transaction });
    const isStaffAdminOrHr = ['admin', 'hr', 'ADMIN', 'HR'].includes(applicantUser?.role);

    if (status === 'approved') {
      if (!isStaffAdminOrHr) {
        await User.update(
          { status: USER_STATUS.NOTICE_PERIOD },
          { where: { id: resignation.userId }, transaction }
        );
      }
    } else if (status === 'completed') {
      if (!isStaffAdminOrHr) {
        await User.update(
          { status: USER_STATUS.RESIGNED },
          { where: { id: resignation.userId }, transaction }
        );
      }
    } else if (status === 'rejected') {
      if (!isStaffAdminOrHr) {
        await User.update(
          { status: USER_STATUS.ACTIVE },
          { where: { id: resignation.userId }, transaction }
        );
      }
    }

    let notifTitle = `Resignation Request ${status.toUpperCase().replace('_', ' ')}`;
    let notifMessage = `Your resignation request status has been updated to ${status}.`;

    if (status === 'rejected') {
      notifTitle = 'Resignation Request Rejected';
      notifMessage = rejectionReason
        ? `Your resignation request has been rejected by HR. Reason: "${rejectionReason}".`
        : 'Your resignation request has been rejected by HR.';
    } else if (status === 'approved') {
      notifTitle = 'Resignation Request Approved';
      const lwd = approvedLastWorkingDay || resignation.requestedLastWorkingDay;
      notifMessage = `Your resignation request has been approved by HR. Approved Last Working Day: ${lwd}.`;
    } else if (status === 'completed') {
      notifTitle = 'Resignation Approved & Exit Completed';
      notifMessage = 'Your resignation request has been approved by HR and your exit process is completed.';
    }

    const createdNotif = await Notification.create(
      {
        userId: resignation.userId,
        title: notifTitle,
        message: notifMessage,
        type: 'resignation',
        actionUrl: '/employee/resignation'
      },
      { transaction }
    );

    await ActivityLog.create(
      {
        userId: actor.id,
        action: `RESIGNATION_${status.toUpperCase()}`,
        module: 'resignation',
        details: status === 'rejected'
          ? `Rejected resignation request for user ${resignation.userId}. Reason: ${rejectionReason || 'No reason provided'}`
          : `Updated resignation status to ${status} for user ${resignation.userId}`
      },
      { transaction }
    );

    await transaction.commit();

    try {
      if (socketService && typeof socketService.emitToUser === 'function') {
        socketService.emitToUser(resignation.userId, 'notification:direct', {
          id: createdNotif.id,
          title: notifTitle,
          message: notifMessage,
          type: 'resignation',
          status,
          rejectionReason: rejectionReason || null,
          actionUrl: '/employee/resignation'
        });
      }
    } catch (wsErr) {
      logger.warn('Socket emit warning on resignation status update:', wsErr.message);
    }

    return await getResignationById(id);
  } catch (err) {
    await transaction.rollback();
    logger.error('Error updating resignation status:', err);
    throw err;
  }
};

/**
 * Update clearance status for a specific department
 */
const updateClearanceStatus = async (resignationId, clearanceId, payload, actor) => {
  const clearance = await ExitClearance.findOne({
    where: { id: clearanceId, resignationId }
  });

  if (!clearance) {
    throw new NotFoundError('Exit clearance record not found');
  }

  const { status, remarks } = payload;
  await clearance.update({
    status: status || clearance.status,
    remarks: remarks !== undefined ? remarks : clearance.remarks,
    clearedBy: actor.id,
    clearedAt: new Date()
  });

  return clearance;
};

/**
 * Withdraw resignation (by Employee)
 */
const withdrawResignation = async (userId, id) => {
  const resignation = await ResignationRequest.findOne({
    where: { id, userId }
  });

  if (!resignation) {
    throw new NotFoundError('Resignation request not found');
  }

  if (!['pending', 'under_review'].includes(resignation.status)) {
    throw new BadRequestError('Cannot withdraw resignation once approved or completed');
  }

  await resignation.update({
    status: 'withdrawn'
  });

  return resignation;
};

module.exports = {
  submitResignation,
  getResignationById,
  getMyResignation,
  getAllResignations,
  updateResignationStatus,
  updateClearanceStatus,
  withdrawResignation
};
