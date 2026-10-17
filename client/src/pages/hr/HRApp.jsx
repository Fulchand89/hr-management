import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

// Layout & HR Pages
import HRLayout from '../../components/hr/HRLayout';
import HRDashboard from './HRDashboard';
import HRAttendanceCorrectionView from './HRAttendanceCorrectionView';
import HRLeaveRequestsView from './HRLeaveRequestsView';
import HRLeaveRequestDetailView from './HRLeaveRequestDetailView';
import HRSignInView from './HRSignInView';

// Self-Contained HR Modules
import HRAttendanceView from './HRAttendanceView';
import HRMyAttendanceView from './HRMyAttendanceView';
import HRLeavesView from './HRLeavesView';
import HRNotificationsView from './HRNotificationsView';
import HRProfileView from './HRProfileView';
import HRApplyLeaveModal from './HRApplyLeaveModal';
import HRAttendanceDetailModal from './HRAttendanceDetailModal';
import HRAttendanceCorrectionDetailView from './HRAttendanceCorrectionDetailView';
import HRHolidayManagementView from './HRHolidayManagementView';
import HRAddHolidayView from './HRAddHolidayView';
import HRReportsView from './HRReportsView';
import HRStaffAttendance from './HRStaffAttendance';
import HREmployeeManagementView from './HREmployeeManagementView';
import HRAddEmployeeView from './HRAddEmployeeView';
import HREmployeeProfileDetailView from './HREmployeeProfileDetailView';
import HREmployeeSalaryView from './HREmployeeSalaryView';
import HREmployeeStatusView from './HREmployeeStatusView';
import HRPayrollView from './HRPayrollView';
import HRPayrollProcessView from './HRPayrollProcessView';
import HRPayslipDetailView from './HRPayslipDetailView';
import HRPayrollAdjustView from './HRPayrollAdjustView';
import HRPolicyManagementView from './HRPolicyManagementView';
import HRAddPolicyView from './HRAddPolicyView';
import HRUploadPolicyDocumentView from './HRUploadPolicyDocumentView';
import HREditPolicyView from './HREditPolicyView';
import HRAppraisalManagementView from './HRAppraisalManagementView';
import HRExitManagementView from './HRExitManagementView';
import HRKycVerificationView from './HRKycVerificationView';
import HRKycDocumentDetailView from './HRKycDocumentDetailView';
import HRApplyLeaveView from './HRApplyLeaveView';
import HRLeaveDetailView from './HRLeaveDetailView';
import ChatView from '../chat/ChatView';

import { useAuth } from '../../context/AuthContext';
import {
  getTodayAttendance,
  punchIn as apiPunchIn,
  startBreak as apiStartBreak,
  endBreak as apiEndBreak,
  punchOut as apiPunchOut,
  getUnreadCount,
  getHRDashboard
} from '../../services/hrService';
import { getAttendanceSnapshot, setAttendanceSnapshot } from '../../services/authStorage';

