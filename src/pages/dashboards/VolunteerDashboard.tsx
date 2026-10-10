import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { VolunteerAssignment } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import {
  Truck,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Clock,
  Phone,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const VolunteerDashboard: React.FC = () => {
  const [assignments, setAssignments] = useState<VolunteerAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [issueModalTaskId, setIssueModalTaskId] = useState<string | null>(null);
  const [issueReasonInput, setIssueReasonInput] = useState<string>('Destination inaccessible due to floodwaters or blocked road');
  const [submittingIssue, setSubmittingIssue] = useState<boolean>(false);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ success: boolean; data: VolunteerAssignment[] }>(
        '/volunteers/assignments'
      );
      if (res.success) {
        setAssignments(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load volunteer tasks:', err);
      setActionError(err.message || 'Failed to load volunteer tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleUpdateStatus = async (assignmentId: string, status: string, notes?: string) => {
    try {
      setActionError(null);
      await api.patch(`/volunteers/assignments/${assignmentId}/status`, {
        status,
        notes: notes || `Updated to ${status} by volunteer`,
      });
      setActionSuccess(`Task status successfully updated to ${status}.`);
      fetchAssignments();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update assignment status');
    }
  };

  const handleConfirmReportIssue = async () => {
    if (!issueModalTaskId) return;
    try {
      setSubmittingIssue(true);
      await handleUpdateStatus(issueModalTaskId, 'failed', issueReasonInput.trim() || 'Delivery issue reported');
      setIssueModalTaskId(null);
    } finally {
      setSubmittingIssue(false);
    }
  };

  const activeTasks = assignments.filter((a) => a.status === 'assigned' || a.status === 'collected');
  const completedTasks = assignments.filter((a) => a.status === 'delivered');

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-[11px] font-mono uppercase font-semibold text-teal-600 tracking-wider">
            Field Logistics Dispatch
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
            Volunteer Delivery Coordination
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pick up reserved emergency supplies from staging depots and deliver them to designated community shelters.
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

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Active Dispatch Tasks</span>
          <span className="text-2xl font-black text-teal-700">{activeTasks.length}</span>
          <span className="text-[10px] text-teal-600 block mt-0.5">In transit or pickup</span>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Completed Deliveries</span>
          <span className="text-2xl font-black text-emerald-700">{completedTasks.length}</span>
          <span className="text-[10px] text-emerald-600 block mt-0.5">Successfully handed over</span>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs col-span-2 md:col-span-1">
          <span className="text-[11px] font-medium text-slate-500 block">Total Lifetime Assignments</span>
          <span className="text-2xl font-black text-slate-900">{assignments.length}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Assigned to you</span>
        </div>
      </div>

      {/* Assignments List */}
      <div className="space-y-4 mb-8">
        <h2 className="text-base font-bold text-slate-900">Assigned Transit & Handover Tasks</h2>

        {loading ? (
          <div className="h-40 bg-slate-200 animate-pulse rounded-lg" />
        ) : assignments.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-xs text-slate-500">
            No delivery tasks assigned to your volunteer profile yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.map((task) => {
              const req = task.requestId;
              const res = req && typeof req.resourceId === 'object' ? req.resourceId : null;

              return (
                <div
                  key={task._id}
                  className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-semibold text-slate-500 uppercase">
                        Task #{task._id.slice(-6)}
                      </span>
                      <StatusBadge status={task.status} />
                    </div>

                    <h3 className="text-base font-bold text-slate-900">
                      {res ? res.title : 'Relief Supply Item'}
                    </h3>

                    <div className="p-3 bg-slate-50 rounded border border-slate-100 space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                          1. Collection Point (Depot)
                        </span>
                        <p className="font-semibold text-slate-900">{task.collectionLocation}</p>
                        {task.collectionNotes && (
                          <p className="text-[11px] text-slate-500 italic mt-0.5">"{task.collectionNotes}"</p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase block">
                          2. Destination (Shelter / Recipient)
                        </span>
                        <p className="font-semibold text-slate-900">{task.dropoffLocation}</p>
                        {req?.seekerId && (
                          <p className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            Recipient: {req.seekerId.name} ({req.contactPhone})
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Workflow Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {task.status === 'assigned' && (
                      <button
                        onClick={() => handleUpdateStatus(task._id, 'collected', 'Picked up from staging warehouse')}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold"
                      >
                        Confirm Picked Up from Depot
                      </button>
                    )}

                    {task.status === 'collected' && (
                      <div className="w-full flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateStatus(task._id, 'delivered', 'Handed over at destination')}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
                        >
                          Confirm Handed Over (Fulfilled)
                        </button>
                        <button
                          onClick={() => {
                            setIssueModalTaskId(task._id);
                            setIssueReasonInput('Destination inaccessible due to floodwaters or road blockage');
                          }}
                          className="px-3 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded text-xs font-medium"
                        >
                          Report Issue
                        </button>
                      </div>
                    )}

                    {task.status === 'delivered' && (
                      <span className="text-emerald-700 text-xs font-bold flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Delivered & Verified
                      </span>
                    )}

                    {task.status === 'failed' && (
                      <span className="text-rose-600 text-xs font-bold flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" /> Handover Unsuccessful
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: REPORT DELIVERY ISSUE */}
      {issueModalTaskId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Report Handover Obstacle</h3>
                <p className="text-slate-500 text-[11px]">Notify coordinators why supplies could not be handed over.</p>
              </div>
            </div>
            <div className="mb-4">
              <label className="block font-medium text-slate-700 mb-1">Issue Details / Explanation</label>
              <textarea
                rows={3}
                value={issueReasonInput}
                onChange={(e) => setIssueReasonInput(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-rose-500 focus:outline-none"
                placeholder="E.g. Recipient unreachable, route flooded, safety hazard..."
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIssueModalTaskId(null)}
                className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingIssue}
                onClick={handleConfirmReportIssue}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded shadow-xs disabled:opacity-50"
              >
                {submittingIssue ? 'Submitting...' : 'Mark Unsuccessful & Alert Dispatch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
