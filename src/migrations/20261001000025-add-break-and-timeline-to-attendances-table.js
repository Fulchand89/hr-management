'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add breakStartTime
    await queryInterface.addColumn('attendances', 'breakStartTime', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // 2. Add totalBreakMinutes
    await queryInterface.addColumn('attendances', 'totalBreakMinutes', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    });

    // 3. Add timeline
    await queryInterface.addColumn('attendances', 'timeline', {
      type: Sequelize.JSON,
      allowNull: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('attendances', 'timeline');
    await queryInterface.removeColumn('attendances', 'totalBreakMinutes');
    await queryInterface.removeColumn('attendances', 'breakStartTime');
  }
};
