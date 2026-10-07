const { DataTypes, Model } = require('sequelize');

class Branch extends Model {}

const initBranchModel = (sequelize) => {
  Branch.init(
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
        allowNull: true,
        unique: true
      },
      city: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      state: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      country: {
        type: DataTypes.STRING(100),
        defaultValue: 'India',
        allowNull: false
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active',
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'Branch',
      tableName: 'branches',
      timestamps: true,
      indexes: [
        { unique: true, fields: ['name'] },
        { fields: ['city'] },
        { fields: ['status'] }
      ]
    }
  );

  return Branch;
};

module.exports = { Branch, initBranchModel };
