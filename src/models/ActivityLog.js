const { DataTypes, Model } = require('sequelize');

class ActivityLog extends Model {}

const initActivityLogModel = (sequelize) => {
  ActivityLog.init(
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
        onDelete: 'SET NULL'
      },
      action: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      module: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      targetId: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true
      },
      details: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'ActivityLog',
      tableName: 'activity_logs',
      timestamps: true,
      indexes: [
        { fields: ['userId'] },
        { fields: ['action'] },
        { fields: ['module'] }
      ]
    }
  );

  return ActivityLog;
};

module.exports = { ActivityLog, initActivityLogModel };
