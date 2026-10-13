import React, { useState, useEffect, useCallback } from 'react';
import { Megaphone, Send, Bell, Plus, Users, Calendar, X, CheckCircle2 } from 'lucide-react';
import { getMyNotifications, broadcastAnnouncement } from '../../services/hrService';

export const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [form, setForm] = useState({
    title: '',
    message: '',
    target: 'All Employees'
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadAnnouncements = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getMyNotifications(1, 50, 'announcement');
      const list = Array.isArray(res?.data?.notifications)
        ? res.data.notifications
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];

      setAnnouncements(
        list.map((n) => ({
          id: n.id,
          title: n.title,
          message: n.message || n.body,
          target: n.data?.target || 'All Employees',
          date: n.createdAt ? n.createdAt.split('T')[0] : '',
          sender: n.data?.senderName || 'HR Administration'
        }))
      );
    } catch (err) {
      console.error('Failed to load announcements:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return;

    try {
      await broadcastAnnouncement({
        title: form.title.trim(),
        message: form.message.trim(),
        type: 'announcement',
        target: form.target
      });
      showToast('Announcement broadcasted successfully!');
      setIsModalOpen(false);
      setForm({ title: '', message: '', target: 'All Employees' });
      loadAnnouncements();
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to broadcast announcement');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-2xl text-xs font-semibold shadow-xl border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Megaphone className="w-7 h-7 text-indigo-600" />
            Company Announcements & Broadcasts
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Publish real-time system broadcasts and employee townhall notifications.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
        >
          <Send className="w-4 h-4" />
          Broadcast Announcement
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {announcements.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-sm">
            {isLoading ? 'Loading broadcasts...' : 'No company announcements broadcasted yet.'}
          </div>
        ) : (
          announcements.map((a) => (
            <div key={a.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700">
                  {a.target}
                </span>
                <span className="text-xs text-slate-400">{a.date}</span>
              </div>
              <h3 className="font-bold text-slate-900 text-base">{a.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{a.message}</p>
              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                Published by: <span className="font-medium text-slate-700">{a.sender}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-indigo-600" />
                New Announcement
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Audience</label>
                <select
                  value={form.target}
                  onChange={(e) => setForm({ ...form, target: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="All Employees">All Employees</option>
                  <option value="Engineering & Product">Engineering & Product</option>
                  <option value="HR & Operations">HR & Operations</option>
                  <option value="Sales & Marketing">Sales & Marketing</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Announcement Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Annual Townhall Meeting"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Message Content</label>
                <textarea
                  required
                  rows="4"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Type announcement details here..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl"
                >
                  Publish Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;
