import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

// Desktop Layout & Pages
import EmployeeLayout from '../../components/employee/EmployeeLayout';
import EmployeeDashboard from './EmployeeDashboard';
import AttendanceView from './AttendanceView';
import MyAttendanceView from './MyAttendanceView';
import LeavesView from './LeavesView';
import EmployeeAttendanceCorrectionView from './EmployeeAttendanceCorrectionView';
import EmployeeApplyCorrectionView from './EmployeeApplyCorrectionView';
import ApplyLeaveModal from './ApplyLeaveModal';
import AttendanceDetailModal from './AttendanceDetailModal';
import NotificationsView from './NotificationsView';
import ProfileView from './ProfileView';
import EmployeeSalaryView from './EmployeeSalaryView';
import EmployeePoliciesView from './EmployeePoliciesView';
import EmployeePolicyDetailView from './EmployeePolicyDetailView';
import EmployeeHandbookView from './EmployeeHandbookView';
import EmployeePolicyDocumentsView from './EmployeePolicyDocumentsView';
import MyAppraisalView from './MyAppraisalView';
import MyResignationView from './MyResignationView';
import EmployeeKycDocumentsView from './EmployeeKycDocumentsView';
import SignInView from './SignInView';

import { useAuth } from '../../context/AuthContext';
import {
  getTodayAttendance,
  punchIn as apiPunchIn,
  startBreak as apiStartBreak,
  endBreak as apiEndBreak,
  punchOut as apiPunchOut,
  getUnreadCount
} from '../../services/employeeService';

