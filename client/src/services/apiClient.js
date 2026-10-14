import axios from 'axios';

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl || typeof envUrl !== 'string' || envUrl === 'undefined' || envUrl === 'null' || !envUrl.trim()) {
    return '/api/v1';
  }
  const trimmed = envUrl.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`;
};

const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true'
  },
  withCredentials: true
});

import { getAuthToken, clearAuthSession, isHRPortal } from './authStorage';

// ── Request Interceptor: Attach JWT token ─────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: Handle auth errors ──────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;
      if (status === 401) {
        clearAuthSession();
        
        // Prevent infinite page-reload blinking loop (lap-chap)
        const isHr = isHRPortal();
        const loginUrl = isHr ? '/hr/signin' : '/signin';
        if (!window.location.pathname.includes('/signin')) {
          window.location.href = loginUrl;
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