export const HRApp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, logout, login, isLoading } = useAuth();

  const [selectedDateDetail, setSelectedDateDetail] = useState(null);
  const [selectedRecordDetail, setSelectedRecordDetail] = useState(null);

  // Global Modals
  const [isApplyLeaveModalOpen, setIsApplyLeaveModalOpen] = useState(false);
  const [isAttendanceDetailModalOpen, setIsAttendanceDetailModalOpen] = useState(false);

  // Attendance state driven by API with user-scoped cache restoration on refresh
  const initialCache = getAttendanceSnapshot(user?.id);
  const [attendanceData, setAttendanceData] = useState(() => initialCache);
  const [attendanceStatus, setAttendanceStatus] = useState(() => initialCache?.status || initialCache?.attendanceStatus || 'NOT_PUNCHED_IN');
  const [timeline, setTimeline] = useState(() => initialCache?.timeline || []);
  const [unreadCount, setUnreadCount] = useState(0);

  const [workingSeconds, setWorkingSeconds] = useState(() => {
    if (!initialCache) return 0;
    const base = Number(initialCache.workingSeconds) || 0;
    const cachedAt = initialCache.cachedAt || Date.now();
    if (initialCache.status === 'WORKING') {
      const elapsed = Math.max(0, Math.floor((Date.now() - cachedAt) / 1000));
      return base + elapsed;
    }
    return base;
  });

  const [breakSeconds, setBreakSeconds] = useState(() => {
    if (!initialCache) return 0;
    const base = Number(initialCache.breakSeconds) || 0;
    const cachedAt = initialCache.cachedAt || Date.now();
    if (initialCache.status === 'ON_BREAK') {
      const elapsed = Math.max(0, Math.floor((Date.now() - cachedAt) / 1000));
      return base + elapsed;
    }
    return base;
  });

  // Reference for drift-free, tab-throttle immune wall-clock ticking
  const timerBaselineRef = useRef({
    status: initialCache?.status || initialCache?.attendanceStatus || 'NOT_PUNCHED_IN',
    workingSec: initialCache?.workingSeconds || 0,
    breakSec: initialCache?.breakSeconds || 0,
    syncTime: Date.now()
  });

  // Load today's attendance from API on mount
  const loadTodayAttendance = useCallback(async () => {
    try {
      const res = await getTodayAttendance();
      const data = res?.data ?? res ?? null;
      if (data) {
        const status = data.status || data.attendanceStatus || 'NOT_PUNCHED_IN';
        const workSec = Number(data.workingSeconds) || 0;
        const brkSec = Number(data.breakSeconds) || 0;

        setAttendanceData(data);
        setAttendanceStatus(status);
        setWorkingSeconds(workSec);
        setBreakSeconds(brkSec);
        setTimeline(data.timeline || []);

        timerBaselineRef.current = {
          status,
          workingSec: workSec,
          breakSec: brkSec,
          syncTime: Date.now()
        };

        setAttendanceSnapshot(user?.id, {
          ...data,
          status,
          workingSeconds: workSec,
          breakSeconds: brkSec,
          cachedAt: Date.now()
        });
      }
    } catch {
      // Graceful fallback
    }
  }, [user?.id]);

  const [pendingQueueCount, setPendingQueueCount] = useState(0);
  const [pendingResignationsCount, setPendingResignationsCount] = useState(0);

  // Load unread notification count
  const loadUnreadCount = useCallback(async () => {
    try {
      const res = await getUnreadCount();
      setUnreadCount(res?.data?.unreadCount ?? res?.data ?? 0);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  // Load live approvals queue count (Leaves + Attendance Corrections + Resignations)
  const loadPendingCount = useCallback(async () => {
    try {
      const res = await getHRDashboard();
      const hrData = res?.data ?? res ?? {};
      const pendingLeaves = hrData?.stats?.pendingLeaves ?? hrData?.overview?.pendingLeaveRequests ?? 0;
      const pendingCorrections = hrData?.stats?.pendingCorrectionRequests ?? hrData?.overview?.pendingCorrectionRequests ?? 0;
      const pendingResignations = hrData?.stats?.pendingResignations ?? hrData?.overview?.pendingResignationRequests ?? 0;
      setPendingQueueCount(pendingLeaves + pendingCorrections + pendingResignations);
      setPendingResignationsCount(pendingResignations);
    } catch {
      setPendingQueueCount(0);
      setPendingResignationsCount(0);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    loadTodayAttendance();
    loadUnreadCount();
    loadPendingCount();

    // Live Socket & Focus listeners for instant real-time sync
    const handleLiveEvent = () => {
      loadUnreadCount();
      loadPendingCount();
    };

    window.addEventListener('app:notification', handleLiveEvent);
    window.addEventListener('app:resignation_submitted', handleLiveEvent);
    window.addEventListener('app:notification_count_refresh', handleLiveEvent);

    // Auto-refresh unread notifications and pending queue every 15 seconds
    const pollInterval = setInterval(() => {
      loadUnreadCount();
      loadPendingCount();
    }, 15000);

    const onWindowFocus = () => {
      loadTodayAttendance();
      loadUnreadCount();
      loadPendingCount();
    };
    window.addEventListener('focus', onWindowFocus);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', onWindowFocus);
      window.removeEventListener('app:notification', handleLiveEvent);
      window.removeEventListener('app:resignation_submitted', handleLiveEvent);
      window.removeEventListener('app:notification_count_refresh', handleLiveEvent);
    };
  }, [token, loadTodayAttendance, loadUnreadCount, loadPendingCount]);

  // Live Timer Interval Effect with wall-clock sync
  useEffect(() => {
    if (attendanceStatus !== 'WORKING' && attendanceStatus !== 'ON_BREAK') return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - timerBaselineRef.current.syncTime) / 1000);
      if (attendanceStatus === 'WORKING') {
        setWorkingSeconds(timerBaselineRef.current.workingSec + elapsed);
      } else if (attendanceStatus === 'ON_BREAK') {
        setBreakSeconds(timerBaselineRef.current.breakSec + elapsed);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [attendanceStatus]);

  // Format seconds to HH:MM:SS
  const formatTime = (totalSec) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  // ── Attendance Handlers ─────────────────────────────────────
  const handlePunchIn = async () => {
    try {
      const res = await apiPunchIn();
      const data = res?.data ?? res ?? {};
      const status = data.status || 'WORKING';
      const workSec = Number(data.workingSeconds) || 1;
      setAttendanceStatus(status);
      setWorkingSeconds(workSec);
      setTimeline(data.timeline || []);

      timerBaselineRef.current = {
        status,
        workingSec: workSec,
        breakSec: 0,
        syncTime: Date.now()
      };
      await loadTodayAttendance();
    } catch (err) {
      console.debug('Punch-in handled:', err?.response?.data?.message || err.message);
    }
  };

  const handleTakeBreak = async () => {
    try {
      const res = await apiStartBreak('Lunch / Tea Break');
      const data = res?.data ?? res ?? {};
      const status = data.status || 'ON_BREAK';
      const workSec = Number(data.workingSeconds) || workingSeconds;
      const brkSec = Number(data.breakSeconds) || 0;
      setAttendanceStatus(status);
      setWorkingSeconds(workSec);
      setBreakSeconds(brkSec);
      setTimeline(data.timeline || []);

      timerBaselineRef.current = {
        status,
        workingSec: workSec,
        breakSec: brkSec,
        syncTime: Date.now()
      };
      await loadTodayAttendance();
    } catch (err) {
      console.debug('Break start handled:', err?.response?.data?.message || err.message);
    }
  };

  const handleEndBreak = async () => {
    try {
      const res = await apiEndBreak();
      const data = res?.data ?? res ?? {};
      const status = data.status || 'WORKING';
      const workSec = Number(data.workingSeconds) || workingSeconds;
      const brkSec = Number(data.breakSeconds) || 0;
      setAttendanceStatus(status);
      setWorkingSeconds(workSec);
      setBreakSeconds(brkSec);
      setTimeline(data.timeline || []);

      timerBaselineRef.current = {
        status,
        workingSec: workSec,
        breakSec: brkSec,
        syncTime: Date.now()
      };
      await loadTodayAttendance();
    } catch (err) {
      console.debug('Break end handled:', err?.response?.data?.message || err.message);
    }
  };

  const handlePunchOut = async () => {
    try {
      const res = await apiPunchOut();
      const data = res?.data ?? res ?? {};
      const status = data.status || 'PUNCHED_OUT';
      const workSec = Number(data.workingSeconds) || workingSeconds;
      const brkSec = Number(data.breakSeconds) || breakSeconds;
      setAttendanceStatus(status);
      setWorkingSeconds(workSec);
      setBreakSeconds(brkSec);
      setTimeline(data.timeline || []);

      timerBaselineRef.current = {
        status,
        workingSec: workSec,
        breakSec: brkSec,
        syncTime: Date.now()
      };
      await loadTodayAttendance();
    } catch (err) {
      console.debug('Punch-out handled:', err?.response?.data?.message || err.message);
    }
  };

  const handleLogout = async () => {
    try {
      if (logout) await logout();
    } finally {
      navigate('/signin');
    }
  };

  return (
    <HRLayout
      attendanceStatus={attendanceStatus}
      workingTime={formatTime(workingSeconds)}
      breakTime={formatTime(breakSeconds)}
      onPunchIn={handlePunchIn}
      onTakeBreak={handleTakeBreak}
      onEndBreak={handleEndBreak}
      onPunchOut={handlePunchOut}
      unreadNotifications={unreadCount}
      pendingQueueCount={pendingQueueCount}
      pendingResignationsCount={pendingResignationsCount}
      onApplyLeaveClick={() => setIsApplyLeaveModalOpen(true)}
      onLogout={handleLogout}
    >
      <Routes>
        <Route index element={<Navigate to="/hr/dashboard" replace />} />

        {/* Dashboard View (Personal & HR Integrated) */}
        <Route
          path="dashboard"
          element={
            <HRDashboard
              attendanceStatus={attendanceStatus}
              punchInTime={attendanceStatus !== 'NOT_PUNCHED_IN' ? (attendanceData?.clockInFormatted || '--:--') : null}
              workingHours={formatTime(workingSeconds)}
              breakHours={formatTime(breakSeconds)}
              timeline={timeline}
              onPunchIn={handlePunchIn}
              onTakeBreak={handleTakeBreak}
              onEndBreak={handleEndBreak}
              onPunchOut={handlePunchOut}
              onNavigateToAttendance={() => navigate('/hr/attendance')}
              onNavigateToLeaves={() => navigate('/hr/leaves')}
              onNavigateToMyAttendance={() => navigate('/hr/my-attendance')}
              onOpenApplyLeave={() => setIsApplyLeaveModalOpen(true)}
              onSelectAttendanceRecord={(recordOrDate) => {
                if (typeof recordOrDate === 'object' && recordOrDate !== null) {
                  setSelectedDateDetail(recordOrDate.date || null);
                  setSelectedRecordDetail(recordOrDate);
                } else {
                  setSelectedDateDetail(recordOrDate);
                  setSelectedRecordDetail(null);
                }
                setIsAttendanceDetailModalOpen(true);
              }}
            />
          }
        />

        {/* Live Punch & Timer View */}
        <Route
          path="attendance"
          element={
            <HRAttendanceView
              status={attendanceStatus}
              timeString={
                attendanceStatus === 'NOT_PUNCHED_IN'
                  ? '--:--:--'
                  : attendanceStatus === 'ON_BREAK'
                  ? formatTime(breakSeconds)
                  : formatTime(workingSeconds)
              }
              sinceText={
                attendanceStatus === 'ON_BREAK'
                  ? 'Break in progress'
                  : attendanceStatus === 'PUNCHED_OUT'
                  ? 'Punched out for today'
                  : attendanceStatus === 'WORKING'
                  ? `Punched in at ${attendanceData?.clockInFormatted || '--:--'}`
                  : 'Ready to punch in'
              }
              progress={
                attendanceStatus === 'PUNCHED_OUT'
                  ? 100
                  : attendanceStatus === 'ON_BREAK'
                  ? Math.min(100, Math.round((breakSeconds / 3600) * 100))
                  : attendanceStatus === 'WORKING'
                  ? Math.min(100, Math.round((workingSeconds / (8 * 3600)) * 100))
                  : 0
              }
              timeline={timeline}
              grossWorkingHours={formatTime(workingSeconds + breakSeconds)}
              totalWorkingHours={formatTime(workingSeconds)}
              breakDuration={formatTime(breakSeconds)}
              shift={attendanceData?.shift}
              ipAddress={attendanceData?.raw?.ipAddress || attendanceData?.ipAddress}
              onBack={() => navigate('/hr/dashboard')}
              onPunchIn={handlePunchIn}
              onTakeBreak={handleTakeBreak}
              onEndBreak={handleEndBreak}
              onPunchOut={handlePunchOut}
              onBackToDashboard={() => navigate('/hr/dashboard')}
            />
          }
        />
        <Route path="live-attendance" element={<Navigate to="/hr/attendance" replace />} />
        <Route path="timer" element={<Navigate to="/hr/attendance" replace />} />
        <Route path="punch" element={<Navigate to="/hr/attendance" replace />} />

        {/* Monthly Attendance Records */}
        <Route
          path="my-attendance"
          element={<HRMyAttendanceView onBack={() => navigate('/hr/dashboard')} />}
        />
        <Route
          path="myattendance"
          element={<HRMyAttendanceView onBack={() => navigate('/hr/dashboard')} />}
        />
        <Route path="attendance-log" element={<Navigate to="/hr/my-attendance" replace />} />
        <Route path="attendance-history" element={<Navigate to="/hr/my-attendance" replace />} />

        {/* Staff Attendance Records */}
        <Route
          path="staff-attendance"
          element={<HRStaffAttendance />}
        />
        <Route path="staffattendance" element={<HRStaffAttendance />} />
        <Route path="attendance/staff" element={<HRStaffAttendance />} />
        <Route path="employee-attendance" element={<HRStaffAttendance />} />

        {/* Employee Lifecycle Management */}
        <Route
          path="employees"
          element={<HREmployeeManagementView />}
        />
        <Route
          path="employee"
          element={<Navigate to="/hr/employees" replace />}
        />
        <Route
          path="employee-management"
          element={<HREmployeeManagementView />}
        />
        <Route
          path="employees/add"
          element={<HRAddEmployeeView />}
        />
        <Route
          path="employees/add/:tab"
          element={<HRAddEmployeeView />}
        />
        <Route
          path="employees/create"
          element={<HRAddEmployeeView />}
        />
        <Route
          path="employees/create/:tab"
          element={<HRAddEmployeeView />}
        />
        <Route
          path="employees/new"
          element={<HRAddEmployeeView />}
        />
        <Route
          path="employees/new/:tab"
          element={<HRAddEmployeeView />}
        />
        <Route
          path="employee/add"
          element={<HRAddEmployeeView />}
        />
        <Route
          path="employee/add/:tab"
          element={<HRAddEmployeeView />}
        />
        <Route
          path="employee/create"
          element={<HRAddEmployeeView />}
        />
        <Route
          path="employee/create/:tab"
          element={<HRAddEmployeeView />}
        />
        <Route
          path="employee/new"
          element={<HRAddEmployeeView />}
        />
        <Route
          path="employee/new/:tab"
          element={<HRAddEmployeeView />}
        />
        <Route
          path="employees/kyc"
          element={<HREmployeeManagementView defaultTab="kyc" />}
        />
        <Route
          path="employees/kyc/:docId"
          element={<HRKycDocumentDetailView />}
        />
        <Route
          path="employees/documents/:docId"
          element={<HRKycDocumentDetailView />}
        />
        <Route
          path="employees/:id"
          element={<HREmployeeProfileDetailView />}
        />
        <Route
          path="employee/:id"
          element={<HREmployeeProfileDetailView />}
        />
        <Route
          path="employees/:id/edit"
          element={<HRAddEmployeeView isEdit={true} />}
        />
        <Route
          path="employees/:id/edit/:tab"
          element={<HRAddEmployeeView isEdit={true} />}
        />
        <Route
          path="employee/:id/edit"
          element={<HRAddEmployeeView isEdit={true} />}
        />
        <Route
          path="employee/:id/edit/:tab"
          element={<HRAddEmployeeView isEdit={true} />}
        />
        <Route
          path="employees/edit/:id"
          element={<HRAddEmployeeView isEdit={true} />}
        />
        <Route
          path="employees/edit/:id/:tab"
          element={<HRAddEmployeeView isEdit={true} />}
        />
        <Route
          path="employees/:id/salary"
          element={<HREmployeeSalaryView />}
        />
        <Route
          path="employee/:id/salary"
          element={<HREmployeeSalaryView />}
        />
        <Route
          path="employees/:id/status"
          element={<HREmployeeStatusView />}
        />
        <Route
          path="employee/:id/status"
          element={<HREmployeeStatusView />}
        />

        {/* KYC Verification & Document Audit Direct Routes */}
        <Route
          path="kyc"
          element={<HREmployeeManagementView defaultTab="kyc" />}
        />
        <Route
          path="kyc-verification"
          element={<HREmployeeManagementView defaultTab="kyc" />}
        />
        <Route
          path="kyc-documents"
          element={<HREmployeeManagementView defaultTab="kyc" />}
        />
        <Route
          path="documents"
          element={<HREmployeeManagementView defaultTab="kyc" />}
        />
        <Route
          path="kyc/:docId"
          element={<HRKycDocumentDetailView />}
        />
        <Route
          path="documents/:docId"
          element={<HRKycDocumentDetailView />}
        />

        {/* Payroll & Compensation */}
        <Route path="payroll" element={<HRPayrollView />} />
        <Route path="payroll/process" element={<HRPayrollProcessView />} />
        <Route path="payroll/:id" element={<HRPayslipDetailView />} />
        <Route path="payroll/:id/payslip" element={<HRPayslipDetailView />} />
        <Route path="payroll/payslip/:id" element={<HRPayslipDetailView />} />
        <Route path="payroll/:id/adjust" element={<HRPayrollAdjustView />} />
        <Route path="payroll/adjust/:id" element={<HRPayrollAdjustView />} />
        <Route path="payslip/:id" element={<HRPayslipDetailView />} />
        <Route path="payslips/:id" element={<HRPayslipDetailView />} />
        <Route path="payslips" element={<Navigate to="/hr/payroll" replace />} />
        <Route path="salary" element={<Navigate to="/hr/payroll" replace />} />

        {/* Leaves & Personal Applications */}
        <Route
          path="leaves"
          element={<HRLeavesView onBack={() => navigate('/hr/dashboard')} />}
        />
        <Route path="leaves/apply" element={<HRApplyLeaveView />} />
        <Route path="leaves/new" element={<HRApplyLeaveView />} />
        <Route path="leaves/create" element={<HRApplyLeaveView />} />
        <Route path="leaves/:id" element={<HRLeaveDetailView />} />
        <Route path="leaves/detail/:id" element={<HRLeaveDetailView />} />
        <Route path="leaves/view/:id" element={<HRLeaveDetailView />} />
        <Route path="apply-leave" element={<Navigate to="/hr/leaves/apply" replace />} />
        <Route path="my-leaves" element={<Navigate to="/hr/leaves" replace />} />
        <Route path="myleaves" element={<Navigate to="/hr/leaves" replace />} />

        {/* Attendance Corrections (HR Queue) */}
        <Route path="attendance-correction" element={<HRAttendanceCorrectionView />} />
        <Route path="attendance-correction/:id" element={<HRAttendanceCorrectionDetailView />} />
        <Route path="attendance-corrections" element={<HRAttendanceCorrectionView />} />
        <Route path="attendance-corrections/:id" element={<HRAttendanceCorrectionDetailView />} />
        <Route path="corrections" element={<HRAttendanceCorrectionView />} />
        <Route path="corrections/:id" element={<HRAttendanceCorrectionDetailView />} />

        {/* Holiday Management */}
        <Route path="holidays" element={<HRHolidayManagementView />} />
        <Route path="holiday-management" element={<HRHolidayManagementView />} />
        <Route path="holiday" element={<HRHolidayManagementView />} />
        <Route path="holiday-calendar" element={<HRHolidayManagementView />} />
        <Route path="holiday-management/new" element={<HRAddHolidayView />} />
        <Route path="holiday-management/add" element={<HRAddHolidayView />} />
        <Route path="holidays/new" element={<HRAddHolidayView />} />
        <Route path="holidays/add" element={<HRAddHolidayView />} />

        {/* Workforce Reports */}
        <Route path="reports" element={<HRReportsView />} />
        <Route path="report" element={<HRReportsView />} />

        {/* Staff Leave Applications (HR Queue) */}
        <Route path="leave-requests" element={<HRLeaveRequestsView />} />
        <Route path="leave-requests/:id" element={<HRLeaveRequestDetailView />} />
        <Route path="leave-request/:id" element={<HRLeaveRequestDetailView />} />
        <Route path="leave-request" element={<Navigate to="/hr/leave-requests" replace />} />
        <Route path="leave-detail" element={<HRLeaveRequestDetailView />} />
        <Route path="leave-detail/:id" element={<HRLeaveRequestDetailView />} />
        <Route path="leave-approvals" element={<Navigate to="/hr/leave-requests" replace />} />

        {/* Notifications Hub View */}
        <Route
          path="notifications"
          element={
            <HRNotificationsView
              onBack={() => navigate('/hr/dashboard')}
              onUnreadChange={loadUnreadCount}
            />
          }
        />
        <Route path="notification" element={<Navigate to="/hr/notifications" replace />} />

        {/* Profile View */}
        <Route
          path="profile"
          element={
            <HRProfileView
              onBack={() => navigate('/hr/dashboard')}
              onLogout={handleLogout}
            />
          }
        />
        <Route path="my-profile" element={<Navigate to="/hr/profile" replace />} />

        {/* HR Policies & SOPs Administration */}
        <Route
          path="policies"
          element={<HRPolicyManagementView />}
        />
        <Route
          path="policy"
          element={<HRPolicyManagementView />}
        />
        <Route
          path="policy-management"
          element={<HRPolicyManagementView />}
        />
        <Route
          path="policies/add"
          element={<HRAddPolicyView />}
        />
        <Route
          path="policies/new"
          element={<HRAddPolicyView />}
        />
        <Route
          path="policies/create"
          element={<HRAddPolicyView />}
        />
        <Route
          path="policies/upload"
          element={<HRUploadPolicyDocumentView />}
        />
        <Route
          path="policies/edit/:id"
          element={<HREditPolicyView />}
        />
        <Route
          path="policies/:id"
          element={<HREditPolicyView />}
        />

        {/* Appraisal & Increment Cycles */}
        <Route
          path="appraisals"
          element={<HRAppraisalManagementView />}
        />
        <Route
          path="appraisal"
          element={<HRAppraisalManagementView />}
        />
        <Route
          path="performance"
          element={<HRAppraisalManagementView />}
        />
        <Route
          path="reviews"
          element={<HRAppraisalManagementView />}
        />

        {/* Resignation, Notice & Exit Clearance */}
        <Route
          path="exit-management"
          element={<HRExitManagementView />}
        />
        <Route
          path="exit-management/:id/letter"
          element={<Navigate to="/hr/exit-management" replace />}
        />
        <Route
          path="exit-management/letter/:id"
          element={<Navigate to="/hr/exit-management" replace />}
        />
        <Route
          path="exit"
          element={<HRExitManagementView />}
        />
        <Route
          path="exit/:id/letter"
          element={<Navigate to="/hr/exit-management" replace />}
        />
        <Route
          path="exit/letter/:id"
          element={<Navigate to="/hr/exit-management" replace />}
        />
        <Route
          path="exits"
          element={<HRExitManagementView />}
        />
        <Route
          path="resignations"
          element={<HRExitManagementView />}
        />
        <Route
          path="resignations/:id/letter"
          element={<Navigate to="/hr/resignations" replace />}
        />
        <Route
          path="resignations/letter/:id"
          element={<Navigate to="/hr/resignations" replace />}
        />
        <Route
          path="resignation"
          element={<HRExitManagementView />}
        />
        <Route
          path="resignation/:id/letter"
          element={<Navigate to="/hr/resignations" replace />}
        />
        <Route
          path="resignation/letter/:id"
          element={<Navigate to="/hr/resignations" replace />}
        />
        <Route
          path="resignation-management"
          element={<HRExitManagementView />}
        />
        <Route
          path="letters/:id"
          element={<Navigate to="/hr/resignations" replace />}
        />

        {/* Candidate Referrals & Spot Rewards (Removed - Redirect to Dashboard) */}
        <Route
          path="referrals-rewards"
          element={<Navigate to="/hr/dashboard" replace />}
        />

        {/* Real-time WhatsApp Style Chat */}
        <Route path="chat" element={<ChatView />} />
        <Route path="chat/:conversationId" element={<ChatView />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/hr/dashboard" replace />} />
      </Routes>

      {/* Global Apply Leave Modal */}
      <HRApplyLeaveModal
        isOpen={isApplyLeaveModalOpen}
        onClose={() => setIsApplyLeaveModalOpen(false)}
        onSubmitLeave={() => {
          setIsApplyLeaveModalOpen(false);
          navigate('/hr/leaves');
        }}
      />

      {/* Global Attendance Day Audit Modal */}
      <HRAttendanceDetailModal
        isOpen={isAttendanceDetailModalOpen}
        onClose={() => {
          setIsAttendanceDetailModalOpen(false);
          setSelectedRecordDetail(null);
        }}
        selectedDate={selectedDateDetail}
        record={selectedRecordDetail}
      />
    </HRLayout>
  );
};

export default HRApp;
