const Joi = require('joi');

const createLeaveTypeSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  code: Joi.string().trim().min(1).max(50).uppercase().required(),
  daysPerYear: Joi.number().min(0).max(365).required(),
  isCarryForward: Joi.boolean().default(false),
  isPaid: Joi.boolean().default(true),
  description: Joi.string().trim().max(255).optional().allow('', null)
});

const updateLeaveTypeSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  code: Joi.string().trim().min(1).max(50).uppercase().optional(),
  daysPerYear: Joi.number().min(0).max(365).optional(),
  isCarryForward: Joi.boolean().optional(),
  isPaid: Joi.boolean().optional(),
  description: Joi.string().trim().max(255).optional().allow('', null)
});

const applyLeaveSchema = Joi.object({
  leaveTypeId: Joi.string().uuid().required(),
  startDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  endDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  totalDays: Joi.number().min(0.5).max(365).required(),
  reason: Joi.string().trim().min(3).max(1000).required()
});

const actionLeaveSchema = Joi.object({
  status: Joi.string().valid('approved', 'rejected').required(),
  actionReason: Joi.string().trim().max(255).optional().allow('', null)
});

const allocateBalanceSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  leaveTypeId: Joi.string().uuid().required(),
  year: Joi.number().integer().min(2020).max(2100).optional(),
  allocated: Joi.number().min(0).max(365).required()
});

const leaveHistoryQuerySchema = Joi.object({
  status: Joi.string().valid('pending', 'approved', 'rejected', 'cancelled').optional(),
  year: Joi.number().integer().min(2020).max(2100).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

const adminLeaveQuerySchema = Joi.object({
  status: Joi.string().valid('pending', 'approved', 'rejected', 'cancelled', 'all').optional(),
  leaveTypeId: Joi.string().uuid().optional().allow(''),
  departmentId: Joi.string().uuid().optional().allow(''),
  search: Joi.string().trim().max(100).allow('', null).optional(),
  startDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

const createHolidaySchema = Joi.object({
  title: Joi.string().trim().min(2).max(100).required(),
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  type: Joi.string().valid('national', 'gazetted', 'restricted', 'company').default('company'),
  description: Joi.string().trim().max(255).optional().allow('', null)
});

const holidayQuerySchema = Joi.object({
  year: Joi.number().integer().min(2020).max(2100).optional()
});

module.exports = {
  createLeaveTypeSchema,
  updateLeaveTypeSchema,
  applyLeaveSchema,
  actionLeaveSchema,
  allocateBalanceSchema,
  leaveHistoryQuerySchema,
  adminLeaveQuerySchema,
  createHolidaySchema,
  holidayQuerySchema
};
