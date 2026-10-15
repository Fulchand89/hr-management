import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck, KeyRound, ArrowRight } from 'lucide-react';
import { resetPassword } from '../../services/employeeService';

export default function ResetPasswordView() {
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const tokenFromUrl = queryParams.get('token') || '';
  const emailFromUrl = queryParams.get('email') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [email, setEmail] = useState(emailFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (tokenFromUrl) setToken(tokenFromUrl);
    if (emailFromUrl) setEmail(emailFromUrl);
  }, [tokenFromUrl, emailFromUrl]);

  // Validation helpers
  const isLengthValid = newPassword.length >= 8;
  const isMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!token.trim()) {
      setErrorMessage('Password reset token is required. Please check your reset link or email.');
      return;
    }

    if (!isLengthValid) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(token.trim(), newPassword);
      setIsSuccess(true);
    } catch (err) {
      console.error('Password reset failure:', err);
      const apiMsg =
        err?.response?.data?.errors?.[0]?.message ||
        err?.response?.data?.message ||
        'Password reset failed. The token may have expired or is invalid.';
      setErrorMessage(apiMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background glow accents */}
      <div className="absolute top-1/4 -right-32 w-96 h-96 bg-[#8B1D2C]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card */}
      <div className="relative w-full max-w-md bg-white rounded-3xl sm:rounded-[32px] shadow-2xl border border-slate-200/80 overflow-hidden z-10 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-50 text-[#8B1D2C] mb-3 shadow-inner">
            <KeyRound className="w-6 h-6" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#8B1D2C]" />
            Security Credential Update
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Create New Password
          </h2>
          {email ? (
            <p className="text-xs text-slate-500 mt-1">
              Resetting corporate account credentials for <span className="font-semibold text-slate-800">{email}</span>
            </p>
          ) : (
            <p className="text-xs text-slate-500 mt-1">
              Enter your secure reset token and set a new password.
            </p>
          )}
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Success View */}
        {isSuccess ? (
          <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200 text-center">
            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-emerald-800">
                Password Successfully Reset!
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your new corporate password has been configured and all previous sessions have been securely invalidated.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <Link
                to="/signin"
                className="w-full py-3 px-4 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#8B1D2C]/20"
              >
                <span>Sign in as Employee</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/hr/signin"
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Sign in to HR Portal</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Reset Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Token Input (shown if not in URL, or readonly) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Reset Security Token <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste the reset token from your email"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C]"
              />
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-10 py-3 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Confirm New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-10 py-3 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Validation Checklist */}
            <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-[11px] border border-slate-200/80">
              <div className={`flex items-center gap-1.5 ${isLengthValid ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isLengthValid ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span>At least 8 characters long</span>
              </div>
              <div className={`flex items-center gap-1.5 ${isMatch ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isMatch ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span>Both passwords match</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !isLengthValid || !isMatch || !token.trim()}
              className="w-full py-3 px-4 rounded-2xl bg-[#8B1D2C] hover:bg-[#731724] active:scale-[0.99] disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-[#8B1D2C]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Reset & Save Password</span>
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <Link
                to="/signin"
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#8B1D2C] transition-colors"
              >
                <span>Remember password? Sign in</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
