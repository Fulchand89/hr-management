const { Op } = require('sequelize');
const {
  sequelize,
  LeaveType,
  LeaveBalance,
  LeaveRequest,
  Holiday,
  User,
  Department,
  Notification,
  ActivityLog
} = require('../models');
const {
  BadRequestError,
  NotFoundError,
  ConflictError,
  ForbiddenError
} = require('../utils/apiError');
const logger = require('../config/logger');
let socketService = null;
try {
  socketService = require('./socket.service');
} catch {
  // Optional in non-websocket test runs
}

/**
 * ==========================================
 * 1. LEAVE TYPES SERVICE
 * ==========================================
 */

const getAllLeaveTypes = async () => {
  return await LeaveType.findAll({
    order: [['name', 'ASC']]
  });
};

const createLeaveType = async (payload, actor) => {
  const existing = await LeaveType.findOne({
    where: {
      [Op.or]: [
        { code: payload.code.toUpperCase() },
        { name: payload.name.trim() }
      ]
    }
  });

  if (existing) {
    throw new ConflictError(`Leave type with name '${payload.name}' or code '${payload.code}' already exists`);
  }

  const leaveType = await LeaveType.create({
    ...payload,
    code: payload.code.toUpperCase(),
    name: payload.name.trim()
  });

  await ActivityLog.create({
    userId: actor ? actor.id : null,
    action: 'LEAVE_TYPE_CREATED',
    module: 'leave',
    targetId: leaveType.id,
    details: `Created new leave category '${leaveType.name}' (${leaveType.code}) with ${leaveType.daysPerYear} days/year`
  }).catch((err) => logger.warn('ActivityLog warning:', err.message));

  return leaveType;
};

const updateLeaveType = async (id, payload, actor) => {
  const leaveType = await LeaveType.findByPk(id);
  if (!leaveType) {
    throw new NotFoundError(`Leave type not found with ID ${id}`);
  }

  if (payload.code || payload.name) {
    const existing = await LeaveType.findOne({
      where: {
        id: { [Op.ne]: id },
        [Op.or]: [
          ...(payload.code ? [{ code: payload.code.toUpperCase() }] : []),
          ...(payload.name ? [{ name: payload.name.trim() }] : [])
        ]
      }
    });

    if (existing) {
      throw new ConflictError('Another leave type with this name or code already exists');
    }
  }

  await leaveType.update({
    ...payload,
    ...(payload.code && { code: payload.code.toUpperCase() }),
    ...(payload.name && { name: payload.name.trim() })
  });

  await ActivityLog.create({
    userId: actor ? actor.id : null,
    action: 'LEAVE_TYPE_UPDATED',
    module: 'leave',
    targetId: leaveType.id,
    details: `Updated leave category '${leaveType.name}' (${leaveType.code})`
  }).catch((err) => logger.warn('ActivityLog warning:', err.message));

  return leaveType;
};

const deleteLeaveType = async (id, actor) => {
  const leaveType = await LeaveType.findByPk(id);
  if (!leaveType) {
    throw new NotFoundError(`Leave type not found with ID ${id}`);
  }

  const requestCount = await LeaveRequest.count({ where: { leaveTypeId: id } });
  if (requestCount > 0) {
    throw new BadRequestError(`Cannot delete leave type '${leaveType.name}' because ${requestCount} employee leave requests are linked to it.`);
  }

  await LeaveBalance.destroy({ where: { leaveTypeId: id } });
  await leaveType.destroy();

  await ActivityLog.create({
    userId: actor ? actor.id : null,
    action: 'LEAVE_TYPE_DELETED',
    module: 'leave',
    targetId: id,
    details: `Deleted leave category '${leaveType.name}' (${leaveType.code})`
  }).catch((err) => logger.warn('ActivityLog warning:', err.message));

  return { id, name: leaveType.name, code: leaveType.code };
};

