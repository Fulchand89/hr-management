const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const env = require('../config/env');
const logger = require('../config/logger');

/**
 * Ensure the MySQL database exists before running migrations
 */
const ensureDatabaseExists = async () => {
  if (process.env.NODE_ENV === 'test' || env.DB.DIALECT === 'sqlite') {
    return;
  }

  try {
    const connection = await mysql.createConnection({
      host: env.DB.HOST,
      port: env.DB.PORT,
      user: env.DB.USER,
      password: env.DB.PASSWORD
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${env.DB.NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.end();
    logger.info(`Database \`${env.DB.NAME}\` checked/created successfully.`);
  } catch (error) {
    logger.error('Failed to ensure database exists:', error.message);
    throw error;
  }
};

/**
 * Migration Meta Table Handler
 */
const ensureMetaTable = async (queryInterface) => {
  const tables = await queryInterface.showAllTables();
  const normalizedTables = tables.map((t) => (typeof t === 'object' ? t.tableName || Object.values(t)[0] : t));

  if (!normalizedTables.includes('SequelizeMeta')) {
    await queryInterface.createTable('SequelizeMeta', {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
      }
    });
  }
};

/**
 * Run migrations UP
 */
const runMigrationsUp = async () => {
  try {
    await ensureDatabaseExists();
    await sequelize.authenticate();

    const queryInterface = sequelize.getQueryInterface();
    await ensureMetaTable(queryInterface);

    // Fetch already executed migrations
    const [executedRows] = await sequelize.query('SELECT name FROM SequelizeMeta ORDER BY name ASC;');
    const executedMigrationNames = executedRows.map((r) => r.name);

    // Read all migration files
    const migrationsDir = path.resolve(__dirname);
    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.js') && file !== 'migrationRunner.js')
      .sort();

    const pending = files.filter((f) => !executedMigrationNames.includes(f));

    if (pending.length === 0) {
      logger.info('No pending migrations. Database is up to date.');
      return;
    }

    logger.info(`Found ${pending.length} pending migration(s): ${pending.join(', ')}`);

    for (const file of pending) {
      const migrationPath = path.join(migrationsDir, file);
      const migration = require(migrationPath);
      logger.info(`Migrating: ${file}...`);
      await migration.up(queryInterface, sequelize.constructor);
      await sequelize.query('INSERT INTO SequelizeMeta (name) VALUES (?);', {
        replacements: [file]
      });
      logger.success(`Migrated:  ${file}`);
    }

    logger.success('All migrations executed successfully!');
  } catch (error) {
    logger.error('Migration failed:', error.message);
    throw error;
  }
};

/**
 * Rollback last migration DOWN
 */
const runMigrationsDown = async () => {
  try {
    await sequelize.authenticate();
    const queryInterface = sequelize.getQueryInterface();
    await ensureMetaTable(queryInterface);

    const [executedRows] = await sequelize.query('SELECT name FROM SequelizeMeta ORDER BY name DESC LIMIT 1;');
    if (executedRows.length === 0) {
      logger.info('No migrations have been executed yet to revert.');
      return;
    }

    const lastMigrationName = executedRows[0].name;
    const migrationPath = path.resolve(__dirname, lastMigrationName);

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${lastMigrationName}`);
    }

    logger.info(`Reverting migration: ${lastMigrationName}...`);
    const migration = require(migrationPath);
    await migration.down(queryInterface, sequelize.constructor);
    await sequelize.query('DELETE FROM SequelizeMeta WHERE name = ?;', {
      replacements: [lastMigrationName]
    });

    logger.success(`Reverted: ${lastMigrationName}`);
  } catch (error) {
    logger.error('Rollback failed:', error.message);
    throw error;
  }
};

module.exports = {
  runMigrationsUp,
  runMigrationsDown,
  ensureDatabaseExists
};
