const request = require('supertest');
const app = require('./src/app');
const { closeConnection } = require('./src/config/db');

async function runPayrollTests() {
  console.log('========================================================');
  console.log('🚀 Starting Comprehensive Payroll Management API Tests');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, extraInfo = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} ${extraInfo}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate as HR
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'hr@hrmanagement.com', password: 'HrPassword@123' });

    const hrToken = loginRes.body.data?.accessToken;
    assert(loginRes.status === 200 && Boolean(hrToken), '1. HR Login Authentication');

    if (!hrToken) {
      throw new Error('HR Login failed: ' + JSON.stringify(loginRes.body));
    }

    const hrHeader = `Bearer ${hrToken}`;

    // 2. Batch Generate Payroll for October 2026
    const genRes = await request(app)
      .post('/api/v1/payroll/generate')
      .set('Authorization', hrHeader)
      .send({ month: 10, year: 2026 });

    assert(
      (genRes.status === 200 || genRes.status === 201) && genRes.body.success === true,
      '2. POST /api/v1/payroll/generate (Batch Monthly Calculation)',
      JSON.stringify(genRes.body)
    );

    // 3. Get Payroll KPI Summary
    const summaryRes = await request(app)
      .get('/api/v1/payroll/summary?month=10&year=2026')
      .set('Authorization', hrHeader);

    assert(
      summaryRes.status === 200 &&
      summaryRes.body.data?.counts &&
      typeof summaryRes.body.data.totalNetDisbursement === 'number',
      '3. GET /api/v1/payroll/summary (Monthly KPIs & Statutory Liabilities)'
    );

    // 4. Get Payroll Directory Grid
    const listRes = await request(app)
      .get('/api/v1/payroll?month=10&year=2026&limit=10')
      .set('Authorization', hrHeader);

    assert(
      listRes.status === 200 &&
      Array.isArray(listRes.body.data?.payrolls) &&
      listRes.body.data.payrolls.length > 0,
      '4. GET /api/v1/payroll (Staff Directory with Snapshot Breakdown)'
    );

    const firstPayroll = listRes.body.data?.payrolls?.[0];
    const payrollId = firstPayroll?.id;

    if (payrollId) {
      // 5. Adjust Payroll (Bonus & Remarks)
      const adjustRes = await request(app)
        .put(`/api/v1/payroll/${payrollId}/adjust`)
        .set('Authorization', hrHeader)
        .send({ bonus: 3500, remarks: 'Festival Performance Reward' });

      assert(
        adjustRes.status === 200 &&
        Number(adjustRes.body.data?.bonus) === 3500,
        '5. PUT /api/v1/payroll/:id/adjust (Manual Bonus & Recalculation)'
      );

      // 6. Update Single Status to Processed
      const statusRes = await request(app)
        .patch(`/api/v1/payroll/${payrollId}/status`)
        .set('Authorization', hrHeader)
        .send({ status: 'processed' });

      assert(
        statusRes.status === 200 &&
        statusRes.body.data?.paymentStatus === 'processed',
        '6. PATCH /api/v1/payroll/:id/status (Approval Workflow Transition)'
      );

      // 7. Get Official Printable Payslip
      const payslipRes = await request(app)
        .get(`/api/v1/payroll/${payrollId}/payslip`)
        .set('Authorization', hrHeader);

      assert(
        payslipRes.status === 200 &&
        payslipRes.body.data?.company?.name === 'Gupta Tech Web' &&
        Array.isArray(payslipRes.body.data?.earnings) &&
        typeof payslipRes.body.data?.summary?.netSalaryInWords === 'string',
        '7. GET /api/v1/payroll/:id/payslip (Formatted Official Payslip)'
      );
    }

    // 8. Export Bank NEFT Transfer CSV Sheet
    const csvRes = await request(app)
      .get('/api/v1/payroll/export-bank-sheet?month=10&year=2026')
      .set('Authorization', hrHeader);

    assert(
      csvRes.status === 200 &&
      csvRes.headers['content-type']?.includes('text/csv') &&
      csvRes.text.includes('Beneficiary Name'),
      '8. GET /api/v1/payroll/export-bank-sheet (Bank NEFT Payout CSV Export)'
    );

    // 9. Bulk Disburse (Mark Paid)
    const disburseRes = await request(app)
      .post('/api/v1/payroll/bulk-disburse')
      .set('Authorization', hrHeader)
      .send({
        month: 10,
        year: 2026,
        paymentMode: 'neft',
        transactionReference: 'HDFC-TEST-NEFT-998811'
      });

    assert(
      disburseRes.status === 200 && disburseRes.body.success === true,
      '9. POST /api/v1/payroll/bulk-disburse (Corporate Payout Confirmation)'
    );

    // 10. Employee Self-Service: My Payslips
    const myPayslipsRes = await request(app)
      .get('/api/v1/payroll/my-payslips')
      .set('Authorization', hrHeader);

    assert(
      myPayslipsRes.status === 200 && Array.isArray(myPayslipsRes.body.data),
      '10. GET /api/v1/payroll/my-payslips (Employee Self-Service Portal)'
    );

    console.log('\n========================================================');
    console.log(`📊 Payroll Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log('========================================================\n');
  } catch (error) {
    console.error('Test execution error:', error);
  } finally {
    await closeConnection();
  }
}

runPayrollTests();
