import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Building2,
  Users,
  Clock,
  CalendarDays,
  Sparkles
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

export const HRSignInView = ({ onSignIn }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setError('Please enter your email or Employee ID');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      if (login) {
        await login(identifier.trim(), password);
      }
      if (onSignIn) {
        onSignIn();
      } else {
        navigate('/hr/dashboard');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans relative overflow-hidden">
      {/* Background Subtle Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#8B1D2C]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Portal Switcher Bar */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8B1D2C] to-[#5C101B] text-white flex items-center justify-center font-black text-sm shadow-md shadow-[#8B1D2C]/30">
            WP
          </div>
          <div>
            <span className="text-sm font-bold text-white tracking-tight">WorkPulse HRMS</span>
            <span className="text-[10px] text-rose-300 font-semibold block">People Operations Console</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => navigate('/employee/dashboard')}
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/90 border border-white/10 font-semibold transition-all cursor-pointer backdrop-blur-md"
          >
            Employee Portal &rarr;
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/dashboard')}
            className="hidden sm:inline-flex px-3.5 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold transition-all cursor-pointer backdrop-blur-md shadow-xs"
          >
            Admin Console &rarr;
          </button>
        </div>
      </div>

      {/* Main Web Login Container (Full Responsive Split-Card on Desktop) */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl sm:rounded-[36px] shadow-2xl border border-slate-200/80 overflow-hidden z-10 grid grid-cols-1 md:grid-cols-2 mt-16 md:mt-0">
        {/* Left Side: Brand Visual & Features Showcase */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-[#7A1523] p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Ambient Decorative Circles */}
          <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-rose-500/10 pointer-events-none" />
          <div className="absolute bottom-10 -right-16 w-48 h-48 rounded-full bg-rose-500/10 pointer-events-none" />

          {/* Top Brand Pill */}
          <div className="relative z-10">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/15 text-rose-300 inline-flex items-center gap-1.5 backdrop-blur-md shadow-2xs mb-6">
              <ShieldCheck className="w-3.5 h-3.5" />
              HR Management Portal
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Manage Staff Attendance & Approvals with Ease
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 font-medium leading-relaxed">
              Real-time attendance punch corrections, leave request management, and organizational oversight.
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="relative z-10 space-y-3 my-8">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Attendance Corrections</h4>
                <p className="text-[11px] text-slate-300">Fast review of missed punch-ins and break adjustments</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Leave Requests</h4>
                <p className="text-[11px] text-slate-300">One-click approval and rejection with reason audit trail</p>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="relative z-10 text-[11px] text-slate-400 font-medium">
            &copy; 2026 WorkPulse Systems. Secure Multi-Role HRMS.
          </div>
        </div>

        {/* Right Side: Web Sign In Form */}
        <div className="p-8 sm:p-10 flex flex-col justify-center bg-white">
          <div className="mb-6">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center mb-4 font-bold shadow-2xs">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Sign in to HR Portal
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Enter your official HR credentials to access manager operations
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email or Employee ID <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. hr@hrmanagement.com or EMP-002"
                  className="w-full pl-10 pr-3.5 py-3 text-xs border border-slate-200 rounded-2xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Password <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-medium">Default: HRPassword@123</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-3 text-xs border border-slate-200 rounded-2xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-[#8B1D2C] hover:bg-[#731724] active:scale-[0.99] text-white text-xs font-bold shadow-md shadow-[#8B1D2C]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign in to HR Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Quick Fill:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIdentifier('hr@hrmanagement.com');
                  setPassword('HRPassword@123');
                }}
                className="px-2.5 py-1 rounded-xl bg-rose-50 text-[#8B1D2C] hover:bg-rose-100 font-bold text-[11px] transition-colors cursor-pointer"
              >
                HR Lead Demo
              </button>
              <button
                type="button"
                onClick={() => {
                  setIdentifier('manager@hrmanagement.com');
                  setPassword('ManagerPassword@123');
                }}
                className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-[11px] transition-colors cursor-pointer"
              >
                Manager Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRSignInView;