/**
 * ==========================================
 * 2. LEAVE BALANCES SERVICE
 * ==========================================
 */

const getMyLeaveBalances = async (userId, queryYear) => {
  const year = queryYear ? parseInt(queryYear, 10) : new Date().getFullYear();

  let balances = await LeaveBalance.findAll({
    where: { userId, year },
    include: [
      {
        model: LeaveType,
        as: 'leaveType',
        attributes: ['id', 'name', 'code', 'daysPerYear', 'isCarryForward', 'isPaid', 'description']
      }
    ],
    order: [[{ model: LeaveType, as: 'leaveType' }, 'name', 'ASC']]
  });

  // If no balance exists for this year, auto-seed defaults from existing LeaveTypes
  if (!balances || balances.length === 0) {
    const allTypes = await LeaveType.findAll();
    if (allTypes.length > 0) {
      const toInsert = allTypes.map((lt) => ({
        userId,
        leaveTypeId: lt.id,
        year,
        allocated: lt.daysPerYear || 12,
        used: 0,
        remaining: lt.daysPerYear || 12
      }));
      await LeaveBalance.bulkCreate(toInsert);

      balances = await LeaveBalance.findAll({
        where: { userId, year },
        include: [
          {
            model: LeaveType,
            as: 'leaveType',
            attributes: ['id', 'name', 'code', 'daysPerYear', 'isCarryForward', 'isPaid', 'description']
          }
        ],
        order: [[{ model: LeaveType, as: 'leaveType' }, 'name', 'ASC']]
      });
    }
  }

  // Summary aggregation
  const summary = balances.reduce(
    (acc, b) => {
      acc.totalAllocated += Number(b.allocated);
      acc.totalUsed += Number(b.used);
      acc.totalRemaining += Number(b.remaining);
      return acc;
    },
    { totalAllocated: 0, totalUsed: 0, totalRemaining: 0, year }
  );

  return { balances, summary };
};

const getUserLeaveBalances = async (userId, queryYear) => {
  const user = await User.findByPk(userId);
  if (!user) throw new NotFoundError(`User not found with ID ${userId}`);
  return await getMyLeaveBalances(userId, queryYear);
};

const allocateBalance = async (payload, actor) => {
  const { userId, leaveTypeId, allocated } = payload;
  const year = payload.year || new Date().getFullYear();

  const user = await User.findByPk(userId);
  if (!user) throw new NotFoundError(`User not found with ID ${userId}`);

  const leaveType = await LeaveType.findByPk(leaveTypeId);
  if (!leaveType) throw new NotFoundError(`Leave type not found with ID ${leaveTypeId}`);

  let balance = await LeaveBalance.findOne({
    where: { userId, leaveTypeId, year }
  });

  if (balance) {
    const used = Number(balance.used);
    const newRemaining = Math.max(0, Number(allocated) - used);
    await balance.update({
      allocated: Number(allocated),
      remaining: newRemaining
    });
  } else {
    balance = await LeaveBalance.create({
      userId,
      leaveTypeId,
      year,
      allocated: Number(allocated),
      used: 0,
      remaining: Number(allocated)
    });
  }

  await ActivityLog.create({
    userId: actor ? actor.id : null,
    action: 'LEAVE_BALANCE_ALLOCATED',
    module: 'leave',
    targetId: balance.id,
    details: `Allocated ${allocated} days of ${leaveType.name} (${year}) to ${user.firstName} ${user.lastName}`
  }).catch((err) => logger.warn('ActivityLog warning:', err.message));

  return balance;
};

/**
 * ==========================================
 * 3. LEAVE APPLICATIONS (EMPLOYEE)
 * ==========================================
 */

