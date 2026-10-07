const { DataTypes, Model } = require('sequelize');

class SalaryStructure extends Model {}

const initSalaryStructureModel = (sequelize) => {
  SalaryStructure.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      ctc: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.00,
        allowNull: false
      },
      basicSalary: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.00,
        allowNull: false
      },
      hra: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.00,
        allowNull: false
      },
      specialAllowance: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.00,
        allowNull: false
      },
      pfDeduction: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.00,
        allowNull: false
      },
      esiDeduction: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.00,
        allowNull: false
      },
      taxDeduction: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.00,
        allowNull: false
      },
      netSalary: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.00,
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'SalaryStructure',
      tableName: 'salary_structures',
      timestamps: true,
      indexes: [
        { unique: true, fields: ['userId'] }
      ]
    }
  );

  return SalaryStructure;
};

module.exports = { SalaryStructure, initSalaryStructureModel };
