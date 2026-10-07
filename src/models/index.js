const { Sequelize } = require('sequelize');
const { sequelize } = require('../config/db');

// Models Initializers
const { initUserModel } = require('./User');
const { initRoleModel } = require('./Role');
const { initPermissionModel } = require('./Permission');
const { initRolePermissionModel } = require('./RolePermission');
const { initUserPermissionModel } = require('./UserPermission');
const { initDesignationModel } = require('./Designation');
const { initDepartmentModel } = require('./Department');
const { initBranchModel } = require('./Branch');
const { initShiftModel } = require('./Shift');
const { initAttendanceModel } = require('./Attendance');
const { initHolidayModel } = require('./Holiday');
const { initLeaveTypeModel } = require('./LeaveType');
const { initLeaveBalanceModel } = require('./LeaveBalance');
const { initLeaveRequestModel } = require('./LeaveRequest');
const { initSalaryStructureModel } = require('./SalaryStructure');
const { initPayrollModel } = require('./Payroll');
const { initEmployeeDocumentModel } = require('./EmployeeDocument');
const { initCompanyAssetModel } = require('./CompanyAsset');
const { initNotificationModel } = require('./Notification');
const { initActivityLogModel } = require('./ActivityLog');
const { initAttendanceCorrectionModel } = require('./AttendanceCorrection');

// 1. Initialize all models
const Role = initRoleModel(sequelize);
const Permission = initPermissionModel(sequelize);
const RolePermission = initRolePermissionModel(sequelize);
const Designation = initDesignationModel(sequelize);
const Department = initDepartmentModel(sequelize);
const Branch = initBranchModel(sequelize);
const User = initUserModel(sequelize);
const UserPermission = initUserPermissionModel(sequelize);
const Shift = initShiftModel(sequelize);
const Attendance = initAttendanceModel(sequelize);
const AttendanceCorrection = initAttendanceCorrectionModel(sequelize);
const Holiday = initHolidayModel(sequelize);
const LeaveType = initLeaveTypeModel(sequelize);
const LeaveBalance = initLeaveBalanceModel(sequelize);
const LeaveRequest = initLeaveRequestModel(sequelize);
const SalaryStructure = initSalaryStructureModel(sequelize);
const Payroll = initPayrollModel(sequelize);
const EmployeeDocument = initEmployeeDocumentModel(sequelize);
const CompanyAsset = initCompanyAssetModel(sequelize);
const Notification = initNotificationModel(sequelize);
const ActivityLog = initActivityLogModel(sequelize);

// 2. Define Associations

// A. Role <-> User
Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });
User.belongsTo(Role, { foreignKey: 'roleId', as: 'roleDetails' });

// B. Designation <-> User
Designation.hasMany(User, { foreignKey: 'designationId', as: 'employees' });
User.belongsTo(Designation, { foreignKey: 'designationId', as: 'designationDetails' });

// Designation <-> Department
Department.hasMany(Designation, { foreignKey: 'departmentId', as: 'designations' });
Designation.belongsTo(Department, { foreignKey: 'departmentId', as: 'departmentDetails' });

// C. Department <-> User
Department.hasMany(User, { foreignKey: 'departmentId', as: 'employees' });
User.belongsTo(Department, { foreignKey: 'departmentId', as: 'departmentDetails' });
Department.belongsTo(User, { foreignKey: 'headId', as: 'departmentHead' });

// D. Branch <-> User
Branch.hasMany(User, { foreignKey: 'branchId', as: 'employees' });
User.belongsTo(Branch, { foreignKey: 'branchId', as: 'branchDetails' });

// E. Manager Hierarchy (Self-referencing)
User.hasMany(User, { foreignKey: 'managerId', as: 'reportees' });
User.belongsTo(User, { foreignKey: 'managerId', as: 'manager' });

