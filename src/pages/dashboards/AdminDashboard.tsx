import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { AdminStats, User, Organization, Resource, AuditLogItem } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { RoleBadge } from '../../components/common/RoleBadge.js';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  ShieldAlert,
  Users,
  Package,
  Building,
  CheckCircle,
  XCircle,
  AlertTriangle,
  History,
  Lock,
  Unlock,
  Search,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'moderation' | 'organizations' | 'audit'>('analytics');
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [orgQueue, setOrgQueue] = useState<Organization[]>([]);
  const [moderationResources, setModerationResources] = useState<Resource[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [verifyOrgModal, setVerifyOrgModal] = useState<{ id: string; name: string; status: 'verified' | 'rejected' } | null>(null);
  const [verifyNotes, setVerifyNotes] = useState<string>('Verified by regional administration');
  const [verifying, setVerifying] = useState<boolean>(false);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, orgsRes, modRes, auditRes] = await Promise.all([
        api.get<{ success: boolean; data: AdminStats }>('/admin/stats'),
        api.get<{ success: boolean; data: Organization[] }>('/admin/organizations/queue'),
        api.get<{ success: boolean; data: Resource[] }>('/admin/moderation/resources'),
        api.get<{ success: boolean; data: AuditLogItem[] }>('/admin/audit-logs'),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (orgsRes.success) setOrgQueue(orgsRes.data);
      if (modRes.success) setModerationResources(modRes.data);
      if (auditRes.success) setAuditLogs(auditRes.data);

      fetchUsers();
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      setActionError(err.message || 'Failed to load admin dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const query = userSearch ? `?search=${encodeURIComponent(userSearch)}` : '';
      const res = await api.get<{ success: boolean; data: User[] }>(`/admin/users${query}`);
      if (res.success) setUsers(res.data);
    } catch (err: any) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      setActionError(null);
      await api.patch(`/admin/users/${userId}/status`, { status: nextStatus });
      setActionSuccess(`User status updated to ${nextStatus}.`);
      fetchUsers();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update user status');
    }
  };

  const handleConfirmVerifyOrg = async () => {
    if (!verifyOrgModal) return;

    try {
      setVerifying(true);
      setActionError(null);
      await api.patch(`/admin/organizations/${verifyOrgModal.id}/verify`, {
        status: verifyOrgModal.status,
        notes: verifyNotes.trim() || 'Reviewed by regional administration',
      });
      setActionSuccess(`Organization "${verifyOrgModal.name}" marked as ${verifyOrgModal.status}.`);
      setVerifyOrgModal(null);
      fetchAdminData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to verify organization');
    } finally {
      setVerifying(false);
    }
  };

  const handleModerateResource = async (resourceId: string, status: 'approved' | 'rejected' | 'suspended') => {
    try {
      setActionError(null);
      await api.patch(`/admin/moderation/resources/${resourceId}`, { status });
      setActionSuccess(`Resource marked as ${status}.`);
      fetchAdminData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update resource moderation');
    }
  };

  const COLORS = ['#FF7A00', '#0284C7', '#E11D48', '#7C3AED', '#059669', '#4F46E5', '#64748B'];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-[11px] font-mono uppercase font-semibold text-rose-600 tracking-wider">
            Crisis Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
            Platform Operations & Oversight
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            System moderation, organization verifications, user account controls, and audit streams.
          </p>
        </div>
      </div>

      {actionSuccess && (
        <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {actionError && (
        <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* KPI Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-[10px] font-medium text-slate-500 block uppercase font-mono">Total Users</span>
            <span className="text-xl font-black text-slate-900">{stats.summary.totalUsers}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Multi-role</span>
          </div>
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-[10px] font-medium text-slate-500 block uppercase font-mono">Total Listings</span>
            <span className="text-xl font-black text-slate-900">{stats.summary.totalResources}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">All depots</span>
          </div>
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-[10px] font-medium text-slate-500 block uppercase font-mono">Available Stock</span>
            <span className="text-xl font-black text-emerald-700">{stats.summary.availableResources}</span>
            <span className="text-[10px] text-emerald-600 block mt-0.5">Ready to request</span>
          </div>
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-[10px] font-medium text-slate-500 block uppercase font-mono">Unavailable</span>
            <span className="text-xl font-black text-rose-700">{stats.summary.unavailableResources}</span>
            <span className="text-[10px] text-rose-600 block mt-0.5">Reserved / Depleted</span>
          </div>
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-[10px] font-medium text-slate-500 block uppercase font-mono">Total Units</span>
            <span className="text-xl font-black text-orange-600">{stats.summary.totalAvailableQuantity}</span>
            <span className="text-[10px] text-orange-600 block mt-0.5">In disaster reserve</span>
          </div>
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
            <span className="text-[10px] font-medium text-slate-500 block uppercase font-mono">NGO Queue</span>
            <span className="text-xl font-black text-amber-700">{orgQueue.length}</span>
            <span className="text-[10px] text-amber-600 block mt-0.5">Pending review</span>
          </div>
        </div>
      )}

      {/* Segmented Navigation Tabs */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-xs mb-6 w-fit text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
            activeTab === 'analytics' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Analytics & Metrics
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
            activeTab === 'users' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          User Accounts ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('organizations')}
          className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap flex items-center gap-1 ${
            activeTab === 'organizations' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>NGO Verification Queue</span>
          {orgQueue.length > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-600 text-white text-[10px] rounded-full">
              {orgQueue.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('moderation')}
          className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
            activeTab === 'moderation' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Resource Moderation ({moderationResources.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
            activeTab === 'audit' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: ANALYTICS */}
      {activeTab === 'analytics' && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Stock Availability by Category</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.categoryStats}>
                  <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="totalQty" fill="#FF7A00" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Requests Status Distribution</h3>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.requestStatusStats}
                    dataKey="count"
                    nameKey="_id"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {stats.requestStatusStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Resources Grouped by Location */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Resources Grouped by Staging Location</h3>
            <div className="space-y-2.5 text-xs">
              {stats.locationStats && stats.locationStats.length > 0 ? (
                stats.locationStats.map((loc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-800 truncate max-w-[200px]" title={loc._id}>
                      {loc._id || 'Primary Depot'}
                    </span>
                    <div className="flex items-center gap-3 text-right">
                      <span className="text-slate-500 font-mono text-[11px]">{loc.count} listings</span>
                      <span className="font-bold text-emerald-700 font-mono text-[11px]">{loc.totalQty} units</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-xs">No location distributions recorded.</p>
              )}
            </div>
          </div>

          {/* Recently Added or Updated Resources */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Recently Added / Updated Supplies</h3>
            <div className="divide-y divide-slate-100 text-xs">
              {stats.recentResources && stats.recentResources.length > 0 ? (
                stats.recentResources.map((res) => (
                  <div key={res._id} className="py-2.5 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900 block truncate max-w-[220px]">{res.title}</span>
                      <span className="text-[10px] text-slate-400 capitalize">{res.category.replace('_', ' ')} · {res.locationName}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 block">{res.quantityAvailable} {res.unit}</span>
                      <StatusBadge status={res.availabilityStatus} className="text-[9px]" />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-xs">No recent resources.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER ACCOUNTS */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="font-bold text-sm text-slate-900">User Account Controls</h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                className="px-2.5 py-1.5 border border-slate-300 rounded text-xs w-60"
              />
              <button
                onClick={fetchUsers}
                className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold"
              >
                Search
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id || (u as any)._id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{u.email}</td>
                    <td className="py-3 px-4">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.role !== 'super_admin' && (
                        <button
                          onClick={() => handleToggleUserStatus(u.id || (u as any)._id, u.status)}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold border ${
                            u.status === 'active'
                              ? 'border-rose-300 text-rose-700 hover:bg-rose-50'
                              : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {u.status === 'active' ? 'Suspend Account' : 'Reactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: NGO VERIFICATION QUEUE */}
      {activeTab === 'organizations' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900">Pending NGO Accreditation Queue</h3>
            <p className="text-xs text-slate-500">Verify documentation before enabling verified badges.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-4">Organization Name</th>
                  <th className="py-3 px-4">Contact Person</th>
                  <th className="py-3 px-4">Registration #</th>
                  <th className="py-3 px-4">Headquarters</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orgQueue.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No organizations currently waiting in the verification queue.
                    </td>
                  </tr>
                ) : (
                  orgQueue.map((org) => (
                    <tr key={org._id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-900">{org.name}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {(org.createdBy as any)?.name || 'Representative'} ({org.contactEmail})
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{org.registrationNumber || 'N/A'}</td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-[200px]">{org.address}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setVerifyOrgModal({ id: org._id, name: org.name, status: 'verified' });
                            setVerifyNotes('Verified by regional administration');
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold"
                        >
                          Approve Verification
                        </button>
                        <button
                          onClick={() => {
                            setVerifyOrgModal({ id: org._id, name: org.name, status: 'rejected' });
                            setVerifyNotes('Registration documentation insufficient or expired');
                          }}
                          className="px-2.5 py-1 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded text-[11px]"
                        >
                          Decline
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: MODERATION */}
      {activeTab === 'moderation' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900">Resource Moderation Queue</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Current Moderation</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {moderationResources.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      All published resources are approved. No listings currently flagged.
                    </td>
                  </tr>
                ) : (
                  moderationResources.map((res) => (
                    <tr key={res._id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-900">{res.title}</td>
                      <td className="py-3 px-4 capitalize font-mono text-[11px]">{res.category}</td>
                      <td className="py-3 px-4 text-slate-600">{(res.providerId as any)?.name}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={res.moderationStatus} />
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleModerateResource(res._id, 'approved')}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px]"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleModerateResource(res._id, 'rejected')}
                          className="px-2.5 py-1 border border-rose-300 text-rose-700 rounded text-[11px]"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900">System Activity Audit Trail</h3>
            <p className="text-xs text-slate-500">Immutable ledger of administrative actions and state changes.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Target Resource</th>
                  <th className="py-3 px-4">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">{log.action}</td>
                    <td className="py-2.5 px-4 text-slate-700">
                      {log.userEmail || log.userId?.email || 'System'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {log.resourceType} {log.resourceId ? `(${log.resourceId.slice(-6)})` : ''}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400 text-[11px]">{log.ip || '127.0.0.1'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* MODAL: VERIFY ORGANIZATION */}
      {verifyOrgModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-xs animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              {verifyOrgModal.status === 'verified' ? 'Approve NGO Accreditation' : 'Decline Organization Request'}
            </h3>
            <p className="text-slate-500 text-[11px] mb-3">
              Organization: <strong className="text-slate-900">{verifyOrgModal.name}</strong>
            </p>
            <div className="mb-4">
              <label className="block font-medium text-slate-700 mb-1">Administrative Notes</label>
              <textarea
                rows={3}
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-rose-500 focus:outline-none"
                placeholder="Enter verification audit notes or reason for decline..."
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setVerifyOrgModal(null)}
                className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={verifying}
                onClick={handleConfirmVerifyOrg}
                className={`px-4 py-1.5 text-white font-bold rounded shadow-xs disabled:opacity-50 ${
                  verifyOrgModal.status === 'verified'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {verifying ? 'Updating...' : `Confirm ${verifyOrgModal.status === 'verified' ? 'Approval' : 'Decline'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
