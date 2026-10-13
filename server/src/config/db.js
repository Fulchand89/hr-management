const { Sequelize } = require('sequelize');
const env = require('./env');
const logger = require('./logger');

let sequelize;
let sequelize2 = null;

// ==========================================
// 1. Primary Database Connection
// ==========================================
if (process.env.NODE_ENV === 'test') {
  // Use in-memory SQLite for super-fast, clean unit and integration testing
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
  });
} else {
  // Primary MySQL Connection Pool (Local)
  sequelize = new Sequelize(env.DB.NAME, env.DB.USER, env.DB.PASSWORD, {
    host: env.DB.HOST,
    port: env.DB.PORT,
    dialect: env.DB.DIALECT || 'mysql',
    logging: env.DB.LOGGING ? (msg) => logger.debug(msg) : false,
    pool: {
      max: env.DB.POOL.max,
      min: env.DB.POOL.min,
      acquire: env.DB.POOL.acquire,
      idle: env.DB.POOL.idle
    },
    timezone: '+00:00',
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: false
    }
  });
}

// ==========================================
// 2. Secondary Database Connection (Hostinger Remote / DB2)
// ==========================================
if (process.env.NODE_ENV !== 'test' && env.DB2 && env.DB2.ENABLED && env.DB.HOST !== env.DB2.HOST) {
  try {
    sequelize2 = new Sequelize(env.DB2.NAME, env.DB2.USER, env.DB2.PASSWORD, {
      host: env.DB2.HOST,
      port: env.DB2.PORT,
      dialect: env.DB2.DIALECT || 'mysql',
      logging: env.DB2.LOGGING ? (msg) => logger.debug(`[DB2] ${msg}`) : false,
      pool: {
        max: env.DB2.POOL.max,
        min: env.DB2.POOL.min,
        acquire: env.DB2.POOL.acquire,
        idle: env.DB2.POOL.idle
      },
      timezone: '+00:00',
      define: {
        timestamps: true,
        underscored: false,
        freezeTableName: false
      }
    });
  } catch (err) {
    logger.error('Failed to configure Secondary Database (DB2):', err.message);
  }
}

// ==========================================
// 3. Dual-Database Synchronization Hooks
// ==========================================
const replicateToSecondary = async (targetSeq, tableName, dataValues) => {
  if (!targetSeq || !tableName || !dataValues) return;
  try {
    const cols = Object.keys(dataValues).filter((k) => dataValues[k] !== undefined);
    if (cols.length === 0) return;

    const quotedCols = cols.map((c) => `\`${c}\``).join(', ');
    const placeholders = cols.map(() => '?').join(', ');
    const updateAssignments = cols.map((c) => `\`${c}\` = VALUES(\`${c}\`)`).join(', ');

    const sql = `INSERT INTO \`${tableName}\` (${quotedCols}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateAssignments};`;
    const replacements = cols.map((c) => {
      const val = dataValues[c];
      if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
        return JSON.stringify(val);
      }
      return val;
    });

    await targetSeq.query(sql, {
      replacements,
      type: targetSeq.QueryTypes.INSERT
    });
  } catch (err) {
    logger.warn(`[Dual-Sync] Replication failed on table \`${tableName}\`: ${err.message}`);
  }
};

const setupDualSyncHooks = (primarySeq, secondarySeq) => {
  if (!primarySeq || !secondarySeq) return;

  // Global afterCreate hook
  primarySeq.addHook('afterCreate', async (instance, options) => {
    if (options && options.skipDualSync) return;
    const model = instance.constructor;
    const tableName = model.tableName || (typeof model.getTableName === 'function' ? model.getTableName() : null);
    if (tableName) {
      await replicateToSecondary(secondarySeq, tableName, instance.dataValues);
    }
  });

  // Global afterUpdate hook
  primarySeq.addHook('afterUpdate', async (instance, options) => {
    if (options && options.skipDualSync) return;
    const model = instance.constructor;
    const tableName = model.tableName || (typeof model.getTableName === 'function' ? model.getTableName() : null);
    if (tableName) {
      await replicateToSecondary(secondarySeq, tableName, instance.dataValues);
    }
  });

  // Global afterDestroy hook
  primarySeq.addHook('afterDestroy', async (instance, options) => {
    if (options && options.skipDualSync) return;
    try {
      const model = instance.constructor;
      const tableName = model.tableName || (typeof model.getTableName === 'function' ? model.getTableName() : null);
      const pkField = model.primaryKeyAttribute || 'id';
      const pkVal = instance.dataValues ? instance.dataValues[pkField] : null;

      if (tableName && pkVal) {
        await secondarySeq.query(`DELETE FROM \`${tableName}\` WHERE \`${pkField}\` = ?;`, {
          replacements: [pkVal],
          type: secondarySeq.QueryTypes.DELETE
        });
      }
    } catch (err) {
      logger.warn(`[Dual-Sync] Delete replication failed: ${err.message}`);
    }
  });

  // Global afterBulkCreate hook
  primarySeq.addHook('afterBulkCreate', async (instances, options) => {
    if (options && options.skipDualSync) return;
    if (!instances || instances.length === 0) return;
    for (const instance of instances) {
      const model = instance.constructor;
      const tableName = model.tableName || (typeof model.getTableName === 'function' ? model.getTableName() : null);
      if (tableName && instance.dataValues) {
        await replicateToSecondary(secondarySeq, tableName, instance.dataValues);
      }
    }
  });

  logger.info('[Dual-Sync] Active live replication hooks installed (Primary -> Secondary).');
};

if (sequelize && sequelize2) {
  setupDualSyncHooks(sequelize, sequelize2);
}

/**
 * Test Database Connection for Both Databases
 */
const testConnection = async () => {
  let primaryOk = false;
  let secondaryOk = false;

  // 1. Test Primary Database
  try {
    await sequelize.authenticate();
    logger.success(`Primary DB connected: ${sequelize.getDialect()} @ ${env.DB.HOST}:${env.DB.PORT}/${env.DB.NAME}`);
    primaryOk = true;
  } catch (error) {
    logger.error('Primary Database connection failed:', error.message);
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Please verify primary MySQL service is running and credentials in .env are correct.');
    }
  }

  // 2. Test Secondary Database (if enabled)
  if (sequelize2) {
    try {
      await sequelize2.authenticate();
      logger.success(`Secondary DB connected: ${sequelize2.getDialect()} @ ${env.DB2.HOST}:${env.DB2.PORT}/${env.DB2.NAME}`);
      secondaryOk = true;
    } catch (error) {
      logger.error('Secondary Database connection failed:', error.message);
      logger.warn('Remote database (DB2) could not be reached. Server will continue with Primary DB.');
    }
  }

  return primaryOk || secondaryOk;
};

/**
 * Gracefully close database connection pools
 */
const closeConnection = async () => {
  try {
    if (sequelize) {
      await sequelize.close();
      logger.info('Primary Database connection closed.');
    }
    if (sequelize2) {
      await sequelize2.close();
      logger.info('Secondary Database connection closed.');
    }
  } catch (error) {
    logger.error('Error closing database connections:', error.message);
  }
};

module.exports = {
  sequelize,
  sequelize2,
  testConnection,
  closeConnection,
  replicateToSecondary
};