// F. Role <-> Permission
Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: 'roleId',
  otherKey: 'permissionId',
  as: 'permissions'
});
Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: 'permissionId',
  otherKey: 'roleId',
  as: 'roles'
});
Role.hasMany(RolePermission, { foreignKey: 'roleId', as: 'rolePermissions' });
RolePermission.belongsTo(Role, { foreignKey: 'roleId' });
Permission.hasMany(RolePermission, { foreignKey: 'permissionId', as: 'rolePermissions' });
RolePermission.belongsTo(Permission, { foreignKey: 'permissionId' });

// G. User <-> Permission (Direct)
User.belongsToMany(Permission, {
  through: UserPermission,
  foreignKey: 'userId',
  otherKey: 'permissionId',
  as: 'directPermissions'
});
Permission.belongsToMany(User, {
  through: UserPermission,
  foreignKey: 'permissionId',
  otherKey: 'userId',
  as: 'users'
});
User.hasMany(UserPermission, { foreignKey: 'userId', as: 'userPermissions' });
UserPermission.belongsTo(User, { foreignKey: 'userId' });
Permission.hasMany(UserPermission, { foreignKey: 'permissionId', as: 'userPermissions' });
UserPermission.belongsTo(Permission, { foreignKey: 'permissionId' });

// H. Attendance & Shifts
User.hasMany(Attendance, { foreignKey: 'userId', as: 'attendances' });
Attendance.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Shift.hasMany(Attendance, { foreignKey: 'shiftId', as: 'attendances' });
Attendance.belongsTo(Shift, { foreignKey: 'shiftId', as: 'shift' });

// Attendance Corrections
User.hasMany(AttendanceCorrection, { foreignKey: 'userId', as: 'attendanceCorrections' });
AttendanceCorrection.belongsTo(User, { foreignKey: 'userId', as: 'applicant' });
AttendanceCorrection.belongsTo(User, { foreignKey: 'actionedBy', as: 'reviewer' });
Attendance.hasMany(AttendanceCorrection, { foreignKey: 'attendanceId', as: 'corrections' });
AttendanceCorrection.belongsTo(Attendance, { foreignKey: 'attendanceId', as: 'attendance' });

// I. Leave Management
User.hasMany(LeaveBalance, { foreignKey: 'userId', as: 'leaveBalances' });
LeaveBalance.belongsTo(User, { foreignKey: 'userId', as: 'user' });
LeaveType.hasMany(LeaveBalance, { foreignKey: 'leaveTypeId', as: 'balances' });
LeaveBalance.belongsTo(LeaveType, { foreignKey: 'leaveTypeId', as: 'leaveType' });

User.hasMany(LeaveRequest, { foreignKey: 'userId', as: 'leaveRequests' });
LeaveRequest.belongsTo(User, { foreignKey: 'userId', as: 'applicant' });
LeaveRequest.belongsTo(User, { foreignKey: 'actionedBy', as: 'reviewer' });
LeaveType.hasMany(LeaveRequest, { foreignKey: 'leaveTypeId', as: 'requests' });
LeaveRequest.belongsTo(LeaveType, { foreignKey: 'leaveTypeId', as: 'leaveType' });

// J. Payroll & Salary
User.hasOne(SalaryStructure, { foreignKey: 'userId', as: 'salaryStructure' });
SalaryStructure.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Payroll, { foreignKey: 'userId', as: 'payrolls' });
Payroll.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// K. Documents & Assets
User.hasMany(EmployeeDocument, { foreignKey: 'userId', as: 'documents' });
EmployeeDocument.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(CompanyAsset, { foreignKey: 'assignedTo', as: 'assignedAssets' });
CompanyAsset.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignedEmployee' });

// L. Notifications & Activity Logs
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(ActivityLog, { foreignKey: 'userId', as: 'activityLogs' });
ActivityLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Model registry
const db = {
  sequelize,
  Sequelize,
  User,
  Role,
  Permission,
  RolePermission,
  UserPermission,
  Designation,
  Department,
  Branch,
  Shift,
  Attendance,
  AttendanceCorrection,
  Holiday,
  LeaveType,
  LeaveBalance,
  LeaveRequest,
  SalaryStructure,
  Payroll,
  EmployeeDocument,
  CompanyAsset,
  Notification,
  ActivityLog
};

module.exports = db;
