import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { UserRole } from '../types/index.js';
import { ShieldAlert, AlertCircle, Lock, Mail, User, Phone, Building, ArrowRight } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register, getDashboardPath } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'seeker' | 'provider' | 'organization' | 'volunteer'>('seeker');
  const [organizationName, setOrganizationName] = useState('');
  const [organizationAddress, setOrganizationAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (role === 'organization' && !organizationName.trim()) {
      setError('Organization name is required for NGO accounts.');
      return;
    }

    try {
      setLoading(true);
      const user = await register({
        name,
        email,
        password,
        phone,
        role,
        organizationName: role === 'organization' ? organizationName : undefined,
        organizationAddress: role === 'organization' ? organizationAddress : undefined,
      });

      const destination = getDashboardPath(user.role);
      navigate(destination, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded bg-orange-600 flex items-center justify-center text-white shadow-md">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              CRISIS<span className="text-orange-500">RELIEF</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold text-slate-100">Create Relief Account</h2>
          <p className="text-xs text-slate-400 mt-1">
            Register to request aid, contribute emergency inventory, or coordinate disaster logistics.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-md text-xs">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account Type / Role */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Account Type <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'seeker', title: 'Resource Seeker', desc: 'Seeking aid for self or family' },
                  { id: 'provider', title: 'Resource Provider', desc: 'Offering stockpiles & items' },
                  { id: 'organization', title: 'Relief NGO / Org', desc: 'Accredited disaster team' },
                  { id: 'volunteer', title: 'Volunteer Dispatch', desc: 'Assisting physical delivery' },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setRole(item.id as any)}
                    className={`p-2.5 rounded text-left border transition-all ${
                      role === item.id
                        ? 'border-orange-600 bg-orange-50/70 text-slate-900 ring-1 ring-orange-500'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <p className="font-bold text-xs">{item.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Full Name / Contact Person <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="E.g. Elena Rostova"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-orange-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@example.com"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-orange-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Phone Number (Emergency Coordination)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-orange-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Organization Specific Fields */}
            {role === 'organization' && (
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded space-y-3">
                <p className="text-[11px] font-semibold text-blue-900 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-blue-600" />
                  Organization Details (Requires Admin Verification)
                </p>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Organization Official Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="E.g. Hope Relief Coalition"
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-orange-500 focus:outline-none bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Operational Headquarters Address
                  </label>
                  <input
                    type="text"
                    value={organizationAddress}
                    onChange={(e) => setOrganizationAddress(e.target.value)}
                    placeholder="E.g. 742 Staging Depot Blvd, San Francisco, CA"
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-orange-500 focus:outline-none bg-white"
                  />
                </div>
              </div>
            )}

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-orange-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-orange-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
            >
              <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-slate-600">
            Already have an emergency account?{' '}
            <Link to="/login" className="text-orange-600 font-semibold hover:underline">
              Sign In here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
