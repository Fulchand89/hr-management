const { DataTypes, Model } = require('sequelize');

class AttendanceCorrection extends Model {}

const initAttendanceCorrectionModel = (sequelize) => {
  AttendanceCorrection.init(
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
      attendanceId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'attendances',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      punchType: {
        type: DataTypes.ENUM('Check In Time', 'Check Out Time', 'Break Time'),
        allowNull: false
      },
      originalTime: {
        type: DataTypes.STRING(20),
        allowNull: false
      },
      requestedTime: {
        type: DataTypes.STRING(20),
        allowNull: false
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
        allowNull: false
      },
      actionedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      actionReason: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      actionedAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'AttendanceCorrection',
      tableName: 'attendance_corrections',
      timestamps: true,
      indexes: [
        { fields: ['userId'] },
        { fields: ['status'] },
        { fields: ['date'] },
        { fields: ['attendanceId'] }
      ]
    }
  );

  return AttendanceCorrection;
};

module.exports = { AttendanceCorrection, initAttendanceCorrectionModel };
