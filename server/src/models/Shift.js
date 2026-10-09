const { DataTypes, Model } = require('sequelize');

class Shift extends Model {}

const initShiftModel = (sequelize) => {
  Shift.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      startTime: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: '10:00'
      },
      endTime: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: '19:00'
      },
      graceMinutes: {
        type: DataTypes.INTEGER,
        defaultValue: 15,
        allowNull: false
      },
      breakAllowedMinutes: {
        type: DataTypes.INTEGER,
        defaultValue: 60,
        allowNull: false
      },
      halfDayThresholdHours: {
        type: DataTypes.DECIMAL(4, 2),
        defaultValue: 4.5,
        allowNull: false
      },
      fullDayThresholdHours: {
        type: DataTypes.DECIMAL(4, 2),
        defaultValue: 8.0,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active',
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'Shift',
      tableName: 'shifts',
      timestamps: true,
      indexes: [
        { fields: ['status'] }
      ]
    }
  );

  return Shift;
};

module.exports = { Shift, initShiftModel };
