'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('payrolls');

    const addColumnIfNotExists = async (columnName, definition) => {
      if (!tableInfo[columnName]) {
        await queryInterface.addColumn('payrolls', columnName, definition);
      }
    };

    await addColumnIfNotExists('totalDays', {
      type: Sequelize.INTEGER,
      defaultValue: 30,
      allowNull: false
    });

    await addColumnIfNotExists('paidLeaves', {
      type: Sequelize.DECIMAL(5, 2),
      defaultValue: 0.00,
      allowNull: false
    });

    await addColumnIfNotExists('lopDays', {
      type: Sequelize.DECIMAL(5, 2),
      defaultValue: 0.00,
      allowNull: false
    });

    await addColumnIfNotExists('baseCtc', {
      type: Sequelize.DECIMAL(12, 2),
      defaultValue: 0.00,
      allowNull: false
    });

    await addColumnIfNotExists('monthlyGross', {
      type: Sequelize.DECIMAL(12, 2),
      defaultValue: 0.00,
      allowNull: false
    });

    await addColumnIfNotExists('basicSalary', {
      type: Sequelize.DECIMAL(12, 2),
      defaultValue: 0.00,
      allowNull: false
    });

    await addColumnIfNotExists('hra', {
      type: Sequelize.DECIMAL(12, 2),
      defaultValue: 0.00,
      allowNull: false
    });

    await addColumnIfNotExists('specialAllowance', {
      type: Sequelize.DECIMAL(12, 2),
      defaultValue: 0.00,
      allowNull: false
    });

    await addColumnIfNotExists('bonus', {
      type: Sequelize.DECIMAL(12, 2),
      defaultValue: 0.00,
      allowNull: false
    });

    await addColumnIfNotExists('pfDeduction', {
      type: Sequelize.DECIMAL(12, 2),
      defaultValue: 0.00,
      allowNull: false
    });

    await addColumnIfNotExists('esiDeduction', {
      type: Sequelize.DECIMAL(12, 2),
      defaultValue: 0.00,
      allowNull: false
    });

    await addColumnIfNotExists('taxDeduction', {
      type: Sequelize.DECIMAL(12, 2),
      defaultValue: 0.00,
      allowNull: false
    });

    await addColumnIfNotExists('lopDeduction', {
      type: Sequelize.DECIMAL(12, 2),
      defaultValue: 0.00,
      allowNull: false
    });

    await addColumnIfNotExists('otherDeductions', {
      type: Sequelize.DECIMAL(12, 2),
      defaultValue: 0.00,
      allowNull: false
    });

    await addColumnIfNotExists('paymentMode', {
      type: Sequelize.STRING(50),
      allowNull: true
    });

    await addColumnIfNotExists('remarks', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  async down(queryInterface) {
    const columns = [
      'totalDays',
      'paidLeaves',
      'lopDays',
      'baseCtc',
      'monthlyGross',
      'basicSalary',
      'hra',
      'specialAllowance',
      'bonus',
      'pfDeduction',
      'esiDeduction',
      'taxDeduction',
      'lopDeduction',
      'otherDeductions',
      'paymentMode',
      'remarks'
    ];

    for (const column of columns) {
      await queryInterface.removeColumn('payrolls', column).catch(() => {});
    }
  }
};
