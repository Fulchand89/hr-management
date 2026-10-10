const PDFDocument = require('pdfkit');

/**
 * Generate a professional salary payslip PDF as a Buffer
 * @param {Object} payroll Full payroll record with user and relations
 * @returns {Promise<Buffer>} Resolves to PDF Buffer
 */
const generatePayslipPDFBuffer = (payroll) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      const user = payroll.user || {};
      const empName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Employee';
      const monthNames = [
        '', 'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const monthStr = `${monthNames[payroll.month] || payroll.month} ${payroll.year}`;

      // Primary theme colors
      const primaryColor = '#1e3a8a';
      const secondaryColor = '#475569';
      const borderColor = '#cbd5e1';
      const lightBg = '#f8fafc';

      // 1. Company Header
      doc.rect(40, 40, 515, 60).fill(primaryColor);
      doc.fillColor('#ffffff')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('GUPTA TECH WEB - HRMS PLATFORM', 55, 52);
      doc.fontSize(10)
        .font('Helvetica')
        .text('Corporate Headquarters • Noida Sector 62 • support@guptatechweb.com', 55, 75);

      // Payslip Title Bar
      doc.rect(40, 105, 515, 26).fill('#f1f5f9');
      doc.fillColor('#0f172a')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(`SALARY PAYSLIP - ${monthStr.toUpperCase()}`, 50, 112, { align: 'center', width: 495 });

      // 2. Employee Details Box
      let y = 140;
      doc.rect(40, y, 515, 80).stroke(borderColor);

      doc.fillColor(secondaryColor).fontSize(9).font('Helvetica-Bold');
      doc.text('Employee Code:', 50, y + 8);
      doc.text('Employee Name:', 50, y + 25);
      doc.text('Department:', 50, y + 42);
      doc.text('Designation:', 50, y + 59);

      doc.fillColor('#0f172a').font('Helvetica');
      doc.text(user.employeeCode || 'N/A', 140, y + 8);
      doc.text(empName, 140, y + 25);
      doc.text(user.departmentDetails?.name || user.department || 'N/A', 140, y + 42);
      doc.text(user.designationDetails?.title || user.designation || 'N/A', 140, y + 59);

      doc.fillColor(secondaryColor).font('Helvetica-Bold');
      doc.text('Bank Name:', 310, y + 8);
      doc.text('Account No:', 310, y + 25);
      doc.text('IFSC Code:', 310, y + 42);
      doc.text('Payment Status:', 310, y + 59);

      doc.fillColor('#0f172a').font('Helvetica');
      doc.text(user.bankName || 'HDFC Bank', 400, y + 8);
      doc.text(user.bankAccountNumber ? `••••${user.bankAccountNumber.slice(-4)}` : '••••8921', 400, y + 25);
      doc.text(user.bankIfsc || 'HDFC0001234', 400, y + 42);
      const payStatus = (payroll.paymentStatus || 'pending').toUpperCase();
      doc.fillColor(payStatus === 'PAID' ? '#16a34a' : '#d97706').font('Helvetica-Bold');
      doc.text(payStatus, 400, y + 59);

      // 3. Attendance & LOP Summary
      y = 230;
      doc.rect(40, y, 515, 45).fill(lightBg).stroke(borderColor);

      doc.fillColor(secondaryColor).fontSize(8).font('Helvetica-Bold');
      doc.text('TOTAL DAYS', 50, y + 8);
      doc.text('WORK DAYS', 120, y + 8);
      doc.text('PRESENT', 190, y + 8);
      doc.text('PAID LEAVES', 255, y + 8);
      doc.text('LATE MARKS', 330, y + 8);
      doc.text('SANDWICH LOP', 410, y + 8);
      doc.text('TOTAL LOP', 490, y + 8);

      doc.fillColor('#0f172a').fontSize(10).font('Helvetica');
      doc.text(String(payroll.totalDays || 30), 50, y + 24);
      doc.text(String(payroll.workingDays || 26), 120, y + 24);
      doc.text(String(payroll.presentDays || 0), 190, y + 24);
      doc.text(String(payroll.paidLeaves || 0), 255, y + 24);
      doc.text(`${payroll.lateCount || 0} (${payroll.lateLopDays || 0}d)`, 330, y + 24);
      doc.text(`${payroll.sandwichLopDays || 0}d`, 410, y + 24);
      doc.fillColor('#dc2626').font('Helvetica-Bold');
      doc.text(`${payroll.lopDays || 0}d`, 490, y + 24);

      // 4. Earnings & Deductions Tables
      y = 285;
      const colWidth = 252;
      
      // Headers
      doc.rect(40, y, colWidth, 22).fill(primaryColor);
      doc.rect(302, y, colWidth, 22).fill(primaryColor);
      doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold');
      doc.text('EARNINGS', 50, y + 6);
      doc.text('AMOUNT (₹)', 230, y + 6);
      doc.text('DEDUCTIONS', 312, y + 6);
      doc.text('AMOUNT (₹)', 492, y + 6);

      y += 22;
      const earnings = [
        { label: 'Basic Salary', val: payroll.basicSalary },
        { label: 'House Rent Allowance (HRA)', val: payroll.hra },
        { label: 'Special Allowance', val: payroll.specialAllowance },
        { label: 'Performance / Referral Bonus', val: payroll.bonus }
      ];

      const deductions = [
        { label: 'Provident Fund (PF)', val: payroll.pfDeduction },
        { label: 'Employee State Insurance (ESI)', val: payroll.esiDeduction },
        { label: 'Professional / Income Tax', val: payroll.taxDeduction },
        { label: 'LOP Deduction (Absence / Late)', val: payroll.lopDeduction },
        { label: 'Other Deductions', val: payroll.otherDeductions }
      ];

      const maxRows = Math.max(earnings.length, deductions.length);
      const rowHeight = 20;

      for (let i = 0; i < maxRows; i++) {
        const rowY = y + i * rowHeight;
        const bg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(40, rowY, colWidth, rowHeight).fill(bg).stroke(borderColor);
        doc.rect(302, rowY, colWidth, rowHeight).fill(bg).stroke(borderColor);

        doc.fillColor('#334155').fontSize(9).font('Helvetica');
        if (earnings[i]) {
          doc.text(earnings[i].label, 50, rowY + 5);
          doc.text(Number(earnings[i].val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }), 215, rowY + 5, { align: 'right', width: 65 });
        }

        if (deductions[i]) {
          doc.text(deductions[i].label, 312, rowY + 5);
          doc.text(Number(deductions[i].val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }), 477, rowY + 5, { align: 'right', width: 65 });
        }
      }

      // Subtotals
      y += maxRows * rowHeight;
      doc.rect(40, y, colWidth, 24).fill('#e2e8f0').stroke(borderColor);
      doc.rect(302, y, colWidth, 24).fill('#e2e8f0').stroke(borderColor);

      doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
      doc.text('GROSS EARNINGS', 50, y + 7);
      doc.text(`₹${Number(payroll.grossSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 200, y + 7, { align: 'right', width: 80 });

      doc.text('TOTAL DEDUCTIONS', 312, y + 7);
      doc.text(`₹${Number(payroll.totalDeductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 462, y + 7, { align: 'right', width: 80 });

      // 5. Net Salary Highlights Box
      y += 35;
      doc.rect(40, y, 515, 55).fill('#ecfdf5').stroke('#10b981');
      doc.fillColor('#065f46').fontSize(11).font('Helvetica-Bold');
      doc.text('NET TAKE HOME PAY:', 60, y + 12);
      doc.fontSize(16).text(`₹${Number(payroll.netSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 60, y + 30);

      // 6. Payment Details & Signatory
      y += 70;
      doc.fillColor(secondaryColor).fontSize(8).font('Helvetica');
      doc.text(`Transaction Reference: ${payroll.transactionReference || 'N/A'}`, 45, y);
      doc.text(`Payment Mode: ${(payroll.paymentMode || 'bank_transfer').toUpperCase()}`, 45, y + 12);
      if (payroll.paidAt) {
        doc.text(`Disbursed On: ${new Date(payroll.paidAt).toLocaleDateString('en-IN')}`, 45, y + 24);
      }

      doc.text('Authorised Signatory', 430, y + 35);
      doc.rect(410, y + 30, 120, 1).stroke(borderColor);
      doc.fontSize(7).text('Gupta Tech Web HR Operations', 425, y + 46);

      // Footer
      doc.fillColor('#94a3b8').fontSize(7)
        .text('This is a system generated payslip and does not require a physical signature. Confidential.', 40, 780, {
          align: 'center',
          width: 515
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generatePayslipPDFBuffer
};
