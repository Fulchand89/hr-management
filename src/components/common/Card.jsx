import React from 'react';

export const Card = ({ children, className = '', hover = false, ...props }) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-xs ${
        hover ? 'transition-all duration-200 hover:shadow-md hover:border-slate-300' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, title, subtitle, action, className = '' }) => {
  return (
    <div className={`p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-4 ${className}`}>
      {title || subtitle ? (
        <div>
          {title && <h3 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight">{title}</h3>}
          {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      ) : (
        children
      )}
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export const CardBody = ({ children, className = '' }) => {
  return <div className={`p-5 sm:p-6 ${className}`}>{children}</div>;
};

export default Card;
