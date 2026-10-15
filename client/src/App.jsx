import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Employee Portal
import EmployeeApp from './pages/employee/EmployeeApp';
import SignInView from './pages/employee/SignInView';

// Auth Recovery Pages
import ForgotPasswordView from './pages/auth/ForgotPasswordView';
import ResetPasswordView from './pages/auth/ResetPasswordView';

// HR Portal
import HRApp from './pages/hr/HRApp';
import HRSignInView from './pages/hr/HRSignInView';

import ProtectedRoute from './components/common/ProtectedRoute';

export function App() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen">
      <Routes>
        {/* Root Redirect to Sign In */}
        <Route path="/" element={<Navigate to="/signin" replace />} />

        {/* Standalone Authentication */}
        <Route path="/signin" element={<SignInView />} />
        <Route path="/signup" element={<Navigate to="/signin" replace />} />

        {/* Password Recovery Routes */}
        <Route path="/forgot-password" element={<ForgotPasswordView />} />
        <Route path="/reset-password" element={<ResetPasswordView />} />
        <Route path="/hr/forgot-password" element={<ForgotPasswordView />} />

        {/* ========================================== */}
        {/* EMPLOYEE PORTAL DEDICATED ROUTES          */}
        {/* ========================================== */}
        <Route
          path="/employee/*"
          element={
            <ProtectedRoute allowedRoles={['admin', 'hr', 'manager', 'employee']}>
              <EmployeeApp />
            </ProtectedRoute>
          }
        />

        {/* ========================================== */}
        {/* HR PORTAL DEDICATED ROUTES                 */}
        {/* ========================================== */}
        <Route
          path="/hr/signin"
          element={<HRSignInView onSignIn={() => navigate('/hr/dashboard')} />}
        />
        <Route
          path="/hr/*"
          element={
            <ProtectedRoute allowedRoles={['admin', 'hr']}>
              <HRApp />
            </ProtectedRoute>
          }
        />

        {/* ========================================== */}
        {/* ADMIN ROUTE REMOVAL (REDIRECT TO HR)       */}
        {/* ========================================== */}
        <Route path="/admin/*" element={<Navigate to="/hr/dashboard" replace />} />

        {/* Global Fallback */}
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    </div>
  );
}

export default App;
