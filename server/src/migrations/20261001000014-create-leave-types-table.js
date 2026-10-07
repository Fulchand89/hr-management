'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('leave_types', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      daysPerYear: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 12.0,
        allowNull: false
      },
      isCarryForward: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      isPaid: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true
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

    await queryInterface.addIndex('leave_types', ['name'], {
      unique: true,
      name: 'leave_types_name_unique_idx'
    });
    await queryInterface.addIndex('leave_types', ['code'], {
      unique: true,
      name: 'leave_types_code_unique_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('leave_types');
  }
};
