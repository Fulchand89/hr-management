const { DataTypes, Model } = require('sequelize');

class Permission extends Model {}

const initPermissionModel = (sequelize) => {
  Permission.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: {
          msg: 'Permission name must be unique'
        },
        validate: {
          notEmpty: { msg: 'Permission name cannot be empty' },
          len: { args: [2, 100], msg: 'Permission name must be between 2 and 100 characters' }
        }
      },
      displayName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Permission display name cannot be empty' }
        }
      },
      module: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Permission module cannot be empty' }
        }
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'Permission',
      tableName: 'permissions',
      timestamps: true,
      indexes: [
        { unique: true, fields: ['name'] },
        { fields: ['module'] }
      ]
    }
  );

  return Permission;
};

module.exports = {
  Permission,
  initPermissionModel
};
