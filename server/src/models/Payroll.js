const { DataTypes, Model } = require('sequelize');

class Payroll extends Model {}

const initPayrollModel = (sequelize) => {
  Payroll.init(
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
      month: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1, max: 12 }
      },
      year: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      totalDays: {
        type: DataTypes.INTEGER,
        defaultValue: 30,
        allowNull: false
      },
      workingDays: {
        type: DataTypes.INTEGER,
        defaultValue: 26,
        allowNull: false
      },
      presentDays: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0.0,
        allowNull: false
      },
      paidLeaves: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0.0,
        allowNull: false
      },
      lopDays: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0.0,
        allowNull: false
      },
      lateCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      lateLopDays: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0.0,
        allowNull: false
      },
      sandwichLopDays: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0.0,
        allowNull: false
      },
      baseCtc: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.00,
        allowNull: false
      },
      monthlyGross: {
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
      bonus: {
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
      lopDeduction: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.00,
        allowNull: false
      },
      otherDeductions: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.00,
        allowNull: false
      },
      grossSalary: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
      },
      totalDeductions: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0.00,
        allowNull: false
      },
      netSalary: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
      },
      paymentStatus: {
        type: DataTypes.ENUM('pending', 'processed', 'paid', 'failed', 'cancelled'),
        defaultValue: 'pending',
        allowNull: false
      },
      paymentMode: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      paidAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      transactionReference: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'Payroll',
      tableName: 'payrolls',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['userId', 'month', 'year'],
          name: 'payroll_user_month_year_idx'
        },
        { fields: ['month', 'year'] },
        { fields: ['paymentStatus'] }
      ]
    }
  );

  return Payroll;
};

module.exports = { Payroll, initPayrollModel };
