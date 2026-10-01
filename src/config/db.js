const { Sequelize } = require('sequelize');
const env = require('./env');
const logger = require('./logger');

let sequelize;

if (process.env.NODE_ENV === 'test') {
  // Use in-memory SQLite for super-fast, clean unit and integration testing
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
  });
} else {
  // MySQL Production / Development Connection Pool
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

/**
 * Test Database Connection
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.success(`Database connection established successfully (${sequelize.getDialect()} @ ${env.DB.HOST}:${env.DB.PORT}/${env.DB.NAME})`);
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error.message);
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Please verify MySQL service is running and credentials in .env are correct.');
    }
    return false;
  }
};

/**
 * Gracefully close database connection pool
 */
const closeConnection = async () => {
  try {
    await sequelize.close();
    logger.info('Database connection closed.');
  } catch (error) {
    logger.error('Error closing database connection:', error.message);
  }
};

module.exports = {
  sequelize,
  testConnection,
  closeConnection
};
