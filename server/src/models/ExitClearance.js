const { DataTypes, Model } = require('sequelize');

class ExitClearance extends Model {}

const initExitClearanceModel = (sequelize) => {
  ExitClearance.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      resignationId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'resignation_requests',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      department: {
        type: DataTypes.ENUM('it', 'finance', 'hr', 'admin', 'manager'),
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('pending', 'cleared', 'flagged'),
        defaultValue: 'pending',
        allowNull: false
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      clearedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      clearedAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'ExitClearance',
      tableName: 'exit_clearances',
      timestamps: true,
      indexes: [
        { fields: ['resignationId'] },
        { fields: ['resignationId', 'department'], unique: true }
      ]
    }
  );

  return ExitClearance;
};

module.exports = {
  ExitClearance,
  initExitClearanceModel
};
