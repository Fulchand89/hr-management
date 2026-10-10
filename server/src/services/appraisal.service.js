const { Op } = require('sequelize');
const {
  sequelize,
  AppraisalReview,
  User,
  Department,
  Designation,
  SalaryStructure,
  Notification,
  ActivityLog
} = require('../models');
const { BadRequestError, NotFoundError } = require('../utils/apiError');
const logger = require('../config/logger');

/**
 * Create appraisal review and optionally apply revised compensation
 */
const createAppraisalReview = async (payload, reviewer) => {
  const {
    userId,
    cycleName,
    reviewPeriodStart,
    reviewPeriodEnd,
    technicalScore = 0,
    productivityScore = 0,
    teamworkScore = 0,
    leadershipScore = 0,
    newSalary,
    hikePercentage,
    promotionDesignationId,
    feedbackStrengths,
    feedbackImprovements,
    comments,
    effectiveDate,
    applyToSalary = false
  } = payload;

  const employee = await User.findByPk(userId, {
    include: [{ model: SalaryStructure, as: 'salaryStructure' }]
  });

  if (!employee) {
    throw new NotFoundError('Employee not found');
  }

  const previousSalary = parseFloat(employee.salary || 0.0);
  let computedNewSalary = previousSalary;
  let computedHike = 0.0;

  if (newSalary !== undefined && newSalary !== null && parseFloat(newSalary) > 0) {
    computedNewSalary = parseFloat(newSalary);
    if (previousSalary > 0) {
      computedHike = ((computedNewSalary - previousSalary) / previousSalary) * 100;
    }
  } else if (hikePercentage !== undefined && hikePercentage !== null) {
    computedHike = parseFloat(hikePercentage);
    computedNewSalary = previousSalary * (1 + computedHike / 100);
  }

  const tScore = parseFloat(technicalScore) || 0;
  const pScore = parseFloat(productivityScore) || 0;
  const tmScore = parseFloat(teamworkScore) || 0;
  const lScore = parseFloat(leadershipScore) || 0;
  const overallScore = parseFloat(((tScore + pScore + tmScore + lScore) / 4).toFixed(1));

  const transaction = await sequelize.transaction();
  try {
    const review = await AppraisalReview.create(
      {
        userId,
        reviewerId: reviewer.id,
        cycleName: cycleName || `Appraisal ${new Date().getFullYear()}`,
        reviewPeriodStart: reviewPeriodStart || new Date().toISOString().split('T')[0],
        reviewPeriodEnd: reviewPeriodEnd || new Date().toISOString().split('T')[0],
        technicalScore: tScore,
        productivityScore: pScore,
        teamworkScore: tmScore,
        leadershipScore: lScore,
        overallScore,
        status: 'completed',
        previousSalary,
        newSalary: computedNewSalary,
        hikePercentage: parseFloat(computedHike.toFixed(2)),
        promotionDesignationId: promotionDesignationId || null,
        feedbackStrengths,
        feedbackImprovements,
        comments,
        effectiveDate: effectiveDate || new Date().toISOString().split('T')[0]
      },
      { transaction }
    );

    // If HR elected to immediately apply salary hike and/or promotion
    if (applyToSalary && computedNewSalary > 0) {
      const userUpdates = { salary: computedNewSalary };
      if (promotionDesignationId) {
        userUpdates.designationId = promotionDesignationId;
      }
      await employee.update(userUpdates, { transaction });

      // Synchronize SalaryStructure (Standard ratio: 50% Basic, 30% HRA, 20% Special Allowance)
      const monthlyGross = computedNewSalary / 12;
      const basic = monthlyGross * 0.5;
      const hra = monthlyGross * 0.3;
      const special = monthlyGross * 0.2;
      const pf = basic * 0.12;
      const net = monthlyGross - pf;

      const structPayload = {
        userId,
        ctc: computedNewSalary,
        basicSalary: basic,
        hra,
        specialAllowance: special,
        pfDeduction: pf,
        esiDeduction: 0.0,
        taxDeduction: 0.0,
        netSalary: net
      };

      if (employee.salaryStructure) {
        await employee.salaryStructure.update(structPayload, { transaction });
      } else {
        await SalaryStructure.create(structPayload, { transaction });
      }
    }

    await Notification.create(
      {
        userId,
        title: 'Performance Appraisal Completed',
        message: `Your performance appraisal for ${review.cycleName} has been processed with an overall score of ${overallScore}/5.0.`,
        type: 'appraisal',
        actionUrl: '/employee/performance'
      },
      { transaction }
    );

    await ActivityLog.create(
      {
        userId: reviewer.id,
        action: 'APPRAISAL_CREATED',
        module: 'appraisal',
        description: `Conducted appraisal for ${employee.firstName} ${employee.lastName} with score ${overallScore}/5.0`
      },
      { transaction }
    );

    await transaction.commit();
    return await getAppraisalById(review.id);
  } catch (err) {
    await transaction.rollback();
    logger.error('Error creating appraisal review:', err);
    throw err;
  }
};

/**
 * Get appraisal by ID
 */
const getAppraisalById = async (id) => {
  const review = await AppraisalReview.findByPk(id, {
    include: [
      {
        model: User,
        as: 'employee',
        attributes: ['id', 'firstName', 'lastName', 'email', 'employeeId', 'salary'],
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
        model: Designation,
        as: 'promotedDesignation',
        attributes: ['id', 'title']
      }
    ]
  });

  if (!review) {
    throw new NotFoundError('Appraisal review not found');
  }

  return review;
};

/**
 * Get all appraisals (HR / Admin)
 */
const getAllAppraisals = async (query = {}) => {
  const { cycleName, search, status } = query;
  const where = {};

  if (cycleName && cycleName !== 'all') {
    where.cycleName = cycleName;
  }
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

  return await AppraisalReview.findAll({
    where,
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: User,
        as: 'employee',
        where: Object.keys(userWhere).length > 0 ? userWhere : undefined,
        attributes: ['id', 'firstName', 'lastName', 'email', 'employeeId', 'salary'],
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
        model: Designation,
        as: 'promotedDesignation',
        attributes: ['id', 'title']
      }
    ]
  });
};

/**
 * Get appraisals for specific employee
 */
const getEmployeeAppraisals = async (userId) => {
  return await AppraisalReview.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: User,
        as: 'reviewer',
        attributes: ['id', 'firstName', 'lastName', 'email']
      },
      {
        model: Designation,
        as: 'promotedDesignation',
        attributes: ['id', 'title']
      }
    ]
  });
};

module.exports = {
  createAppraisalReview,
  getAppraisalById,
  getAllAppraisals,
  getEmployeeAppraisals
};
