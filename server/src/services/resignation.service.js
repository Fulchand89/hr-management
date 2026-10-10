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
        description: `Submitted resignation requesting LWD: ${payload.requestedLastWorkingDay}`
      },
      { transaction }
    );

    await transaction.commit();

    return await getResignationById(resignation.id);
  } catch (err) {
    await transaction.rollback();
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
        attributes: ['id', 'firstName', 'lastName', 'email', 'employeeId', 'joiningDate', 'status'],
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
      { employeeId: { [Op.like]: `%${search}%` } }
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
        attributes: ['id', 'firstName', 'lastName', 'email', 'employeeId', 'joiningDate', 'status'],
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
    if (status === 'approved') {
      await User.update(
        { status: USER_STATUS.NOTICE_PERIOD },
        { where: { id: resignation.userId }, transaction }
      );
    } else if (status === 'completed') {
      await User.update(
        { status: USER_STATUS.RESIGNED },
        { where: { id: resignation.userId }, transaction }
      );
    }

    await Notification.create(
      {
        userId: resignation.userId,
        title: `Resignation Request ${status.toUpperCase().replace('_', ' ')}`,
        message: `Your resignation request status has been updated to ${status}.`,
        type: 'resignation',
        actionUrl: '/employee/resignation'
      },
      { transaction }
    );

    await transaction.commit();
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
