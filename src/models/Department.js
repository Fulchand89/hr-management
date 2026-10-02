const { DataTypes, Model } = require('sequelize');

class Department extends Model {}

const initDepartmentModel = (sequelize) => {
  Department.init(
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
      headId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      description: {
        type: DataTypes.STRING(255),
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
      modelName: 'Department',
      tableName: 'departments',
      timestamps: true,
      indexes: [
        { unique: true, fields: ['name'] },
        { fields: ['headId'] },
        { fields: ['status'] }
      ]
    }
  );

  return Department;
};

module.exports = { Department, initDepartmentModel };
