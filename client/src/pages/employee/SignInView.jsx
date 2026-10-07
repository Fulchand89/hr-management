import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Sparkles, CheckCircle2, ArrowRight, User, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SignInView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle successful login routing based on role
  const handleRedirectAfterLogin = (role) => {
    // If user attempted to visit a guarded route prior to login, send them there if permitted
    const intendedPath = location.state?.from?.pathname;
    if (intendedPath && !intendedPath.includes('/signin')) {
      if (intendedPath.startsWith('/admin') && role !== 'admin') {
        // Fallback if not admin
      } else if (intendedPath.startsWith('/hr') && !['admin', 'hr'].includes(role)) {
        // Fallback if not hr/admin
      } else {
        navigate(intendedPath, { replace: true });
        return;
      }
    }

    if (role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    } else if (role === 'hr') {
      navigate('/hr/dashboard', { replace: true });
    } else {
      navigate('/employee/dashboard', { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const userData = await login(identifier, password);
      handleRedirectAfterLogin(userData?.role);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Invalid email or password';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (email, pwd) => {
    setError('');
    setIdentifier(email);
    setPassword(pwd);
    setIsLoading(true);
    try {
      const userData = await login(email, pwd);
      handleRedirectAfterLogin(userData?.role);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Login failed';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 border border-slate-100">
        {/* Left Side: Brand Visual & Value Proposition */}
        <div className="bg-gradient-to-br from-[#8B1D2C] via-[#66131F] to-slate-950 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-rose-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-2.5 mb-8">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Sparkles className="w-5 h-5 text-rose-300" />
              </div>
              <span className="text-xl font-black tracking-tight text-white">WorkPulse HRMS</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight text-white mb-3">
              Enterprise Workforce Authentication
            </h2>
            <p className="text-rose-100/80 text-xs sm:text-sm leading-relaxed mb-6">
              Role-Based Access Control protecting Employee Self-Service, HR Management Operations, and Executive System Administration.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2.5 text-xs text-rose-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Encrypted JWT Token Bearer authentication</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-rose-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Strict RBAC route protection for Admin, HR & Employee</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-rose-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Real-time attendance tracking & leave management</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-8 border-t border-white/10 flex items-center justify-between text-xs text-rose-200">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Enterprise Security
            </span>
            <span>v2.4 Production</span>
          </div>
        </div>

        {/* Right Side: Sign In Form */}
        <div className="p-8 sm:p-10 flex flex-col justify-center bg-white">
          <div className="mb-6">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center mb-3">
              <User className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Sign In</h3>
            <p className="text-xs text-slate-400 mt-1">
              Enter your corporate credentials to access your authorized portal
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@hrmanagement.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">Password</label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#8B1D2C] hover:bg-[#731724] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-md shadow-[#8B1D2C]/30 transition-all duration-150 cursor-pointer active:scale-[0.99] text-xs flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating...</>
                ) : (
                  <>Sign In to Portal <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </form>

          {/* Quick Demo Credentials Matrix */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
              ⚡ 1-Click Role Login (Testing)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@hrmanagement.com', 'AdminPassword@123')}
                disabled={isLoading}
                className="py-2 px-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-[11px] transition-colors cursor-pointer text-center"
              >
                👑 Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('hr@hrmanagement.com', 'HrPassword@123')}
                disabled={isLoading}
                className="py-2 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-[11px] transition-colors cursor-pointer text-center"
              >
                💼 HR Lead
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('john.doe@hrmanagement.com', 'UserPassword@123')}
                disabled={isLoading}
                className="py-2 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-[11px] transition-colors cursor-pointer text-center"
              >
                👤 Employee
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInView;
