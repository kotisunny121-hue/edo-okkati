import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { ResourceRequest } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import {
  Clock,
  CheckCircle,
  XCircle,
  Package,
  Search,
  ArrowRight,
  AlertCircle,
  MapPin,
  Phone,
  RotateCcw,
} from 'lucide-react';

export const SeekerDashboard: React.FC = () => {
  const [requests, setRequests] = useState<ResourceRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ success: boolean; data: ResourceRequest[] }>('/requests/seeker');
      if (res.success) {
        setRequests(res.data);
      }
    } catch (err: any) {
      console.error('Error fetching seeker requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const handleCancelRequest = async (requestId: string) => {
    if (!window.confirm('Are you sure you want to cancel this emergency request? Any reserved items will be released back to the community.')) {
      return;
    }

    try {
      setActionError(null);
      await api.post(`/requests/${requestId}/cancel`, {
        reason: 'Cancelled by seeker',
      });
      setActionSuccess('Request cancelled. Reserved stock released.');
      fetchMyRequests();
    } catch (err: any) {
      setActionError(err.message || 'Failed to cancel request');
    }
  };

  const pending = requests.filter((r) => r.status === 'pending');
  const approved = requests.filter((r) => r.status === 'approved');
  const fulfilled = requests.filter((r) => r.status === 'fulfilled');

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-[11px] font-mono uppercase font-semibold text-orange-600 tracking-wider">
            Assistance Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
            Seeker Emergency Requests
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track status of your submitted emergency supplies and coordinate collection.
          </p>
        </div>

        <Link
          to="/resources"
          className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs font-bold shadow-xs transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Search className="w-4 h-4" />
          Browse Available Supplies
        </Link>
      </div>

      {actionError && (
        <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-slate-400">✕</button>
        </div>
      )}

      {actionSuccess && (
        <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-slate-400">✕</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Total Requests</span>
          <span className="text-2xl font-black text-slate-900">{requests.length}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Submitted history</span>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Pending Review</span>
          <span className="text-2xl font-black text-blue-700">{pending.length}</span>
          <span className="text-[10px] text-blue-600 block mt-0.5">Awaiting provider</span>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Approved & Ready</span>
          <span className="text-2xl font-black text-amber-700">{approved.length}</span>
          <span className="text-[10px] text-amber-600 block mt-0.5">Stock reserved</span>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Fulfilled / Handed Over</span>
          <span className="text-2xl font-black text-emerald-700">{fulfilled.length}</span>
          <span className="text-[10px] text-emerald-600 block mt-0.5">Distribution complete</span>
        </div>
      </div>

      {/* Requests History Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden mb-8">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">Your Emergency Request History</h3>
          <span className="text-xs text-slate-500">Real-time status updates</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">Supply Item</th>
                <th className="py-3 px-4">Requested / Approved</th>
                <th className="py-3 px-4">Urgency</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Provider / Staging Depot</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Loading requests...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    You have not submitted any emergency resource requests yet.
                  </td>
                </tr>
              ) : (
                requests.map((req) => {
                  const res = typeof req.resourceId === 'object' ? req.resourceId : null;
                  return (
                    <tr key={req._id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {res ? res.title : 'Supply Listing'}
                        <span className="block text-[10px] font-normal text-slate-400">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-slate-900">{req.requestedQuantity}</span>
                        {req.approvedQuantity > 0 && req.status !== 'pending' && (
                          <span className="text-[11px] text-emerald-700 block font-semibold">
                            Apprv: {req.approvedQuantity}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 uppercase text-[10px] font-mono font-bold">
                        <span
                          className={
                            req.urgency === 'critical'
                              ? 'text-rose-600'
                              : req.urgency === 'high'
                              ? 'text-orange-600'
                              : 'text-slate-600'
                          }
                        >
                          {req.urgency}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <span className="font-semibold block">{req.providerId?.name || 'Relief Provider'}</span>
                        <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                          {res?.locationName || 'Staging Area'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-[160px]" title={req.destinationAddress}>
                        {req.destinationAddress}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {(req.status === 'pending' || req.status === 'approved') && (
                          <button
                            onClick={() => handleCancelRequest(req._id)}
                            className="px-2.5 py-1 text-rose-700 hover:text-rose-800 border border-rose-200 hover:bg-rose-50 rounded text-[11px] font-semibold transition-colors"
                          >
                            Cancel Request
                          </button>
                        )}
                        {req.status === 'fulfilled' && (
                          <span className="text-emerald-700 font-semibold text-[11px]">Fulfilled</span>
                        )}
                        {req.status === 'rejected' && (
                          <span className="text-rose-600 text-[11px]" title={req.rejectionReason}>
                            Declined
                          </span>
                        )}
                        {req.status === 'cancelled' && (
                          <span className="text-slate-400 text-[11px]">Cancelled</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Emergency Guidance for Seekers */}
      <div className="bg-orange-50/70 border border-orange-200 rounded-lg p-5">
        <h4 className="font-bold text-xs text-orange-950 flex items-center gap-2 mb-2">
          <AlertCircle className="w-4 h-4 text-orange-600" />
          Urgent Assistance Protocol
        </h4>
        <p className="text-xs text-orange-900/90 leading-relaxed">
          When your request changes to <strong>Approved</strong>, supplies have been reserved specifically for your location. The staging depot manager or an assigned volunteer coordinator will reach out to your contact phone to coordinate collection or handover. For immediate life-safety emergencies, call 911 immediately.
        </p>
      </div>
    </div>
  );
};
