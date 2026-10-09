const { DataTypes, Model } = require('sequelize');

class PolicyAcknowledgment extends Model {}

const initPolicyAcknowledgmentModel = (sequelize) => {
  PolicyAcknowledgment.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      policyId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'company_policies',
          key: 'id'
        },
        onDelete: 'CASCADE'
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
      versionAcknowledged: {
        type: DataTypes.STRING(15),
        allowNull: false,
        defaultValue: '1.0'
      },
      acknowledgedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      },
      ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'PolicyAcknowledgment',
      tableName: 'policy_acknowledgments',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['policyId', 'userId', 'versionAcknowledged']
        },
        { fields: ['policyId'] },
        { fields: ['userId'] }
      ]
    }
  );

  return PolicyAcknowledgment;
};

module.exports = { PolicyAcknowledgment, initPolicyAcknowledgmentModel };
