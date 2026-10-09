const { Op } = require('sequelize');
const {
  Payroll,
  User,
  SalaryStructure,
  Department,
  Designation,
  Attendance,
  LeaveRequest,
  Holiday
} = require('../models');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/apiError');
const logger = require('../config/logger');

/**
 * Convert number to Indian currency words
 */
const numberToWords = (num) => {
  if (!num || isNaN(num) || num <= 0) return 'Zero Rupees Only';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
  };

  const integerPart = Math.floor(num);
  return inWords(integerPart).trim() + ' Rupees Only';
};

/**
 * Generate / Calculate Monthly Payroll Batch
 */
const generateMonthlyPayroll = async ({ month, year, departmentId, generatedBy }) => {
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);

  if (!m || m < 1 || m > 12 || !y || y < 2020) {
    throw new BadRequestError('Invalid month or year specified for payroll generation');
  }

  const daysInMonth = new Date(y, m, 0).getDate();
  const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
  const endDate = `${y}-${String(m).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  // Find all active employees eligible for salary
  const userWhere = {
    status: { [Op.in]: ['active', 'probation'] }
  };
  if (departmentId) {
    userWhere.departmentId = departmentId;
  }

  const employees = await User.findAll({
    where: userWhere,
    include: [
      { model: SalaryStructure, as: 'salaryStructure' },
      { model: Department, as: 'departmentDetails' },
      { model: Designation, as: 'designationDetails' }
    ]
  });

  if (!employees || employees.length === 0) {
    return {
      month: m,
      year: y,
      totalProcessed: 0,
      message: 'No active employees found to process payroll'
    };
  }

  const results = [];

  for (const emp of employees) {
    // 1. Calculate Attendance & Leaves for Month
    const attendances = await Attendance.findAll({
      where: {
        userId: emp.id,
        date: { [Op.between]: [startDate, endDate] }
      }
    });

    let presentDays = 0;
    for (const att of attendances) {
      if (att.status === 'present' || att.status === 'late') {
        presentDays += 1;
      } else if (att.status === 'half_day') {
        presentDays += 0.5;
      }
    }

    // 2. Query Approved Leaves in Month
    const leaves = await LeaveRequest.findAll({
      where: {
        userId: emp.id,
        status: 'approved',
        [Op.or]: [
          { startDate: { [Op.between]: [startDate, endDate] } },
          { endDate: { [Op.between]: [startDate, endDate] } }
        ]
      }
    });

    let paidLeaveDays = 0;
    for (const lev of leaves) {
      paidLeaveDays += Number(lev.totalDays || 1);
    }

    // Standard working days (approx 26 if 6-day week or 22 if 5-day week, default 26)
    const standardWorkingDays = Math.min(26, daysInMonth);

    // If attendance records exist in DB, calculate actual LOP
    let lopDays = 0;
    if (attendances.length > 0) {
      // Any missing day from standard working schedule minus paid leaves is LOP
      const totalAccountedDays = presentDays + paidLeaveDays;
      lopDays = Math.max(0, standardWorkingDays - totalAccountedDays);
    } else {
      // Default: If attendance records haven't been seeded yet for future/current test month, assume full attendance
      presentDays = standardWorkingDays;
      lopDays = 0;
    }

    // 3. Salary Structure Breakdown
    let baseCtc = 0;
    let monthlyGross = 0;
    let basicSalary = 0;
    let hra = 0;
    let specialAllowance = 0;
    let pfDeduction = 0;
    let esiDeduction = 0;
    let taxDeduction = 0;

    if (emp.salaryStructure) {
      const s = emp.salaryStructure;
      baseCtc = Number(s.ctc || emp.salary || 0);
      monthlyGross = Math.round(baseCtc / 12);
      basicSalary = Number(s.basicSalary || Math.round(monthlyGross * 0.5));
      hra = Number(s.hra || Math.round(monthlyGross * 0.2));
      specialAllowance = Number(s.specialAllowance || Math.max(0, monthlyGross - basicSalary - hra));
      pfDeduction = Number(s.pfDeduction || Math.round(basicSalary * 0.12));
      esiDeduction = Number(s.esiDeduction || (monthlyGross <= 21000 ? Math.round(monthlyGross * 0.0075) : 0));
      taxDeduction = Number(s.taxDeduction || 0);
    } else {
      // Fallback to emp.salary or default CTC
      baseCtc = Number(emp.salary || 600000);
      monthlyGross = Math.round(baseCtc / 12);
      basicSalary = Math.round(monthlyGross * 0.5);
      hra = Math.round(monthlyGross * 0.2);
      specialAllowance = Math.max(0, monthlyGross - basicSalary - hra);
      pfDeduction = Math.round(basicSalary * 0.12);
      esiDeduction = monthlyGross <= 21000 ? Math.round(monthlyGross * 0.0075) : 0;
      taxDeduction = 0;
    }

    // 4. LOP Prorated Calculation
    const perDayRate = daysInMonth > 0 ? monthlyGross / daysInMonth : 0;
    const lopDeduction = Math.round(perDayRate * lopDays);
    const earnedGross = Math.max(0, monthlyGross - lopDeduction);

    const totalDeductions = Math.round(pfDeduction + esiDeduction + taxDeduction);
    const netSalary = Math.max(0, earnedGross - totalDeductions);

    // 5. Upsert snapshot into payrolls table
    const [record] = await Payroll.upsert({
      userId: emp.id,
      month: m,
      year: y,
      totalDays: daysInMonth,
      workingDays: standardWorkingDays,
      presentDays,
      paidLeaves: paidLeaveDays,
      lopDays,
      baseCtc,
      monthlyGross,
      basicSalary,
      hra,
      specialAllowance,
      bonus: 0,
      pfDeduction,
      esiDeduction,
      taxDeduction,
      lopDeduction,
      otherDeductions: 0,
      grossSalary: earnedGross,
      totalDeductions,
      netSalary,
      paymentStatus: 'pending',
      remarks: `Automated payroll cycle for ${m}/${y}`
    });

    results.push(record);
  }

  logger.info(`Monthly payroll generated for ${results.length} employees (${m}/${y}) by user ${generatedBy || 'system'}`);

  return {
    month: m,
    year: y,
    totalProcessed: results.length,
    message: `Payroll successfully generated for ${results.length} employee(s).`
  };
};

/**
 * Get Paginated Payroll Directory with Filters
 */
const getPayrollDirectory = async ({
  month,
  year,
  status,
  departmentId,
  search,
  page = 1,
  limit = 20
}) => {
  const m = month ? parseInt(month, 10) : new Date().getMonth() + 1;
  const y = year ? parseInt(year, 10) : new Date().getFullYear();
  const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
  const take = parseInt(limit, 10);

  const where = {
    month: m,
    year: y
  };

  if (status && status !== 'all') {
    where.paymentStatus = status.toLowerCase();
  }

  const userWhere = {};
  if (departmentId && departmentId !== 'all') {
    userWhere.departmentId = departmentId;
  }
  if (search && search.trim() !== '') {
    const q = `%${search.trim()}%`;
    userWhere[Op.or] = [
      { firstName: { [Op.like]: q } },
      { lastName: { [Op.like]: q } },
      { employeeCode: { [Op.like]: q } },
      { email: { [Op.like]: q } }
    ];
  }

  const { rows, count } = await Payroll.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'user',
        where: userWhere,
        attributes: [
          'id',
          'firstName',
          'lastName',
          'email',
          'employeeCode',
          'department',
          'designation',
          'avatar',
          'bankName',
          'bankAccountNumber',
          'bankIfsc'
        ],
        include: [
          { model: Department, as: 'departmentDetails', attributes: ['id', 'name'] },
          { model: Designation, as: 'designationDetails', attributes: ['id', 'title'] }
        ]
      }
    ],
    order: [['createdAt', 'DESC']],
    offset,
    limit: take
  });

  return {
    payrolls: rows,
    total: count,
    page: parseInt(page, 10),
    limit: take,
    totalPages: Math.ceil(count / take),
    month: m,
    year: y
  };
};

/**
 * Get Monthly KPI Summary
 */
const getPayrollSummary = async ({ month, year }) => {
  const m = month ? parseInt(month, 10) : new Date().getMonth() + 1;
  const y = year ? parseInt(year, 10) : new Date().getFullYear();

  const payrolls = await Payroll.findAll({
    where: { month: m, year: y }
  });

  let totalNetDisbursement = 0;
  let totalGross = 0;
  let totalDeductions = 0;
  let totalPf = 0;
  let totalEsi = 0;
  let totalTds = 0;

  let countPending = 0;
  let countProcessed = 0;
  let countPaid = 0;
  let countFailed = 0;

  payrolls.forEach((p) => {
    totalNetDisbursement += Number(p.netSalary || 0);
    totalGross += Number(p.grossSalary || 0);
    totalDeductions += Number(p.totalDeductions || 0);
    totalPf += Number(p.pfDeduction || 0);
    totalEsi += Number(p.esiDeduction || 0);
    totalTds += Number(p.taxDeduction || 0);

    if (p.paymentStatus === 'paid') countPaid++;
    else if (p.paymentStatus === 'processed') countProcessed++;
    else if (p.paymentStatus === 'failed') countFailed++;
    else countPending++;
  });

  return {
    month: m,
    year: y,
    totalStaff: payrolls.length,
    totalNetDisbursement: Math.round(totalNetDisbursement),
    totalGross: Math.round(totalGross),
    totalDeductions: Math.round(totalDeductions),
    statutoryTotal: Math.round(totalPf + totalEsi + totalTds),
    totalPf: Math.round(totalPf),
    totalEsi: Math.round(totalEsi),
    totalTds: Math.round(totalTds),
    counts: {
      total: payrolls.length,
      pending: countPending,
      processed: countProcessed,
      paid: countPaid,
      failed: countFailed
    }
  };
};

/**
 * Get Single Payroll Details by ID
 */
const getPayrollById = async (id) => {
  const payroll = await Payroll.findByPk(id, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: [
          'id',
          'firstName',
          'lastName',
          'email',
          'employeeCode',
          'department',
          'designation',
          'avatar',
          'joiningDate',
          'bankName',
          'bankAccountNumber',
          'bankIfsc'
        ],
        include: [
          { model: Department, as: 'departmentDetails', attributes: ['id', 'name'] },
          { model: Designation, as: 'designationDetails', attributes: ['id', 'title'] }
        ]
      }
    ]
  });

  if (!payroll) {
    throw new NotFoundError('Payroll record not found');
  }

  return payroll;
};

/**
 * Adjust Single Payroll (Bonus / Extra Deductions / Remarks)
 */
const adjustPayroll = async (id, { bonus, otherDeductions, remarks, adjustedBy }) => {
  const payroll = await Payroll.findByPk(id);
  if (!payroll) {
    throw new NotFoundError('Payroll record not found');
  }

  const numBonus = bonus !== undefined ? parseFloat(bonus) : Number(payroll.bonus || 0);
  const numOtherDed = otherDeductions !== undefined ? parseFloat(otherDeductions) : Number(payroll.otherDeductions || 0);

  // Recalculate Gross and Total Deductions
  const baseGross = Number(payroll.monthlyGross || 0) - Number(payroll.lopDeduction || 0);
  const newGross = Math.max(0, baseGross + numBonus);

  const newTotalDeductions = Math.max(
    0,
    Number(payroll.pfDeduction || 0) +
    Number(payroll.esiDeduction || 0) +
    Number(payroll.taxDeduction || 0) +
    numOtherDed
  );

  const newNet = Math.max(0, newGross - newTotalDeductions);

  payroll.bonus = numBonus;
  payroll.otherDeductions = numOtherDed;
  payroll.grossSalary = newGross;
  payroll.totalDeductions = newTotalDeductions;
  payroll.netSalary = newNet;

  if (remarks) {
    payroll.remarks = remarks;
  }

  await payroll.save();
  logger.info(`Payroll ${id} adjusted by ${adjustedBy || 'HR'}. New Net: ${newNet}`);

  return getPayrollById(id);
};

/**
 * Update Payroll Status (Single)
 */
const updatePayrollStatus = async (
  id,
  { status, paymentMode, transactionReference, paidAt, remarks }
) => {
  const payroll = await Payroll.findByPk(id);
  if (!payroll) {
    throw new NotFoundError('Payroll record not found');
  }

  const validStatuses = ['pending', 'processed', 'paid', 'failed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw new BadRequestError(`Invalid payment status '${status}'`);
  }

  payroll.paymentStatus = status;

  if (paymentMode) payroll.paymentMode = paymentMode;
  if (transactionReference) payroll.transactionReference = transactionReference;
  if (remarks) payroll.remarks = remarks;

  if (status === 'paid') {
    payroll.paidAt = paidAt || new Date();
    if (!payroll.transactionReference) {
      payroll.transactionReference = `PAY-UTR-${Date.now().toString().slice(-8)}`;
    }
    if (!payroll.paymentMode) {
      payroll.paymentMode = 'bank_transfer';
    }
  }

  await payroll.save();
  return getPayrollById(id);
};

/**
 * Bulk Disburse / Mark as Paid
 */
const bulkDisburse = async ({
  month,
  year,
  ids,
  paymentMode = 'bank_transfer',
  transactionReference,
  paidAt = new Date()
}) => {
  const where = {};
  if (month && year) {
    where.month = parseInt(month, 10);
    where.year = parseInt(year, 10);
  }
  if (ids && Array.isArray(ids) && ids.length > 0) {
    where.id = { [Op.in]: ids };
  }

  const [updatedCount] = await Payroll.update(
    {
      paymentStatus: 'paid',
      paymentMode,
      transactionReference: transactionReference || `BULK-UTR-${Date.now().toString().slice(-8)}`,
      paidAt: paidAt || new Date()
    },
    { where }
  );

  return {
    updatedCount,
    message: `Successfully marked ${updatedCount} payroll record(s) as Paid.`
  };
};

/**
 * Export Bank NEFT Transfer Payout Sheet as CSV Data
 */
const exportBankSheet = async ({ month, year }) => {
  const m = month ? parseInt(month, 10) : new Date().getMonth() + 1;
  const y = year ? parseInt(year, 10) : new Date().getFullYear();

  const payrolls = await Payroll.findAll({
    where: { month: m, year: y },
    include: [
      {
        model: User,
        as: 'user',
        attributes: [
          'employeeCode',
          'firstName',
          'lastName',
          'bankName',
          'bankAccountNumber',
          'bankIfsc'
        ]
      }
    ]
  });

  const headers = [
    'Sr No',
    'Employee Code',
    'Beneficiary Name',
    'Bank Name',
    'Bank Account Number',
    'IFSC Code',
    'Net Payable Amount (INR)',
    'Payment Mode',
    'Status',
    'Transaction Reference'
  ];

  const rows = payrolls.map((p, idx) => {
    const emp = p.user || {};
    const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Employee';
    return [
      idx + 1,
      emp.employeeCode || 'N/A',
      `"${fullName}"`,
      `"${emp.bankName || 'HDFC Bank'}"`,
      `"${emp.bankAccountNumber || 'Not Provided'}"`,
      `"${emp.bankIfsc || 'HDFC0001234'}"`,
      Number(p.netSalary || 0).toFixed(2),
      p.paymentMode || 'NEFT',
      p.paymentStatus.toUpperCase(),
      p.transactionReference || 'PENDING'
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
};

/**
 * Get My Payslips (Employee Self-Service)
 */
const getMyPayslips = async (userId) => {
  const payrolls = await Payroll.findAll({
    where: { userId },
    order: [
      ['year', 'DESC'],
      ['month', 'DESC']
    ]
  });

  return payrolls;
};

/**
 * Get Formatted Payslip Data for Printable / PDF view
 */
const getPayslipDetails = async (id, requestingUser) => {
  const payroll = await getPayrollById(id);

  // Security check: only Admin/HR or the employee himself can view
  if (
    requestingUser.role !== 'admin' &&
    requestingUser.role !== 'hr' &&
    requestingUser.id !== payroll.userId
  ) {
    throw new ForbiddenError('You are not authorized to view this payslip');
  }

  const u = payroll.user || {};
  const monthNames = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[payroll.month] || `Month ${payroll.month}`;

  return {
    id: payroll.id,
    period: {
      month: payroll.month,
      monthName,
      year: payroll.year,
      displayPeriod: `${monthName} ${payroll.year}`,
      totalDays: payroll.totalDays,
      workingDays: payroll.workingDays,
      presentDays: Number(payroll.presentDays),
      paidLeaves: Number(payroll.paidLeaves),
      lopDays: Number(payroll.lopDays)
    },
    company: {
      name: 'Gupta Tech Web',
      tagline: 'Enterprise HR Operations & Technology Hub',
      address: '410, Shagun Tower, Vijay Nagar, Indore, MP, India',
      cin: 'U72200MP2024PTC189201',
      pan: 'AAACG1234F',
      phone: '+91 7400554294',
      email: 'sales@guptatechweb.com'
    },
    employee: {
      id: u.id,
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
      employeeCode: u.employeeCode || 'EMP-ID',
      email: u.email,
      department: u.departmentDetails?.name || u.department || 'General',
      designation: u.designationDetails?.title || u.designation || 'Staff',
      joiningDate: u.joiningDate || 'N/A',
      bankName: u.bankName || 'HDFC Bank',
      bankAccountNumber: u.bankAccountNumber || '••••••••4819',
      bankIfsc: u.bankIfsc || 'HDFC0001234'
    },
    earnings: [
      { name: 'Basic Salary', amount: Number(payroll.basicSalary || 0) },
      { name: 'House Rent Allowance (HRA)', amount: Number(payroll.hra || 0) },
      { name: 'Special Allowance', amount: Number(payroll.specialAllowance || 0) },
      ...(Number(payroll.bonus || 0) > 0 ? [{ name: 'Incentive / Bonus', amount: Number(payroll.bonus) }] : [])
    ],
    deductions: [
      { name: 'Employee Provident Fund (PF)', amount: Number(payroll.pfDeduction || 0) },
      { name: 'Employee State Insurance (ESIC)', amount: Number(payroll.esiDeduction || 0) },
      { name: 'Professional Tax (PT)', amount: 200 },
      { name: 'TDS / Income Tax', amount: Number(payroll.taxDeduction || 0) },
      ...(Number(payroll.lopDeduction || 0) > 0 ? [{ name: `Loss of Pay (${payroll.lopDays} days)`, amount: Number(payroll.lopDeduction) }] : []),
      ...(Number(payroll.otherDeductions || 0) > 0 ? [{ name: 'Other Deductions', amount: Number(payroll.otherDeductions) }] : [])
    ],
    summary: {
      grossEarnings: Number(payroll.grossSalary || 0),
      totalDeductions: Number(payroll.totalDeductions || 0),
      netSalary: Number(payroll.netSalary || 0),
      netSalaryInWords: numberToWords(payroll.netSalary),
      paymentStatus: payroll.paymentStatus,
      paymentMode: payroll.paymentMode || 'Bank Transfer',
      transactionReference: payroll.transactionReference || 'N/A',
      paidAt: payroll.paidAt
    }
  };
};

module.exports = {
  generateMonthlyPayroll,
  getPayrollDirectory,
  getPayrollSummary,
  getPayrollById,
  adjustPayroll,
  updatePayrollStatus,
  bulkDisburse,
  exportBankSheet,
  getMyPayslips,
  getPayslipDetails
};
