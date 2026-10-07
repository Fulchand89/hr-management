const { DataTypes, Model } = require('sequelize');

class LeaveRequest extends Model {}

const initLeaveRequestModel = (sequelize) => {
  LeaveRequest.init(
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
      leaveTypeId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'leave_types',
          key: 'id'
        },
        onDelete: 'RESTRICT'
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      totalDays: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: false
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
        defaultValue: 'pending',
        allowNull: false
      },
      actionedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      actionReason: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      actionedAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'LeaveRequest',
      tableName: 'leave_requests',
      timestamps: true,
      indexes: [
        { fields: ['userId'] },
        { fields: ['status'] },
        { fields: ['startDate', 'endDate'] }
      ]
    }
  );

  return LeaveRequest;
};

module.exports = { LeaveRequest, initLeaveRequestModel };
