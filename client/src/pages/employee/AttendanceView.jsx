import React from 'react';
import CircularTimer from '../../components/employee/CircularTimer';
import {
  Clock,
  Coffee,
  Play,
  Square,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  AlertCircle,
  MapPin,
} from 'lucide-react';

export const AttendanceView = ({
  status = 'NOT_PUNCHED_IN',
  timeString = '--:--:--',
  sinceText = '',
  progress = 0,
  timeline = [],
  grossWorkingHours = '00:00:00',
  totalWorkingHours = '00:00:00',
  breakDuration = '00:00:00',
  onBack,
  onPunchIn,
  onTakeBreak,
  onEndBreak,
  onPunchOut,
  onBackToDashboard,
}) => {
  return (
    <div className="space-y-6">
      {/* Main 2-Column Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 Cols): Circular Clock & Punch Actions */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                Live Stopwatch & Punch Control
              </span>
              <span className="px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs flex items-center gap-1.5 whitespace-nowrap shrink-0">
                <Clock className="w-3.5 h-3.5 text-[#8B1D2C] shrink-0" />
                Standard Shift (9h)
              </span>
            </div>

            {/* Circular Timer Visual */}
            <div className="my-6">
              <CircularTimer
                status={status}
                timeString={timeString}
                subtitle={sinceText}
                progress={progress}
              />
            </div>

            {/* Shift Progress Bar */}
            <div className="max-w-md mx-auto mb-8 bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-700">Today's Progress</span>
                <span className="font-mono font-bold text-slate-900">{progress}% Completed</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${status === 'PUNCHED_OUT'
                    ? 'bg-emerald-500'
                    : status === 'ON_BREAK'
                      ? 'bg-amber-500'
                      : 'bg-[#8B1D2C]'
                    }`}
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 mt-1.5">
                <span>0h (Punch in)</span>
                <span>4h (Half Day)</span>
                <span>8h (Full Day)</span>
              </div>
            </div>

            {/* Action Buttons based on status */}
            <div className="max-w-md mx-auto">
              {status === 'NOT_PUNCHED_IN' && (
                <button
                  type="button"
                  onClick={onPunchIn}
                  className="w-full bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold py-3.5 px-6 rounded-2xl shadow-md shadow-[#8B1D2C]/30 transition-all cursor-pointer text-sm flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" /> Punch In for Today
                </button>
              )}

              {status === 'WORKING' && (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={onTakeBreak}
                    className="w-full bg-white border-2 border-amber-500 text-amber-700 hover:bg-amber-50 font-bold py-3.5 px-4 rounded-2xl shadow-xs transition-all cursor-pointer text-sm flex items-center justify-center gap-2"
                  >
                    <Coffee className="w-4 h-4 text-amber-600" /> Take Break
                  </button>
                  <button
                    type="button"
                    onClick={onPunchOut}
                    className="w-full bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold py-3.5 px-4 rounded-2xl shadow-md shadow-[#8B1D2C]/30 transition-all cursor-pointer text-sm flex items-center justify-center gap-2"
                  >
                    <Square className="w-4 h-4 fill-white" /> Punch Out
                  </button>
                </div>
              )}

              {status === 'ON_BREAK' && (
                <button
                  type="button"
                  onClick={onEndBreak}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-md shadow-emerald-600/30 transition-all cursor-pointer text-sm flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" /> Resume Working (End Break)
                </button>
              )}

              {status === 'PUNCHED_OUT' && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-center text-xs text-emerald-800 font-semibold">
                  ✓ You have successfully punched out for today! Great job!
                </div>
              )}
            </div>
          </div>

          {/* Bottom Security / Location Audit Badge */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-rose-500" />
              Office Geofence: Primary Office Network
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <ShieldCheck className="w-4 h-4" /> Secure IP & Location Verified
            </span>
          </div>
        </div>

        {/* Right Column (5 Cols): Timeline & Shift Details */}
        <div className="lg:col-span-5 space-y-6">
          {/* Today's Timeline Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Today's Milestone Timeline</h3>
              <span className="text-[11px] text-slate-400 font-mono">
                {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>

            <div className="space-y-4 pl-2">
              {timeline.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No punch activity recorded today yet.
                </div>
              ) : (
                timeline.map((step, idx) => {
                const isLast = idx === timeline.length - 1;

                return (
                  <div key={idx} className="relative flex items-start gap-4">
                    {/* Connecting vertical line */}
                    {!isLast && (
                      <div className="absolute left-2.5 top-6 bottom-0 w-0.5 -mb-4 bg-slate-200" />
                    )}

                    {/* Node Dot */}
                    <div
                      className={`w-5 h-5 rounded-full z-10 shrink-0 flex items-center justify-center mt-0.5 ${step.status === 'completed'
                        ? 'bg-emerald-500 ring-4 ring-emerald-100 text-white'
                        : step.status === 'break'
                          ? 'bg-amber-500 ring-4 ring-amber-100 text-white'
                          : step.status === 'punched_out'
                            ? 'bg-[#8B1D2C] ring-4 ring-rose-100 text-white'
                            : 'bg-slate-300 ring-4 ring-slate-100'
                        }`}
                    >
                      {step.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                      {step.status === 'break' && <Coffee className="w-2.5 h-2.5 text-white" />}
                      {step.status === 'punched_out' && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>

                    {/* Label & Time */}
                    <div className="flex-1 flex items-center justify-between pb-1">
                      <div>
                        <div className="text-xs font-bold text-slate-800">{step.label}</div>
                        <div className="text-[10px] text-slate-400">
                          {step.status === 'completed'
                            ? 'Logged on time'
                            : step.status === 'break'
                              ? 'Paused session'
                              : step.status === 'punched_out'
                                ? 'Final punch'
                                : 'Pending'}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-xs text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                        {step.time || '--:--'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

            {/* Duration Summary in Timeline */}
            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Total Shift Time (Gross)</span>
                <span className="font-bold font-mono text-slate-900">{grossWorkingHours || totalWorkingHours}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Break Duration</span>
                <span className="font-bold font-mono text-amber-700">{breakDuration}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-100/80">
                <span className="text-slate-700 font-bold">Net Effective Hours</span>
                <span className="font-black font-mono text-[#8B1D2C]">{totalWorkingHours}</span>
              </div>
            </div>
          </div>

          {/* Shift Rules & Policies Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Attendance Policies</h3>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Grace Period:</strong> You can punch in until 09:15 AM without being marked late.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Lunch Break:</strong> 1 hour lunch break is permitted between 01:00 PM and 02:30 PM.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Minimum Hours:</strong> At least 4.5 hours required for Half-Day and 8 hours for Full-Day credit.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceView;
