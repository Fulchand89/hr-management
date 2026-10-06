const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { ROLES } = require('../constants/roles');
const { USER_STATUS } = require('../constants/status');

class User extends Model {
  /**
   * Compare candidate password with stored hash
   */
  async validatePassword(candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
  }

  /**
   * Generate JWT Access Token
   */
  generateAccessToken() {
    return jwt.sign(
      {
        id: this.id,
        email: this.email,
        role: this.role,
        roleId: this.roleId,
        department: this.department
      },
      env.JWT.SECRET,
      { expiresIn: env.JWT.EXPIRES_IN }
    );
  }

  /**
   * Generate JWT Refresh Token
   */
  generateRefreshToken() {
    return jwt.sign(
      { id: this.id },
      env.JWT.REFRESH_SECRET,
      { expiresIn: env.JWT.REFRESH_EXPIRES_IN }
    );
  }

  /**
   * Fetch all effective permissions for this user (Role Permissions + Direct User Permissions)
   */
  async getEffectivePermissions() {
    const permissionsSet = new Set();

    // 1. Role-based permissions
    if (this.roleId) {
      const Role = this.sequelize.models.Role;
      const Permission = this.sequelize.models.Permission;
      const roleWithPerms = await Role.findByPk(this.roleId, {
        include: [
          {
            model: Permission,
            as: 'permissions',
            attributes: ['name']
          }
        ]
      });

      if (roleWithPerms && roleWithPerms.permissions) {
        roleWithPerms.permissions.forEach((p) => permissionsSet.add(p.name));
      }
    }

    // 2. Direct user permissions
    const UserPermission = this.sequelize.models.UserPermission;
    const Permission = this.sequelize.models.Permission;
    if (UserPermission && Permission) {
      const directPerms = await UserPermission.findAll({
        where: { userId: this.id },
        include: [{ model: Permission, attributes: ['name'] }]
      });

      directPerms.forEach((up) => {
        if (up.Permission) {
          if (up.granted) {
            permissionsSet.add(up.Permission.name);
          } else {
            // Explicit deny
            permissionsSet.delete(up.Permission.name);
          }
        }
      });
    }

    return Array.from(permissionsSet);
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(permissionName) {
    // Admin role has all permissions
    if (this.role === ROLES.ADMIN) {
      return true;
    }

    const effective = await this.getEffectivePermissions();
    return effective.includes(permissionName) || effective.includes('*');
  }

  /**
   * Check if user has any of the listed permissions
   */
  async hasAnyPermission(permissionNames = []) {
    if (this.role === ROLES.ADMIN) {
      return true;
    }

    const effective = await this.getEffectivePermissions();
    return permissionNames.some((p) => effective.includes(p) || effective.includes('*'));
  }

  /**
   * Return safe representation omitting sensitive credentials
   */
  toSafeJSON() {
    const raw = this.toJSON();
    delete raw.password;
    delete raw.refreshToken;
    delete raw.resetPasswordToken;
    delete raw.resetPasswordExpires;
    return raw;
  }
}

const initUserModel = (sequelize) => {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      firstName: {
        type: DataTypes.STRING(60),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'First name cannot be empty' },
          len: { args: [2, 60], msg: 'First name must be between 2 and 60 characters' }
        }
      },
      lastName: {
        type: DataTypes.STRING(60),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Last name cannot be empty' },
          len: { args: [2, 60], msg: 'Last name must be between 2 and 60 characters' }
        }
      },
      email: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: {
          msg: 'Email address already registered'
        },
        validate: {
          isEmail: { msg: 'Must be a valid email address' }
        }
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      role: {
        type: DataTypes.STRING(50),
        defaultValue: ROLES.EMPLOYEE,
        allowNull: false
      },
      roleId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'roles',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      employeeCode: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true
      },
      department: {
        type: DataTypes.STRING(100),
        defaultValue: 'General',
        allowNull: false
      },
      departmentId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'departments',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      branchId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'branches',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      managerId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      designation: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      designationId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'designations',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      joiningDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      salary: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true
      },
      dob: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      gender: {
        type: DataTypes.ENUM('male', 'female', 'other'),
        allowNull: true
      },
      phone: {
        type: DataTypes.STRING(25),
        allowNull: true
      },
      address: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      emergencyContactName: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      emergencyContactPhone: {
        type: DataTypes.STRING(25),
        allowNull: true
      },
      emergencyContactRelation: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      bankAccountNumber: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      bankName: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      bankIfsc: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      avatar: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM(Object.values(USER_STATUS)),
        defaultValue: USER_STATUS.ACTIVE,
        allowNull: false
      },
      refreshToken: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      resetPasswordToken: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      resetPasswordExpires: {
        type: DataTypes.DATE,
        allowNull: true
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
      indexes: [
        { unique: true, fields: ['email'] },
        { unique: true, fields: ['employeeCode'] },
        { fields: ['role'] },
        { fields: ['roleId'] },
        { fields: ['departmentId'] },
        { fields: ['branchId'] },
        { fields: ['managerId'] },
        { fields: ['designationId'] },
        { fields: ['status'] }
      ],
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        }
      }
    }
  );

  return User;
};

module.exports = {
  User,
  initUserModel
};
