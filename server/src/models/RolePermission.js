const { DataTypes, Model } = require('sequelize');

class RolePermission extends Model {}

const initRolePermissionModel = (sequelize) => {
  RolePermission.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      roleId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'roles',
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
      }
    },
    {
      sequelize,
      modelName: 'RolePermission',
      tableName: 'role_permissions',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['roleId', 'permissionId'],
          name: 'role_permission_unique_idx'
        }
      ]
    }
  );

  return RolePermission;
};

module.exports = {
  RolePermission,
  initRolePermissionModel
};
