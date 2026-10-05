import React from 'react';

export const CircularTimer = ({
  status = 'NOT_PUNCHED_IN', // NOT_PUNCHED_IN | WORKING | ON_BREAK | PUNCHED_OUT
  timeString = '--:--:--',
  subtitle = 'Since 09:12 AM',
  progress = 0, // 0 to 100
}) => {
  // Radius and circumference for SVG circle
  const size = 240;
  const strokeWidth = 10;
  const center = size / 2;
  const radius = center - strokeWidth - 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Colors based on state
  let strokeColor = '#FCE7EC'; // Pink background circle
  let activeStrokeColor = '#8B1D2C'; // Maroon for working
  let badgeText = 'Not Punched In';
  let badgeColor = 'bg-rose-50 text-rose-600 border-rose-200';
  let dotColor = 'bg-rose-500';

  if (status === 'WORKING') {
    activeStrokeColor = '#8B1D2C'; // Deep maroon
    badgeText = 'Working';
    badgeColor = 'bg-emerald-50 text-emerald-600 border-emerald-200';
    dotColor = 'bg-emerald-500';
  } else if (status === 'ON_BREAK') {
    activeStrokeColor = '#F59E0B'; // Orange / Amber
    badgeText = 'Working';
    badgeColor = 'bg-emerald-50 text-emerald-600 border-emerald-200';
    dotColor = 'bg-emerald-500';
  } else if (status === 'PUNCHED_OUT') {
    activeStrokeColor = '#22C55E'; // Green
    badgeText = 'Punched out';
    badgeColor = 'bg-emerald-50 text-emerald-600 border-emerald-200';
    dotColor = 'bg-emerald-500';
  }

  return (
    <div className="relative flex flex-col items-center justify-center my-4">
      {/* SVG Circular Ring */}
      <div className="relative w-60 h-60 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          {/* Background track circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={status === 'NOT_PUNCHED_IN' ? '#FCE7EC' : '#F8E7EA'}
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Active Progress circle */}
          {status !== 'NOT_PUNCHED_IN' && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              stroke={activeStrokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={status === 'PUNCHED_OUT' ? 0 : strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-in-out"
            />
          )}
        </svg>

        {/* Inner Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <span className="text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
            {timeString}
          </span>

          {/* Status Badge */}
          <div
            className={`mt-2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold border ${badgeColor}`}
          >
            <span className={`w-2 h-2 rounded-full ${dotColor}`} />
            {badgeText}
          </div>

          {status !== 'NOT_PUNCHED_IN' && subtitle && (
            <span className="text-[11px] text-slate-400 font-medium mt-1.5">{subtitle}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CircularTimer;
