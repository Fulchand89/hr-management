import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CheckCheck,
  Trash2,
} from 'lucide-react';

export const NotificationsView = ({ onBack }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'Shift Punch In Reminder',
      message: 'Your shift started at 09:00 AM. Please make sure to record your punch in on time.',
      time: '10 mins ago',
      category: 'Attendance',
      read: false,
      icon: Clock,
      color: 'text-amber-500 bg-amber-50',
    },
    {
      id: '2',
      title: 'Leave Request Approved',
      message: 'Your Sick Leave for 10 Jul 2026 has been approved by Sarah Connor (HR Manager).',
      time: '2 hours ago',
      category: 'Leaves',
      read: false,
      icon: CheckCircle2,
      color: 'text-emerald-500 bg-emerald-50',
    },
    {
      id: '3',
      title: 'Upcoming Public Holiday',
      message: 'Office will remain closed on 15 Aug 2026 for Independence Day celebrations.',
      time: '1 day ago',
      category: 'Company',
      read: true,
      icon: Calendar,
      color: 'text-blue-500 bg-blue-50',
    },
    {
      id: '4',
      title: 'Attendance Regularized',
      message: 'Your attendance regularization for 09 Aug 2026 was accepted successfully.',
      time: '3 days ago',
      category: 'Attendance',
      read: true,
      icon: CheckCircle2,
      color: 'text-emerald-500 bg-emerald-50',
    },
    {
      id: '5',
      title: 'Quarterly Townhall Notice',
      message: 'Join all-hands company townhall meeting this Friday at 04:00 PM via Google Meet.',
      time: '4 days ago',
      category: 'Company',
      read: true,
      icon: AlertCircle,
      color: 'text-purple-500 bg-purple-50',
    },
    {
      id: '6',
      title: 'Overtime Approved',
      message: 'Your overtime claim of 35m on 07 Aug 2026 has been credited to your monthly audit.',
      time: '5 days ago',
      category: 'Attendance',
      read: true,
      icon: Clock,
      color: 'text-emerald-500 bg-emerald-50',
    },
    {
      id: '7',
      title: 'Casual Leave Request Received',
      message: 'Your leave application for 15 Aug 2026 is currently pending manager review.',
      time: '6 days ago',
      category: 'Leaves',
      read: true,
      icon: Calendar,
      color: 'text-amber-500 bg-amber-50',
    },
    {
      id: '8',
      title: 'System Security Update',
      message: 'Two-factor authentication requirement has been updated for all employee portal accounts.',
      time: '1 week ago',
      category: 'Company',
      read: true,
      icon: AlertCircle,
      color: 'text-rose-500 bg-rose-50',
    },
    {
      id: '9',
      title: 'Attendance Punch Out Missing',
      message: 'Please raise a regularization for missing punch out timestamp on 01 Aug 2026.',
      time: '1 week ago',
      category: 'Attendance',
      read: true,
      icon: Clock,
      color: 'text-amber-500 bg-amber-50',
    },
    {
      id: '10',
      title: 'Monthly Policy Handbook 2026',
      message: 'The revised leave and travel expense policy handbook has been published on the intranet.',
      time: '1 week ago',
      category: 'Company',
      read: true,
      icon: Calendar,
      color: 'text-blue-500 bg-blue-50',
    },
    {
      id: '11',
      title: 'Half Day Leave Approved',
      message: 'Your half day request for 20 Apr 2026 has been approved by your department lead.',
      time: '2 weeks ago',
      category: 'Leaves',
      read: true,
      icon: CheckCircle2,
      color: 'text-emerald-500 bg-emerald-50',
    },
    {
      id: '12',
      title: 'Health & Wellness Session',
      message: 'Free workplace ergonomics and eye checkup camp scheduled for next Tuesday.',
      time: '2 weeks ago',
      category: 'Company',
      read: true,
      icon: Calendar,
      color: 'text-emerald-500 bg-emerald-50',
    },
    {
      id: '13',
      title: 'Early Punch Out Alert',
      message: 'Recorded punch out before standard shift duration on 25 Jul 2026.',
      time: '3 weeks ago',
      category: 'Attendance',
      read: true,
      icon: Clock,
      color: 'text-amber-500 bg-amber-50',
    },
    {
      id: '14',
      title: 'Comp Off Balance Credited',
      message: '1 Day Comp Off credited for weekend release deployment support.',
      time: '3 weeks ago',
      category: 'Leaves',
      read: true,
      icon: CheckCircle2,
      color: 'text-emerald-500 bg-emerald-50',
    },
    {
      id: '15',
      title: 'Performance Review Cycle Q2',
      message: 'Self-appraisal review form is now open for submission in the employee portal.',
      time: '1 month ago',
      category: 'Company',
      read: true,
      icon: AlertCircle,
      color: 'text-purple-500 bg-purple-50',
    },
    {
      id: '16',
      title: 'Sick Leave Rejected',
      message: 'Sick leave application for 14 Jun 2026 was rejected due to lack of medical documentation.',
      time: '1 month ago',
      category: 'Leaves',
      read: true,
      icon: AlertCircle,
      color: 'text-rose-500 bg-rose-50',
    },
  ]);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const filteredNotifications = notifications.filter(
    (n) => activeCategory === 'All' || n.category === activeCategory
  );

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNotifications = filteredNotifications.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Actions Bar */}
      <div className="flex items-center justify-end gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs cursor-pointer transition-colors"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            Mark all read
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-semibold shadow-2xs cursor-pointer transition-colors"
          >
            <Trash2 className="w-4 h-4 text-rose-500" />
            Clear
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          {['All', 'Attendance', 'Leaves', 'Company'].map((cat) => {
            const count =
              cat === 'All'
                ? notifications.length
                : notifications.filter((n) => n.category === cat).length;
            const isActive = activeCategory === cat;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setActiveCategory(cat);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  isActive
                    ? 'bg-[#8B1D2C] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Notifications List */}
        <div className="space-y-3 pt-2">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
              No notifications to display in this category.
            </div>
          ) : (
            currentNotifications.map((n) => {
              const Icon = n.icon;

              return (
                <div
                  key={n.id}
                  className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                    !n.read
                      ? 'bg-rose-50/20 border-rose-200 shadow-2xs'
                      : 'bg-white border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${n.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-[#8B1D2C]" />
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                          {n.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 max-w-2xl">{n.message}</p>
                      <span className="text-[11px] text-slate-400 mt-2 block font-medium">
                        {n.time}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Controls */}
        {filteredNotifications.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Showing <span className="font-bold text-slate-800 font-mono">{startIndex + 1}</span> to{' '}
              <span className="font-bold text-slate-800 font-mono">
                {Math.min(endIndex, filteredNotifications.length)}
              </span>{' '}
              of <span className="font-bold text-slate-800 font-mono">{filteredNotifications.length}</span> notifications
            </p>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  currentPage === 1
                    ? 'border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50/50'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50 bg-white shadow-2xs'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-[#8B1D2C] text-white shadow-xs'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-50 bg-white'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  currentPage === totalPages
                    ? 'border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50/50'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50 bg-white shadow-2xs'
                }`}
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsView;
