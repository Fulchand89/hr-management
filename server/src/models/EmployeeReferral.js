const { DataTypes, Model } = require('sequelize');

class EmployeeReferral extends Model {}

const initEmployeeReferralModel = (sequelize) => {
  EmployeeReferral.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      referrerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      candidateName: {
        type: DataTypes.STRING(120),
        allowNull: false
      },
      candidateEmail: {
        type: DataTypes.STRING(150),
        allowNull: false
      },
      candidatePhone: {
        type: DataTypes.STRING(20),
        allowNull: false
      },
      position: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      department: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      experienceYears: {
        type: DataTypes.DECIMAL(4, 1),
        defaultValue: 0.0,
        allowNull: false
      },
      resumeUrl: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('submitted', 'screening', 'interviewing', 'offered', 'hired', 'rejected'),
        defaultValue: 'submitted',
        allowNull: false
      },
      bonusAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        allowNull: false
      },
      payoutStatus: {
        type: DataTypes.ENUM('unearned', 'pending_probation', 'eligible', 'paid'),
        defaultValue: 'unearned',
        allowNull: false
      },
      joiningDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      probationCompletionDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      paidAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      reviewedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'EmployeeReferral',
      tableName: 'employee_referrals',
      timestamps: true,
      indexes: [
        { fields: ['referrerId'] },
        { fields: ['status'] },
        { fields: ['payoutStatus'] }
      ]
    }
  );

  return EmployeeReferral;
};

module.exports = {
  EmployeeReferral,
  initEmployeeReferralModel
};
