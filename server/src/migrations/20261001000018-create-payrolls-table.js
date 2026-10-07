'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payrolls', {
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
      month: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      workingDays: {
        type: Sequelize.INTEGER,
        defaultValue: 30,
        allowNull: false
      },
      presentDays: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 30.0,
        allowNull: false
      },
      grossSalary: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      totalDeductions: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0.00,
        allowNull: false
      },
      netSalary: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      paymentStatus: {
        type: Sequelize.ENUM('pending', 'processed', 'paid', 'failed'),
        defaultValue: 'pending',
        allowNull: false
      },
      paidAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      transactionReference: {
        type: Sequelize.STRING(100),
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

    await queryInterface.addIndex('payrolls', ['userId', 'month', 'year'], {
      unique: true,
      name: 'payrolls_user_month_year_unique_idx'
    });
    await queryInterface.addIndex('payrolls', ['month', 'year'], {
      name: 'payrolls_month_year_idx'
    });
    await queryInterface.addIndex('payrolls', ['paymentStatus'], {
      name: 'payrolls_payment_status_idx'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('payrolls');
  }
};
