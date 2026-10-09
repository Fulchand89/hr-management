const { sequelize } = require('../src/config/db');
const { v4: uuidv4 } = require('uuid');

async function syncPolicies() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // 1. Ensure CREATE OR REPLACE VIEW policies AS SELECT * FROM company_policies
    await sequelize.query('CREATE OR REPLACE VIEW policies AS SELECT * FROM company_policies;');
    console.log('✓ VIEW `policies` pointing to `company_policies` created.');

    const [viewCount] = await sequelize.query('SELECT COUNT(*) as count FROM policies;');
    console.log(`✓ Table/View \`policies\` row count: ${viewCount[0].count}`);

    const [tableCount] = await sequelize.query('SELECT COUNT(*) as count FROM company_policies;');
    console.log(`✓ Table \`company_policies\` row count: ${tableCount[0].count}`);

    // 2. Populate sample employee policy acknowledgments if empty
    const [existingAck] = await sequelize.query('SELECT COUNT(*) as count FROM policy_acknowledgments;');
    if (existingAck[0].count === 0) {
      const [policies] = await sequelize.query("SELECT id FROM company_policies WHERE isMandatory = 1 LIMIT 5;");
      const [employees] = await sequelize.query("SELECT id FROM users WHERE role IN ('employee', 'hr') LIMIT 3;");

      for (const emp of employees) {
        for (const p of policies) {
          await sequelize.query(
            `INSERT INTO policy_acknowledgments (id, policyId, userId, versionAcknowledged, acknowledgedAt, ipAddress, userAgent, createdAt, updatedAt) 
             VALUES (?, ?, ?, '1.0', NOW(), '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', NOW(), NOW())`,
            {
              replacements: [uuidv4(), p.id, emp.id]
            }
          );
        }
      }
      console.log('✓ Sample policy acknowledgments inserted.');
    }

    const [finalAck] = await sequelize.query('SELECT COUNT(*) as count FROM policy_acknowledgments;');
    console.log(`✓ Table \`policy_acknowledgments\` row count: ${finalAck[0].count}`);

  } catch (error) {
    console.error('Error syncing policies:', error);
  } finally {
    await sequelize.close();
  }
}

syncPolicies();
