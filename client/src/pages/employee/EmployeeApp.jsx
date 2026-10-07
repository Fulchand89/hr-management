import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

// Desktop Layout & Pages
import EmployeeLayout from '../../components/employee/EmployeeLayout';
import EmployeeDashboard from './EmployeeDashboard';
import AttendanceView from './AttendanceView';
import MyAttendanceView from './MyAttendanceView';
import LeavesView from './LeavesView';
import ApplyLeaveModal from './ApplyLeaveModal';
import AttendanceDetailModal from './AttendanceDetailModal';
import NotificationsView from './NotificationsView';
import ProfileView from './ProfileView';
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

export const EmployeeApp = ({ onSwitchToAdmin }) => {
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
      setUnreadCount(res.data?.unreadCount ?? res.data ?? 0);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    loadTodayAttendance();
    loadUnreadCount();
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
      navigate('/employee/signin');
    }
  };

  // Compute active tab from route
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/my-attendance') || path.includes('/myattendance')) return 'my-attendance';
    if (path.includes('/attendance')) return 'attendance';
    if (path.includes('/leaves')) return 'leaves';
    if (path.includes('/notifications')) return 'notifications';
    if (path.includes('/profile')) return 'profile';
    return 'dashboard';
  };

  const handleTabSelect = (tabId) => {
    if (tabId === 'dashboard') navigate('/employee/dashboard');
    else navigate(`/employee/${tabId}`);
  };

  // If on signin route, render standalone signin
  if (location.pathname === '/employee/signin' || location.pathname === '/signin') {
    return <SignInView onSignIn={() => navigate('/employee/dashboard')} />;
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
      onSwitchToAdmin={() => navigate('/admin/dashboard')}
      onSwitchToHR={() => navigate('/hr/dashboard')}
      unreadNotifications={unreadCount}
      onApplyLeaveClick={() => setIsApplyLeaveModalOpen(true)}
      onLogout={handleLogout}
    >
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />

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
              onBackToDashboard={() => navigate('/employee/dashboard')}
            />
          }
        />

        {/* My Monthly Attendance View */}
        <Route
          path="my-attendance"
          element={<MyAttendanceView onBack={() => navigate('/employee/dashboard')} />}
        />
        <Route
          path="myattendance"
          element={<MyAttendanceView onBack={() => navigate('/employee/dashboard')} />}
        />

        {/* Leaves & Applications View */}
        <Route
          path="leaves"
          element={
            <LeavesView
              onBack={() => navigate('/employee/dashboard')}
            />
          }
        />

        {/* Notifications Hub View */}
        <Route
          path="notifications"
          element={<NotificationsView onBack={() => navigate('/employee/dashboard')} />}
        />

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

        {/* Fallback */}
        <Route path="*" element={<Navigate to="dashboard" replace />} />
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
      />
    </EmployeeLayout>
  );
};

export default EmployeeApp;
