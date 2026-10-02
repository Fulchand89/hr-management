const { DataTypes, Model } = require('sequelize');

class Holiday extends Model {}

const initHolidayModel = (sequelize) => {
  Holiday.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        unique: true
      },
      type: {
        type: DataTypes.ENUM('national', 'gazetted', 'restricted', 'company'),
        defaultValue: 'company',
        allowNull: false
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'Holiday',
      tableName: 'holidays',
      timestamps: true,
      indexes: [
        { unique: true, fields: ['date'] }
      ]
    }
  );

  return Holiday;
};

module.exports = { Holiday, initHolidayModel };
