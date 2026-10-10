import React, { useState, useEffect, useCallback } from 'react';
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
import HRReferralsRewardsView from './HRReferralsRewardsView';
import HRKycVerificationView from './HRKycVerificationView';

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

export const HRApp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, logout, login, isLoading } = useAuth();

  const [selectedDateDetail, setSelectedDateDetail] = useState(null);
  const [selectedRecordDetail, setSelectedRecordDetail] = useState(null);

  // Global Modals
  const [isApplyLeaveModalOpen, setIsApplyLeaveModalOpen] = useState(false);
  const [isAttendanceDetailModalOpen, setIsAttendanceDetailModalOpen] = useState(false);

  // Attendance state driven by API
  const [attendanceData, setAttendanceData] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState('NOT_PUNCHED_IN');
  const [workingSeconds, setWorkingSeconds] = useState(0);
  const [breakSeconds, setBreakSeconds] = useState(0);
  const [timeline, setTimeline] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);



  // Load today's attendance from API on mount
  const loadTodayAttendance = useCallback(async () => {
    try {
      const res = await getTodayAttendance();
      const data = res?.data ?? res ?? null;
      if (data) {
        setAttendanceData(data);
        setAttendanceStatus(data.status || data.attendanceStatus || 'NOT_PUNCHED_IN');
        setWorkingSeconds(data.workingSeconds || 0);
        setBreakSeconds(data.breakSeconds || 0);
        setTimeline(data.timeline || []);
      }
    } catch {
      // Graceful fallback
    }
  }, []);

  const [pendingQueueCount, setPendingQueueCount] = useState(0);

  // Load unread notification count
  const loadUnreadCount = useCallback(async () => {
    try {
      const res = await getUnreadCount();
      setUnreadCount(res?.data?.unreadCount ?? res?.data ?? 0);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  // Load live approvals queue count
  const loadPendingCount = useCallback(async () => {
    try {
      const res = await getHRDashboard();
      const hrData = res?.data ?? res ?? {};
      const pendingLeaves = hrData?.stats?.pendingLeaves || 0;
      const pendingCorrections = hrData?.stats?.pendingCorrectionRequests || 0;
      setPendingQueueCount(pendingLeaves + pendingCorrections);
    } catch {
      setPendingQueueCount(0);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    loadTodayAttendance();
    loadUnreadCount();
    loadPendingCount();
  }, [token, loadTodayAttendance, loadUnreadCount, loadPendingCount]);

  // Live Timer Interval Effect
  useEffect(() => {
    let interval = null;
    if (attendanceStatus === 'WORKING') {
      interval = setInterval(() => {
        setWorkingSeconds((prev) => prev + 1);
      }, 1000);
    } else if (attendanceStatus === 'ON_BREAK') {
      interval = setInterval(() => {
        setBreakSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
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
      setAttendanceStatus(data.status || 'WORKING');
      setWorkingSeconds(data.workingSeconds || 1);
      setTimeline(data.timeline || []);
      await loadTodayAttendance();
    } catch (err) {
      console.error('Punch-in failed:', err?.response?.data?.message || err.message);
    }
  };

  const handleTakeBreak = async () => {
    try {
      const res = await apiStartBreak('Lunch / Tea Break');
      const data = res?.data ?? res ?? {};
      setAttendanceStatus(data.status || 'ON_BREAK');
      setTimeline(data.timeline || []);
      await loadTodayAttendance();
    } catch (err) {
      console.error('Break start failed:', err?.response?.data?.message || err.message);
    }
  };

  const handleEndBreak = async () => {
    try {
      const res = await apiEndBreak();
      const data = res?.data ?? res ?? {};
      setAttendanceStatus(data.status || 'WORKING');
      setBreakSeconds(data.breakSeconds || 0);
      setTimeline(data.timeline || []);
      await loadTodayAttendance();
    } catch (err) {
      console.error('Break end failed:', err?.response?.data?.message || err.message);
    }
  };

  const handlePunchOut = async () => {
    try {
      const res = await apiPunchOut();
      const data = res?.data ?? res ?? {};
      setAttendanceStatus(data.status || 'PUNCHED_OUT');
      setTimeline(data.timeline || []);
      await loadTodayAttendance();
    } catch (err) {
      console.error('Punch-out failed:', err?.response?.data?.message || err.message);
    }
  };

  const handleLogout = async () => {
    try {
      if (logout) await logout();
    } finally {
      navigate('/signin');
    }
  };

  // If on legacy hr/signin route, redirect to unified signin
  if (location.pathname === '/hr/signin') {
    return <Navigate to="/signin" replace />;
  }

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
      onApplyLeaveClick={() => setIsApplyLeaveModalOpen(true)}
      onLogout={handleLogout}
    >
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />

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
              onBack={() => navigate('/hr/dashboard')}
              onPunchIn={handlePunchIn}
              onTakeBreak={handleTakeBreak}
              onEndBreak={handleEndBreak}
              onPunchOut={handlePunchOut}
              onBackToDashboard={() => navigate('/hr/dashboard')}
            />
          }
        />

        {/* Monthly Attendance Records */}
        <Route
          path="my-attendance"
          element={<HRMyAttendanceView onBack={() => navigate('/hr/dashboard')} />}
        />
        <Route
          path="myattendance"
          element={<HRMyAttendanceView onBack={() => navigate('/hr/dashboard')} />}
        />

        {/* Staff Attendance Records */}
        <Route
          path="staff-attendance"
          element={<HRStaffAttendance />}
        />

        {/* Employee Lifecycle Management */}
        <Route
          path="employees"
          element={<HREmployeeManagementView />}
        />
        <Route
          path="employees/add"
          element={<HRAddEmployeeView />}
        />
        <Route
          path="employees/create"
          element={<HRAddEmployeeView />}
        />
        <Route
          path="employees/new"
          element={<HRAddEmployeeView />}
        />
        <Route
          path="employees/:id"
          element={<HREmployeeProfileDetailView />}
        />
        <Route
          path="employees/:id/edit"
          element={<HRAddEmployeeView isEdit={true} />}
        />
        <Route
          path="employees/:id/salary"
          element={<HREmployeeSalaryView />}
        />
        <Route
          path="employees/:id/status"
          element={<HREmployeeStatusView />}
        />
        <Route
          path="employee-management"
          element={<HREmployeeManagementView />}
        />

        {/* Payroll & Compensation */}
        <Route path="payroll" element={<HRPayrollView />} />
        <Route path="payroll/process" element={<HRPayrollProcessView />} />
        <Route path="payroll/:id/payslip" element={<HRPayslipDetailView />} />
        <Route path="payroll/:id/adjust" element={<HRPayrollAdjustView />} />

        {/* Leaves & Requests View */}
        <Route
          path="leaves"
          element={<HRLeavesView onBack={() => navigate('/hr/dashboard')} />}
        />

        {/* Attendance Corrections (HR Queue) */}
        <Route path="attendance-correction" element={<HRAttendanceCorrectionView />} />
        <Route path="attendance-correction/:id" element={<HRAttendanceCorrectionDetailView />} />

        {/* Holiday Management */}
        <Route path="holidays" element={<HRHolidayManagementView />} />
        <Route path="holiday-management" element={<HRHolidayManagementView />} />

        {/* Workforce Reports */}
        <Route path="reports" element={<HRReportsView />} />

        {/* Staff Leave Applications (HR Queue) */}
        <Route path="leave-requests" element={<HRLeaveRequestsView />} />
        <Route path="leave-requests/:id" element={<HRLeaveRequestDetailView />} />
        <Route path="leave-detail" element={<HRLeaveRequestDetailView />} />

        {/* Notifications Hub View */}
        <Route
          path="notifications"
          element={<HRNotificationsView onBack={() => navigate('/hr/dashboard')} />}
        />

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

        {/* HR Policies & SOPs Administration */}
        <Route
          path="policies"
          element={<HRPolicyManagementView />}
        />
        <Route
          path="policies/add"
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

        {/* Appraisal & Increment Cycles */}
        <Route
          path="appraisals"
          element={<HRAppraisalManagementView />}
        />

        {/* Resignation, Notice & Exit Clearance */}
        <Route
          path="exit-management"
          element={<HRExitManagementView />}
        />

        {/* Candidate Referrals & Spot Rewards */}
        <Route
          path="referrals-rewards"
          element={<HRReferralsRewardsView />}
        />

        {/* Employee KYC Documents Verification */}
        <Route
          path="kyc-documents"
          element={<HRKycVerificationView />}
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="dashboard" replace />} />
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