const applyLeave = async (user, payload, ipAddress) => {
  const { leaveTypeId, startDate, endDate, totalDays, reason } = payload;

  if (new Date(startDate) > new Date(endDate)) {
    throw new BadRequestError('Start date cannot be after end date');
  }

  const leaveType = await LeaveType.findByPk(leaveTypeId);
  if (!leaveType) {
    throw new NotFoundError(`Leave category not found with ID ${leaveTypeId}`);
  }

  const year = new Date(startDate).getFullYear();

  // Check or initialize leave balance
  let balance = await LeaveBalance.findOne({
    where: { userId: user.id, leaveTypeId, year }
  });

  if (!balance) {
    balance = await LeaveBalance.create({
      userId: user.id,
      leaveTypeId,
      year,
      allocated: leaveType.daysPerYear || 12,
      used: 0,
      remaining: leaveType.daysPerYear || 12
    });
  }

  if (Number(balance.remaining) < Number(totalDays)) {
    throw new BadRequestError(
      `Insufficient leave balance for ${leaveType.name}. Requested ${totalDays} day(s), but only ${balance.remaining} day(s) available in quota.`
    );
  }

  // Check for overlapping pending or approved leave requests
  const overlapping = await LeaveRequest.findOne({
    where: {
      userId: user.id,
      status: { [Op.in]: ['pending', 'approved'] },
      startDate: { [Op.lte]: endDate },
      endDate: { [Op.gte]: startDate }
    }
  });

  if (overlapping) {
    throw new ConflictError(
      `You already have an active/pending leave application from ${overlapping.startDate} to ${overlapping.endDate} (${overlapping.status})`
    );
  }

  const leaveRequest = await LeaveRequest.create({
    userId: user.id,
    leaveTypeId,
    startDate,
    endDate,
    totalDays: Number(totalDays),
    reason: reason.trim(),
    status: 'pending'
  });

  // Real-time broadcast announcement to Admin/HR/Manager
  if (socketService && typeof socketService.broadcastToRoom === 'function') {
    socketService.broadcastToRoom('role:admin', 'notification:leave_applied', {
      requestId: leaveRequest.id,
      employeeName: `${user.firstName} ${user.lastName}`,
      leaveType: leaveType.name,
      startDate,
      endDate,
      totalDays
    });
  }

  await ActivityLog.create({
    userId: user.id,
    action: 'LEAVE_APPLIED',
    module: 'leave',
    targetId: leaveRequest.id,
    ipAddress,
    details: `Applied for ${totalDays} day(s) of ${leaveType.name} from ${startDate} to ${endDate}`
  }).catch((err) => logger.warn('ActivityLog warning:', err.message));

  return await LeaveRequest.findByPk(leaveRequest.id, {
    include: [
      { model: LeaveType, as: 'leaveType', attributes: ['id', 'name', 'code', 'isPaid'] }
    ]
  });
};

