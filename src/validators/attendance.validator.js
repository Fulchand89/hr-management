const Joi = require('joi');

const punchInSchema = Joi.object({
  shiftId: Joi.string().uuid().optional().allow(null, ''),
  remarks: Joi.string().trim().max(255).optional().allow('', null)
});

const breakStartSchema = Joi.object({
  reason: Joi.string().trim().max(150).optional().default('Regular Break')
});

const punchOutSchema = Joi.object({
  remarks: Joi.string().trim().max(255).optional().allow('', null)
});

const attendanceHistoryQuerySchema = Joi.object({
  month: Joi.number().integer().min(1).max(12).optional(),
  year: Joi.number().integer().min(2020).max(2100).optional(),
  startDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional()
});

const adminAttendanceQuerySchema = Joi.object({
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  departmentId: Joi.string().uuid().optional().allow(''),
  status: Joi.string().valid('present', 'absent', 'half_day', 'late', 'on_leave', 'holiday', 'weekend').optional(),
  search: Joi.string().trim().max(100).allow('', null).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

const regularizeAttendanceSchema = Joi.object({
  clockIn: Joi.date().iso().optional(),
  clockOut: Joi.date().iso().optional(),
  status: Joi.string().valid('present', 'absent', 'half_day', 'late', 'on_leave', 'holiday', 'weekend').optional(),
  totalHours: Joi.number().min(0).max(24).optional(),
  remarks: Joi.string().trim().max(255).optional().allow('', null)
});

module.exports = {
  punchInSchema,
  breakStartSchema,
  punchOutSchema,
  attendanceHistoryQuerySchema,
  adminAttendanceQuerySchema,
  regularizeAttendanceSchema
};
