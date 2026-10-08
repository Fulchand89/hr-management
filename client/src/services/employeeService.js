import apiClient from './apiClient';

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

export const login = async (email, password) => {
  const res = await apiClient.post('/auth/login', { email, password });
  return res.data;
};

export const register = async (userData) => {
  const res = await apiClient.post('/auth/register', userData);
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

export const getDashboard = async () => {
  const res = await apiClient.get('/dashboard/employee');
  return res.data;
};

// ─────────────────────────────────────────────
// ATTENDANCE
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

// ─────────────────────────────────────────────
// LEAVES
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

export const getHolidays = async (year) => {
  const res = await apiClient.get('/leaves/holidays', { params: { year } });
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

// ─────────────────────────────────────────────
// PROFILE
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
