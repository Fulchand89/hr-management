const { generatePayslipPDFBuffer } = require('./src/services/pdf.service');
const fs = require('fs');

async function test() {
  const mockPayroll = {
    month: 10,
    year: 2026,
    user: {
      firstName: 'Rahul',
      lastName: 'Sharma',
      employeeCode: 'EMP001',
      department: 'Engineering',
      designation: 'Software Engineer',
      bankName: 'HDFC Bank',
      bankAccountNumber: '123456789012',
      bankIfsc: 'HDFC0001234'
    },
    paymentStatus: 'PAID',
    totalDays: 31,
    workingDays: 26,
    presentDays: 25,
    actualLoggedHours: 200,
    lateCount: 2,
    lateLopDays: 0.5,
    overtimeHours: 5,
    overtimePay: 2500,
    underTimeHours: 0,
    underTimeDeduction: 0,
    lopDays: 1,
    lopDeduction: 1500,
    basicSalary: 30000,
    hra: 15000,
    specialAllowance: 10000,
    bonus: 2000,
    pfDeduction: 1800,
    esiDeduction: 500,
    taxDeduction: 2000,
    otherDeductions: 500,
    grossSalary: 59500,
    totalDeductions: 5800,
    netSalary: 53700,
    transactionReference: 'NEFT123456789',
    paymentMode: 'bank_transfer',
    paidAt: new Date()
  };

  const buffer = await generatePayslipPDFBuffer(mockPayroll);
  fs.writeFileSync('./test-output.pdf', buffer);
  
  // Count pages in generated PDF buffer
  const str = buffer.toString('utf8');
  const matches = str.match(/\/Type\s*\/Page[^s]/g);
  console.log('Page count matches:', matches ? matches.length : 'unknown');
  console.log('PDF size in bytes:', buffer.length);
}

test().catch(console.error);
