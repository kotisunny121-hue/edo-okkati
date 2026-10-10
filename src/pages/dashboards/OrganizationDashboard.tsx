import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { Organization, Resource, ResourceRequest, User } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import {
  Building2,
  ShieldCheck,
  AlertTriangle,
  Users,
  Package,
  Layers,
  CheckCircle,
  Clock,
  Plus,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const OrganizationDashboard: React.FC = () => {
  const [data, setData] = useState<{
    organization: Organization;
    members: User[];
    resources: Resource[];
    requests: ResourceRequest[];
    stats: {
      totalListings: number;
      totalStockAvailable: number;
      totalStockReserved: number;
      pendingRequests: number;
      fulfilledRequests: number;
    };
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchOrgData = async () => {
    try {
      setLoading(true);
      const res = await api.get<{
        success: boolean;
        data: any;
      }>('/organizations/my');

      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error fetching org data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgData();
  }, []);

  const handleApprove = async (requestId: string, quantity: number) => {
    try {
      await api.post(`/requests/${requestId}/approve`, {
        approvedQuantity: quantity,
      });
      setActionSuccess('Request approved and stock reserved.');
      fetchOrgData();
    } catch (err: any) {
      alert(err.message || 'Failed to approve request');
    }
  };

  const handleFulfill = async (requestId: string) => {
    try {
      await api.post(`/requests/${requestId}/fulfill`, {
        note: 'Distribution completed by NGO field logistics',
      });
      setActionSuccess('Request marked fulfilled.');
      fetchOrgData();
    } catch (err: any) {
      alert(err.message || 'Failed to fulfill request');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || !data.organization) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 max-w-lg mx-auto text-center">
        <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">No Organization Linked</h2>
        <p className="text-xs text-slate-600 mt-1 mb-4">
          Your account is not currently linked to an active relief organization profile.
        </p>
      </div>
    );
  }

  const { organization, members, resources, requests, stats } = data;
  const isVerified = organization.status === 'verified';

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Verification Notice Banner */}
      {!isVerified && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-amber-900">Organization Pending Administrative Verification</h4>
            <p className="text-amber-800 mt-0.5 leading-relaxed">
              Your NGO registration is currently under review by our operations verification team. Once verified, your listings receive priority verified badges across the regional staging map.
            </p>
          </div>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{organization.name}</h1>
                <StatusBadge status={organization.status} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Reg: {organization.registrationNumber || 'Pending'} · Headquartered: {organization.address}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/dashboard/provider"
              className="px-3 py-1.5 rounded bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold"
            >
              + Add Organization Listing
            </Link>
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800">
          {actionSuccess}
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Relief Listings</span>
          <span className="text-2xl font-black text-slate-900">{stats.totalListings}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Disaster staging</span>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Stock Available</span>
          <span className="text-2xl font-black text-emerald-700">{stats.totalStockAvailable}</span>
          <span className="text-[10px] text-emerald-600 block mt-0.5">Units ready</span>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Stock Reserved</span>
          <span className="text-2xl font-black text-amber-700">{stats.totalStockReserved}</span>
          <span className="text-[10px] text-amber-600 block mt-0.5">Locked for approved</span>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Pending Requests</span>
          <span className="text-2xl font-black text-blue-700">{stats.pendingRequests}</span>
          <span className="text-[10px] text-blue-600 block mt-0.5">Awaiting triage</span>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs col-span-2 md:col-span-1">
          <span className="text-[11px] font-medium text-slate-500 block">Total Fulfilled</span>
          <span className="text-2xl font-black text-slate-900">{stats.fulfilledRequests}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Distributions</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Organization Incoming Requests (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Incoming Requests for Organization Stock</h3>
              <span className="text-xs text-slate-500">{requests.length} total</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Seeker</th>
                    <th className="py-3 px-4">Supply</th>
                    <th className="py-3 px-4">Quantity</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No requests submitted for this organization yet.
                      </td>
                    </tr>
                  ) : (
                    requests.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{r.seekerId?.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{r.contactPhone}</span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {typeof r.resourceId === 'object' ? r.resourceId.title : 'Supply item'}
                        </td>
                        <td className="py-3 px-4 font-extrabold text-slate-900">
                          {r.requestedQuantity}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          {r.status === 'pending' && (
                            <button
                              onClick={() => handleApprove(r._id, r.requestedQuantity)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold"
                            >
                              Approve
                            </button>
                          )}
                          {r.status === 'approved' && (
                            <button
                              onClick={() => handleFulfill(r._id)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-semibold"
                            >
                              Fulfill
                            </button>
                          )}
                          {r.status === 'fulfilled' && (
                            <span className="text-emerald-700 font-semibold text-[11px]">Completed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Team Members & Org Info (1 col) */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-600" />
              Authorized Organization Staff ({members.length})
            </h3>
            <ul className="divide-y divide-slate-100 text-xs">
              {members.map((m) => (
                <li key={m.id || (m as any)._id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">{m.name}</span>
                    <span className="text-slate-500 text-[11px]">{m.email}</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {m.role}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs text-xs space-y-2">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider font-mono text-[11px]">
              Accreditation Details
            </h4>
            <p className="text-slate-600">
              Contact: {organization.contactEmail} · {organization.contactPhone}
            </p>
            {organization.verificationNotes && (
              <p className="text-slate-500 text-[11px] italic bg-slate-50 p-2 rounded">
                "{organization.verificationNotes}"
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
