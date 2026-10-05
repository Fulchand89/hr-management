import React from 'react';

const colorStyles = {
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 ring-emerald-600/10',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/60 ring-emerald-600/10',
  amber: 'bg-amber-50 text-amber-700 border-amber-200/60 ring-amber-600/10',
  yellow: 'bg-yellow-50 text-yellow-800 border-yellow-200/60 ring-yellow-600/10',
  red: 'bg-rose-50 text-rose-700 border-rose-200/60 ring-rose-600/10',
  blue: 'bg-sky-50 text-sky-700 border-sky-200/60 ring-sky-600/10',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/60 ring-indigo-600/10',
  purple: 'bg-purple-50 text-purple-700 border-purple-200/60 ring-purple-600/10',
  pink: 'bg-pink-50 text-pink-700 border-pink-200/60 ring-pink-600/10',
  teal: 'bg-teal-50 text-teal-700 border-teal-200/60 ring-teal-600/10',
  slate: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/10',
};

export const Badge = ({ children, variant = 'slate', dot = false, className = '' }) => {
  const chosenStyle = colorStyles[variant] || colorStyles.slate;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ring-1 ring-inset ${chosenStyle} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            variant === 'green' || variant === 'emerald'
              ? 'bg-emerald-500'
              : variant === 'amber'
              ? 'bg-amber-500'
              : variant === 'red'
              ? 'bg-rose-500'
              : variant === 'purple'
              ? 'bg-purple-500'
              : variant === 'indigo'
              ? 'bg-indigo-500'
              : variant === 'teal'
              ? 'bg-teal-500'
              : variant === 'blue'
              ? 'bg-sky-500'
              : 'bg-slate-400'
          }`}
        />
      )}
      {children}
    </span>
  );
};

export default Badge;
