'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('attendance_corrections', {
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
      attendanceId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'attendances',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      punchType: {
        type: Sequelize.ENUM('Check In Time', 'Check Out Time', 'Break Time'),
        allowNull: false
      },
      originalTime: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      requestedTime: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
        allowNull: false
      },
      actionedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      actionReason: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      actionedAt: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex('attendance_corrections', ['userId'], {
      name: 'attendance_corrections_user_id_idx'
    });
    await queryInterface.addIndex('attendance_corrections', ['status'], {
      name: 'attendance_corrections_status_idx'
    });
    await queryInterface.addIndex('attendance_corrections', ['date'], {
      name: 'attendance_corrections_date_idx'
    });
    await queryInterface.addIndex('attendance_corrections', ['attendanceId'], {
      name: 'attendance_corrections_attendance_id_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('attendance_corrections');
  }
};
