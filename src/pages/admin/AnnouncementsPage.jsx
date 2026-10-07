import React, { useState } from 'react';
import { Megaphone, Send, Bell, Plus, Users, Calendar } from 'lucide-react';

export const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([
    {
      id: 'ANN-1',
      title: 'Diwali Office Celebrations & Ethnic Wear Day',
      message: 'Join us this Friday at 4 PM in the main cafeteria for games, sweets, and our annual Diwali photo booth!',
      target: 'All Employees',
      date: '2026-10-04',
      sender: 'Sarah Connor (HR Lead)'
    },
    {
      id: 'ANN-2',
      title: 'Quarterly Townhall with Leadership',
      message: 'Q3 Townhall scheduled for Wednesday at 11 AM IST. Review roadmap updates and team milestones.',
      target: 'Engineering & Product',
      date: '2026-10-01',
      sender: 'Michael Scott (Director)'
    }
  ]);

  return (
    <div className="space-y-6 max-w-5xl">
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
        <button className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer">
          <Send className="w-4 h-4" />
          Broadcast Announcement
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {announcements.map((a) => (
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
        ))}
      </div>
    </div>
  );
};

export default AnnouncementsPage;
