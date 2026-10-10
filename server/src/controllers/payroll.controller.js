const payrollService = require('../services/payroll.service');
const ApiResponse = require('../utils/apiResponse');

/**
 * Run Monthly Payroll Batch Generation
 */
const generatePayroll = async (req, res, next) => {
  try {
    const { month, year, departmentId } = req.body;
    const result = await payrollService.generateMonthlyPayroll({
      month,
      year,
      departmentId,
      generatedBy: req.user.id
    });

    return ApiResponse.created(res, {
      message: result.message,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Paginated Payroll Directory with Filters
 */
const getPayrollDirectory = async (req, res, next) => {
  try {
    const result = await payrollService.getPayrollDirectory(req.query);
    return ApiResponse.success(res, {
      message: 'Payroll records retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Monthly KPI Summary Statistics
 */
const getPayrollSummary = async (req, res, next) => {
  try {
    const result = await payrollService.getPayrollSummary(req.query);
    return ApiResponse.success(res, {
      message: 'Payroll summary retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Single Payroll Details
 */
const getPayrollById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await payrollService.getPayrollById(id);
    return ApiResponse.success(res, {
      message: 'Payroll details retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Adjust Single Payroll (Bonus / Penalty)
 */
const adjustPayroll = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { bonus, otherDeductions, remarks } = req.body;
    const result = await payrollService.adjustPayroll(id, {
      bonus,
      otherDeductions,
      remarks,
      adjustedBy: req.user.id
    });
    return ApiResponse.success(res, {
      message: 'Payroll adjusted successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Status for Single Payroll
 */
const updatePayrollStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, paymentMode, transactionReference, paidAt, remarks } = req.body;
    const result = await payrollService.updatePayrollStatus(id, {
      status,
      paymentMode,
      transactionReference,
      paidAt,
      remarks
    });
    return ApiResponse.success(res, {
      message: 'Payroll status updated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk Disburse / Mark as Paid
 */
const bulkDisburse = async (req, res, next) => {
  try {
    const { month, year, ids, paymentMode, transactionReference, paidAt } = req.body;
    const result = await payrollService.bulkDisburse({
      month,
      year,
      ids,
      paymentMode,
      transactionReference,
      paidAt
    });
    return ApiResponse.success(res, {
      message: result.message,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export Bank Transfer CSV
 */
const exportBankSheet = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const csvData = await payrollService.exportBankSheet({ month, year });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Bank_Payout_Sheet_${month || 'current'}_${year || '2026'}.csv"`
    );
    return res.status(200).send(csvData);
  } catch (error) {
    next(error);
  }
};

/**
 * Employee Self-Service: My Payslips
 */
const getMyPayslips = async (req, res, next) => {
  try {
    const result = await payrollService.getMyPayslips(req.user.id);
    return ApiResponse.success(res, {
      message: 'My payslips retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Formatted Printable Payslip Details
 */
const getPayslipDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await payrollService.getPayslipDetails(id, req.user);
    return ApiResponse.success(res, {
      message: 'Payslip details formatted successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Stream Binary Payslip PDF Download
 */
const downloadPayslipPDF = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pdfBuffer = await payrollService.downloadPayslipPDF(id, req.user);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Payslip_${id}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.end(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generatePayroll,
  getPayrollDirectory,
  getPayrollSummary,
  getPayrollById,
  adjustPayroll,
  updatePayrollStatus,
  bulkDisburse,
  exportBankSheet,
  getMyPayslips,
  getPayslipDetails,
  downloadPayslipPDF
};
