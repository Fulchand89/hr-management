import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import HRExitLetterView from '../hr/HRExitLetterView';
import HRApplyLeaveView from '../hr/HRApplyLeaveView';
import HRLeaveDetailView from '../hr/HRLeaveDetailView';
import EmployeeKycDocumentsView from './EmployeeKycDocumentsView';
import EmployeeHolidayCalendarView from './EmployeeHolidayCalendarView';
import SignInView from './SignInView';
import ChatView from '../chat/ChatView';

import { useAuth } from '../../context/AuthContext';
import {
  getTodayAttendance,
  punchIn as apiPunchIn,
  startBreak as apiStartBreak,
  endBreak as apiEndBreak,
  punchOut as apiPunchOut,
  getUnreadCount
} from '../../services/employeeService';
import { getAttendanceSnapshot, setAttendanceSnapshot } from '../../services/authStorage';

export const EmployeeApp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, logout } = useAuth();

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
      // Offline / not logged in — retain graceful state
    }
  }, [user?.id]);

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
      loadTodayAttendance();
    };
    window.addEventListener('focus', onWindowFocus);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('focus', onWindowFocus);
    };
  }, [token, loadTodayAttendance, loadUnreadCount]);

  // Live Timer Effect with wall-clock synchronization (immune to browser background throttling)
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

  // ── Attendance Handlers (Real API) ────────────────────────
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
      console.error('Punch-in failed:', err?.response?.data?.message || err.message);
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
      console.error('Break start failed:', err?.response?.data?.message || err.message);
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
      console.error('Break end failed:', err?.response?.data?.message || err.message);
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
    if (path.includes('/holidays') || path.includes('/holiday-calendar') || path.includes('/holiday')) return 'holidays';
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
    if (path.includes('/chat')) return 'chat';
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
              shift={attendanceData?.shift}
              ipAddress={attendanceData?.raw?.ipAddress || attendanceData?.ipAddress}
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

        {/* Company Holiday Calendar */}
        <Route
          path="holidays"
          element={
            <EmployeeHolidayCalendarView
              onBack={() => navigate('/employee/dashboard')}
            />
          }
        />
        <Route path="holiday-calendar" element={<Navigate to="/employee/holidays" replace />} />
        <Route path="holiday" element={<Navigate to="/employee/holidays" replace />} />

        {/* Leaves & Applications View */}
        <Route
          path="leaves"
          element={
            <LeavesView
              onBack={() => navigate('/employee/dashboard')}
            />
          }
        />
        <Route path="leaves/apply" element={<HRApplyLeaveView />} />
        <Route path="leaves/new" element={<HRApplyLeaveView />} />
        <Route path="leaves/create" element={<HRApplyLeaveView />} />
        <Route path="leaves/:id" element={<HRLeaveDetailView />} />
        <Route path="leaves/detail/:id" element={<HRLeaveDetailView />} />
        <Route path="leaves/view/:id" element={<HRLeaveDetailView />} />
        <Route path="apply-leave" element={<Navigate to="/employee/leaves/apply" replace />} />
        <Route path="my-leaves" element={<Navigate to="/employee/leaves" replace />} />
        <Route path="leave-requests" element={<Navigate to="/employee/leaves" replace />} />

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
          path="resignation/letter"
          element={<HRExitLetterView />}
        />
        <Route
          path="resignation/letter/:id"
          element={<HRExitLetterView />}
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
          path="exit/letter"
          element={<HRExitLetterView />}
        />
        <Route
          path="exit/letter/:id"
          element={<HRExitLetterView />}
        />
        <Route
          path="exit-management"
          element={<MyResignationView onBack={() => navigate('/employee/dashboard')} />}
        />

        {/* Removed Referrals & Rewards Redirects */}
        <Route path="referrals" element={<Navigate to="/employee/dashboard" replace />} />
        <Route path="rewards" element={<Navigate to="/employee/dashboard" replace />} />

        {/* Real-time WhatsApp Style Chat */}
        <Route path="chat" element={<ChatView />} />
        <Route path="chat/:conversationId" element={<ChatView />} />

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
