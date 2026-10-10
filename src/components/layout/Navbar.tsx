import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { useNotifications } from '../../context/NotificationContext.js';
import { RoleBadge } from '../common/RoleBadge.js';
import {
  ShieldAlert,
  Bell,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  MapPin,
  Package,
  Layers,
  PhoneCall,
  LayoutDashboard,
  Truck,
  HeartHandshake,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, getDashboardPath } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const dashboardPath = user ? getDashboardPath(user.role) : '/';

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-[#0B132B] text-white border-b border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded bg-orange-600 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  CRISIS<span className="text-orange-500 font-extrabold">RELIEF</span>
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block -mt-1">
                  Resource Coordination System
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 text-sm">
              <Link
                to="/resources"
                className={`px-3 py-1.5 rounded transition-colors ${
                  isActive('/resources')
                    ? 'text-orange-400 font-medium bg-slate-800/60'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-slate-400" />
                  Supplies Catalog
                </span>
              </Link>

              <Link
                to="/hotlines"
                className={`px-3 py-1.5 rounded transition-colors ${
                  isActive('/hotlines')
                    ? 'text-orange-400 font-medium bg-slate-800/60'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <PhoneCall className="w-4 h-4 text-rose-400" />
                  Emergency Hotlines
                </span>
              </Link>

              {user && (
                <Link
                  to={dashboardPath}
                  className={`px-3 py-1.5 rounded transition-colors ${
                    isActive(dashboardPath)
                      ? 'text-orange-400 font-semibold bg-slate-800'
                      : 'text-slate-200 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <LayoutDashboard className="w-4 h-4 text-orange-400" />
                    Dashboard
                  </span>
                </Link>
              )}
            </nav>
          </div>

          {/* Right section: Auth controls & Notifications */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {/* Notifications Bell */}
                <Link
                  to="/notifications"
                  className="relative p-2 rounded text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* User info & role */}
                <div className="h-6 w-px bg-slate-800 mx-1" />

                <div className="flex items-center gap-2.5">
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-200 leading-tight truncate max-w-[140px]">
                      {user.name}
                    </p>
                    <RoleBadge role={user.role} className="mt-0.5 text-[10px]" />
                  </div>

                  <Link
                    to="/profile"
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Account Settings"
                  >
                    <UserIcon className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="p-1.5 rounded bg-slate-800/80 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 border border-slate-700/60 transition-colors"
                    title="Log Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-sm font-medium text-slate-200 hover:text-white transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 text-sm font-semibold rounded bg-orange-600 hover:bg-orange-500 text-white shadow-sm transition-colors"
                >
                  Register Account
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {user && (
              <Link
                to="/notifications"
                className="relative p-2 text-slate-300 hover:text-white"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded text-slate-300 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-[#0B132B] px-4 pt-2 pb-4 space-y-2">
          {user && (
            <div className="pb-3 mb-2 border-b border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">{user.name}</p>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>
              <RoleBadge role={user.role} />
            </div>
          )}

          <Link
            to="/resources"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 rounded"
          >
            Emergency Catalog
          </Link>
          <Link
            to="/hotlines"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm text-rose-300 hover:bg-slate-800 rounded"
          >
            Hotlines & Protocols
          </Link>

          {user ? (
            <>
              <Link
                to={dashboardPath}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-semibold text-orange-400 hover:bg-slate-800 rounded"
              >
                Role Dashboard
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 rounded"
              >
                Profile & Security
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 text-sm text-rose-400 hover:bg-slate-800 rounded"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2 text-center text-sm font-medium border border-slate-700 text-slate-200 rounded"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2 text-center text-sm font-semibold bg-orange-600 text-white rounded"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
