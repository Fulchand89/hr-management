'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Working Hours & Under-Time Metrics
    await queryInterface.addColumn('payrolls', 'expectedWorkingHours', {
      type: Sequelize.DECIMAL(6, 2),
      defaultValue: 208.00,
      allowNull: false
    });

    await queryInterface.addColumn('payrolls', 'actualLoggedHours', {
      type: Sequelize.DECIMAL(6, 2),
      defaultValue: 0.00,
      allowNull: false
    });

    await queryInterface.addColumn('payrolls', 'underTimeHours', {
      type: Sequelize.DECIMAL(5, 2),
      defaultValue: 0.00,
      allowNull: false
    });

    await queryInterface.addColumn('payrolls', 'underTimeDeduction', {
      type: Sequelize.DECIMAL(12, 2),
      defaultValue: 0.00,
      allowNull: false
    });

    // 2. Overtime & Extra Hours Metrics
    await queryInterface.addColumn('payrolls', 'overtimeHours', {
      type: Sequelize.DECIMAL(5, 2),
      defaultValue: 0.00,
      allowNull: false
    });

    await queryInterface.addColumn('payrolls', 'overtimePay', {
      type: Sequelize.DECIMAL(12, 2),
      defaultValue: 0.00,
      allowNull: false
    });

    await queryInterface.addColumn('payrolls', 'overtimeRateMultiplier', {
      type: Sequelize.DECIMAL(3, 2),
      defaultValue: 1.00,
      allowNull: false
    });

    // 3. HR Manual Override Audit Fields
    await queryInterface.addColumn('payrolls', 'isManuallyAdjusted', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });

    await queryInterface.addColumn('payrolls', 'waiveUnderTime', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });

    await queryInterface.addColumn('payrolls', 'waiveLatePenalty', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });

    await queryInterface.addColumn('payrolls', 'adjustedByUserId', {
      type: Sequelize.UUID,
      allowNull: true
    });

    await queryInterface.addColumn('payrolls', 'adjustmentAuditTrail', {
      type: Sequelize.JSON,
      allowNull: true
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('payrolls', 'expectedWorkingHours');
    await queryInterface.removeColumn('payrolls', 'actualLoggedHours');
    await queryInterface.removeColumn('payrolls', 'underTimeHours');
    await queryInterface.removeColumn('payrolls', 'underTimeDeduction');
    await queryInterface.removeColumn('payrolls', 'overtimeHours');
    await queryInterface.removeColumn('payrolls', 'overtimePay');
    await queryInterface.removeColumn('payrolls', 'overtimeRateMultiplier');
    await queryInterface.removeColumn('payrolls', 'isManuallyAdjusted');
    await queryInterface.removeColumn('payrolls', 'waiveUnderTime');
    await queryInterface.removeColumn('payrolls', 'waiveLatePenalty');
    await queryInterface.removeColumn('payrolls', 'adjustedByUserId');
    await queryInterface.removeColumn('payrolls', 'adjustmentAuditTrail');
  }
};
