const { DataTypes, Model } = require('sequelize');

class ResignationRequest extends Model {}

const initResignationRequestModel = (sequelize) => {
  ResignationRequest.init(
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
      resignationDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      requestedLastWorkingDay: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      approvedLastWorkingDay: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      personalEmail: {
        type: DataTypes.STRING(150),
        allowNull: true
      },
      contactPhone: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('pending', 'under_review', 'approved', 'rejected', 'withdrawn', 'completed'),
        defaultValue: 'pending',
        allowNull: false
      },
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      reviewedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      reviewedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      settlementAmount: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.00,
        allowNull: false
      },
      settlementRemarks: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'ResignationRequest',
      tableName: 'resignation_requests',
      timestamps: true,
      indexes: [
        { fields: ['userId'] },
        { fields: ['status'] }
      ]
    }
  );

  return ResignationRequest;
};

module.exports = {
  ResignationRequest,
  initResignationRequestModel
};
