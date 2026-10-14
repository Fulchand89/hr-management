/**
 * Portal-Aware & Tab-Isolated Auth Storage
 * 
 * Prevents session collisions when an HR administrator and an Employee
 * are logged in simultaneously across different tabs or windows in the same browser.
 */

export const isHRPortal = () => {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith('/hr');
};

export const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  const isHr = isHRPortal();

  if (isHr) {
    const token =
      sessionStorage.getItem('hr_token') ||
      localStorage.getItem('hr_token');
    if (token && token !== 'undefined' && token !== 'null') return token;

    // Graceful fallback to generic token if it is an HR/admin user
    const genericToken = sessionStorage.getItem('token') || localStorage.getItem('token');
    const genericUser = sessionStorage.getItem('user') || localStorage.getItem('user');
    if (genericToken && genericUser) {
      try {
        const u = JSON.parse(genericUser);
        if (u.role === 'hr' || u.role === 'admin') return genericToken;
      } catch {}
    }
    return null;
  }

  // Employee Portal
  const token =
    sessionStorage.getItem('employee_token') ||
    localStorage.getItem('employee_token') ||
    sessionStorage.getItem('token') ||
    localStorage.getItem('token');

  return token && token !== 'undefined' && token !== 'null' ? token : null;
};

export const getAuthUser = () => {
  if (typeof window === 'undefined') return null;
  const isHr = isHRPortal();

  let raw = null;
  if (isHr) {
    raw =
      sessionStorage.getItem('hr_user') ||
      localStorage.getItem('hr_user');

    if (!raw) {
      const genericUser = sessionStorage.getItem('user') || localStorage.getItem('user');
      if (genericUser) {
        try {
          const u = JSON.parse(genericUser);
          if (u.role === 'hr' || u.role === 'admin') raw = genericUser;
        } catch {}
      }
    }
  } else {
    raw =
      sessionStorage.getItem('employee_user') ||
      localStorage.getItem('employee_user') ||
      sessionStorage.getItem('user') ||
      localStorage.getItem('user');
  }

  if (raw && raw !== 'undefined' && raw !== 'null') {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return null;
};

export const saveAuthSession = (token, user, portalHint) => {
  if (!token || !user) return;
  const portal = portalHint || (isHRPortal() ? 'hr' : 'employee');
  const role = (user.role || '').toLowerCase();
  const userJson = JSON.stringify(user);

  if (portal === 'hr' || role === 'hr' || role === 'admin') {
    sessionStorage.setItem('hr_token', token);
    sessionStorage.setItem('hr_user', userJson);
    localStorage.setItem('hr_token', token);
    localStorage.setItem('hr_user', userJson);
  }

  if (portal === 'employee' || (role !== 'hr' && role !== 'admin')) {
    sessionStorage.setItem('employee_token', token);
    sessionStorage.setItem('employee_user', userJson);
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', userJson);

    localStorage.setItem('employee_token', token);
    localStorage.setItem('employee_user', userJson);
    localStorage.setItem('token', token);
    localStorage.setItem('user', userJson);
  }
};

export const clearAuthSession = (portalHint) => {
  const portal = portalHint || (isHRPortal() ? 'hr' : 'employee');

  if (portal === 'hr') {
    sessionStorage.removeItem('hr_token');
    sessionStorage.removeItem('hr_user');
    localStorage.removeItem('hr_token');
    localStorage.removeItem('hr_user');
  } else {
    sessionStorage.removeItem('employee_token');
    sessionStorage.removeItem('employee_user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    localStorage.removeItem('employee_token');
    localStorage.removeItem('employee_user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

/**
 * Attendance live snapshot cache isolated by user ID and portal
 */
export const getAttendanceSnapshot = (userId) => {
  if (typeof window === 'undefined') return null;
  const portal = isHRPortal() ? 'hr' : 'employee';
  const key = userId
    ? `attendance_today_snapshot_${userId}`
    : `attendance_today_snapshot_${portal}`;

  try {
    const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
};

export const setAttendanceSnapshot = (userId, data) => {
  if (typeof window === 'undefined' || !data) return;
  const portal = isHRPortal() ? 'hr' : 'employee';
  const key = userId
    ? `attendance_today_snapshot_${userId}`
    : `attendance_today_snapshot_${portal}`;

  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
    sessionStorage.setItem(key, serialized);
  } catch {}
};

export const clearAttendanceSnapshot = (userId) => {
  if (typeof window === 'undefined') return;
  const portal = isHRPortal() ? 'hr' : 'employee';
  const key = userId
    ? `attendance_today_snapshot_${userId}`
    : `attendance_today_snapshot_${portal}`;

  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
};
