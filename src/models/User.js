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
        type: DataTypes.ENUM(Object.values(ROLES)),
        defaultValue: ROLES.EMPLOYEE,
        allowNull: false
      },
      department: {
        type: DataTypes.STRING(100),
        defaultValue: 'General',
        allowNull: false
      },
      designation: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      phone: {
        type: DataTypes.STRING(25),
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
        { fields: ['role'] },
        { fields: ['department'] },
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
