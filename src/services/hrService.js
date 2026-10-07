import apiClient from './apiClient';

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

export const login = async (email, password) => {
  const res = await apiClient.post('/auth/login', { email, password });
  return res.data;
};

export const logout = async () => {
  try {
    await apiClient.post('/auth/logout');
  } catch (_) {
    // Ignore logout errors
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────

export const getHRDashboard = async () => {
  const res = await apiClient.get('/dashboard/hr');
  return res.data;
};

export const getEmployeeDashboard = async () => {
  const res = await apiClient.get('/dashboard/employee');
  return res.data;
};

// ─────────────────────────────────────────────
// ATTENDANCE & STOPWATCH
// ─────────────────────────────────────────────

export const getTodayAttendance = async () => {
  const res = await apiClient.get('/attendance/today');
  return res.data;
};

export const punchIn = async (payload = {}) => {
  const res = await apiClient.post('/attendance/punch-in', payload);
  return res.data;
};

export const startBreak = async (reason = '') => {
  const res = await apiClient.post('/attendance/break-start', { reason });
  return res.data;
};

export const endBreak = async () => {
  const res = await apiClient.post('/attendance/break-end');
  return res.data;
};

export const punchOut = async (payload = {}) => {
  const res = await apiClient.post('/attendance/punch-out', payload);
  return res.data;
};

export const getMyAttendanceHistory = async (month, year) => {
  const res = await apiClient.get('/attendance/my-history', {
    params: { month, year }
  });
  return res.data;
};

export const getAdminDailyAttendance = async (params = {}) => {
  const res = await apiClient.get('/attendance/admin/daily', { params });
  return res.data;
};

// ─────────────────────────────────────────────
// ATTENDANCE CORRECTIONS (HR & EMPLOYEE)
// ─────────────────────────────────────────────

export const createAttendanceCorrection = async (payload) => {
  const res = await apiClient.post('/attendance/corrections', payload);
  return res.data;
};

export const getMyAttendanceCorrections = async (params = {}) => {
  const res = await apiClient.get('/attendance/corrections/mine', { params });
  return res.data;
};

export const getAdminAttendanceCorrections = async (params = {}) => {
  const res = await apiClient.get('/attendance/admin/corrections', { params });
  return res.data;
};

export const getAttendanceCorrectionById = async (id) => {
  const res = await apiClient.get(`/attendance/admin/corrections/${id}`);
  return res.data;
};

export const actionAttendanceCorrection = async (id, payload) => {
  const res = await apiClient.patch(`/attendance/admin/corrections/${id}/action`, payload);
  return res.data;
};

// ─────────────────────────────────────────────
// LEAVES MANAGEMENT
// ─────────────────────────────────────────────

export const getLeaveTypes = async () => {
  const res = await apiClient.get('/leaves/types');
  return res.data;
};

export const getLeaveBalance = async () => {
  const res = await apiClient.get('/leaves/my-balances');
  return res.data;
};

export const getMyLeaves = async (filters = {}) => {
  const res = await apiClient.get('/leaves/my-requests', { params: filters });
  return res.data;
};

export const applyLeave = async (payload) => {
  const res = await apiClient.post('/leaves/apply', payload);
  return res.data;
};

export const cancelLeave = async (id) => {
  const res = await apiClient.put(`/leaves/cancel/${id}`);
  return res.data;
};

export const getAdminLeaveRequests = async (params = {}) => {
  const res = await apiClient.get('/leaves/admin/requests', { params });
  return res.data;
};

export const getLeaveRequestById = async (id) => {
  const res = await apiClient.get(`/leaves/${id}`);
  return res.data;
};

export const actionLeaveRequest = async (id, payload) => {
  const res = await apiClient.patch(`/leaves/admin/action/${id}`, payload);
  return res.data;
};

// ─────────────────────────────────────────────
// HOLIDAYS
// ─────────────────────────────────────────────

export const getHolidays = async (year) => {
  const res = await apiClient.get('/leaves/holidays', { params: { year } });
  return res.data;
};

export const createHoliday = async (payload) => {
  const res = await apiClient.post('/leaves/holidays', payload);
  return res.data;
};

export const deleteHoliday = async (id) => {
  const res = await apiClient.delete(`/leaves/holidays/${id}`);
  return res.data;
};

// ─────────────────────────────────────────────
// REPORTS & DATA EXPORTS
// ─────────────────────────────────────────────

export const getAttendanceReport = async (params = {}) => {
  const isCsv = params.format === 'csv';
  const res = await apiClient.get('/reports/attendance', {
    params,
    ...(isCsv && { responseType: 'blob' })
  });
  return res.data;
};

export const getLeaveReport = async (params = {}) => {
  const isCsv = params.format === 'csv';
  const res = await apiClient.get('/reports/leave', {
    params,
    ...(isCsv && { responseType: 'blob' })
  });
  return res.data;
};

export const getEmployeeSummaryReport = async (params = {}) => {
  const isCsv = params.format === 'csv';
  const res = await apiClient.get('/reports/employee-summary', {
    params,
    ...(isCsv && { responseType: 'blob' })
  });
  return res.data;
};

// ─────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────

export const getMyNotifications = async (page = 1, limit = 20, type = null) => {
  const params = { page, limit };
  if (type && type !== 'All') params.type = type.toLowerCase();
  const res = await apiClient.get('/notifications/my', { params });
  return res.data;
};

export const getUnreadCount = async () => {
  const res = await apiClient.get('/notifications/unread-count');
  return res.data;
};

export const markNotificationRead = async (id) => {
  const res = await apiClient.put(`/notifications/${id}/mark-read`);
  return res.data;
};

export const markAllNotificationsRead = async () => {
  const res = await apiClient.put('/notifications/mark-all-read');
  return res.data;
};

export const broadcastAnnouncement = async (payload) => {
  const res = await apiClient.post('/notifications/broadcast', payload);
  return res.data;
};

export const sendDirectNotification = async (userId, payload) => {
  const res = await apiClient.post(`/notifications/user/${userId}`, payload);
  return res.data;
};

// ─────────────────────────────────────────────
// PROFILE & EMPLOYEE DETAILS
// ─────────────────────────────────────────────

export const getMyProfile = async () => {
  const res = await apiClient.get('/employees/me');
  return res.data;
};

export const updateMyProfile = async (payload) => {
  const res = await apiClient.put('/employees/me', payload);
  return res.data;
};

export const changePassword = async (payload) => {
  const res = await apiClient.put('/employees/me/password', payload);
  return res.data;
};

export const uploadAvatar = async (formData) => {
  const res = await apiClient.post('/employees/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};
