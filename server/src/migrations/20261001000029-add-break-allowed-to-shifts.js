'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Add breakAllowedMinutes column to shifts
    const tableInfo = await queryInterface.describeTable('shifts');
    if (!tableInfo.breakAllowedMinutes) {
      await queryInterface.addColumn('shifts', 'breakAllowedMinutes', {
        type: Sequelize.INTEGER,
        defaultValue: 60,
        allowNull: false
      });
    }

    // 2. Update existing General Shift timing to 10:00 - 19:00
    await queryInterface.sequelize.query(`
      UPDATE shifts 
      SET startTime = '10:00',
          endTime = '19:00',
          graceMinutes = 15,
          breakAllowedMinutes = 60,
          halfDayThresholdHours = 4.5,
          fullDayThresholdHours = 8.0
      WHERE name = 'General Shift';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('shifts');
    if (tableInfo.breakAllowedMinutes) {
      await queryInterface.removeColumn('shifts', 'breakAllowedMinutes');
    }
  }
};
