import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Mail,
  Lock,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  User,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Eye,
  EyeOff,
  UserPlus,
  Building2,
  Key,
  Check,
  Copy,
  HelpCircle,
  X,
  Send,
  Phone,
  MapPin
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SignInView = ({ initialMode = 'signin' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();

  const [mode, setMode] = useState(initialMode); // 'signin' | 'signup'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Production state
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('gtw_remember_me') === 'true';
  });
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  // Sign up fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedRole, setCopiedRole] = useState(null);

  // Synchronize mode if prop or route changes
  useEffect(() => {
    if (location.pathname === '/signup') {
      setMode('signup');
      setError('');
      if (identifier.includes('hrmanagement.com')) {
        setIdentifier('');
      }
      setPassword('');
      setConfirmPassword('');
    } else if (location.pathname === '/signin') {
      setMode('signin');
      setError('');
      const savedEmail = localStorage.getItem('gtw_saved_email');
      if (savedEmail && rememberMe && !identifier) {
        setIdentifier(savedEmail);
      }
    } else {
      setMode(initialMode);
    }
  }, [location.pathname, initialMode]);

  // Tab switcher with clean state
  const switchMode = (targetMode) => {
    setError('');
    if (targetMode === 'signup') {
      setMode('signup');
      if (identifier.includes('hrmanagement.com')) {
        setIdentifier('');
      }
      setPassword('');
      setConfirmPassword('');
      navigate('/signup', { replace: true });
    } else {
      setMode('signin');
      const savedEmail = localStorage.getItem('gtw_saved_email');
      if (savedEmail && rememberMe) {
        setIdentifier(savedEmail);
      }
      navigate('/signin', { replace: true });
    }
  };

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('gtw_saved_email');
    if (savedEmail && rememberMe) {
      setIdentifier(savedEmail);
    }
  }, []);

  // Handle successful login routing based on role
  const handleRedirectAfterLogin = (role) => {
    const intendedPath = location.state?.from?.pathname;
    if (intendedPath && !intendedPath.includes('/signin') && !intendedPath.includes('/signup')) {
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

  // Submit Sign In Form
  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const userData = await login(identifier.trim(), password);
      if (rememberMe) {
        localStorage.setItem('gtw_remember_me', 'true');
        localStorage.setItem('gtw_saved_email', identifier.trim());
      } else {
        localStorage.removeItem('gtw_remember_me');
        localStorage.removeItem('gtw_saved_email');
      }
      handleRedirectAfterLogin(userData?.role);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Invalid email or password';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Sign Up Form
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const userData = await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: identifier.trim().toLowerCase(),
        password,
        department: department.trim() || 'Engineering'
      });
      handleRedirectAfterLogin(userData?.role);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick 1-Click Role Login
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

  const copyCredentials = (role, email, pwd) => {
    navigator.clipboard.writeText(`Email: ${email}\nPassword: ${pwd}`);
    setCopiedRole(role);
    setIdentifier(email);
    setPassword(pwd);
    setTimeout(() => setCopiedRole(null), 2500);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center py-6 px-4 sm:px-6 font-sans relative overflow-y-auto">
      {/* Background Subtle Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#8B1D2C]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Split Authentication Card */}
      <div className="relative w-full max-w-4xl lg:max-w-5xl bg-white rounded-3xl sm:rounded-[32px] shadow-2xl border border-slate-200/80 overflow-hidden z-10 grid grid-cols-1 md:grid-cols-2 my-auto">
        
        {/* Left Side: Brand Visual & Security / Support Section */}
        <div className="bg-gradient-to-br from-[#8B1D2C] via-[#66131F] to-slate-950 p-6 sm:p-7 lg:p-8 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Decorative Glow Elements */}
          <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-rose-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-3">
            {/* Top Brand Identity */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-lg shrink-0">
                <img src="/logo.png" alt="Gupta Tech Web Logo" className="h-full w-full object-contain" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white block leading-tight">
                  Gupta Tech Web HRMS
                </span>
                <span className="text-xs text-rose-200 font-medium">Enterprise Workforce Platform</span>
              </div>
            </div>

            {/* Enterprise Security Badges List */}
            <div className="space-y-2">
              <div className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white leading-tight">256-Bit SSL Encrypted</h4>
                  <p className="text-[10px] text-rose-100/75 truncate">Enterprise banking-grade encryption</p>
                </div>
              </div>

              <div className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white leading-tight">RBAC Security</h4>
                  <p className="text-[10px] text-rose-100/75 truncate">Role-based access protection</p>
                </div>
              </div>

              <div className="px-3 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white leading-tight">ISO Compliant</h4>
                  <p className="text-[10px] text-rose-100/75 truncate">Standard security & data compliance</p>
                </div>
              </div>
            </div>

            {/* Corporate Contact Us Section */}
            <div className="p-3 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-white space-y-1.5">
              <h5 className="text-[10px] font-black uppercase tracking-wider text-rose-300">
                CONTACT US
              </h5>
              <div className="space-y-1.5 text-xs">
                <a
                  href="tel:+917400554294"
                  className="flex items-center gap-2 text-slate-200 hover:text-white transition-colors"
                >
                  <div className="w-5 h-5 rounded bg-[#8B1D2C] text-white flex items-center justify-center shrink-0">
                    <Phone className="w-3 h-3" />
                  </div>
                  <span className="font-semibold text-[11px]">+91 7400554294</span>
                </a>

                <a
                  href="mailto:sales@guptatechweb.com"
                  className="flex items-center gap-2 text-slate-200 hover:text-white transition-colors"
                >
                  <div className="w-5 h-5 rounded bg-[#8B1D2C] text-white flex items-center justify-center shrink-0">
                    <Mail className="w-3 h-3" />
                  </div>
                  <span className="font-semibold text-[11px]">sales@guptatechweb.com</span>
                </a>

                <div className="flex items-center gap-2 text-slate-200">
                  <div className="w-5 h-5 rounded bg-[#8B1D2C] text-white flex items-center justify-center shrink-0">
                    <MapPin className="w-3 h-3" />
                  </div>
                  <span className="text-[11px] leading-tight truncate">
                    410, Shagun Tower, Vijay Nagar, Indore, MP
                  </span>
                </div>
              </div>
            </div>

            {/* IT Support Box - Clearly visible with icon and prompt */}
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white text-[#8B1D2C] flex items-center justify-center shrink-0 shadow-xs font-bold">
                  <HelpCircle className="w-4 h-4 text-[#8B1D2C]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] sm:text-xs text-rose-100 font-medium leading-snug">
                    Need help or experiencing login issues?
                  </p>
                  <a
                    href="mailto:support@guptatechweb.com"
                    className="text-white text-xs font-extrabold underline hover:text-rose-200 transition-colors inline-block mt-0.5"
                  >
                    Contact IT Support &rarr;
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-3 mt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-rose-200/80">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Enterprise RBAC Security
            </span>
            <span className="font-semibold">v2.4 Production</span>
          </div>
        </div>

        {/* Right Side: Authentication Form */}
        <div className="p-6 sm:p-7 lg:p-8 flex flex-col justify-between bg-white">
          <div>
            {/* Mode Switcher Tabs (Sign In / Sign Up) */}
            <div className="flex p-1 bg-slate-100 rounded-xl mb-4 shrink-0">
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  mode === 'signin'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  mode === 'signup'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Sign Up</span>
              </button>
            </div>

            <div className="mb-4 shrink-0">
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {mode === 'signin' ? 'Welcome Back' : 'Create an Account'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {mode === 'signin'
                  ? 'Enter your corporate credentials to access your workspace'
                  : 'Register your details to create an employee account'}
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={mode === 'signin' ? handleSignInSubmit : handleSignUpSubmit}
              className="space-y-3 sm:space-y-3.5"
            >
              {mode === 'signup' ? (
                <>
                  {/* First Name & Last Name */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        First Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="e.g. John"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Last Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="e.g. Doe"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Department <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors cursor-pointer appearance-none truncate"
                      >
                        <option value="Engineering">Engineering</option>
                        <option value="Human Resources">Human Resources (HR)</option>
                        <option value="Finance">Finance & Accounting</option>
                        <option value="Sales">Sales & Marketing</option>
                        <option value="Operations">Operations & Logistics</option>
                        <option value="General">General Administration</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Work Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Work Email <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="name@guptatechweb.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Password & Confirm Password */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min 8 chars"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-9 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
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
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Confirm Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-9 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Sign In Mode Fields */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Work Email <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="name@guptatechweb.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Password <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(identifier);
                          setForgotSent(false);
                          setIsForgotPasswordOpen(true);
                        }}
                        className="text-xs font-semibold text-[#8B1D2C] hover:underline cursor-pointer"
                      >
                        Forgot Password?
                      </button>
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
                </>
              )}

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
                    {mode === 'signin' ? 'Authenticating...' : 'Creating Account...'}
                  </>
                ) : (
                  <>
                    {mode === 'signin' ? 'Sign In to Portal' : 'Confirm & Register'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Bottom Footer Actions */}
          <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-2 shrink-0">
            {mode === 'signin' ? (
              <div className="text-center space-y-1.5">
                <p className="text-xs text-slate-500">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="text-[#8B1D2C] font-bold hover:underline cursor-pointer"
                  >
                    Sign Up &rarr;
                  </button>
                </p>

                <div>
                  <button
                    type="button"
                    onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showDemoAccounts ? '▲ Hide Quick Login' : '▼ Staging Quick Login'}</span>
                  </button>

                  {showDemoAccounts && (
                    <div className="mt-2 p-2 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-3 gap-1.5 animate-in fade-in duration-200">
                      <button
                        type="button"
                        onClick={() => handleQuickLogin('hr@hrmanagement.com', 'HrPassword@123')}
                        disabled={isLoading}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-[#8B1D2C] text-xs font-bold text-center transition-colors cursor-pointer"
                      >
                        💼 HR
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickLogin('john.doe@hrmanagement.com', 'UserPassword@123')}
                        disabled={isLoading}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold text-center transition-colors cursor-pointer"
                      >
                        👤 Emp
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickLogin('admin@hrmanagement.com', 'AdminPassword@123')}
                        disabled={isLoading}
                        className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs font-bold text-center transition-colors cursor-pointer"
                      >
                        👑 Admin
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-xs text-slate-500">
                  Already have an employee account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className="text-[#8B1D2C] font-bold hover:underline cursor-pointer"
                  >
                    Sign In &rarr;
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#8B1D2C] flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Reset Corporate Password</h4>
                  <p className="text-[11px] text-slate-400">Gupta Tech Web IT Security</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              {forgotSent ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Reset Instructions Sent
                  </div>
                  <p className="text-emerald-700 text-[11px]">
                    If an active account exists for <b>{forgotEmail}</b>, an email with a secure reset link has been dispatched. Please check your inbox or spam folder.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Enter your registered corporate work email address below to receive password reset instructions from the IT security team.
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Corporate Work Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="your.name@guptatechweb.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
                      />
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-800">
                    💡 <b>Tip:</b> For urgent clearance resets, contact your department HR lead or email{' '}
                    <a href="mailto:support@guptatechweb.com" className="font-bold underline">
                      support@guptatechweb.com
                    </a>.
                  </div>
                </>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
              {!forgotSent && (
                <button
                  type="button"
                  onClick={() => {
                    if (forgotEmail.trim()) {
                      setForgotSent(true);
                    }
                  }}
                  disabled={!forgotEmail.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#8B1D2C] hover:bg-[#731724] disabled:opacity-50 text-white cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Reset Link</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignInView;
