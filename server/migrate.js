const { runMigrationsUp, runMigrationsDown } = require('./src/migrations/migrationRunner');
const { closeConnection } = require('./src/config/db');
const logger = require('./src/config/logger');

const command = process.argv[2] || 'up';

(async () => {
  try {
    if (command === 'down' || command === 'undo') {
      logger.info('Rolling back last migration...');
      await runMigrationsDown();
    } else {
      logger.info('Running database migrations...');
      await runMigrationsUp();
    }
  } catch (error) {
    logger.error('Migration process error:', error.message);
    process.exit(1);
  } finally {
    await closeConnection();
    process.exit(0);
  }
})();
