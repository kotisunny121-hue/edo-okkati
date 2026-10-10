import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { UserRole } from '../types/index.js';
import { ShieldAlert, AlertCircle, Lock, Mail, ArrowRight, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, quickLogin, getDashboardPath } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      setLoading(true);
      const user = await login(email, password);
      const destination = from || getDashboardPath(user.role);
      navigate(destination, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: UserRole) => {
    setError(null);
    try {
      setLoading(true);
      const user = await quickLogin(role);
      const destination = getDashboardPath(user.role);
      navigate(destination, { replace: true });
    } catch (err: any) {
      setError(err.message || `Quick login failed for ${role}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="max-w-md w-full space-y-6">
        {/* Brand */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded bg-orange-600 flex items-center justify-center text-white shadow-md">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              CRISIS<span className="text-orange-500">RELIEF</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold text-slate-100">Portal Authentication</h2>
          <p className="text-xs text-slate-400 mt-1">
            Sign in to access your authorized role dashboard and real backend data.
          </p>
        </div>

        {/* Demo Quick-Switcher Card */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-orange-400">
            <UserCheck className="w-4 h-4" />
            <span>Evaluation Quick-Login (Select Any Role)</span>
          </div>
          <p className="text-[11px] text-slate-400 mb-3">
            Click any button below to instantly sign in and test that specific role's server-enforced dashboard:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickDemo('seeker')}
              disabled={loading}
              className="py-1.5 px-2 bg-slate-700/80 hover:bg-slate-700 text-slate-200 hover:text-white rounded text-center font-medium border border-slate-600 transition-colors"
            >
              Seeker
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('provider')}
              disabled={loading}
              className="py-1.5 px-2 bg-slate-700/80 hover:bg-slate-700 text-orange-300 hover:text-orange-200 rounded text-center font-medium border border-slate-600 transition-colors"
            >
              Provider
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('organization')}
              disabled={loading}
              className="py-1.5 px-2 bg-slate-700/80 hover:bg-slate-700 text-blue-300 hover:text-blue-200 rounded text-center font-medium border border-slate-600 transition-colors"
            >
              NGO Org
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('volunteer')}
              disabled={loading}
              className="py-1.5 px-2 bg-slate-700/80 hover:bg-slate-700 text-teal-300 hover:text-teal-200 rounded text-center font-medium border border-slate-600 transition-colors"
            >
              Volunteer
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              disabled={loading}
              className="py-1.5 px-2 bg-slate-700/80 hover:bg-slate-700 text-rose-300 hover:text-rose-200 rounded text-center font-medium border border-slate-600 transition-colors"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('super_admin')}
              disabled={loading}
              className="py-1.5 px-2 bg-purple-900/40 hover:bg-purple-900/60 text-purple-300 rounded text-center font-medium border border-purple-800 transition-colors"
            >
              Super Admin
            </button>
          </div>
        </div>

        {/* Standard Login Form */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-md text-xs">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-orange-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Account Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-orange-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-slate-600">
            Don't have an emergency account yet?{' '}
            <Link to="/register" className="text-orange-600 font-semibold hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