const getMyLeaveRequests = async (userId, query) => {
  const page = Math.max(1, parseInt(query.page || 1, 10));
  const limit = Math.max(1, Math.min(100, parseInt(query.limit || 10, 10)));
  const offset = (page - 1) * limit;

  const where = { userId };

  if (query.status && query.status.toLowerCase() !== 'all') {
    where.status = query.status.toLowerCase();
  }

  if (query.search && query.search.trim()) {
    where.reason = {
      [Op.like]: `%${query.search.trim()}%`
    };
  }

  if (query.year) {
    const yr = parseInt(query.year, 10);
    where.startDate = {
      [Op.between]: [`${yr}-01-01`, `${yr}-12-31`]
    };
  }

  const { rows, count } = await LeaveRequest.findAndCountAll({
    where,
    include: [
      { model: LeaveType, as: 'leaveType', attributes: ['id', 'name', 'code', 'isPaid'] },
      { model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'] }
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  return {
    requests: rows,
    meta: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    }
  };
};

const cancelLeave = async (requestId, user, ipAddress) => {
  const leave = await LeaveRequest.findByPk(requestId, {
    include: [{ model: LeaveType, as: 'leaveType' }]
  });

  if (!leave) {
    throw new NotFoundError(`Leave request not found with ID ${requestId}`);
  }

  // Authorization check
  const isAdminOrHr = ['admin', 'hr'].includes(user.role);
  if (!isAdminOrHr && leave.userId !== user.id) {
    throw new ForbiddenError('You can only cancel your own leave requests');
  }

  if (leave.status === 'cancelled') {
    throw new BadRequestError('This leave request is already cancelled');
  }

  if (leave.status === 'rejected') {
    throw new BadRequestError('Cannot cancel a rejected leave request');
  }

  // If already approved, restore the used leave balance!
  if (leave.status === 'approved') {
    const year = new Date(leave.startDate).getFullYear();
    const balance = await LeaveBalance.findOne({
      where: { userId: leave.userId, leaveTypeId: leave.leaveTypeId, year }
    });

    if (balance) {
      const restoredUsed = Math.max(0, Number(balance.used) - Number(leave.totalDays));
      const restoredRemaining = Number(balance.remaining) + Number(leave.totalDays);
      await balance.update({
        used: restoredUsed,
        remaining: restoredRemaining
      });
    }
  }

  await leave.update({ status: 'cancelled' });

  await ActivityLog.create({
    userId: user.id,
    action: 'LEAVE_CANCELLED',
    module: 'leave',
    targetId: leave.id,
    ipAddress,
    details: `Cancelled leave request (${leave.startDate} to ${leave.endDate})`
  }).catch((err) => logger.warn('ActivityLog warning:', err.message));

  return leave;
};

/**
 * ==========================================
 * 4. LEAVE MANAGEMENT (ADMIN / MANAGER)
 * ==========================================
 */

const getAdminLeaveRequests = async (query) => {
  const page = Math.max(1, parseInt(query.page || 1, 10));
  const limit = Math.max(1, Math.min(100, parseInt(query.limit || 20, 10)));
  const offset = (page - 1) * limit;

  const where = {};

  if (query.status && query.status !== 'all') {
    where.status = query.status;
  }

  if (query.leaveTypeId) {
    where.leaveTypeId = query.leaveTypeId;
  }

  if (query.startDate && query.endDate) {
    where.startDate = { [Op.gte]: query.startDate };
    where.endDate = { [Op.lte]: query.endDate };
  } else if (query.startDate) {
    where.startDate = { [Op.gte]: query.startDate };
  }

  const userWhere = {};
  if (query.departmentId) {
    userWhere.departmentId = query.departmentId;
  }

  if (query.search) {
    const term = `%${query.search.trim()}%`;
    userWhere[Op.or] = [
      { firstName: { [Op.like]: term } },
      { lastName: { [Op.like]: term } },
      { email: { [Op.like]: term } },
      { employeeCode: { [Op.like]: term } }
    ];
  }

  const { rows, count } = await LeaveRequest.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'applicant',
        where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
        attributes: [
          'id',
          'firstName',
          'lastName',
          'email',
          'employeeCode',
          'department',
          'departmentId',
          'designation',
          'avatar'
        ]
      },
      {
        model: LeaveType,
        as: 'leaveType',
        attributes: ['id', 'name', 'code', 'isPaid']
      },
      {
        model: User,
        as: 'reviewer',
        attributes: ['id', 'firstName', 'lastName', 'email', 'avatar']
      }
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  // Calculate high-level status breakdown stats
  const [pendingCount, approvedCount, rejectedCount, cancelledCount] = await Promise.all([
    LeaveRequest.count({ where: { status: 'pending' } }),
    LeaveRequest.count({ where: { status: 'approved' } }),
    LeaveRequest.count({ where: { status: 'rejected' } }),
    LeaveRequest.count({ where: { status: 'cancelled' } })
  ]);

  return {
    records: rows,
    meta: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    },
    summary: {
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      cancelled: cancelledCount,
      total: pendingCount + approvedCount + rejectedCount + cancelledCount
    }
  };
};

const getLeaveRequestById = async (id, user) => {
  const leave = await LeaveRequest.findByPk(id, {
    include: [
      {
        model: User,
        as: 'applicant',
        attributes: ['id', 'firstName', 'lastName', 'email', 'employeeCode', 'department', 'designation', 'avatar']
      },
      {
        model: LeaveType,
        as: 'leaveType',
        attributes: ['id', 'name', 'code', 'daysPerYear', 'isPaid', 'isCarryForward']
      },
      {
        model: User,
        as: 'reviewer',
        attributes: ['id', 'firstName', 'lastName', 'email', 'avatar']
      }
    ]
  });

  if (!leave) {
    throw new NotFoundError(`Leave request not found with ID ${id}`);
  }

  const isStaffOrManager = ['admin', 'hr', 'manager'].includes(user.role);
  if (!isStaffOrManager && leave.userId !== user.id) {
    throw new ForbiddenError('You do not have permission to view this leave request');
  }

  const year = new Date(leave.startDate).getFullYear();
  const balances = await LeaveBalance.findAll({
    where: { userId: leave.userId, year },
    include: [{ model: LeaveType, as: 'leaveType', attributes: ['name', 'code'] }]
  });

  const leaveJson = leave.toJSON();
  leaveJson.applicantBalances = balances.map((b) => ({
    name: b.leaveType ? b.leaveType.name : 'Leave',
    code: b.leaveType ? b.leaveType.code : 'LV',
    allocated: Number(b.allocated),
    used: Number(b.used),
    remaining: Number(b.remaining),
    total: Number(b.allocated)
  }));

  return leaveJson;
};

const actionLeaveRequest = async (id, payload, reviewer, ipAddress) => {
  const status = payload.status;
  const actionReason = payload.actionReason || payload.rejectionReason;

  const leave = await LeaveRequest.findByPk(id, {
    include: [
      { model: LeaveType, as: 'leaveType' },
      { model: User, as: 'applicant' }
    ]
  });

  if (!leave) {
    throw new NotFoundError(`Leave request not found with ID ${id}`);
  }

  if (leave.status !== 'pending') {
    throw new BadRequestError(`Cannot action this leave application because it is already marked as ${leave.status}`);
  }

  // Conflict of Interest Prevention: HR/Managers cannot approve their own leaves
  if (leave.userId === reviewer.id && reviewer.role !== 'admin') {
    throw new ForbiddenError(
      'Conflict of Interest: You cannot approve or reject your own leave application. It must be reviewed by an Administrator.'
    );
  }

  const year = new Date(leave.startDate).getFullYear();

  await sequelize.transaction(async (t) => {
    if (status === 'approved') {
      let balance = await LeaveBalance.findOne({
        where: { userId: leave.userId, leaveTypeId: leave.leaveTypeId, year },
        transaction: t
      });

      if (!balance) {
        balance = await LeaveBalance.create(
          {
            userId: leave.userId,
            leaveTypeId: leave.leaveTypeId,
            year,
            allocated: leave.leaveType.daysPerYear || 12,
            used: 0,
            remaining: leave.leaveType.daysPerYear || 12
          },
          { transaction: t }
        );
      }

      const totalDays = Number(leave.totalDays);
      if (Number(balance.remaining) < totalDays) {
        throw new BadRequestError(
          `Cannot approve leave: Employee only has ${balance.remaining} day(s) remaining for ${leave.leaveType.name}, but requested ${totalDays} day(s).`
        );
      }

      await balance.update(
        {
          used: Number(balance.used) + totalDays,
          remaining: Number(balance.remaining) - totalDays
        },
        { transaction: t }
      );
    }

    await leave.update(
      {
        status,
        actionedBy: reviewer.id,
        actionReason: actionReason ? actionReason.trim() : null,
        actionedAt: new Date()
      },
      { transaction: t }
    );
  });

  // Persistent user notification
  await Notification.create({
    userId: leave.userId,
    title: `Leave Application ${status.toUpperCase()}`,
    message: `Your leave request for ${leave.startDate} to ${leave.endDate} has been ${status}${actionReason ? `: "${actionReason}"` : '.'}`,
    type: status === 'approved' ? 'leave_approved' : 'leave_rejected',
    referenceId: leave.id,
    isRead: false
  }).catch((err) => logger.warn('Notification log warning:', err.message));

  // Dispatch real-time WebSocket alert directly to employee
  if (socketService && typeof socketService.sendToUser === 'function') {
    socketService.sendToUser(leave.userId, 'notification:direct', {
      type: `leave_${status}`,
      title: `Leave ${status.toUpperCase()}`,
      message: `Your leave application (${leave.startDate} to ${leave.endDate}) was ${status}.`,
      leaveId: leave.id
    });
  }

  await ActivityLog.create({
    userId: reviewer.id,
    action: `LEAVE_${status.toUpperCase()}`,
    module: 'leave',
    targetId: leave.id,
    ipAddress,
    details: `${reviewer.role.toUpperCase()} ${reviewer.firstName} ${reviewer.lastName} marked leave for ${leave.applicant.firstName} ${leave.applicant.lastName} as ${status}.`
  }).catch((err) => logger.warn('ActivityLog warning:', err.message));

  return await LeaveRequest.findByPk(id, {
    include: [
      { model: LeaveType, as: 'leaveType' },
      { model: User, as: 'applicant', attributes: ['id', 'firstName', 'lastName', 'email', 'employeeCode'] },
      { model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email'] }
    ]
  });
};

/**
 * ==========================================
 * 5. HOLIDAYS SERVICE
 * ==========================================
 */

const getHolidays = async (query) => {
  const year = query.year ? parseInt(query.year, 10) : new Date().getFullYear();

  return await Holiday.findAll({
    where: {
      date: {
        [Op.between]: [`${year}-01-01`, `${year}-12-31`]
      }
    },
    order: [['date', 'ASC']]
  });
};

const createHoliday = async (payload, actor) => {
  const existing = await Holiday.findOne({ where: { date: payload.date } });
  if (existing) {
    throw new ConflictError(`A holiday on ${payload.date} already exists ('${existing.title}')`);
  }

  const holiday = await Holiday.create({
    title: payload.title.trim(),
    date: payload.date,
    type: payload.type || 'company',
    description: payload.description ? payload.description.trim() : null
  });

  await ActivityLog.create({
    userId: actor ? actor.id : null,
    action: 'HOLIDAY_CREATED',
    module: 'leave',
    targetId: holiday.id,
    details: `Added holiday '${holiday.title}' on ${holiday.date} (${holiday.type})`
  }).catch((err) => logger.warn('ActivityLog warning:', err.message));

  return holiday;
};

const deleteHoliday = async (id, actor) => {
  const holiday = await Holiday.findByPk(id);
  if (!holiday) {
    throw new NotFoundError(`Holiday not found with ID ${id}`);
  }

  await holiday.destroy();

  await ActivityLog.create({
    userId: actor ? actor.id : null,
    action: 'HOLIDAY_DELETED',
    module: 'leave',
    targetId: id,
    details: `Deleted holiday '${holiday.title}' (${holiday.date})`
  }).catch((err) => logger.warn('ActivityLog warning:', err.message));

  return { id, title: holiday.title, date: holiday.date };
};

module.exports = {
  getAllLeaveTypes,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
  getMyLeaveBalances,
  getUserLeaveBalances,
  allocateBalance,
  applyLeave,
  getMyLeaveRequests,
  cancelLeave,
  getAdminLeaveRequests,
  getLeaveRequestById,
  actionLeaveRequest,
  getHolidays,
  createHoliday,
  deleteHoliday
};
