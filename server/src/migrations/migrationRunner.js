const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { DataTypes } = require('sequelize');
const { sequelize, sequelize2 } = require('../config/db');
const env = require('../config/env');
const logger = require('../config/logger');

/**
 * Ensure a MySQL database exists before running migrations
 */
const ensureDatabaseExists = async (dbConfig, label = 'Database') => {
  if (process.env.NODE_ENV === 'test' || dbConfig.DIALECT === 'sqlite') {
    return;
  }

  try {
    const connection = await mysql.createConnection({
      host: dbConfig.HOST,
      port: dbConfig.PORT,
      user: dbConfig.USER,
      password: dbConfig.PASSWORD
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.end();
    logger.info(`[${label}] Database \`${dbConfig.NAME}\` checked/created successfully.`);
  } catch (error) {
    logger.error(`[${label}] Failed to ensure database exists:`, error.message);
    throw error;
  }
};

/**
 * Migration Meta Table Handler (handles case sensitivity across platforms)
 */
const ensureMetaTable = async (queryInterface) => {
  const tables = await queryInterface.showAllTables();
  const normalizedTables = tables.map((t) => (typeof t === 'object' ? t.tableName || Object.values(t)[0] : t));
  const existingMeta = normalizedTables.find((t) => t.toLowerCase() === 'sequelizemeta');

  if (!existingMeta) {
    await queryInterface.createTable('SequelizeMeta', {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
      }
    });
    return 'SequelizeMeta';
  }
  return existingMeta;
};

/**
 * Run migrations UP on a specific sequelize instance
 */
const runMigrationsForInstance = async (seqInstance, dbConfig, label) => {
  try {
    logger.info(`>>> Starting migrations UP on [${label}] (${dbConfig.HOST}:${dbConfig.PORT}/${dbConfig.NAME})...`);
    await ensureDatabaseExists(dbConfig, label);
    await seqInstance.authenticate();

    const queryInterface = seqInstance.getQueryInterface();
    const metaTable = await ensureMetaTable(queryInterface);

    // Fetch already executed migrations
    const [executedRows] = await seqInstance.query(`SELECT name FROM \`${metaTable}\` ORDER BY name ASC;`);
    const executedMigrationNames = executedRows.map((r) => r.name);

    // Read all migration files
    const migrationsDir = path.resolve(__dirname);
    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.js') && file !== 'migrationRunner.js')
      .sort();

    const pending = files.filter((f) => !executedMigrationNames.includes(f));

    if (pending.length === 0) {
      logger.info(`[${label}] No pending migrations. Database is up to date.`);
      return;
    }

    logger.info(`[${label}] Found ${pending.length} pending migration(s): ${pending.join(', ')}`);

    for (const file of pending) {
      const migrationPath = path.join(migrationsDir, file);
      const migration = require(migrationPath);
      logger.info(`[${label}] Migrating: ${file}...`);
      await migration.up(queryInterface, seqInstance.constructor);
      await seqInstance.query(`INSERT INTO \`${metaTable}\` (name) VALUES (?);`, {
        replacements: [file]
      });
      logger.success(`[${label}] Migrated:  ${file}`);
    }

    logger.success(`[${label}] All migrations executed successfully!`);
  } catch (error) {
    logger.error(`[${label}] Migration failed:`, error.message);
    throw error;
  }
};

/**
 * Rollback last migration DOWN on a specific sequelize instance
 */
const runMigrationsDownForInstance = async (seqInstance, label) => {
  try {
    await seqInstance.authenticate();
    const queryInterface = seqInstance.getQueryInterface();
    const metaTable = await ensureMetaTable(queryInterface);

    const [executedRows] = await seqInstance.query(`SELECT name FROM \`${metaTable}\` ORDER BY name DESC LIMIT 1;`);
    if (executedRows.length === 0) {
      logger.info(`[${label}] No migrations have been executed yet to revert.`);
      return;
    }

    const lastMigrationName = executedRows[0].name;
    const migrationPath = path.resolve(__dirname, lastMigrationName);

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${lastMigrationName}`);
    }

    logger.info(`[${label}] Reverting migration: ${lastMigrationName}...`);
    const migration = require(migrationPath);
    await migration.down(queryInterface, seqInstance.constructor);
    await seqInstance.query(`DELETE FROM \`${metaTable}\` WHERE name = ?;`, {
      replacements: [lastMigrationName]
    });

    logger.success(`[${label}] Reverted: ${lastMigrationName}`);
  } catch (error) {
    logger.error(`[${label}] Rollback failed:`, error.message);
    throw error;
  }
};

/**
 * Run migrations UP on BOTH databases
 */
const runMigrationsUp = async () => {
  // 1. Primary Database
  await runMigrationsForInstance(sequelize, env.DB, 'Primary DB');

  // 2. Secondary Database (Hostinger)
  if (sequelize2 && env.DB2 && env.DB2.ENABLED) {
    try {
      await runMigrationsForInstance(sequelize2, env.DB2, 'Secondary DB (Hostinger)');
    } catch (err) {
      logger.error('Secondary DB migration error:', err.message);
      logger.warn('Primary DB is migrated. Please check secondary DB connection.');
    }
  }
};

/**
 * Rollback migrations DOWN on BOTH databases
 */
const runMigrationsDown = async () => {
  // 1. Primary Database
  await runMigrationsDownForInstance(sequelize, 'Primary DB');

  // 2. Secondary Database (Hostinger)
  if (sequelize2 && env.DB2 && env.DB2.ENABLED) {
    try {
      await runMigrationsDownForInstance(sequelize2, 'Secondary DB (Hostinger)');
    } catch (err) {
      logger.error('Secondary DB rollback error:', err.message);
    }
  }
};

module.exports = {
  runMigrationsUp,
  runMigrationsDown,
  ensureDatabaseExists
};
