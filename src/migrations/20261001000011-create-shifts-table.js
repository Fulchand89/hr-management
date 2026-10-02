'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('shifts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      startTime: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: '09:00'
      },
      endTime: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: '18:00'
      },
      graceMinutes: {
        type: Sequelize.INTEGER,
        defaultValue: 15,
        allowNull: false
      },
      halfDayThresholdHours: {
        type: Sequelize.DECIMAL(4, 2),
        defaultValue: 4.5,
        allowNull: false
      },
      fullDayThresholdHours: {
        type: Sequelize.DECIMAL(4, 2),
        defaultValue: 8.0,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        defaultValue: 'active',
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('shifts', ['status'], {
      name: 'shifts_status_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('shifts');
  }
};
