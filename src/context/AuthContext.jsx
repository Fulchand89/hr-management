import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as loginApi, logout as logoutApi } from '../services/employeeService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // On app load: restore session from localStorage or auto-login matching portal role
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      const isHRPath = window.location.pathname.startsWith('/hr');

      if (storedToken && storedUser && storedToken !== 'undefined' && storedToken !== 'null') {
        try {
          const parsed = JSON.parse(storedUser);
          // If on HR portal and current session is an employee, upgrade to HR session
          if (isHRPath && parsed.role === 'employee' && !window.location.pathname.includes('/signin')) {
            const res = await loginApi('hr@hrmanagement.com', 'HrPassword@123');
            const newToken = res?.data?.accessToken || res?.token;
            const userData = res?.data?.user;
            if (newToken && userData) {
              localStorage.setItem('token', newToken);
              localStorage.setItem('user', JSON.stringify(userData));
              setToken(newToken);
              setUser(userData);
              setIsLoading(false);
              return;
            }
          }
          setToken(storedToken);
          setUser(parsed);
          setIsLoading(false);
          return;
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }

      // If no valid session, auto-login with default credentials matching active portal
      try {
        const defaultEmail = isHRPath ? 'hr@hrmanagement.com' : 'john.doe@hrmanagement.com';
        const defaultPassword = isHRPath ? 'HrPassword@123' : 'UserPassword@123';
        const res = await loginApi(defaultEmail, defaultPassword);
        const newToken = res?.data?.accessToken || res?.token;
        const userData = res?.data?.user;
        if (newToken) {
          localStorage.setItem('token', newToken);
          setToken(newToken);
        }
        if (userData) {
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
        }
      } catch {
        // Fallback: stay unauthenticated
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await loginApi(email, password);
    const newToken = res?.data?.accessToken || res?.token || res?.accessToken || res?.data?.token;
    const userData = res?.data?.user || res?.data || res?.user;

    if (newToken) {
      localStorage.setItem('token', newToken);
      setToken(newToken);
    }
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    }
    return userData;
  }, []);

  const logout = useCallback(async () => {
    await logoutApi();
    setToken(null);
    setUser(null);
  }, []);

  const isLoggedIn = !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, isLoggedIn, isLoading, login, logout }}>
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
