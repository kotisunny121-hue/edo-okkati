import React from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext.js';
import { Bell, CheckCheck, Clock, ArrowRight } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Notifications Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time updates regarding your emergency requests, listings, and tasks.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 bg-white rounded flex items-center gap-1.5 shadow-xs"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {loading && notifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            You have no notifications yet.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => !n.read && markAsRead(n._id)}
              className={`p-4 flex items-start justify-between gap-4 transition-colors cursor-pointer ${
                !n.read ? 'bg-orange-50/40 hover:bg-orange-50/70' : 'hover:bg-slate-50'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className={`text-xs font-bold ${!n.read ? 'text-orange-950' : 'text-slate-900'}`}>
                    {n.title}
                  </h4>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                <span className="text-[10px] font-mono text-slate-400 block pt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>

              {n.link && (
                <Link
                  to={n.link}
                  className="px-2.5 py-1 text-xs font-semibold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1 shrink-0"
                >
                  View <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
