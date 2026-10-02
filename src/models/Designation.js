const { DataTypes, Model } = require('sequelize');

class Designation extends Model {}

const initDesignationModel = (sequelize) => {
  Designation.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: {
          msg: 'Designation title must be unique'
        },
        validate: {
          notEmpty: { msg: 'Designation title cannot be empty' },
          len: { args: [2, 100], msg: 'Designation title must be between 2 and 100 characters' }
        }
      },
      code: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true
      },
      department: {
        type: DataTypes.STRING(100),
        allowNull: true
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
      modelName: 'Designation',
      tableName: 'designations',
      timestamps: true,
      indexes: [
        { unique: true, fields: ['title'] },
        { fields: ['department'] },
        { fields: ['status'] }
      ]
    }
  );

  return Designation;
};

module.exports = {
  Designation,
  initDesignationModel
};
