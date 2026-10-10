'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('employee_referrals', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      referrerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      candidateName: {
        type: Sequelize.STRING(120),
        allowNull: false
      },
      candidateEmail: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      candidatePhone: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      position: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      department: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      experienceYears: {
        type: Sequelize.DECIMAL(4, 1),
        defaultValue: 0.0,
        allowNull: false
      },
      resumeUrl: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('submitted', 'screening', 'interviewing', 'offered', 'hired', 'rejected'),
        defaultValue: 'submitted',
        allowNull: false
      },
      bonusAmount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00,
        allowNull: false
      },
      payoutStatus: {
        type: Sequelize.ENUM('unearned', 'pending_probation', 'eligible', 'paid'),
        defaultValue: 'unearned',
        allowNull: false
      },
      joiningDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      probationCompletionDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      paidAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      reviewedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      notes: {
        type: Sequelize.TEXT,
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

    await queryInterface.addIndex('employee_referrals', ['referrerId']);
    await queryInterface.addIndex('employee_referrals', ['status']);
    await queryInterface.addIndex('employee_referrals', ['payoutStatus']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('employee_referrals');
  }
};
