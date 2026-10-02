const { DataTypes, Model } = require('sequelize');

class LeaveBalance extends Model {}

const initLeaveBalanceModel = (sequelize) => {
  LeaveBalance.init(
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
        onDelete: 'CASCADE'
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 2026
      },
      allocated: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0.0,
        allowNull: false
      },
      used: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0.0,
        allowNull: false
      },
      remaining: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0.0,
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'LeaveBalance',
      tableName: 'leave_balances',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['userId', 'leaveTypeId', 'year'],
          name: 'leave_balance_user_type_year_idx'
        }
      ]
    }
  );

  return LeaveBalance;
};

module.exports = { LeaveBalance, initLeaveBalanceModel };
