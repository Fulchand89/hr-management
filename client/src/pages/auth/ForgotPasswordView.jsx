import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Key, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, ShieldCheck, Send, ExternalLink } from 'lucide-react';
import { forgotPassword } from '../../services/employeeService';

export default function ForgotPasswordView() {
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const initialEmail = location.state?.email || queryParams.get('email') || '';
  const initialPortal = location.state?.portal || (location.pathname.startsWith('/hr') ? 'hr' : 'employee');

  const [email, setEmail] = useState(initialEmail);
  const [portal, setPortal] = useState(initialPortal);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    if (initialEmail && !email) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Please enter your registered corporate email or Employee ID');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await forgotPassword(email.trim());
      const responseData = res?.data || {};
      setSuccessData({
        message: res?.message || 'Password reset link has been dispatched.',
        targetEmail: responseData.email || email.trim(),
        previewUrl: responseData.previewUrl || null,
        resetToken: responseData.resetToken || null,
        resetUrl: responseData.resetUrl || null
      });
    } catch (err) {
      console.error('Forgot password error:', err);
      const apiMsg =
        err?.response?.data?.errors?.[0]?.message ||
        err?.response?.data?.message ||
        'Failed to process password reset request. Please check your network connection.';
      setErrorMessage(apiMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const loginRedirectUrl = portal === 'hr' ? '/hr/signin' : '/signin';

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#8B1D2C]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="relative w-full max-w-md bg-white rounded-3xl sm:rounded-[32px] shadow-2xl border border-slate-200/80 overflow-hidden z-10 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-50 text-[#8B1D2C] mb-3 shadow-inner">
            <Key className="w-6 h-6" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#8B1D2C]" />
            Corporate Account Recovery
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Forgot Password?
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Enter your registered corporate email or Employee ID to receive secure reset instructions.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Success View */}
        {successData ? (
          <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Password Reset Email Sent</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                We have dispatched a password reset link to:
                <br />
                <strong className="text-slate-900 font-mono text-[13px] bg-white px-2 py-0.5 rounded-md border border-emerald-200 inline-block mt-1">
                  {successData.targetEmail}
                </strong>
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Please check your inbox or spam folder. The password reset link will expire in <strong>1 hour</strong>.
              </p>
            </div>

            {/* If test mail preview is available from Ethereal */}
            {successData.previewUrl && (
              <a
                href={successData.previewUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/80 text-indigo-700 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Test Email Preview (Inbox Simulation)</span>
              </a>
            )}

            {/* Direct Quick Reset in dev mode */}
            {successData.resetToken && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 space-y-2">
                <span className="font-bold flex items-center gap-1.5 text-amber-800">
                  ⚡ Quick Reset Available (Development Link)
                </span>
                <p className="text-amber-700 text-[11px]">
                  You can directly set a new password without waiting for inbox delivery:
                </p>
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/reset-password?token=${successData.resetToken}&email=${encodeURIComponent(
                        successData.targetEmail
                      )}`
                    )
                  }
                  className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Continue to Reset Password Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setSuccessData(null);
                  setEmail('');
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
              >
                Send to another email / ID
              </button>

              <Link
                to={loginRedirectUrl}
                className="w-full py-3 px-4 rounded-xl bg-[#8B1D2C] hover:bg-[#731724] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#8B1D2C]/20"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Work Email or Employee ID <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rahul@guptatechweb.com or EMP-001"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-3.5 py-3 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                We'll verify your identity and send an authenticated recovery link.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full py-3 px-4 rounded-2xl bg-[#8B1D2C] hover:bg-[#731724] active:scale-[0.99] disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-[#8B1D2C]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Sending Recovery Email...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Password Reset Link</span>
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <Link
                to={loginRedirectUrl}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#8B1D2C] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </form>
        )}

        {/* Footer Support Info */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            Need urgent assistance? Contact{' '}
            <a href="mailto:support@guptatechweb.com" className="font-bold text-slate-600 hover:underline">
              support@guptatechweb.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
