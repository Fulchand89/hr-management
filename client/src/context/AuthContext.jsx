import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { login as loginApi, register as registerApi, logout as logoutApi, getMyProfile } from '../services/employeeService';
import {
  getAuthToken,
  getAuthUser,
  saveAuthSession,
  clearAuthSession,
  isHRPortal
} from '../services/authStorage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const location = useLocation();
  const [user, setUser] = useState(() => getAuthUser());
  const [token, setToken] = useState(() => getAuthToken());
  const [isLoading, setIsLoading] = useState(true);

  // Synchronize session whenever location portal boundary changes or on initial load
  const syncSession = useCallback(async () => {
    try {
      const currentToken = getAuthToken();
      const currentUser = getAuthUser();

      setToken(currentToken);
      setUser(currentUser);

      if (currentToken && currentUser && currentUser.id) {
        // Fetch fresh profile in background to verify active token and permissions
        try {
          const profileRes = await getMyProfile();
          const freshUser = profileRes?.data || profileRes;
          if (freshUser && freshUser.id) {
            saveAuthSession(currentToken, freshUser);
            setUser(freshUser);
          }
        } catch {
          // Keep cached user if network temporarily unavailable
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    syncSession();
  }, [location.pathname, syncSession]);

  // Standard Login action with email & password
  const login = useCallback(async (email, password, portalHint) => {
    const res = await loginApi(email, password);
    const newToken = res?.data?.accessToken || res?.token || res?.accessToken || res?.data?.token;
    const userData = res?.data?.user || res?.data || res?.user;

    if (newToken && userData) {
      const activePortal = portalHint || (isHRPortal() ? 'hr' : 'employee');
      saveAuthSession(newToken, userData, activePortal);
      setToken(newToken);
      setUser(userData);
    }
    return userData;
  }, []);

  // Register action
  const register = useCallback(async (formData) => {
    const res = await registerApi(formData);
    const newToken = res?.data?.accessToken || res?.token || res?.accessToken || res?.data?.token;
    const userData = res?.data?.user || res?.data || res?.user;

    if (newToken && userData) {
      saveAuthSession(newToken, userData, 'employee');
      setToken(newToken);
      setUser(userData);
    }
    return userData;
  }, []);

  // Secure Logout action (scoped to active portal)
  const logout = useCallback(async (portalHint) => {
    try {
      await logoutApi();
    } catch {
      // Ignore API logout error if session was already expired
    } finally {
      const activePortal = portalHint || (isHRPortal() ? 'hr' : 'employee');
      clearAuthSession(activePortal);
      setToken(null);
      setUser(null);
    }
  }, []);

  const isLoggedIn = Boolean(token && user);

  return (
    <AuthContext.Provider value={{ user, token, isLoggedIn, isLoading, login, register, logout, syncSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export { AuthContext };
export default AuthProvider;
