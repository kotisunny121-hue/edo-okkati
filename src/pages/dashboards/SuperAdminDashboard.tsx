import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { User, UserRole, AuditLogItem } from '../../types/index.js';
import { RoleBadge } from '../../components/common/RoleBadge.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import {
  ShieldAlert,
  Key,
  Users,
  ShieldCheck,
  Activity,
  AlertOctagon,
  RefreshCw,
} from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const [admins, setAdmins] = useState<User[]>([]);
  const [privilegedLogs, setPrivilegedLogs] = useState<AuditLogItem[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchSuperData = async () => {
    try {
      setLoading(true);
      const [adminsRes, logsRes, healthRes] = await Promise.all([
        api.get<{ success: boolean; data: User[] }>('/super-admin/admins'),
        api.get<{ success: boolean; data: AuditLogItem[] }>('/super-admin/privileged-logs'),
        api.get<any>('/health'),
      ]);

      if (adminsRes.success) setAdmins(adminsRes.data);
      if (logsRes.success) setPrivilegedLogs(logsRes.data);
      if (healthRes) setHealth(healthRes);
    } catch (err) {
      console.error('Failed to load super admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuperData();
  }, []);

  const handleChangeRole = async (userId: string, currentRole: string) => {
    const newRole = window.prompt(
      `Enter new role for user (seeker, provider, organization, volunteer, admin, super_admin):`,
      currentRole
    );
    if (!newRole || newRole === currentRole) return;

    try {
      await api.patch(`/super-admin/users/${userId}/role`, { role: newRole });
      setActionSuccess(`Role successfully updated to ${newRole}.`);
      fetchSuperData();
    } catch (err: any) {
      alert(err.message || 'Failed to update user role');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1 text-purple-400 font-mono text-xs uppercase tracking-wider font-semibold">
            <Key className="w-4 h-4" />
            <span>Restricted Security Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Super Administrator Authority
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Privileged role delegation, security audit inspection, and platform policy controls.
          </p>
        </div>

        {health && (
          <div className="bg-slate-800/80 p-3 rounded border border-slate-700 text-xs font-mono self-start sm:self-auto">
            <div className="flex items-center gap-2 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Core Service Status: {health.status}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Uptime: {Math.floor(health.uptime / 60)}m · Env: {health.environment}
            </div>
          </div>
        )}
      </div>

      {actionSuccess && (
        <div className="mb-6 p-3 bg-emerald-950/70 border border-emerald-800 text-emerald-200 rounded text-xs flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-slate-400">✕</button>
        </div>
      )}

      {/* Admin Personnel Management */}
      <div className="bg-slate-800/90 rounded-lg border border-slate-700 shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              Administrative Personnel & Role Assignments
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Authorized operators with administrative platform controls.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 border-b border-slate-700 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {admins.map((adm) => (
                <tr key={adm.id || (adm as any)._id} className="hover:bg-slate-700/30">
                  <td className="py-3 px-4 font-bold text-white">{adm.name}</td>
                  <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">{adm.email}</td>
                  <td className="py-3 px-4">
                    <RoleBadge role={adm.role} />
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={adm.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleChangeRole(adm.id || (adm as any)._id, adm.role)}
                      className="px-2.5 py-1 rounded text-[11px] font-semibold bg-purple-900/40 hover:bg-purple-900/70 text-purple-200 border border-purple-700 transition-colors"
                    >
                      Change Role
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Privileged Security Audit Log */}
      <div className="bg-slate-800/90 rounded-lg border border-slate-700 shadow-md p-6">
        <h2 className="text-base font-bold text-white flex items-center gap-2 mb-2">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          High-Security Audit Ledger (Privileged Actions)
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          All privilege modifications, user suspensions, and NGO verifications are logged here with IP provenance.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/60 border-b border-slate-700 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Initiator</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {privilegedLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-500">
                    No privileged actions recorded in this window.
                  </td>
                </tr>
              ) : (
                privilegedLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-700/30">
                    <td className="py-2.5 px-4 text-slate-400 text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-rose-300">{log.action}</td>
                    <td className="py-2.5 px-4 text-slate-300">
                      {log.userEmail || log.userId?.email || 'System'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400 text-[11px] truncate max-w-[280px]">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
