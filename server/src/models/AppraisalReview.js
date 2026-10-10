const { DataTypes, Model } = require('sequelize');

class AppraisalReview extends Model {}

const initAppraisalReviewModel = (sequelize) => {
  AppraisalReview.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      reviewerId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      cycleName: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      reviewPeriodStart: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      reviewPeriodEnd: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      technicalScore: {
        type: DataTypes.DECIMAL(3, 1),
        defaultValue: 0.0,
        allowNull: false
      },
      productivityScore: {
        type: DataTypes.DECIMAL(3, 1),
        defaultValue: 0.0,
        allowNull: false
      },
      teamworkScore: {
        type: DataTypes.DECIMAL(3, 1),
        defaultValue: 0.0,
        allowNull: false
      },
      leadershipScore: {
        type: DataTypes.DECIMAL(3, 1),
        defaultValue: 0.0,
        allowNull: false
      },
      overallScore: {
        type: DataTypes.DECIMAL(3, 1),
        defaultValue: 0.0,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('draft', 'submitted', 'completed'),
        defaultValue: 'completed',
        allowNull: false
      },
      previousSalary: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.00,
        allowNull: false
      },
      newSalary: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.00,
        allowNull: false
      },
      hikePercentage: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0.00,
        allowNull: false
      },
      promotionDesignationId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'designations',
          key: 'id'
        }
      },
      feedbackStrengths: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      feedbackImprovements: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      comments: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      effectiveDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'AppraisalReview',
      tableName: 'appraisal_reviews',
      timestamps: true,
      indexes: [
        { fields: ['userId'] },
        { fields: ['reviewerId'] },
        { fields: ['status'] }
      ]
    }
  );

  return AppraisalReview;
};

module.exports = {
  AppraisalReview,
  initAppraisalReviewModel
};
