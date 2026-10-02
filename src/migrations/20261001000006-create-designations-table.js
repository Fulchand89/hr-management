'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('designations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: true,
        unique: true
      },
      department: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true
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

    await queryInterface.addIndex('designations', ['title'], {
      unique: true,
      name: 'designations_title_unique_idx'
    });
    await queryInterface.addIndex('designations', ['department'], {
      name: 'designations_department_idx'
    });
    await queryInterface.addIndex('designations', ['status'], {
      name: 'designations_status_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('designations');
  }
};
