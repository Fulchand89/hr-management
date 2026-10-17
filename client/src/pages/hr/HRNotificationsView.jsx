import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  User,
  UserMinus,
  ExternalLink,
  ArrowRight,
  X
} from 'lucide-react';
import {
  getMyNotifications,
  markNotificationRead
} from '../../services/hrService';

export const HRNotificationsView = ({ onBack, onUnreadChange }) => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getMyNotifications(currentPage, 50);
      const data = res?.data ?? res ?? {};
      const rawList = Array.isArray(data)
        ? data
        : (Array.isArray(data?.notifications) ? data.notifications : []);

      if (rawList.length > 0) {
        const formatted = rawList.map((n) => {
          let category = 'Company';
          const typeStr = (n.type || '').toLowerCase();
          const titleStr = (n.title || '').toLowerCase();
          const msgStr = (n.message || '').toLowerCase();

          if (
            typeStr.includes('resignation') ||
            titleStr.includes('resignation') ||
            msgStr.includes('resignation')
          ) {
            category = 'Resignations';
          } else if (typeStr.includes('leave') || titleStr.includes('leave') || msgStr.includes('leave')) {
            category = 'Leaves';
          } else if (typeStr.includes('attendance') || titleStr.includes('attendance') || msgStr.includes('attendance')) {
            category = 'Attendance';
          } else if (
            typeStr.includes('profile') ||
            typeStr.includes('document') ||
            titleStr.includes('profile') ||
            titleStr.includes('kyc') ||
            msgStr.includes('profile')
          ) {
            category = 'Personnel';
          }

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
            actionUrl: n.actionUrl || null,
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
  }, [currentPage]);

  useEffect(() => {
    loadNotifications();

    const handleLiveNotif = () => {
      loadNotifications();
    };

    window.addEventListener('app:notification', handleLiveNotif);
    window.addEventListener('app:resignation_submitted', handleLiveNotif);

    return () => {
      window.removeEventListener('app:notification', handleLiveNotif);
      window.removeEventListener('app:resignation_submitted', handleLiveNotif);
    };
  }, [loadNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read: true } : item))
      );
      if (onUnreadChange) onUnreadChange();
    } catch {
      // optimistic update
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read: true } : item))
      );
      if (onUnreadChange) onUnreadChange();
    }
  };

  const handleViewNotification = async (notif) => {
    setSelectedNotification(notif);
    if (!notif.read) {
      await handleMarkAsRead(notif.id);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Resignations':
        return <UserMinus className="w-4 h-4 text-rose-600" />;
      case 'Attendance':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'Leaves':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'Personnel':
        return <User className="w-4 h-4 text-purple-600" />;
      case 'Company':
      default:
        return <Calendar className="w-4 h-4 text-blue-600" />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Resignations':
        return 'text-rose-600 bg-rose-50';
      case 'Attendance':
        return 'text-amber-500 bg-amber-50';
      case 'Leaves':
        return 'text-emerald-500 bg-emerald-50';
      case 'Personnel':
        return 'text-purple-500 bg-purple-50';
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
              {unreadCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#8B1D2C] text-white">
                  {unreadCount} New
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  All Caught Up
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Stay up to date with resignation requests, leave approvals, and employee lifecycle alerts.
            </p>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl overflow-x-auto w-fit">
          {['All', 'Resignations', 'Personnel', 'Attendance', 'Leaves', 'Company'].map((cat) => {
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
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-2xl border border-slate-100 flex items-start gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs font-medium">
            No notifications in this category.
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleViewNotification(notif)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                notif.read
                  ? 'bg-white border-slate-100 hover:bg-slate-50/70'
                  : 'bg-rose-50/25 border-rose-100/80 hover:bg-rose-50/45 shadow-2xs'
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
                    className={`text-xs truncate ${
                      notif.read ? 'font-semibold text-slate-700' : 'font-extrabold text-slate-900'
                    }`}
                  >
                    {notif.title}
                  </h4>
                  <span className="text-[11px] font-medium text-slate-400 shrink-0">
                    {notif.time}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{notif.message}</p>
                <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                      {notif.category}
                    </span>
                    {notif.read ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        <CheckCheck className="w-3 h-3 text-emerald-600" />
                        Read
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8B1D2C] animate-pulse" />
                        Unread
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewNotification(notif);
                      }}
                      className="text-[11px] font-bold text-[#8B1D2C] hover:text-[#6f1723] flex items-center gap-1 cursor-pointer"
                    >
                      <span>Read Message</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    {notif.actionUrl && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!notif.read) handleMarkAsRead(notif.id);
                          navigate(notif.actionUrl);
                        }}
                        className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 underline underline-offset-2 cursor-pointer ml-1"
                      >
                        <span>View Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
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

      {/* View Notification Message Modal */}
      {selectedNotification && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedNotification(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${getCategoryColor(
                    selectedNotification.category
                  )}`}
                >
                  {getCategoryIcon(selectedNotification.category)}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {selectedNotification.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {selectedNotification.time}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Badges Row */}
            <div className="flex items-center gap-2 pt-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                {selectedNotification.category}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                Read
              </span>
            </div>

            {/* Message Body */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 max-h-64 overflow-y-auto">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Message Content
              </p>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                {selectedNotification.message}
              </p>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Close
              </button>
              {selectedNotification.actionUrl && (
                <button
                  type="button"
                  onClick={() => {
                    const url = selectedNotification.actionUrl;
                    setSelectedNotification(null);
                    navigate(url);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#8B1D2C] hover:bg-[#721724] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <span>Go to Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRNotificationsView;
