import React, { useState } from 'react';
import { Mail, Lock, Sparkles, CheckCircle2, ShieldCheck, ArrowRight, User } from 'lucide-react';

export const SignInView = ({ onSignIn }) => {
  const [identifier, setIdentifier] = useState('ankit.sharma@workpulse.io');
  const [password, setPassword] = useState('••••••••');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSignIn();
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 border border-slate-100">
        {/* Left Side: Brand Visual & Value Proposition */}
        <div className="bg-gradient-to-br from-[#8B1D2C] via-[#66131F] to-slate-950 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle glow circles */}
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
              Employee Self-Service Portal
            </h2>
            <p className="text-rose-100/80 text-xs sm:text-sm leading-relaxed mb-6">
              Track your daily attendance in real-time, log breaks, manage annual leave quotas, and inspect your work performance with ease.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2.5 text-xs text-rose-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Geofenced automated biometric clock-in</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-rose-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Real-time break & work duration stopwatch</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-rose-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Instant leave request submission & approval tracking</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-8 border-t border-white/10 flex items-center justify-between text-xs text-rose-200">
            <span>Enterprise Security 256-bit</span>
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
              Enter your corporate credentials to access your dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Work Email or Employee ID
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="name@workpulse.io"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#8B1D2C]/20 focus:border-[#8B1D2C] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">Password</label>
                <a href="#forgot" className="text-[11px] font-semibold text-[#8B1D2C] hover:underline">
                  Forgot?
                </a>
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
                className="w-full bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold py-3.5 rounded-xl shadow-md shadow-[#8B1D2C]/30 transition-all duration-150 cursor-pointer active:scale-[0.99] text-xs flex items-center justify-center gap-2"
              >
                Sign In to Portal
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Quick Demo Login Preset Button */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 mb-2">Want to jump right in for demonstration?</p>
            <button
              type="button"
              onClick={onSignIn}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>⚡ One-Click Demo Login (Ankit Sharma)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInView;
