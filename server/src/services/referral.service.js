const { Op } = require('sequelize');
const {
  EmployeeReferral,
  User,
  Department,
  Designation,
  Notification,
  ActivityLog
} = require('../models');
const { BadRequestError, NotFoundError, ConflictError } = require('../utils/apiError');
const logger = require('../config/logger');

/**
 * Submit candidate referral by employee
 */
const createReferral = async (referrerId, payload, file) => {
  const existing = await EmployeeReferral.findOne({
    where: {
      candidateEmail: payload.candidateEmail.toLowerCase().trim(),
      status: {
        [Op.notIn]: ['rejected']
      }
    }
  });

  if (existing) {
    throw new ConflictError('A candidate with this email has already been referred and is currently in process');
  }

  const referralData = {
    referrerId,
    candidateName: payload.candidateName.trim(),
    candidateEmail: payload.candidateEmail.toLowerCase().trim(),
    candidatePhone: payload.candidatePhone.trim(),
    position: payload.position.trim(),
    department: payload.department || null,
    experienceYears: parseFloat(payload.experienceYears) || 0.0,
    resumeUrl: file ? `/uploads/${file.filename}` : payload.resumeUrl || null,
    bonusAmount: parseFloat(payload.bonusAmount) || 15000.00,
    status: 'submitted',
    payoutStatus: 'unearned',
    notes: payload.notes || null
  };

  const referral = await EmployeeReferral.create(referralData);

  await ActivityLog.create({
    userId: referrerId,
    action: 'REFERRAL_SUBMITTED',
    module: 'referrals',
    description: `Submitted referral for candidate ${payload.candidateName} (${payload.position})`
  });

  return await getReferralById(referral.id);
};

/**
 * Get referral by ID
 */
const getReferralById = async (id) => {
  const referral = await EmployeeReferral.findByPk(id, {
    include: [
      {
        model: User,
        as: 'referrer',
        attributes: ['id', 'firstName', 'lastName', 'email', 'employeeId'],
        include: [
          { model: Department, as: 'departmentDetails', attributes: ['id', 'name'] },
          { model: Designation, as: 'designationDetails', attributes: ['id', 'title'] }
        ]
      },
      {
        model: User,
        as: 'reviewer',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }
    ]
  });

  if (!referral) {
    throw new NotFoundError('Referral record not found');
  }

  return referral;
};

/**
 * Get employee's own referrals
 */
const getMyReferrals = async (referrerId) => {
  return await EmployeeReferral.findAll({
    where: { referrerId },
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: User,
        as: 'reviewer',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }
    ]
  });
};

/**
 * Get all referrals (HR / Admin)
 */
const getAllReferrals = async (query = {}) => {
  const { status, payoutStatus, search } = query;
  const where = {};

  if (status && status !== 'all') {
    where.status = status;
  }

  if (payoutStatus && payoutStatus !== 'all') {
    where.payoutStatus = payoutStatus;
  }

  const referrerWhere = {};
  if (search) {
    where[Op.or] = [
      { candidateName: { [Op.like]: `%${search}%` } },
      { candidateEmail: { [Op.like]: `%${search}%` } },
      { position: { [Op.like]: `%${search}%` } }
    ];
  }

  return await EmployeeReferral.findAll({
    where,
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: User,
        as: 'referrer',
        attributes: ['id', 'firstName', 'lastName', 'email', 'employeeId'],
        include: [
          { model: Department, as: 'departmentDetails', attributes: ['id', 'name'] },
          { model: Designation, as: 'designationDetails', attributes: ['id', 'title'] }
        ]
      },
      {
        model: User,
        as: 'reviewer',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }
    ]
  });
};

/**
 * Update candidate referral stage, bonus, and payout lifecycle
 */
const updateReferral = async (id, payload, actor) => {
  const referral = await EmployeeReferral.findByPk(id);
  if (!referral) {
    throw new NotFoundError('Referral not found');
  }

  const updateData = {
    reviewedBy: actor.id
  };

  if (payload.status) updateData.status = payload.status;
  if (payload.notes !== undefined) updateData.notes = payload.notes;
  if (payload.bonusAmount !== undefined) updateData.bonusAmount = parseFloat(payload.bonusAmount);

  // Automated 90-day probation rule handling
  if (payload.status === 'hired') {
    const joining = payload.joiningDate ? new Date(payload.joiningDate) : new Date();
    const probationEnd = new Date(joining);
    probationEnd.setDate(probationEnd.getDate() + 90);

    updateData.joiningDate = joining.toISOString().split('T')[0];
    updateData.probationCompletionDate = probationEnd.toISOString().split('T')[0];

    const today = new Date();
    if (today >= probationEnd) {
      updateData.payoutStatus = 'eligible';
    } else {
      updateData.payoutStatus = 'pending_probation';
    }
  } else if (payload.status === 'rejected') {
    updateData.payoutStatus = 'unearned';
  }

  // Explicit payout status overrides (e.g. marked as 'paid')
  if (payload.payoutStatus) {
    updateData.payoutStatus = payload.payoutStatus;
    if (payload.payoutStatus === 'paid') {
      updateData.paidAt = new Date();
    }
  }

  await referral.update(updateData);

  // Notify the referring employee of candidate progress
  if (payload.status) {
    await Notification.create({
      userId: referral.referrerId,
      title: `Referral Update: ${referral.candidateName}`,
      message: `Your referral ${referral.candidateName} is now in stage '${payload.status.toUpperCase()}'.`,
      type: 'referral',
      actionUrl: '/employee/referrals'
    });
  }

  return await getReferralById(id);
};

module.exports = {
  createReferral,
  getReferralById,
  getMyReferrals,
  getAllReferrals,
  updateReferral
};
