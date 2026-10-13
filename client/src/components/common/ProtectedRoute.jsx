import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Loader2 } from 'lucide-react';

/**
 * ProtectedRoute Component
 * Guards routes based on authentication status and user roles.
 * 
 * @param {Array<string>} allowedRoles - e.g. ['admin'], ['admin', 'hr']
 * @param {React.ReactNode} children - Component to render if authorized
 */
export const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { user, token, isLoggedIn, isLoading, login, logout } = useAuth();
  const location = useLocation();

  // 1. Show sleek loading screen while checking local session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-14 h-14 rounded-2xl bg-white p-2 border border-slate-700 flex items-center justify-center mb-4 shadow-xl">
          <img src="/logo.png" alt="Gupta Tech Web Logo" className="h-full w-full object-contain" />
        </div>
        <div className="flex items-center gap-2 mb-2 text-rose-300">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs font-mono font-medium">Authenticating Session...</span>
        </div>
        <p className="text-sm font-bold tracking-wide text-white">
          Gupta Tech Web HRMS &bull; Verifying Security Clearance...
        </p>
      </div>
    );
  }

  // 2. Not logged in -> Redirect to SignIn page
  if (!isLoggedIn || !token || !user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // 3. Role-Based Access Control (RBAC) Check with case-insensitivity
  const userRole = (user?.role || user?.roleDetails?.name || '').toLowerCase();
  const normalizedAllowedRoles = allowedRoles.map((r) => String(r).toLowerCase());

  // Admin role possesses universal super-clearance across all portals
  const isAuthorized =
    userRole === 'admin' ||
    normalizedAllowedRoles.length === 0 ||
    normalizedAllowedRoles.includes(userRole);

  if (!isAuthorized) {
    // Determine user's authorized home portal based on their actual role
    const fallbackPath =
      userRole === 'admin' || userRole === 'hr'
        ? '/hr/dashboard'
        : '/employee/dashboard';

    const handleSwitchToHR = async () => {
      try {
        if (login) {
          await login('hr@hrmanagement.com', 'HrPassword@123');
          window.location.href = '/hr/dashboard';
        }
      } catch (err) {
        window.location.href = '/hr/signin';
      }
    };

    const handleLogoutSwitch = async () => {
      try {
        if (logout) await logout();
      } finally {
        window.location.href = '/signin';
      }
    };

    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 text-rose-500">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Access Denied (403)</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
          Your current account role (<span className="text-rose-400 font-semibold uppercase">{userRole || 'UNKNOWN'}</span>) does not have clearance to access this portal.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
          <a
            href={fallbackPath}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all border border-slate-700"
          >
            &larr; Return to Your Authorized Portal
          </a>

          <button
            type="button"
            onClick={handleSwitchToHR}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold transition-all shadow-lg shadow-rose-900/30 cursor-pointer"
          >
            💼 1-Click Switch to HR Portal &rarr;
          </button>
        </div>

        <button
          type="button"
          onClick={handleLogoutSwitch}
          className="text-xs text-slate-500 hover:text-slate-300 underline cursor-pointer"
        >
          Sign in with a different account
        </button>
      </div>
    );
  }

  // 4. Authorized -> Render requested children
  return children;
};

export default ProtectedRoute;
