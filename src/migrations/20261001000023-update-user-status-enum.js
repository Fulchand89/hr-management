'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === 'mysql') {
      await queryInterface.sequelize.query(`
        ALTER TABLE \`users\` 
        MODIFY COLUMN \`status\` ENUM('active', 'inactive', 'probation', 'notice_period', 'suspended', 'terminated', 'resigned') 
        NOT NULL DEFAULT 'active';
      `);
    } else {
      await queryInterface.changeColumn('users', 'status', {
        type: Sequelize.ENUM('active', 'inactive', 'probation', 'notice_period', 'suspended', 'terminated', 'resigned'),
        defaultValue: 'active',
        allowNull: false
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === 'mysql') {
      await queryInterface.sequelize.query(`
        ALTER TABLE \`users\` 
        MODIFY COLUMN \`status\` ENUM('active', 'inactive', 'suspended') 
        NOT NULL DEFAULT 'active';
      `);
    } else {
      await queryInterface.changeColumn('users', 'status', {
        type: Sequelize.ENUM('active', 'inactive', 'suspended'),
        defaultValue: 'active',
        allowNull: false
      });
    }
  }
};
