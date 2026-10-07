import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CheckCheck,
  Loader2,
} from 'lucide-react';
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '../../services/hrService';

export const HRNotificationsView = ({ onBack }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getMyNotifications(currentPage, 10, activeCategory);
      const data = res?.data ?? res ?? {};
      const rawList = Array.isArray(data)
        ? data
        : (Array.isArray(data?.notifications) ? data.notifications : []);

      if (rawList.length > 0) {
        const formatted = rawList.map((n) => {
          let category = 'Company';
          if (n.type?.toLowerCase().includes('leave')) category = 'Leaves';
          else if (n.type?.toLowerCase().includes('attendance')) category = 'Attendance';

          const timeAgo = n.createdAt
            ? new Date(n.createdAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })
            : 'Recently';

          return {
            id: n.id,
            title: n.title,
            message: n.message,
            time: timeAgo,
            category,
            read: !!n.isRead
          };
        });
        setNotifications(formatted);
        setTotalPages(data?.pagination?.totalPages || 1);
        setTotalCount(data?.pagination?.totalCount || data?.pagination?.total || formatted.length);
      } else {
        setNotifications([]);
        setTotalCount(0);
        setTotalPages(1);
      }
    } catch {
      setNotifications([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, activeCategory]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read: true } : item))
      );
    } catch {
      // optimistic update
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read: true } : item))
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    } catch {
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Attendance':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'Leaves':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'Company':
      default:
        return <Calendar className="w-4 h-4 text-blue-600" />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Attendance':
        return 'text-amber-500 bg-amber-50';
      case 'Leaves':
        return 'text-emerald-500 bg-emerald-50';
      case 'Company':
      default:
        return 'text-blue-500 bg-blue-50';
    }
  };

  // Filter by category
  const filteredNotifications = notifications.filter((n) =>
    activeCategory === 'All' ? true : n.category.toLowerCase() === activeCategory.toLowerCase()
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Top Bar with Filter & Actions */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#8B1D2C]" />
              Notifications Hub
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#8B1D2C] text-white">
                  {unreadCount} New
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Stay up to date with leave approvals, shift alerts, and company announcements.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              <span>Mark All as Read</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl overflow-x-auto w-fit">
          {['All', 'Attendance', 'Leaves', 'Company'].map((cat) => {
            const count =
              cat === 'All'
                ? notifications.length
                : notifications.filter((n) => n.category.toLowerCase() === cat.toLowerCase()).length;
            const isActive = activeCategory === cat;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setActiveCategory(cat);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-[#8B1D2C] text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-3">
        {isLoading ? (
          <div className="py-12 flex items-center justify-center gap-2 text-slate-500 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-[#8B1D2C]" />
            <span>Loading notifications...</span>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs font-medium">
            No notifications in this category.
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleMarkAsRead(notif.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                notif.read
                  ? 'bg-white border-slate-100 hover:bg-slate-50/60'
                  : 'bg-rose-50/30 border-rose-100 hover:bg-rose-50/50 shadow-2xs'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getCategoryColor(
                  notif.category
                )}`}
              >
                {getCategoryIcon(notif.category)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4
                    className={`text-xs font-bold truncate ${
                      notif.read ? 'text-slate-700' : 'text-slate-900'
                    }`}
                  >
                    {notif.title}
                  </h4>
                  <span className="text-[11px] font-medium text-slate-400 shrink-0">
                    {notif.time}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{notif.message}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                    {notif.category}
                  </span>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-[#8B1D2C]" title="Unread" />
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Page <span className="font-bold">{currentPage}</span> of{' '}
              <span className="font-bold">{totalPages}</span>
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold disabled:opacity-40"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HRNotificationsView;