export const EmployeeApp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, logout } = useAuth();

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
      const data = res.data;
      if (data) {
        setAttendanceData(data);
        setAttendanceStatus(data.status || data.attendanceStatus || 'NOT_PUNCHED_IN');
        setWorkingSeconds(data.workingSeconds || 0);
        setBreakSeconds(data.breakSeconds || 0);
        setTimeline(data.timeline || []);
      }
    } catch {
      // Offline / not logged in — retain graceful state
    }
  }, []);

  // Load unread notification count
  const loadUnreadCount = useCallback(async () => {
    try {
      const res = await getUnreadCount();
      const count = res?.data?.unreadCount ?? res?.data ?? 0;
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    loadTodayAttendance();
    loadUnreadCount();

    // Poll unread notifications every 15 seconds for live status updates
    const pollInterval = setInterval(() => {
      loadUnreadCount();
    }, 15000);

    const onWindowFocus = () => {
      loadUnreadCount();
    };
    window.addEventListener('focus', onWindowFocus);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', onWindowFocus);
    };
  }, [token, loadTodayAttendance, loadUnreadCount]);

  // Live Timer Effect
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

  // ── Attendance Handlers (Real API) ────────────────────────
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
      await logout();
    } finally {
      navigate('/signin');
    }
  };

  // Compute active tab from route
  const getActiveTab = () => {
    const path = location.pathname;
    if (
      path.includes('/attendance-correction') ||
      path.includes('/attendance-corrections') ||
      path.includes('/correction-request') ||
      path.includes('/correction-requests')
    ) {
      return 'attendance-correction';
    }
    if (
      path.includes('/my-attendance') ||
      path.includes('/myattendance') ||
      path.includes('/attendance-log') ||
      path.includes('/attendance-history')
    ) {
      return 'my-attendance';
    }
    if (
      path.includes('/attendance') ||
      path.includes('/live-attendance') ||
      path.includes('/timer') ||
      path.includes('/punch')
    ) {
      return 'attendance';
    }
    if (path.includes('/leaves') || path.includes('/my-leaves') || path.includes('/apply-leave')) return 'leaves';
    if (
      path.includes('/salary') ||
      path.includes('/payslips') ||
      path.includes('/payslip') ||
      path.includes('/payroll')
    ) {
      return 'salary';
    }
    if (path.includes('/kyc') || path.includes('/documents') || path.includes('/my-documents')) return 'profile';
    if (path.includes('/policies') || path.includes('/handbook')) return 'policies';
    if (
      path.includes('/appraisals') ||
      path.includes('/performance') ||
      path.includes('/appraisal') ||
      path.includes('/reviews')
    ) {
      return 'appraisals';
    }
    if (
      path.includes('/resignation') ||
      path.includes('/exit') ||
      path.includes('/resignations')
    ) {
      return 'resignation';
    }
    if (path.includes('/notifications') || path.includes('/notification')) return 'notifications';
    if (path.includes('/profile') || path.includes('/my-profile')) return 'profile';
    return 'dashboard';
  };

  const handleTabSelect = (tabId) => {
    if (tabId === 'dashboard') navigate('/employee/dashboard');
    else navigate(`/employee/${tabId}`);
  };

  // If on legacy employee signin route, redirect to unified signin
  if (location.pathname === '/employee/signin') {
    return <Navigate to="/signin" replace />;
  }

  return (
    <EmployeeLayout
      activeTab={getActiveTab()}
      onSelectTab={handleTabSelect}
      attendanceStatus={attendanceStatus}
      workingTime={formatTime(workingSeconds)}
      breakTime={formatTime(breakSeconds)}
      onPunchIn={handlePunchIn}
      onTakeBreak={handleTakeBreak}
      onEndBreak={handleEndBreak}
      onPunchOut={handlePunchOut}
      onSwitchToHR={() => navigate('/hr/dashboard')}
      unreadNotifications={unreadCount}
      onApplyLeaveClick={() => setIsApplyLeaveModalOpen(true)}
      onLogout={handleLogout}
    >
      <Routes>
        <Route index element={<Navigate to="/employee/dashboard" replace />} />

        {/* Dashboard View */}
        <Route
          path="dashboard"
          element={
            <EmployeeDashboard
              attendanceStatus={attendanceStatus}
              punchInTime={attendanceStatus !== 'NOT_PUNCHED_IN' ? (attendanceData?.clockInFormatted || '--:--') : null}
              workingHours={formatTime(workingSeconds)}
              breakHours={formatTime(breakSeconds)}
              timeline={timeline}
              onPunchIn={handlePunchIn}
              onTakeBreak={handleTakeBreak}
              onEndBreak={handleEndBreak}
              onPunchOut={handlePunchOut}
              onNavigateToAttendance={() => navigate('/employee/attendance')}
              onNavigateToLeaves={() => navigate('/employee/leaves')}
              onNavigateToMyAttendance={() => navigate('/employee/my-attendance')}
              onNavigateToResignation={() => navigate('/employee/resignation')}
              onOpenApplyLeave={() => setIsApplyLeaveModalOpen(true)}
              onRequestCorrection={() => navigate('/employee/attendance-correction/new')}
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
            <AttendanceView
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
              onBack={() => navigate('/employee/dashboard')}
              onPunchIn={handlePunchIn}
              onTakeBreak={handleTakeBreak}
              onEndBreak={handleEndBreak}
              onPunchOut={handlePunchOut}
              onRequestCorrection={() => navigate('/employee/attendance-correction/new')}
              onBackToDashboard={() => navigate('/employee/dashboard')}
            />
          }
        />
        <Route path="live-attendance" element={<Navigate to="/employee/attendance" replace />} />
        <Route path="timer" element={<Navigate to="/employee/attendance" replace />} />
        <Route path="punch" element={<Navigate to="/employee/attendance" replace />} />

        {/* My Monthly Attendance View */}
        <Route
          path="my-attendance"
          element={
            <MyAttendanceView
              onBack={() => navigate('/employee/dashboard')}
              onRequestCorrection={() => navigate('/employee/attendance-correction/new')}
            />
          }
        />
        <Route
          path="myattendance"
          element={
            <MyAttendanceView
              onBack={() => navigate('/employee/dashboard')}
              onRequestCorrection={() => navigate('/employee/attendance-correction/new')}
            />
          }
        />
        <Route path="attendance-log" element={<Navigate to="/employee/my-attendance" replace />} />
        <Route path="attendance-history" element={<Navigate to="/employee/my-attendance" replace />} />

        {/* Attendance Correction Dedicated Routes */}
        <Route
          path="attendance-correction"
          element={
            <EmployeeAttendanceCorrectionView
              onBack={() => navigate('/employee/my-attendance')}
            />
          }
        />
        <Route
          path="attendance-correction/new"
          element={<EmployeeApplyCorrectionView />}
        />
        <Route
          path="attendance-correction/apply"
          element={<Navigate to="/employee/attendance-correction/new" replace />}
        />
        <Route
          path="attendance-correction/request"
          element={<Navigate to="/employee/attendance-correction/new" replace />}
        />
        <Route path="attendance-corrections" element={<Navigate to="/employee/attendance-correction" replace />} />
        <Route path="attendance-corrections/new" element={<Navigate to="/employee/attendance-correction/new" replace />} />
        <Route path="correction-request" element={<Navigate to="/employee/attendance-correction" replace />} />
        <Route path="correction-request/new" element={<Navigate to="/employee/attendance-correction/new" replace />} />
        <Route path="correction-requests" element={<Navigate to="/employee/attendance-correction" replace />} />

        {/* Leaves & Applications View */}
        <Route
          path="leaves"
          element={
            <LeavesView
              onBack={() => navigate('/employee/dashboard')}
            />
          }
        />
        <Route path="my-leaves" element={<Navigate to="/employee/leaves" replace />} />
        <Route path="leave-requests" element={<Navigate to="/employee/leaves" replace />} />
        <Route path="apply-leave" element={<Navigate to="/employee/leaves" replace />} />

        {/* Notifications Hub View */}
        <Route
          path="notifications"
          element={
            <NotificationsView
              onBack={() => navigate('/employee/dashboard')}
              onUnreadChange={loadUnreadCount}
            />
          }
        />
        <Route path="notification" element={<Navigate to="/employee/notifications" replace />} />

        {/* Profile View */}
        <Route
          path="profile"
          element={
            <ProfileView
              onBack={() => navigate('/employee/dashboard')}
              onLogout={handleLogout}
            />
          }
        />
        <Route path="my-profile" element={<Navigate to="/employee/profile" replace />} />

        {/* Salary & Compensation (Strictly Read-Only) */}
        <Route
          path="salary"
          element={<EmployeeSalaryView onBack={() => navigate('/employee/dashboard')} />}
        />
        <Route
          path="payslips"
          element={<EmployeeSalaryView onBack={() => navigate('/employee/dashboard')} />}
        />
        <Route
          path="payslip"
          element={<EmployeeSalaryView onBack={() => navigate('/employee/dashboard')} />}
        />
        <Route
          path="payroll"
          element={<EmployeeSalaryView onBack={() => navigate('/employee/dashboard')} />}
        />

        {/* Employee KYC & Identity Compliance Documents */}
        <Route
          path="kyc"
          element={<EmployeeKycDocumentsView onBack={() => navigate('/employee/dashboard')} />}
        />
        <Route
          path="documents"
          element={<EmployeeKycDocumentsView onBack={() => navigate('/employee/dashboard')} />}
        />
        <Route
          path="kyc-documents"
          element={<EmployeeKycDocumentsView onBack={() => navigate('/employee/dashboard')} />}
        />
        <Route
          path="my-documents"
          element={<EmployeeKycDocumentsView onBack={() => navigate('/employee/dashboard')} />}
        />

        {/* Company Policies & Handbook Dedicated Sub-routes */}
        <Route
          path="policies"
          element={<EmployeePoliciesView />}
        />
        <Route
          path="policies/handbook"
          element={<EmployeeHandbookView />}
        />
        <Route
          path="handbook"
          element={<Navigate to="/employee/policies/handbook" replace />}
        />
        <Route
          path="policies/documents"
          element={<EmployeePolicyDocumentsView />}
        />
        <Route
          path="policy-documents"
          element={<Navigate to="/employee/policies/documents" replace />}
        />
        <Route
          path="policies/:id"
          element={<EmployeePolicyDetailView />}
        />

        {/* Performance & Appraisals */}
        <Route
          path="appraisals"
          element={<MyAppraisalView onBack={() => navigate('/employee/dashboard')} />}
        />
        <Route
          path="appraisal"
          element={<MyAppraisalView onBack={() => navigate('/employee/dashboard')} />}
        />
        <Route
          path="performance"
          element={<MyAppraisalView onBack={() => navigate('/employee/dashboard')} />}
        />
        <Route
          path="reviews"
          element={<MyAppraisalView onBack={() => navigate('/employee/dashboard')} />}
        />

        {/* Resignation, Notice Period & Exit Clearance */}
        <Route
          path="resignation"
          element={<MyResignationView onBack={() => navigate('/employee/dashboard')} />}
        />
        <Route
          path="resignations"
          element={<MyResignationView onBack={() => navigate('/employee/dashboard')} />}
        />
        <Route
          path="exit"
          element={<MyResignationView onBack={() => navigate('/employee/dashboard')} />}
        />
        <Route
          path="exit-management"
          element={<MyResignationView onBack={() => navigate('/employee/dashboard')} />}
        />

        {/* Removed Referrals & Rewards Redirects */}
        <Route path="referrals" element={<Navigate to="/employee/dashboard" replace />} />
        <Route path="rewards" element={<Navigate to="/employee/dashboard" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/employee/dashboard" replace />} />
      </Routes>

      {/* Global Apply Leave Modal */}
      <ApplyLeaveModal
        isOpen={isApplyLeaveModalOpen}
        onClose={() => setIsApplyLeaveModalOpen(false)}
        onSubmitLeave={() => {
          setIsApplyLeaveModalOpen(false);
          navigate('/employee/leaves');
        }}
      />

      {/* Global Attendance Day Audit Modal */}
      <AttendanceDetailModal
        isOpen={isAttendanceDetailModalOpen}
        onClose={() => {
          setIsAttendanceDetailModalOpen(false);
          setSelectedRecordDetail(null);
        }}
        selectedDate={selectedDateDetail}
        record={selectedRecordDetail}
        onRequestCorrection={(rec) => {
          setIsAttendanceDetailModalOpen(false);
          const targetDate = rec?.date || selectedDateDetail || '';
          navigate(`/employee/attendance-correction/new?date=${targetDate}`);
        }}
      />
    </EmployeeLayout>
  );
};

export default EmployeeApp;
