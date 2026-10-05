import React, { useState, useEffect } from 'react';

// Desktop Layout & Pages
import EmployeeLayout from '../../components/employee/EmployeeLayout';
import EmployeeDashboard from './EmployeeDashboard';
import AttendanceView from './AttendanceView';
import MyAttendanceView from './MyAttendanceView';
import LeavesView from './LeavesView';
import ApplyLeaveModal from './ApplyLeaveModal';
import LeaveDetailModal from './LeaveDetailModal';
import AttendanceDetailModal from './AttendanceDetailModal';
import NotificationsView from './NotificationsView';
import ProfileView from './ProfileView';
import SignInView from './SignInView';

export const EmployeeApp = ({ onSwitchToAdmin }) => {
  // Navigation State: 'home' | 'attendance' | 'my-attendance' | 'leaves' | 'notifications' | 'profile' | 'signin'
  const [currentScreen, setCurrentScreen] = useState('home');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [selectedDateDetail, setSelectedDateDetail] = useState('12 Aug 2026');

  // Global Modals
  const [isApplyLeaveModalOpen, setIsApplyLeaveModalOpen] = useState(false);
  const [isAttendanceDetailModalOpen, setIsAttendanceDetailModalOpen] = useState(false);

  // Live Stopwatch & Punch States
  const [attendanceStatus, setAttendanceStatus] = useState('WORKING'); // 'NOT_PUNCHED_IN' | 'WORKING' | 'ON_BREAK' | 'PUNCHED_OUT'
  const [workingSeconds, setWorkingSeconds] = useState(19920); // ~05h 32m
  const [breakSeconds, setBreakSeconds] = useState(2100); // 35m break

  // Sample timeline
  const [timeline, setTimeline] = useState([
    { label: 'Punch In', time: '09:12 AM', status: 'completed' },
    { label: 'Break Started', time: '01:15 PM', status: 'completed' },
    { label: 'Break Ended', time: '01:50 PM', status: 'completed' },
    { label: 'Punch Out', time: '--:--', status: 'pending' },
  ]);

  // Initial leaves list (15 records for 10-per-page pagination)
  const [leavesList, setLeavesList] = useState([
    {
      id: 'LV-1001',
      leaveType: 'Casual Leave',
      fromDate: '15 Aug 2026',
      toDate: '15 Aug 2026',
      duration: '1 Day',
      days: '1',
      status: 'Pending',
      reason: 'Family function in hometown',
      appliedOn: '01 Aug 2026',
    },
    {
      id: 'LV-1002',
      leaveType: 'Sick Leave',
      fromDate: '10 Jul 2026',
      toDate: '10 Jul 2026',
      duration: '1 Day',
      days: '1',
      status: 'Approved',
      reason: 'Fever & medical rest prescribed by physician',
      appliedOn: '09 Jul 2026',
    },
    {
      id: 'LV-1003',
      leaveType: 'Half Day',
      fromDate: '15 Jun 2026',
      toDate: '15 Jun 2026',
      duration: '0.5 Day (Second Half)',
      days: '0.5',
      status: 'Rejected',
      reason: 'Doctor dental checkup appointment',
      appliedOn: '14 Jun 2026',
    },
    {
      id: 'LV-1004',
      leaveType: 'Casual Leave',
      fromDate: '22 May 2026',
      toDate: '23 May 2026',
      duration: '2 Days',
      days: '2',
      status: 'Approved',
      reason: 'Attending cousin wedding in Jaipur',
      appliedOn: '18 May 2026',
    },
    {
      id: 'LV-1005',
      leaveType: 'Sick Leave',
      fromDate: '05 May 2026',
      toDate: '06 May 2026',
      duration: '2 Days',
      days: '2',
      status: 'Approved',
      reason: 'Viral flu recovery',
      appliedOn: '04 May 2026',
    },
    {
      id: 'LV-1006',
      leaveType: 'Half Day',
      fromDate: '20 Apr 2026',
      toDate: '20 Apr 2026',
      duration: '0.5 Day (First Half)',
      days: '0.5',
      status: 'Approved',
      reason: 'Passport renewal office appointment',
      appliedOn: '18 Apr 2026',
    },
    {
      id: 'LV-1007',
      leaveType: 'Casual Leave',
      fromDate: '08 Apr 2026',
      toDate: '08 Apr 2026',
      duration: '1 Day',
      days: '1',
      status: 'Rejected',
      reason: 'Personal errands',
      appliedOn: '07 Apr 2026',
    },
    {
      id: 'LV-1008',
      leaveType: 'Comp Off',
      fromDate: '25 Mar 2026',
      toDate: '25 Mar 2026',
      duration: '1 Day',
      days: '1',
      status: 'Approved',
      reason: 'Compensatory off for weekend deployment release',
      appliedOn: '23 Mar 2026',
    },
    {
      id: 'LV-1009',
      leaveType: 'Sick Leave',
      fromDate: '12 Mar 2026',
      toDate: '12 Mar 2026',
      duration: '1 Day',
      days: '1',
      status: 'Approved',
      reason: 'Severe migraine headache',
      appliedOn: '12 Mar 2026',
    },
    {
      id: 'LV-1010',
      leaveType: 'Casual Leave',
      fromDate: '18 Feb 2026',
      toDate: '19 Feb 2026',
      duration: '2 Days',
      days: '2',
      status: 'Approved',
      reason: 'Annual family holiday trip',
      appliedOn: '10 Feb 2026',
    },
    {
      id: 'LV-1011',
      leaveType: 'Half Day',
      fromDate: '05 Feb 2026',
      toDate: '05 Feb 2026',
      duration: '0.5 Day (Second Half)',
      days: '0.5',
      status: 'Pending',
      reason: 'Home electricity meter repair inspection',
      appliedOn: '03 Feb 2026',
    },
    {
      id: 'LV-1012',
      leaveType: 'Sick Leave',
      fromDate: '20 Jan 2026',
      toDate: '20 Jan 2026',
      duration: '1 Day',
      days: '1',
      status: 'Approved',
      reason: 'Stomach infection and doctor visit',
      appliedOn: '19 Jan 2026',
    },
    {
      id: 'LV-1013',
      leaveType: 'Casual Leave',
      fromDate: '02 Jan 2026',
      toDate: '02 Jan 2026',
      duration: '1 Day',
      days: '1',
      status: 'Approved',
      reason: 'New Year post celebration recovery',
      appliedOn: '28 Dec 2025',
    },
    {
      id: 'LV-1014',
      leaveType: 'Unpaid Leave',
      fromDate: '15 Dec 2025',
      toDate: '16 Dec 2025',
      duration: '2 Days',
      days: '2',
      status: 'Rejected',
      reason: 'Extended vacation travel',
      appliedOn: '10 Dec 2025',
    },
    {
      id: 'LV-1015',
      leaveType: 'Casual Leave',
      fromDate: '01 Dec 2025',
      toDate: '01 Dec 2025',
      duration: '1 Day',
      days: '1',
      status: 'Approved',
      reason: 'Bank work and registration formalities',
      appliedOn: '26 Nov 2025',
    },
  ]);

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

  // Actions for Attendance
  const handlePunchIn = () => {
    setAttendanceStatus('WORKING');
    setWorkingSeconds(1);
    setTimeline([
      { label: 'Punch In', time: '09:12 AM', status: 'completed' },
      { label: 'Break Started', time: '--:--', status: 'pending' },
      { label: 'Break Ended', time: '--:--', status: 'pending' },
      { label: 'Punch Out', time: '--:--', status: 'pending' },
    ]);
  };

  const handleTakeBreak = () => {
    setAttendanceStatus('ON_BREAK');
    setTimeline((prev) =>
      prev.map((step, idx) =>
        idx === 1 ? { ...step, time: '01:15 PM', status: 'break' } : step
      )
    );
  };

  const handleEndBreak = () => {
    setAttendanceStatus('WORKING');
    setTimeline((prev) =>
      prev.map((step, idx) =>
        idx === 2 ? { ...step, time: '01:50 PM', status: 'completed' } : step
      )
    );
  };

  const handlePunchOut = () => {
    setAttendanceStatus('PUNCHED_OUT');
    setTimeline((prev) =>
      prev.map((step, idx) =>
        idx === 3 ? { ...step, time: '05:47 PM', status: 'completed' } : step
      )
    );
  };

  // Actions for Leaves
  const handleApplyNewLeave = (newLeaveData) => {
    const newId = `LV-${1000 + leavesList.length + 1}`;
    const newEntry = {
      ...newLeaveData,
      id: newId,
      status: 'Pending',
      appliedOn: 'Today',
    };
    setLeavesList((prev) => [newEntry, ...prev]);
    setIsApplyLeaveModalOpen(false);
  };

  const handleCancelLeave = (leaveId) => {
    if (window.confirm('Are you sure you want to cancel this leave application?')) {
      setLeavesList((prev) => prev.filter((l) => l.id !== leaveId));
    }
  };

  // Map tab string to current screen
  const handleTabSelect = (tabId) => {
    if (tabId === 'dashboard') setCurrentScreen('home');
    else setCurrentScreen(tabId);
  };

  // Sign In Screen
  if (currentScreen === 'signin') {
    return <SignInView onSignIn={() => setCurrentScreen('home')} />;
  }

  // Full Desktop Application
  return (
    <EmployeeLayout
      activeTab={
        currentScreen === 'home'
          ? 'dashboard'
          : ['my-attendance', 'attendance-detail'].includes(currentScreen)
          ? 'my-attendance'
          : currentScreen
      }
      onSelectTab={handleTabSelect}
      attendanceStatus={attendanceStatus}
      workingTime={formatTime(workingSeconds)}
      breakTime={formatTime(breakSeconds)}
      onPunchIn={handlePunchIn}
      onTakeBreak={handleTakeBreak}
      onEndBreak={handleEndBreak}
      onPunchOut={handlePunchOut}
      onSwitchToAdmin={onSwitchToAdmin}
      unreadNotifications={2}
      onApplyLeaveClick={() => setIsApplyLeaveModalOpen(true)}
      onLogout={() => setCurrentScreen('signin')}
    >
      {/* Dashboard View */}
      {currentScreen === 'home' && (
        <EmployeeDashboard
          attendanceStatus={attendanceStatus}
          punchInTime={attendanceStatus !== 'NOT_PUNCHED_IN' ? '09:12 AM' : null}
          workingHours={formatTime(workingSeconds)}
          breakHours={formatTime(breakSeconds)}
          timeline={timeline}
          onPunchIn={handlePunchIn}
          onTakeBreak={handleTakeBreak}
          onEndBreak={handleEndBreak}
          onPunchOut={handlePunchOut}
          onNavigateToAttendance={() => setCurrentScreen('attendance')}
          onNavigateToLeaves={() => setCurrentScreen('leaves')}
          onNavigateToMyAttendance={() => setCurrentScreen('my-attendance')}
          onOpenApplyLeave={() => setIsApplyLeaveModalOpen(true)}
          onSelectAttendanceRecord={(date) => {
            setSelectedDateDetail(date);
            setIsAttendanceDetailModalOpen(true);
          }}
        />
      )}

      {/* Live Punch Clock & Attendance View */}
      {currentScreen === 'attendance' && (
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
              ? 'Break since 01:15 PM'
              : attendanceStatus === 'PUNCHED_OUT'
              ? 'Punched out at 05:47 PM'
              : 'Since 09:12 AM'
          }
          progress={
            attendanceStatus === 'PUNCHED_OUT'
              ? 100
              : attendanceStatus === 'ON_BREAK'
              ? 45
              : attendanceStatus === 'WORKING'
              ? 55
              : 0
          }
          timeline={timeline}
          totalWorkingHours={formatTime(workingSeconds)}
          breakDuration={formatTime(breakSeconds)}
          onBack={() => setCurrentScreen('home')}
          onPunchIn={handlePunchIn}
          onTakeBreak={handleTakeBreak}
          onEndBreak={handleEndBreak}
          onPunchOut={handlePunchOut}
          onBackToDashboard={() => setCurrentScreen('home')}
        />
      )}

      {/* My Attendance Monthly Log & Calendar View */}
      {['my-attendance', 'attendance-detail'].includes(currentScreen) && (
        <MyAttendanceView onBack={() => setCurrentScreen('home')} />
      )}

      {/* Leaves & Requests View */}
      {currentScreen === 'leaves' && (
        <LeavesView
          leaves={leavesList}
          onApplyLeave={handleApplyNewLeave}
          onCancelLeave={handleCancelLeave}
          onBack={() => setCurrentScreen('home')}
        />
      )}

      {/* Notifications Hub View */}
      {currentScreen === 'notifications' && (
        <NotificationsView onBack={() => setCurrentScreen('home')} />
      )}

      {/* Profile View */}
      {currentScreen === 'profile' && (
        <ProfileView
          onBack={() => setCurrentScreen('home')}
          onLogout={() => setCurrentScreen('signin')}
        />
      )}

      {/* Global Apply Leave Modal */}
      <ApplyLeaveModal
        isOpen={isApplyLeaveModalOpen}
        onClose={() => setIsApplyLeaveModalOpen(false)}
        onSubmitLeave={handleApplyNewLeave}
      />

      {/* Global Attendance Day Audit Modal */}
      <AttendanceDetailModal
        isOpen={isAttendanceDetailModalOpen}
        onClose={() => setIsAttendanceDetailModalOpen(false)}
        selectedDate={selectedDateDetail}
      />
    </EmployeeLayout>
  );
};

export default EmployeeApp;
