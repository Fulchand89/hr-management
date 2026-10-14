const PDFDocument = require('pdfkit');

/**
 * Generate a professional salary payslip PDF as a Buffer (single A4 page)
 * @param {Object} payroll Full payroll record with user and relations
 * @returns {Promise<Buffer>} Resolves to PDF Buffer
 */
const generatePayslipPDFBuffer = (payroll) => {
  return new Promise((resolve, reject) => {
    try {
      // autoFirstPage:false so we control the single page
      const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: true, bufferPages: true });
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

      // Theme colors — RED instead of blue
      const primaryColor = '#8B1D2C';
      const secondaryColor = '#475569';
      const borderColor = '#e2e8f0';
      const lightBg = '#f8fafc';
      const PAGE_W = 595.28; // A4 width in points
      const M = 30;          // left/right margin
      const W = PAGE_W - M * 2; // usable width

      // ── 1. Company Header ──────────────────────────────────────────────
      doc.rect(M, 20, W, 46).fill(primaryColor);
      doc.fillColor('#ffffff')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('GUPTA TECH WEB — HRMS PLATFORM', M + 10, 28, { width: W - 20 });
      doc.fontSize(8)
        .font('Helvetica')
        .text('Corporate Headquarters • Noida Sector 62 • support@guptatechweb.com', M + 10, 46, { width: W - 20 });

      // ── Payslip Title Bar ─────────────────────────────────────────────
      doc.rect(M, 68, W, 20).fill('#fef2f2');
      doc.fillColor('#7f1d1d')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(`SALARY PAYSLIP — ${monthStr.toUpperCase()}`, M, 72, { align: 'center', width: W });

      // ── 2. Employee & Bank Details Box ────────────────────────────────
      let y = 93;
      const boxH = 68;
      doc.rect(M, y, W, boxH).stroke(borderColor);

      const col1 = M + 8;
      const col2 = M + 115;
      const col3 = M + W / 2 + 8;
      const col4 = M + W / 2 + 105;

      doc.fillColor(secondaryColor).fontSize(8).font('Helvetica-Bold');
      doc.text('Employee Code:', col1, y + 6);
      doc.text('Employee Name:', col1, y + 20);
      doc.text('Department:', col1, y + 34);
      doc.text('Designation:', col1, y + 48);

      doc.fillColor('#0f172a').fontSize(8).font('Helvetica');
      doc.text(user.employeeCode || 'N/A', col2, y + 6);
      doc.text(empName, col2, y + 20, { width: W / 2 - 120 });
      doc.text(user.departmentDetails?.name || user.department || 'N/A', col2, y + 34, { width: W / 2 - 120 });
      doc.text(user.designationDetails?.title || user.designation || 'N/A', col2, y + 48, { width: W / 2 - 120 });

      // Vertical divider
      doc.moveTo(M + W / 2, y + 4).lineTo(M + W / 2, y + boxH - 4).stroke(borderColor);

      doc.fillColor(secondaryColor).fontSize(8).font('Helvetica-Bold');
      doc.text('Bank Name:', col3, y + 6);
      doc.text('Account No:', col3, y + 20);
      doc.text('IFSC Code:', col3, y + 34);
      doc.text('Pay Status:', col3, y + 48);

      const payStatus = (payroll.paymentStatus || 'pending').toUpperCase();
      doc.fillColor('#0f172a').fontSize(8).font('Helvetica');
      doc.text(user.bankName || 'N/A', col4, y + 6, { width: W / 2 - 115 });
      doc.text(user.bankAccountNumber ? `••••${user.bankAccountNumber.slice(-4)}` : 'N/A', col4, y + 20);
      doc.text(user.bankIfsc || 'N/A', col4, y + 34);
      doc.fillColor(payStatus === 'PAID' ? '#16a34a' : '#d97706').font('Helvetica-Bold');
      doc.text(payStatus, col4, y + 48);

      // ── 3. Attendance Summary ─────────────────────────────────────────
      y += boxH + 6;
      const attH = 38;
      doc.rect(M, y, W, attH).fill(lightBg).stroke(borderColor);

      const attCols = [M + 8, M + 85, M + 162, M + 240, M + 318, M + 400, M + 475];
      const attLabels = ['TOTAL DAYS', 'WORK DAYS', 'PRESENT', 'LOGGED HRS', 'LATE MARKS', 'SHORT/OT', 'LOP DAYS'];

      doc.fillColor(secondaryColor).fontSize(7).font('Helvetica-Bold');
      attLabels.forEach((lbl, i) => doc.text(lbl, attCols[i], y + 5, { width: 72 }));

      const shortOtStr = Number(payroll.overtimeHours || 0) > 0
        ? `+${payroll.overtimeHours}h OT`
        : Number(payroll.underTimeHours || 0) > 0
        ? `-${payroll.underTimeHours}h`
        : '0h';

      const attValues = [
        String(payroll.totalDays || 30),
        String(payroll.workingDays || 26),
        String(payroll.presentDays || 0),
        `${payroll.actualLoggedHours || 0}h`,
        `${payroll.lateCount || 0}(${payroll.lateLopDays || 0}d)`,
        shortOtStr,
        `${payroll.lopDays || 0}d`
      ];

      doc.fillColor('#0f172a').fontSize(9).font('Helvetica');
      attValues.forEach((val, i) => {
        if (i === 6) { doc.fillColor('#dc2626').font('Helvetica-Bold'); }
        doc.text(val, attCols[i], y + 20, { width: 72 });
        if (i === 6) { doc.fillColor('#0f172a').font('Helvetica'); }
      });

      // ── 4. Earnings & Deductions Table ────────────────────────────────
      y += attH + 6;
      const colW = (W - 4) / 2;

      // Headers
      doc.rect(M, y, colW, 18).fill(primaryColor);
      doc.rect(M + colW + 4, y, colW, 18).fill(primaryColor);
      doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold');
      doc.text('EARNINGS', M + 8, y + 4);
      doc.text('AMOUNT (₹)', M + colW - 82, y + 4, { width: 78, align: 'right' });
      doc.text('DEDUCTIONS', M + colW + 12, y + 4);
      doc.text('AMOUNT (₹)', M + W - 82, y + 4, { width: 78, align: 'right' });

      y += 18;

      const earnings = [
        { label: 'Basic Salary', val: payroll.basicSalary },
        { label: 'House Rent Allowance (HRA)', val: payroll.hra },
        { label: 'Special Allowance', val: payroll.specialAllowance }
      ];
      if (Number(payroll.bonus || 0) > 0) {
        earnings.push({ label: 'Bonus', val: payroll.bonus });
      }
      if (Number(payroll.overtimePay || 0) > 0) {
        earnings.push({ label: `OT Pay (${payroll.overtimeHours || 0}h)`, val: payroll.overtimePay });
      }

      const deductions = [
        { label: 'Provident Fund (PF)', val: payroll.pfDeduction },
        { label: 'ESI', val: payroll.esiDeduction },
        { label: 'Professional Tax', val: payroll.taxDeduction }
      ];
      if (Number(payroll.lopDeduction || 0) > 0) {
        deductions.push({ label: `LOP (${payroll.lopDays || 0}d)`, val: payroll.lopDeduction });
      }
      if (Number(payroll.underTimeDeduction || 0) > 0 && !payroll.waiveUnderTime) {
        deductions.push({ label: `Under-Time (${payroll.underTimeHours || 0}h)`, val: payroll.underTimeDeduction });
      }
      if (Number(payroll.otherDeductions || 0) > 0) {
        deductions.push({ label: 'Other Deductions', val: payroll.otherDeductions });
      }

      const maxRows = Math.max(earnings.length, deductions.length);
      const rowH = 16;

      for (let i = 0; i < maxRows; i++) {
        const rowY = y + i * rowH;
        const bg = i % 2 === 0 ? '#ffffff' : '#fafafa';
        doc.rect(M, rowY, colW, rowH).fill(bg).stroke(borderColor);
        doc.rect(M + colW + 4, rowY, colW, rowH).fill(bg).stroke(borderColor);

        doc.fillColor('#334155').fontSize(7.5).font('Helvetica');
        if (earnings[i]) {
          doc.text(earnings[i].label, M + 6, rowY + 4, { width: colW - 90 });
          doc.text(
            Number(earnings[i].val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
            M + colW - 82, rowY + 4, { width: 78, align: 'right' }
          );
        }
        if (deductions[i]) {
          doc.text(deductions[i].label, M + colW + 10, rowY + 4, { width: colW - 90 });
          doc.text(
            Number(deductions[i].val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
            M + W - 82, rowY + 4, { width: 78, align: 'right' }
          );
        }
      }

      // Subtotals row
      y += maxRows * rowH;
      doc.rect(M, y, colW, 18).fill('#e2e8f0').stroke(borderColor);
      doc.rect(M + colW + 4, y, colW, 18).fill('#e2e8f0').stroke(borderColor);

      doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold');
      doc.text('GROSS EARNINGS', M + 6, y + 5);
      doc.text(
        `₹${Number(payroll.grossSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        M + colW - 82, y + 5, { width: 78, align: 'right' }
      );
      doc.text('TOTAL DEDUCTIONS', M + colW + 10, y + 5);
      doc.text(
        `₹${Number(payroll.totalDeductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        M + W - 82, y + 5, { width: 78, align: 'right' }
      );

      // ── 5. Net Salary Banner ──────────────────────────────────────────
      y += 24;
      doc.rect(M, y, W, 46).fill('#fff1f2').stroke('#fca5a5');
      doc.fillColor('#7f1d1d').fontSize(9).font('Helvetica-Bold');
      doc.text('NET TAKE HOME PAY', M + 10, y + 8);
      doc.fontSize(18).text(
        `₹${Number(payroll.netSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        M + 10, y + 20
      );

      // ── 6. Payment Details & Signatory ───────────────────────────────
      y += 52;
      doc.fillColor(secondaryColor).fontSize(7.5).font('Helvetica');
      doc.text(`Txn Ref: ${payroll.transactionReference || 'N/A'}`, M + 6, y);
      doc.text(`Mode: ${(payroll.paymentMode || 'BANK_TRANSFER').toUpperCase()}`, M + 6, y + 12);
      if (payroll.paidAt) {
        doc.text(`Disbursed On: ${new Date(payroll.paidAt).toLocaleDateString('en-IN')}`, M + 6, y + 24);
      }

      doc.fillColor('#475569').fontSize(7.5).font('Helvetica');
      doc.text('Authorised Signatory', M + W - 130, y + 24, { width: 120, align: 'center' });
      doc.moveTo(M + W - 130, y + 22).lineTo(M + W - 10, y + 22).stroke(borderColor);
      doc.fontSize(7).text('Gupta Tech Web HR Operations', M + W - 130, y + 34, { width: 120, align: 'center' });

      // ── Footer ────────────────────────────────────────────────────────
      doc.fillColor('#94a3b8').fontSize(6.5)
        .text(
          'This is a system-generated payslip and does not require a physical signature. Confidential.',
          M, 820, { align: 'center', width: W }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generatePayslipPDFBuffer
};
