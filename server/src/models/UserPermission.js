const { DataTypes, Model } = require('sequelize');

class UserPermission extends Model {}

const initUserPermissionModel = (sequelize) => {
  UserPermission.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      permissionId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'permissions',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      granted: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'UserPermission',
      tableName: 'user_permissions',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['userId', 'permissionId'],
          name: 'user_permission_unique_idx'
        }
      ]
    }
  );

  return UserPermission;
};

module.exports = {
  UserPermission,
  initUserPermissionModel
};
