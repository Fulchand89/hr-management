import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as loginApi, logout as logoutApi } from '../services/employeeService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on initial page load (No auto-logins)
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (
          storedToken &&
          storedUser &&
          storedToken !== 'undefined' &&
          storedToken !== 'null' &&
          storedUser !== 'undefined' &&
          storedUser !== 'null'
        ) {
          const parsed = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsed);
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Standard Login action with email & password
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

  // Secure Logout action
  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Ignore API logout error if session was already expired
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    }
  }, []);

  const isLoggedIn = Boolean(token && user);

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
