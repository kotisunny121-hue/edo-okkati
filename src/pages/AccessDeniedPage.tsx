import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { ShieldX, ArrowRight } from 'lucide-react';

export const AccessDeniedPage: React.FC = () => {
  const { user, getDashboardPath } = useAuth();
  const dashboardPath = user ? getDashboardPath(user.role) : '/login';

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-md w-full p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-rose-950 text-rose-500 border border-rose-800 flex items-center justify-center mx-auto">
          <ShieldX className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-bold text-white">403 · Access Denied</h1>

        <p className="text-xs text-slate-300 leading-relaxed">
          Your current account role ({user?.role || 'guest'}) does not possess server-authorized permissions to access this requested area or administrative resource.
        </p>

        <div className="pt-2">
          <Link
            to={dashboardPath}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Return to Your Authorized Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
