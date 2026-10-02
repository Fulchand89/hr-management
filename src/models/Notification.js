const { DataTypes, Model } = require('sequelize');

class Notification extends Model {}

const initNotificationModel = (sequelize) => {
  Notification.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      title: {
        type: DataTypes.STRING(150),
        allowNull: false
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM('info', 'warning', 'success', 'error', 'announcement', 'leave', 'attendance', 'payroll'),
        defaultValue: 'info',
        allowNull: false
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      readAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'Notification',
      tableName: 'notifications',
      timestamps: true,
      indexes: [
        { fields: ['userId'] },
        { fields: ['isRead'] },
        { fields: ['type'] }
      ]
    }
  );

  return Notification;
};

module.exports = { Notification, initNotificationModel };
