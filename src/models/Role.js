const { DataTypes, Model } = require('sequelize');

class Role extends Model {}

const initRoleModel = (sequelize) => {
  Role.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: {
          msg: 'Role name must be unique'
        },
        validate: {
          notEmpty: { msg: 'Role name cannot be empty' },
          len: { args: [2, 50], msg: 'Role name must be between 2 and 50 characters' }
        }
      },
      displayName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Role display name cannot be empty' }
        }
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      isSystem: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'Role',
      tableName: 'roles',
      timestamps: true,
      indexes: [
        { unique: true, fields: ['name'] }
      ]
    }
  );

  return Role;
};

module.exports = {
  Role,
  initRoleModel
};
