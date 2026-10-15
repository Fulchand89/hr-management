import React, { useState } from 'react';
import CircularTimer from '../../components/employee/CircularTimer';
import {
  Clock,
  Coffee,
  Play,
  Square,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Loader2,
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
  shift = null,
  ipAddress = null,
  onBack,
  onPunchIn,
  onTakeBreak,
  onEndBreak,
  onPunchOut,
  onBackToDashboard,
  onRequestCorrection,
}) => {
  const [loadingAction, setLoadingAction] = useState(null);

  const handleAction = async (actionFn, name) => {
    if (loadingAction || !actionFn) return;
    setLoadingAction(name);
    try {
      await actionFn();
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP SECTION: Live Stopwatch & Punch Control (Full Width Card) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-4 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Live Stopwatch & Punch Control
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {onRequestCorrection && (
                <button
                  type="button"
                  onClick={onRequestCorrection}
                  className="px-2.5 sm:px-3 py-1 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-[#8B1D2C] hover:bg-rose-100/70 shadow-2xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
                >
                  <Clock className="w-3.5 h-3.5 text-[#8B1D2C]" />
                  Request Correction
                </button>
              )}
              {shift && (shift.name || shift.display) && (
                <span className="px-2.5 sm:px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs flex items-center gap-1.5 whitespace-nowrap">
                  <Clock className="w-3.5 h-3.5 text-[#8B1D2C]" />
                  {shift.display || `${shift.name}${shift.startTime ? ` (${shift.startTime} - ${shift.endTime})` : ''}`}
                </span>
              )}
            </div>
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
                className={`h-full rounded-full transition-all duration-500 ${
                  status === 'PUNCHED_OUT'
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
                disabled={!!loadingAction}
                onClick={() => handleAction(onPunchIn, 'punch_in')}
                className="w-full bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold py-3.5 px-6 rounded-2xl shadow-md shadow-[#8B1D2C]/30 transition-all cursor-pointer text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loadingAction === 'punch_in' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Play className="w-4 h-4 fill-white" />
                )}
                <span>{loadingAction === 'punch_in' ? 'Punching In...' : 'Punch In for Today'}</span>
              </button>
            )}

            {status === 'WORKING' && (
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  disabled={!!loadingAction}
                  onClick={() => handleAction(onTakeBreak, 'take_break')}
                  className="w-full bg-white border-2 border-amber-500 text-amber-700 hover:bg-amber-50 font-bold py-3.5 px-4 rounded-2xl shadow-xs transition-all cursor-pointer text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loadingAction === 'take_break' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                  ) : (
                    <Coffee className="w-4 h-4 text-amber-600" />
                  )}
                  <span>{loadingAction === 'take_break' ? 'Updating...' : 'Take Break'}</span>
                </button>
                <button
                  type="button"
                  disabled={!!loadingAction}
                  onClick={() => handleAction(onPunchOut, 'punch_out')}
                  className="w-full bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold py-3.5 px-4 rounded-2xl shadow-md shadow-[#8B1D2C]/30 transition-all cursor-pointer text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loadingAction === 'punch_out' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Square className="w-4 h-4 fill-white" />
                  )}
                  <span>{loadingAction === 'punch_out' ? 'Finishing...' : 'Punch Out'}</span>
                </button>
              </div>
            )}

            {status === 'ON_BREAK' && (
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  disabled={!!loadingAction}
                  onClick={() => handleAction(onEndBreak, 'end_break')}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-md shadow-emerald-600/30 transition-all cursor-pointer text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loadingAction === 'end_break' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Play className="w-4 h-4 fill-white" />
                  )}
                  <span>{loadingAction === 'end_break' ? 'Resuming...' : 'Resume Working'}</span>
                </button>
                <button
                  type="button"
                  disabled={!!loadingAction}
                  onClick={() => handleAction(onPunchOut, 'punch_out')}
                  className="w-full bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold py-3.5 px-4 rounded-2xl shadow-md shadow-[#8B1D2C]/30 transition-all cursor-pointer text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loadingAction === 'punch_out' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Square className="w-4 h-4 fill-white" />
                  )}
                  <span>{loadingAction === 'punch_out' ? 'Finishing...' : 'Punch Out'}</span>
                </button>
              </div>
            )}

            {status === 'PUNCHED_OUT' && (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-center text-xs text-emerald-800 font-semibold">
                  ✓ Punched out ({totalWorkingHours || '00:00:00'} worked so far). You can punch in again anytime today!
                </div>
                <button
                  type="button"
                  disabled={!!loadingAction}
                  onClick={() => handleAction(onPunchIn, 'punch_in')}
                  className="w-full bg-[#8B1D2C] hover:bg-[#731724] text-white font-bold py-3.5 px-6 rounded-2xl shadow-md shadow-[#8B1D2C]/30 transition-all cursor-pointer text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loadingAction === 'punch_in' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Play className="w-4 h-4 fill-white" />
                  )}
                  <span>{loadingAction === 'punch_in' ? 'Punching In...' : 'Punch In Again'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Security / Location Audit Badge */}
        {ipAddress && (
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-rose-500" />
              Network IP: {ipAddress}
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <ShieldCheck className="w-4 h-4" /> Secure IP & Attendance Verified
            </span>
          </div>
        )}
      </div>

      {/* 2. BOTTOM SECTION: Milestone Timeline, Shift Configuration & Attendance Correction (Underneath) */}
      <div className={`grid grid-cols-1 ${onRequestCorrection ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
        {/* Today's Timeline Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Today's Milestone Timeline</h3>
              <span className="text-[11px] text-slate-400 font-mono">
                {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>

            <div className="space-y-4 pl-2 max-h-[300px] overflow-y-auto pr-1">
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
                        className={`w-5 h-5 rounded-full z-10 shrink-0 flex items-center justify-center mt-0.5 ${
                          step.status === 'completed'
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

        {/* Dynamic Shift Rules Card (loaded from database shifts table) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Shift Configuration & Policies</h3>
              <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Active Policy
              </span>
            </div>
            <div className="space-y-3.5 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Shift Timings:</strong> {shift?.startTime && shift?.endTime ? `${shift.startTime} to ${shift.endTime}` : '10:00 to 19:00'} ({shift?.name || 'Active Shift'}).
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Grace Period:</strong> {shift?.graceMinutes ?? shift?.gracePeriodMinutes ?? 15} minutes grace allowed from shift start.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Break Allowed:</strong> Maximum {shift?.breakAllowedMinutes ?? 60} minutes ({Math.round((shift?.breakAllowedMinutes ?? 60) / 60)}h) break duration permitted.
                </span>
              </div>
              {shift?.halfDayHours !== undefined && shift?.fullDayHours !== undefined && (
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Work Hours Requirement:</strong> {shift.halfDayHours}h required for Half-Day, {shift.fullDayHours}h required for Full-Day credit.
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Company workforce shift rules and guidelines.
          </div>
        </div>

        {/* Attendance Correction Helper Card */}
        {onRequestCorrection && (
          <div className="bg-rose-50/40 rounded-3xl p-6 border border-rose-100 shadow-2xs space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-[#8B1D2C] text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Attendance Correction</h3>
                  <p className="text-[11px] text-slate-500">Missed a punch or delayed clock-in?</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                If your attendance was marked late or missed due to official duty, client visit, or technical error, submit a correction request to HR for approval.
              </p>
            </div>
            <button
              type="button"
              onClick={onRequestCorrection}
              className="w-full mt-3 py-2.5 px-4 rounded-xl bg-white border border-rose-200 hover:bg-rose-50 text-[#8B1D2C] font-bold text-xs shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Request Attendance Correction</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceView;
