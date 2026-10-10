'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('employee_documents');

    const addColumnIfNotExists = async (columnName, definition) => {
      if (!tableInfo[columnName]) {
        await queryInterface.addColumn('employee_documents', columnName, definition);
      }
    };

    await addColumnIfNotExists('verifiedBy', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await addColumnIfNotExists('verifiedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await addColumnIfNotExists('remarks', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('employee_documents', 'verifiedBy').catch(() => {});
    await queryInterface.removeColumn('employee_documents', 'verifiedAt').catch(() => {});
    await queryInterface.removeColumn('employee_documents', 'remarks').catch(() => {});
  }
};
