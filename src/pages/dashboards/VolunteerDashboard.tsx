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

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ success: boolean; data: VolunteerAssignment[] }>(
        '/volunteers/assignments'
      );
      if (res.success) {
        setAssignments(res.data);
      }
    } catch (err) {
      console.error('Failed to load volunteer tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleUpdateStatus = async (assignmentId: string, status: string, notes?: string) => {
    try {
      await api.patch(`/volunteers/assignments/${assignmentId}/status`, {
        status,
        notes: notes || `Updated to ${status} by volunteer`,
      });
      setActionSuccess(`Task status successfully updated to ${status}.`);
      fetchAssignments();
    } catch (err: any) {
      alert(err.message || 'Failed to update assignment status');
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
          <button onClick={() => setActionSuccess(null)} className="text-slate-400">✕</button>
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
                            const reason = window.prompt('Report delivery failure reason:');
                            if (reason) handleUpdateStatus(task._id, 'failed', reason);
                          }}
                          className="px-3 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded text-xs"
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
    </div>
  );
};
