'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('leave_balances', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      leaveTypeId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'leave_types',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 2026
      },
      allocated: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0.0,
        allowNull: false
      },
      used: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0.0,
        allowNull: false
      },
      remaining: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0.0,
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

    await queryInterface.addIndex('leave_balances', ['userId', 'leaveTypeId', 'year'], {
      unique: true,
      name: 'leave_balances_user_type_year_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('leave_balances');
  }
};
