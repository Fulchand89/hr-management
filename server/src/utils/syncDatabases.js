const { sequelize, sequelize2, closeConnection } = require('../config/db');
const logger = require('../config/logger');

// Order of tables considering Foreign Key dependencies
const SYNC_TABLES = [
  'roles',
  'permissions',
  'role_permissions',
  'branches',
  'departments',
  'designations',
  'users',
  'user_permissions',
  'shifts',
  'holidays',
  'leave_types',
  'leave_balances',
  'leave_requests',
  'attendances',
  'attendance_corrections',
  'salary_structures',
  'payrolls',
  'employee_documents',
  'company_assets',
  'notifications',
  'activity_logs',
  'company_policies',
  'policy_acknowledgments',
  'resignation_requests',
  'exit_clearances',
  'employee_referrals',
  'appraisal_reviews'
];

/**
 * Synchronize all tables from source database to target database
 */
const syncDatabases = async (sourceSeq, targetSeq, sourceName = 'Primary', targetName = 'Secondary') => {
  if (!sourceSeq || !targetSeq) {
    throw new Error('Both database connections must be active to synchronize.');
  }

  logger.info(`=======================================================`);
  logger.info(`Starting Full Database Sync: ${sourceName} -> ${targetName}`);
  logger.info(`=======================================================`);

  // Temporarily disable foreign key checks during batch sync on target
  await targetSeq.query('SET FOREIGN_KEY_CHECKS = 0;');

  let totalRecordsSynced = 0;

  try {
    for (const tableName of SYNC_TABLES) {
      // 1. Fetch all rows from source
      let rows = [];
      try {
        const [sourceRows] = await sourceSeq.query(`SELECT * FROM \`${tableName}\`;`);
        rows = sourceRows;
      } catch (err) {
        // Table might not exist yet, skip
        continue;
      }

      if (!rows || rows.length === 0) {
        continue;
      }

      // 2. Upsert each row into target
      let syncedForTable = 0;
      for (const row of rows) {
        const cols = Object.keys(row).filter((k) => row[k] !== undefined);
        if (cols.length === 0) continue;

        const quotedCols = cols.map((c) => `\`${c}\``).join(', ');
        const placeholders = cols.map(() => '?').join(', ');
        const updateAssignments = cols.map((c) => `\`${c}\` = VALUES(\`${c}\`)`).join(', ');

        const sql = `INSERT INTO \`${tableName}\` (${quotedCols}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateAssignments};`;
        const replacements = cols.map((c) => {
          const val = row[c];
          if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
            return JSON.stringify(val);
          }
          return val;
        });

        await targetSeq.query(sql, { replacements, type: targetSeq.QueryTypes.INSERT });
        syncedForTable++;
      }

      logger.success(`Synced table \`${tableName}\`: ${syncedForTable} record(s)`);
      totalRecordsSynced += syncedForTable;
    }

    logger.success(`=======================================================`);
    logger.success(`Database Synchronization complete! Total records synced: ${totalRecordsSynced}`);
    logger.success(`=======================================================`);
  } catch (error) {
    logger.error('Error during database synchronization:', error.message);
    throw error;
  } finally {
    await targetSeq.query('SET FOREIGN_KEY_CHECKS = 1;');
  }
};

module.exports = {
  syncDatabases,
  SYNC_TABLES
};

if (require.main === module) {
  (async () => {
    try {
      await sequelize.authenticate();
      if (!sequelize2) {
        logger.error('Secondary database (sequelize2) is not configured.');
        process.exit(1);
      }
      await sequelize2.authenticate();

      const fromRemote = process.argv.includes('--from-remote');
      if (fromRemote) {
        await syncDatabases(sequelize2, sequelize, 'Secondary (Hostinger)', 'Primary (Local)');
      } else {
        await syncDatabases(sequelize, sequelize2, 'Primary (Local)', 'Secondary (Hostinger)');
      }
    } catch (err) {
      logger.error('Sync failed:', err.message);
      process.exit(1);
    } finally {
      await closeConnection();
      process.exit(0);
    }
  })();
}
