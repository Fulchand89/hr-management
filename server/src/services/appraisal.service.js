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

  let previousSalary = parseFloat(payload.previousSalary || employee.salary || 0.0);
  if (previousSalary === 0 && employee.salaryStructure) {
    previousSalary = parseFloat(employee.salaryStructure.netSalary || (employee.salaryStructure.ctc ? employee.salaryStructure.ctc / 12 : 0) || 0.0);
  }

  const passedHike = (hikePercentage !== undefined && hikePercentage !== null && !isNaN(parseFloat(hikePercentage)))
    ? parseFloat(hikePercentage)
    : null;

  let computedNewSalary = previousSalary;
  let computedHike = passedHike !== null ? passedHike : 0.0;

  if (newSalary !== undefined && newSalary !== null && parseFloat(newSalary) > 0) {
    let inputNew = parseFloat(newSalary);
    if (previousSalary > 0 && inputNew > previousSalary * 4) {
      // Annual amount was passed, normalize to monthly
      inputNew = Math.round(inputNew / 12);
    }
    computedNewSalary = inputNew;
    if (previousSalary > 0) {
      computedHike = ((computedNewSalary - previousSalary) / previousSalary) * 100;
    } else if (passedHike !== null && passedHike > 0) {
      computedHike = passedHike;
      previousSalary = Math.round(computedNewSalary / (1 + computedHike / 100));
    }
  } else if (passedHike !== null) {
    computedHike = passedHike;
    computedNewSalary = Math.round(previousSalary * (1 + computedHike / 100));
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

      // Synchronize SalaryStructure (computedNewSalary is monthly gross)
      const monthlyGross = computedNewSalary;
      const basic = Math.round(monthlyGross * 0.5);
      const hra = Math.round(monthlyGross * 0.3);
      const special = Math.round(monthlyGross * 0.2);
      const pf = Math.round(basic * 0.12);
      const net = monthlyGross - pf;

      const structPayload = {
        userId,
        ctc: computedNewSalary * 12,
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
        title: '🎉 Performance Appraisal Completed & Approved',
        message: `Congratulations! Your appraisal for ${review.cycleName} has been approved with a ${computedHike > 0 ? `+${computedHike.toFixed(0)}% salary hike` : 'rating'} (${overallScore}/5.0). Revised monthly salary: ₹${computedNewSalary.toLocaleString('en-IN')}.`,
        type: 'appraisal',
        actionUrl: '/employee/appraisals'
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
        attributes: ['id', 'firstName', 'lastName', 'email', 'employeeCode', 'salary'],
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
      { employeeCode: { [Op.like]: `%${search}%` } }
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
        attributes: ['id', 'firstName', 'lastName', 'email', 'employeeCode', 'salary'],
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
