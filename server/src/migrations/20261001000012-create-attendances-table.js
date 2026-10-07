'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('attendances', {
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
      shiftId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'shifts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      clockIn: {
        type: Sequelize.DATE,
        allowNull: true
      },
      clockOut: {
        type: Sequelize.DATE,
        allowNull: true
      },
      totalHours: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0.00,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('present', 'absent', 'half_day', 'late', 'on_leave', 'holiday', 'weekend'),
        defaultValue: 'present',
        allowNull: false
      },
      ipAddress: {
        type: Sequelize.STRING(45),
        allowNull: true
      },
      remarks: {
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

    await queryInterface.addIndex('attendances', ['userId', 'date'], {
      unique: true,
      name: 'attendances_user_date_unique_idx'
    });
    await queryInterface.addIndex('attendances', ['date'], {
      name: 'attendances_date_idx'
    });
    await queryInterface.addIndex('attendances', ['status'], {
      name: 'attendances_status_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('attendances');
  }
};
