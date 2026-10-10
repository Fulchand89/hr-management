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

    await addColumnIfNotExists('lateCount', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false
    });

    await addColumnIfNotExists('lateLopDays', {
      type: Sequelize.DECIMAL(5, 2),
      defaultValue: 0.00,
      allowNull: false
    });

    await addColumnIfNotExists('sandwichLopDays', {
      type: Sequelize.DECIMAL(5, 2),
      defaultValue: 0.00,
      allowNull: false
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('payrolls', 'lateCount').catch(() => {});
    await queryInterface.removeColumn('payrolls', 'lateLopDays').catch(() => {});
    await queryInterface.removeColumn('payrolls', 'sandwichLopDays').catch(() => {});
  }
};
