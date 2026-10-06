'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('users');

    if (!tableInfo.address) {
      await queryInterface.addColumn('users', 'address', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
    }

    if (!tableInfo.emergencyContactName) {
      await queryInterface.addColumn('users', 'emergencyContactName', {
        type: Sequelize.STRING(100),
        allowNull: true
      });
    }

    if (!tableInfo.emergencyContactPhone) {
      await queryInterface.addColumn('users', 'emergencyContactPhone', {
        type: Sequelize.STRING(25),
        allowNull: true
      });
    }

    if (!tableInfo.emergencyContactRelation) {
      await queryInterface.addColumn('users', 'emergencyContactRelation', {
        type: Sequelize.STRING(50),
        allowNull: true
      });
    }

    if (!tableInfo.bankAccountNumber) {
      await queryInterface.addColumn('users', 'bankAccountNumber', {
        type: Sequelize.STRING(50),
        allowNull: true
      });
    }

    if (!tableInfo.bankName) {
      await queryInterface.addColumn('users', 'bankName', {
        type: Sequelize.STRING(100),
        allowNull: true
      });
    }

    if (!tableInfo.bankIfsc) {
      await queryInterface.addColumn('users', 'bankIfsc', {
        type: Sequelize.STRING(20),
        allowNull: true
      });
    }
  },

  async down(queryInterface) {
    const tableInfo = await queryInterface.describeTable('users');
    if (tableInfo.bankIfsc) await queryInterface.removeColumn('users', 'bankIfsc');
    if (tableInfo.bankName) await queryInterface.removeColumn('users', 'bankName');
    if (tableInfo.bankAccountNumber) await queryInterface.removeColumn('users', 'bankAccountNumber');
    if (tableInfo.emergencyContactRelation) await queryInterface.removeColumn('users', 'emergencyContactRelation');
    if (tableInfo.emergencyContactPhone) await queryInterface.removeColumn('users', 'emergencyContactPhone');
    if (tableInfo.emergencyContactName) await queryInterface.removeColumn('users', 'emergencyContactName');
    if (tableInfo.address) await queryInterface.removeColumn('users', 'address');
  }
};
