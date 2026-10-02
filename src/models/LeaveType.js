const { DataTypes, Model } = require('sequelize');

class LeaveType extends Model {}

const initLeaveTypeModel = (sequelize) => {
  LeaveType.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
      },
      code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      daysPerYear: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 12.0,
        allowNull: false
      },
      isCarryForward: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      isPaid: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'LeaveType',
      tableName: 'leave_types',
      timestamps: true,
      indexes: [
        { unique: true, fields: ['name'] },
        { unique: true, fields: ['code'] }
      ]
    }
  );

  return LeaveType;
};

module.exports = { LeaveType, initLeaveTypeModel };
