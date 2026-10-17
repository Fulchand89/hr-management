import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

export const HRSignInView = ({ onSignIn }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('gtw_remember_me_hr') === 'true' || localStorage.getItem('gtw_remember_me') === 'true';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('gtw_saved_email_hr') || localStorage.getItem('gtw_saved_email');
    if (savedEmail) {
      setIdentifier(savedEmail);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setError('Please enter your corporate email address or Employee ID.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      if (rememberMe) {
        localStorage.setItem('gtw_remember_me_hr', 'true');
        localStorage.setItem('gtw_saved_email_hr', cleanIdentifier);
      } else {
        localStorage.removeItem('gtw_remember_me_hr');
        localStorage.removeItem('gtw_saved_email_hr');
      }

      if (login) {
        await login(cleanIdentifier, password, 'hr');
      }
      if (onSignIn) {
        onSignIn();
      } else {
        navigate('/hr/dashboard');
      }
    } catch (err) {
      let msg = 'Invalid credentials. Please verify your corporate email and password.';
      if (err?.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err?.response?.status === 404) {
        msg = 'API server endpoint not found (404). Please ensure your backend is deployed and VITE_API_URL is configured.';
      } else if (err?.response?.status >= 500) {
        msg = `Backend server error (${err.response.status}). Please check backend logs and database connection.`;
      } else if (err?.message && (err.message.includes('Network') || err.message.includes('ERR_NETWORK') || err.code === 'ERR_NETWORK')) {
        msg = 'Cannot connect to backend server. Please verify your network and backend URL.';
      } else if (err?.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden">
      {/* Background Decor Elements */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-[#8B1D2C]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Authentication Container */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden grid grid-cols-1 lg:grid-cols-2 relative z-10">
        
        {/* Left Side: Brand & Identity Showcase */}
        <div className="p-8 lg:p-10 bg-gradient-to-br from-[#8B1D2C] via-[#731724] to-slate-900 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

          {/* Top Brand Logo */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white p-1.5 shadow-lg flex items-center justify-center shrink-0">
                <img src="/logo.png" alt="Gupta Tech Web" className="h-full w-full object-contain" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <span>Gupta Tech Web</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/20">
                    HRMS
                  </span>
                </h2>
                <p className="text-xs text-rose-200/80 font-medium">Enterprise Workforce Operations</p>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-rose-100 border border-white/15 backdrop-blur-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Authorized Access Only
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                Streamlined People &amp; Workforce Management
              </h1>
              <p className="text-xs sm:text-sm text-rose-100/90 leading-relaxed">
                Single sign-on gateway for employee attendance, leaves, payroll records, performance appraisals, and corporate policies.
              </p>
            </div>
          </div>

          {/* Bottom Security Assurance */}
          <div className="pt-8 border-t border-white/15 relative z-10 space-y-2 text-xs text-rose-200/80">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>TLS 1.3 256-Bit Encrypted Corporate Sessions</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Authorized HR &amp; Administrative Personnel Only</span>
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Form */}
        <div className="p-6 sm:p-7 lg:p-8 flex flex-col justify-between bg-white">
          <div>
            <div className="mb-5 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  HR &amp; Admin Portal
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                  Sign In
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                Corporate Sign In
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your corporate credentials to access your HR dashboard
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Work Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Work Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="fulchanddhakad311@gmail.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    state={{ email: identifier, portal: 'hr' }}
                    className="text-xs font-semibold text-[#8B1D2C] hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter corporate password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-[#8B1D2C] focus:ring-[#8B1D2C]/30 accent-[#8B1D2C]"
                  />
                  <span className="text-xs text-slate-600 font-medium">Remember my work email</span>
                </label>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-[#8B1D2C] hover:bg-[#731724] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-2.5 sm:py-3 rounded-xl shadow-md shadow-[#8B1D2C]/25 transition-all duration-150 cursor-pointer active:scale-[0.99] text-xs sm:text-sm flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Bottom Footer Actions: HR Clearance Notice */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2 shrink-0">
            <div className="text-center space-y-1">
              <p className="text-xs font-semibold text-slate-700">
                Authorized HR &amp; Management Personnel Only
              </p>
              <p className="text-[11px] text-slate-400">
                Please contact IT Security or your system administrator for corporate login credentials.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HRSignInView;
