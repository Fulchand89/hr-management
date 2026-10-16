import React, { useState, useEffect } from 'react';
import { Search, X, MessageSquare, Loader2, Users, Shield, User } from 'lucide-react';
import { getEmployeeDirectory } from '../../services/chatService';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

export const NewChatModal = ({ isOpen, onClose, onSelectUser }) => {
  const { user: currentUser } = useAuth();
  const { isUserOnline } = useSocket();
  const [search, setSearch] = useState('');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterRole, setFilterRole] = useState('all'); // 'all' | 'hr' | 'employee'

  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setFilterRole('all');
      return;
    }

    let isMounted = true;
    setLoading(true);

    const query = search.trim();
    // Load immediately on open, or debounce when typing
    const delay = query ? 200 : 0;

    const timer = setTimeout(async () => {
      try {
        const list = await getEmployeeDirectory(query);
        if (isMounted) setEmployees(list || []);
      } catch (err) {
        console.error('Failed to load directory:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }, delay);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, search]);

  if (!isOpen) return null;

  const hrList = employees.filter((e) => e.role === 'hr');
  const employeeList = employees.filter((e) => e.role !== 'hr');

  const filteredList =
    filterRole === 'hr'
      ? hrList
      : filterRole === 'employee'
      ? employeeList
      : employees;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh] border border-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-base">Start a New Chat</h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#8B1D2C]/10 text-[#8B1D2C]">
                {employees.length} Colleagues & HR
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any Employee or HR to start messaging
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input & Role Filter Tabs */}
        <div className="p-3 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or designation..."
              className="w-full pl-9 pr-8 py-2.5 text-xs bg-slate-100/90 rounded-xl focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-[#8B1D2C] transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 mt-2.5">
            <button
              type="button"
              onClick={() => setFilterRole('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterRole === 'all'
                  ? 'bg-[#8B1D2C] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({employees.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterRole('hr')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filterRole === 'hr'
                  ? 'bg-purple-700 text-white shadow-2xs'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              HR ({hrList.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterRole('employee')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filterRole === 'employee'
                  ? 'bg-[#8B1D2C] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Employees ({employeeList.length})
            </button>
          </div>
        </div>

        {/* Directory List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#8B1D2C]" />
              <span className="text-xs font-medium">Loading company members...</span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No persons found matching "{search}"
            </div>
          ) : (
            <>
              {/* WhatsApp Style "Message Yourself" (You) item */}
              {currentUser &&
                filterRole !== 'hr' &&
                (!search ||
                  `${currentUser.firstName} ${currentUser.lastName}`
                    .toLowerCase()
                    .includes(search.toLowerCase())) && (
                  <div
                    key="self-chat"
                    onClick={() =>
                      onSelectUser({
                        ...currentUser,
                        name: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() + ' (You)',
                        isSelf: true
                      })
                    }
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group select-none border-b border-slate-100/90 mb-1"
                  >
                    <div className="relative shrink-0">
                      {currentUser.avatar ? (
                        <img
                          src={currentUser.avatar}
                          alt="You"
                          className="w-11 h-11 rounded-2xl object-cover ring-1 ring-slate-200"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-[#8B1D2C] text-white flex items-center justify-center font-bold text-sm shadow-xs uppercase">
                          {(currentUser.firstName || 'Y').charAt(0)}
                        </div>
                      )}
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#8B1D2C] transition-colors truncate">
                          {currentUser.firstName} {currentUser.lastName} (You)
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800 uppercase tracking-wide shrink-0">
                          You
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        Message yourself • Notes, reminders, media
                      </p>
                    </div>

                    <button
                      type="button"
                      className="p-2.5 rounded-xl bg-slate-100 group-hover:bg-[#8B1D2C] group-hover:text-white text-slate-500 transition-colors shrink-0 cursor-pointer shadow-2xs"
                      title="Message yourself"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                )}

              {filteredList.map((emp) => {
                const isOnline = isUserOnline(emp.id);
                const isHR = emp.role === 'hr';

                return (
                  <div
                    key={emp.id}
                    onClick={() => onSelectUser(emp)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group select-none"
                  >
                  {/* Avatar with Online Ring */}
                  <div className="relative shrink-0">
                    {emp.avatar ? (
                      <img
                        src={emp.avatar}
                        alt={emp.name}
                        className="w-11 h-11 rounded-2xl object-cover ring-1 ring-slate-200"
                      />
                    ) : (
                      <div
                        className={`w-11 h-11 rounded-2xl ${
                          isHR ? 'bg-purple-700' : 'bg-[#8B1D2C]'
                        } text-white flex items-center justify-center font-bold text-sm shadow-xs uppercase`}
                      >
                        {emp.name.charAt(0)}
                      </div>
                    )}
                    {isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#8B1D2C] transition-colors truncate">
                          {emp.name}
                        </h4>
                        {isHR ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-purple-100 text-purple-700 uppercase tracking-wide shrink-0">
                            HR
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-slate-100 text-slate-600 capitalize shrink-0">
                            Employee
                          </span>
                        )}
                      </div>
                      {isOnline ? (
                        <span className="text-[10px] text-emerald-600 font-semibold shrink-0">
                          Online
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 shrink-0">Offline</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      {emp.designation ? `${emp.designation} • ${emp.email}` : emp.email}
                    </p>
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    className="p-2.5 rounded-xl bg-slate-100 group-hover:bg-[#8B1D2C] group-hover:text-white text-slate-500 transition-colors shrink-0 cursor-pointer shadow-2xs"
                    title="Start Chat"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </>
        )}
        </div>
      </div>
    </div>
  );
};
