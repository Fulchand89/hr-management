const { sequelize } = require('../src/models');

beforeAll(async () => {
  // Sync in-memory SQLite schema before test suite runs
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  // Close database connection
  await sequelize.close();
});
