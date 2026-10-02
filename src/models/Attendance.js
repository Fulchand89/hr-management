const { DataTypes, Model } = require('sequelize');

class Attendance extends Model {}

const initAttendanceModel = (sequelize) => {
  Attendance.init(
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
      shiftId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'shifts',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      clockIn: {
        type: DataTypes.DATE,
        allowNull: true
      },
      clockOut: {
        type: DataTypes.DATE,
        allowNull: true
      },
      totalHours: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0.00,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('present', 'absent', 'half_day', 'late', 'on_leave', 'holiday', 'weekend'),
        defaultValue: 'present',
        allowNull: false
      },
      ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true
      },
      remarks: {
        type: DataTypes.STRING(255),
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: 'Attendance',
      tableName: 'attendances',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['userId', 'date'],
          name: 'attendance_user_date_unique_idx'
        },
        { fields: ['date'] },
        { fields: ['status'] }
      ]
    }
  );

  return Attendance;
};

module.exports = { Attendance, initAttendanceModel };
