'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('appraisal_reviews', {
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
      reviewerId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      cycleName: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      reviewPeriodStart: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      reviewPeriodEnd: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      technicalScore: {
        type: Sequelize.DECIMAL(3, 1),
        defaultValue: 0.0,
        allowNull: false
      },
      productivityScore: {
        type: Sequelize.DECIMAL(3, 1),
        defaultValue: 0.0,
        allowNull: false
      },
      teamworkScore: {
        type: Sequelize.DECIMAL(3, 1),
        defaultValue: 0.0,
        allowNull: false
      },
      leadershipScore: {
        type: Sequelize.DECIMAL(3, 1),
        defaultValue: 0.0,
        allowNull: false
      },
      overallScore: {
        type: Sequelize.DECIMAL(3, 1),
        defaultValue: 0.0,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('draft', 'submitted', 'completed'),
        defaultValue: 'completed',
        allowNull: false
      },
      previousSalary: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0.00,
        allowNull: false
      },
      newSalary: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0.00,
        allowNull: false
      },
      hikePercentage: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0.00,
        allowNull: false
      },
      promotionDesignationId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'designations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      feedbackStrengths: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      feedbackImprovements: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      comments: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      effectiveDate: {
        type: Sequelize.DATEONLY,
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

    await queryInterface.addIndex('appraisal_reviews', ['userId']);
    await queryInterface.addIndex('appraisal_reviews', ['reviewerId']);
    await queryInterface.addIndex('appraisal_reviews', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('appraisal_reviews');
  }
};
