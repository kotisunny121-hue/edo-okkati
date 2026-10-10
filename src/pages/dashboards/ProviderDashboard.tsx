import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { Resource, ResourceRequest, ResourceCategory } from '../../types/index.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import {
  Package,
  Layers,
  Clock,
  CheckCircle,
  Plus,
  AlertCircle,
  Edit2,
  Trash2,
  Send,
  User,
  MapPin,
  TrendingUp,
} from 'lucide-react';

export const ProviderDashboard: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<ResourceRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'inventory' | 'requests' | 'add'>('inventory');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Form for new resource
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ResourceCategory>('food');
  const [description, setDescription] = useState('');
  const [quantityAvailable, setQuantityAvailable] = useState<number>(100);
  const [unit, setUnit] = useState('packets');
  const [condition, setCondition] = useState<'new' | 'good' | 'perishable'>('new');
  const [locationName, setLocationName] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number>(37.7749);
  const [lng, setLng] = useState<number>(-122.4194);
  const [submittingResource, setSubmittingResource] = useState(false);

  // Stock edit state
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [stockEditQty, setStockEditQty] = useState<number>(0);

  // Full Resource Edit Modal state
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [resourceToEdit, setResourceToEdit] = useState<Resource | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<ResourceCategory>('food');
  const [editDescription, setEditDescription] = useState('');
  const [editQuantityAvailable, setEditQuantityAvailable] = useState<number>(0);
  const [editUnit, setEditUnit] = useState('units');
  const [editCondition, setEditCondition] = useState<'new' | 'good' | 'perishable'>('new');
  const [editLocationName, setEditLocationName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editLat, setEditLat] = useState<number>(37.7749);
  const [editLng, setEditLng] = useState<number>(-122.4194);
  const [editAvailabilityStatus, setEditAvailabilityStatus] = useState<string>('available');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  // Custom in-app modal states for deletion, rejection, fulfillment
  const [deleteConfirmRes, setDeleteConfirmRes] = useState<Resource | null>(null);
  const [deletingResource, setDeletingResource] = useState<boolean>(false);
  const [rejectModalReq, setRejectModalReq] = useState<ResourceRequest | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState<string>('Currently unavailable');
  const [rejectingRequest, setRejectingRequest] = useState<boolean>(false);
  const [fulfillModalReq, setFulfillModalReq] = useState<ResourceRequest | null>(null);
  const [fulfillingRequest, setFulfillingRequest] = useState<boolean>(false);

  const openEditModal = (res: Resource) => {
    setResourceToEdit(res);
    setEditTitle(res.title);
    setEditCategory(res.category);
    setEditDescription(res.description);
    setEditQuantityAvailable(res.quantityAvailable);
    setEditUnit(res.unit);
    setEditCondition(res.condition);
    setEditLocationName(res.locationName);
    setEditAddress(res.address);
    setEditLat(res.coordinates?.lat || 37.7749);
    setEditLng(res.coordinates?.lng || -122.4194);
    setEditAvailabilityStatus(res.availabilityStatus);
    setEditModalOpen(true);
  };

  const handleSaveEditResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceToEdit) return;
    try {
      setSavingEdit(true);
      setActionError(null);
      await api.put(`/resources/${resourceToEdit._id}`, {
        title: editTitle,
        category: editCategory,
        description: editDescription,
        quantityAvailable: editQuantityAvailable,
        unit: editUnit,
        condition: editCondition,
        locationName: editLocationName,
        address: editAddress,
        coordinates: { lat: editLat, lng: editLng },
        availabilityStatus: editAvailabilityStatus,
      });

      setActionSuccess(`Resource "${editTitle}" updated successfully in MongoDB.`);
      setEditModalOpen(false);
      setResourceToEdit(null);
      fetchData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update resource');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleChangeAvailability = async (resourceId: string, newStatus: string) => {
    try {
      setActionError(null);
      await api.patch(`/resources/${resourceId}/availability`, {
        availabilityStatus: newStatus,
      });
      setActionSuccess(`Availability status updated to '${newStatus}'.`);
      fetchData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update availability');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resData, reqData] = await Promise.all([
        api.get<{ success: boolean; data: Resource[] }>('/resources/mine'),
        api.get<{ success: boolean; data: ResourceRequest[] }>('/requests/incoming'),
      ]);

      if (resData.success) setResources(resData.data);
      if (reqData.success) setIncomingRequests(reqData.data);
    } catch (err: any) {
      console.error('Error loading provider data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    try {
      setSubmittingResource(true);
      const res = await api.post('/resources', {
        title,
        category,
        description,
        quantityAvailable,
        unit,
        condition,
        locationName,
        address,
        coordinates: { lat, lng },
      });

      if (res) {
        setActionSuccess('Resource created and published to crisis network.');
        // reset form
        setTitle('');
        setDescription('');
        setLocationName('');
        setAddress('');
        setActiveTab('inventory');
        fetchData();
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to create resource');
    } finally {
      setSubmittingResource(false);
    }
  };

  const handleUpdateStock = async (resourceId: string) => {
    try {
      await api.put(`/resources/${resourceId}`, {
        quantityAvailable: stockEditQty,
      });
      setEditingStockId(null);
      setActionSuccess('Stock quantity updated successfully.');
      fetchData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update stock');
    }
  };

  const handleConfirmDeleteResource = async () => {
    if (!deleteConfirmRes) return;
    try {
      setDeletingResource(true);
      setActionError(null);
      await api.delete(`/resources/${deleteConfirmRes._id}`);
      setActionSuccess(`Listing "${deleteConfirmRes.title}" successfully removed.`);
      setDeleteConfirmRes(null);
      fetchData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete listing');
    } finally {
      setDeletingResource(false);
    }
  };

  const handleApproveRequest = async (requestId: string, quantity: number) => {
    try {
      await api.post(`/requests/${requestId}/approve`, {
        approvedQuantity: quantity,
      });
      setActionSuccess('Request approved! Stock atomically reserved in inventory.');
      fetchData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to approve request');
    }
  };

  const handleConfirmRejectRequest = async () => {
    if (!rejectModalReq) return;
    try {
      setRejectingRequest(true);
      setActionError(null);
      await api.post(`/requests/${rejectModalReq._id}/reject`, {
        rejectionReason: rejectReasonInput.trim() || 'Currently unavailable',
      });
      setActionSuccess('Request marked as rejected.');
      setRejectModalReq(null);
      fetchData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to reject request');
    } finally {
      setRejectingRequest(false);
    }
  };

  const handleConfirmFulfillRequest = async () => {
    if (!fulfillModalReq) return;
    try {
      setFulfillingRequest(true);
      setActionError(null);
      await api.post(`/requests/${fulfillModalReq._id}/fulfill`, {
        note: 'Confirmed handover at provider distribution depot',
      });
      setActionSuccess('Request marked as fulfilled and reserved stock finalized.');
      setFulfillModalReq(null);
      fetchData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to fulfill request');
    } finally {
      setFulfillingRequest(false);
    }
  };

  const totalAvailable = resources.reduce((acc, r) => acc + r.quantityAvailable, 0);
  const totalReserved = resources.reduce((acc, r) => acc + r.quantityReserved, 0);
  const pendingRequests = incomingRequests.filter((r) => r.status === 'pending');
  const approvedRequests = incomingRequests.filter((r) => r.status === 'approved');
  const fulfilledRequests = incomingRequests.filter((r) => r.status === 'fulfilled');

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-[11px] font-mono uppercase font-semibold text-orange-600 tracking-wider">
            Provider Operations Hub
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
            Resource Inventory & Distribution
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your staging inventory, review incoming emergency requests, and log handovers.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('add')}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs font-bold shadow-xs transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Relief Resource
        </button>
      </div>

      {actionError && (
        <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {actionSuccess && (
        <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Total Listings</span>
          <span className="text-2xl font-black text-slate-900">{resources.length}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Active depots</span>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Available Units</span>
          <span className="text-2xl font-black text-emerald-700">{totalAvailable}</span>
          <span className="text-[10px] text-emerald-600 block mt-0.5">Ready to allocate</span>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Reserved Units</span>
          <span className="text-2xl font-black text-amber-700">{totalReserved}</span>
          <span className="text-[10px] text-amber-600 block mt-0.5">Locked for approved</span>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">Pending Requests</span>
          <span className="text-2xl font-black text-blue-700">{pendingRequests.length}</span>
          <span className="text-[10px] text-blue-600 block mt-0.5">Need review</span>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs col-span-2 md:col-span-1">
          <span className="text-[11px] font-medium text-slate-500 block">Fulfilled Total</span>
          <span className="text-2xl font-black text-slate-900">{fulfilledRequests.length}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Distributions done</span>
        </div>
      </div>

      {/* Segmented Navigation Tabs */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-xs mb-6 w-fit text-xs font-semibold">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded transition-colors ${
            activeTab === 'inventory' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          My Inventory ({resources.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded transition-colors flex items-center gap-1.5 ${
            activeTab === 'requests' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Incoming Requests ({incomingRequests.length})</span>
          {pendingRequests.length > 0 && (
            <span className="px-1.5 py-0.2 bg-orange-600 text-white text-[10px] rounded-full">
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`px-4 py-2 rounded transition-colors ${
            activeTab === 'add' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          + Add New Resource
        </button>
      </div>

      {/* TAB 1: INVENTORY TABLE */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Active Supply Inventory</h3>
            <span className="text-xs text-slate-500">Atomic real-time database locks enabled</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-4">Supply Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Available</th>
                  <th className="py-3 px-4">Reserved</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Staging Depot</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resources.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No resources listed yet. Click "+ Add New Resource" to list emergency supplies.
                    </td>
                  </tr>
                ) : (
                  resources.map((res) => (
                    <tr key={res._id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {res.title}
                        <span className="block text-[11px] font-normal text-slate-500 capitalize">{res.condition} condition</span>
                      </td>
                      <td className="py-3 px-4 capitalize font-mono text-[11px] text-slate-600">
                        {res.category.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4">
                        {editingStockId === res._id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={stockEditQty}
                              onChange={(e) => setStockEditQty(parseInt(e.target.value) || 0)}
                              className="w-16 px-1.5 py-1 border border-slate-300 rounded text-xs"
                            />
                            <button
                              onClick={() => handleUpdateStock(res._id)}
                              className="px-2 py-1 bg-emerald-700 text-white rounded text-[10px]"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingStockId(null)}
                              className="px-1.5 py-1 text-slate-500 text-[10px]"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-900">{res.quantityAvailable}</span>
                            <span className="text-slate-500">{res.unit}</span>
                            <button
                              onClick={() => {
                                setEditingStockId(res._id);
                                setStockEditQty(res.quantityAvailable);
                              }}
                              className="text-slate-400 hover:text-slate-700 ml-1"
                              title="Edit available quantity"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-amber-700">
                        {res.quantityReserved} {res.unit}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <StatusBadge status={res.availabilityStatus} />
                          <select
                            value={res.availabilityStatus}
                            onChange={(e) => handleChangeAvailability(res._id, e.target.value)}
                            className="text-[10px] border border-slate-200 rounded px-1 py-0.5 bg-white text-slate-700 focus:outline-none"
                            title="Quick update availability"
                          >
                            <option value="available">Available</option>
                            <option value="partially_available">Partial Stock</option>
                            <option value="reserved">Reserved</option>
                            <option value="unavailable">Unavailable</option>
                          </select>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="block truncate max-w-[140px]">{res.locationName}</span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => openEditModal(res)}
                          className="p-1 text-slate-500 hover:text-orange-600 inline-flex items-center"
                          title="Edit Full Resource Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmRes(res)}
                          className="p-1 text-slate-400 hover:text-rose-600 inline-flex items-center"
                          title="Delete Listing"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* TAB 2: INCOMING REQUESTS */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Incoming Requests for Your Inventory</h3>
            <span className="text-xs text-slate-500">Authorize or reject with real reservation locks</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-4">Seeker & Phone</th>
                  <th className="py-3 px-4">Resource</th>
                  <th className="py-3 px-4">Requested Qty</th>
                  <th className="py-3 px-4">Urgency</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Reason / Destination</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incomingRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No incoming requests received yet.
                    </td>
                  </tr>
                ) : (
                  incomingRequests.map((req) => (
                    <tr key={req._id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{req.seekerId.name}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{req.contactPhone}</span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {typeof req.resourceId === 'object' ? req.resourceId.title : 'Supply Item'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-slate-900">{req.requestedQuantity}</span>
                        {req.approvedQuantity > 0 && req.status !== 'pending' && (
                          <span className="text-[11px] text-emerald-700 block">
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
                      <td className="py-3 px-4 text-slate-600 max-w-[200px]">
                        <p className="truncate" title={req.reason}>{req.reason}</p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">Dest: {req.destinationAddress}</p>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {req.status === 'pending' && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleApproveRequest(req._id, req.requestedQuantity)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setRejectModalReq(req);
                                setRejectReasonInput('Currently unavailable');
                              }}
                              className="px-2 py-1 border border-slate-300 text-slate-600 hover:bg-slate-50 rounded text-[11px]"
                            >
                              Reject
                            </button>
                          </div>
                        )}

                        {req.status === 'approved' && (
                          <button
                            onClick={() => setFulfillModalReq(req)}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-semibold"
                          >
                            Mark Fulfilled
                          </button>
                        )}

                        {req.status === 'fulfilled' && (
                          <span className="text-emerald-700 font-semibold text-[11px]">Completed</span>
                        )}

                        {req.status === 'rejected' && (
                          <span className="text-rose-600 text-[11px]">Declined</span>
                        )}

                        {req.status === 'cancelled' && (
                          <span className="text-slate-400 text-[11px]">Cancelled</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ADD RESOURCE FORM */}
      {activeTab === 'add' && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs max-w-2xl">
          <h3 className="font-bold text-base text-slate-900 mb-1">List New Emergency Resource</h3>
          <p className="text-xs text-slate-500 mb-6">
            Input verified stockpiles. Coordinates allow victims and volunteers to locate supplies on GIS map.
          </p>

          <form onSubmit={handleCreateResource} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Resource Name / Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g. Packaged Drinking Water 1-Gallon Bottles"
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-orange-500 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-orange-500 focus:outline-none bg-white"
                >
                  <option value="food">Food Packets</option>
                  <option value="water">Drinking Water</option>
                  <option value="first_aid">First Aid Kits</option>
                  <option value="medicine">Essential Medicine</option>
                  <option value="clothing">Clothing & Blankets</option>
                  <option value="shelter">Shelter & Tents</option>
                  <option value="hygiene">Hygiene Kits</option>
                  <option value="rescue">Rescue Equipment</option>
                  <option value="other">Other Emergency Supplies</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-orange-500 focus:outline-none bg-white"
                >
                  <option value="new">Brand New / Sealed</option>
                  <option value="good">Good Condition</option>
                  <option value="perishable">Perishable (Consume Soon)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Initial Available Quantity <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantityAvailable}
                  onChange={(e) => setQuantityAvailable(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-orange-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Unit of Measurement <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="E.g. packets, gallons, kits, boxes"
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-orange-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Detailed Description & Usage Instructions <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Include shelf life, contents list, dietary details, or storage instructions..."
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-orange-500 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Location Name / Depot Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="E.g. Apex Central Distribution Center"
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-orange-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Physical Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="E.g. 101 Bayfront Expressway, San Francisco, CA"
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-orange-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded border border-slate-100">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white text-xs font-mono"
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-slate-600 mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={lng}
                  onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white text-xs font-mono"
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('inventory')}
                className="px-3 py-2 border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingResource}
                className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded font-bold transition-colors disabled:opacity-50"
              >
                {submittingResource ? 'Publishing...' : 'Publish Resource to Catalog'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT RESOURCE MODAL */}
      {editModalOpen && resourceToEdit && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-xl w-full p-6 shadow-xl border border-slate-200 relative text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase font-semibold text-orange-600">
                  Update Supply Record
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Edit Resource: {resourceToEdit.title}
                </h3>
              </div>
              <button
                onClick={() => {
                  setEditModalOpen(false);
                  setResourceToEdit(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditResource} className="space-y-4">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Resource Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-orange-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-orange-500 focus:outline-none bg-white"
                  >
                    <option value="food">Food Packets</option>
                    <option value="water">Drinking Water</option>
                    <option value="first_aid">First Aid Kits</option>
                    <option value="medicine">Essential Medicine</option>
                    <option value="clothing">Clothing & Blankets</option>
                    <option value="shelter">Shelter & Tents</option>
                    <option value="hygiene">Hygiene Kits</option>
                    <option value="rescue">Rescue Equipment</option>
                    <option value="other">Other Emergency Supplies</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Condition</label>
                  <select
                    value={editCondition}
                    onChange={(e) => setEditCondition(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-orange-500 focus:outline-none bg-white"
                  >
                    <option value="new">Brand New / Sealed</option>
                    <option value="good">Good Condition</option>
                    <option value="perishable">Perishable</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Available Stock <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editQuantityAvailable}
                    onChange={(e) => setEditQuantityAvailable(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-orange-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-orange-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={editAvailabilityStatus}
                    onChange={(e) => setEditAvailabilityStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-orange-500 focus:outline-none bg-white"
                  >
                    <option value="available">Available</option>
                    <option value="partially_available">Partial Stock</option>
                    <option value="reserved">Reserved</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-orange-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Depot / Location Name</label>
                  <input
                    type="text"
                    value={editLocationName}
                    onChange={(e) => setEditLocationName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-orange-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-orange-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-2 bg-slate-50 rounded border border-slate-100">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={editLat}
                    onChange={(e) => setEditLat(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white font-mono text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={editLng}
                    onChange={(e) => setEditLng(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white font-mono text-xs"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditModalOpen(false);
                    setResourceToEdit(null);
                  }}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded shadow-xs disabled:opacity-50"
                >
                  {savingEdit ? 'Saving Changes...' : 'Save Changes to MongoDB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: DELETE RESOURCE CONFIRMATION */}
      {deleteConfirmRes && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Confirm Deletion</h3>
                <p className="text-slate-500 text-[11px]">This action permanently removes the record from MongoDB.</p>
              </div>
            </div>
            <p className="text-slate-600 mb-4 bg-slate-50 p-3 rounded border border-slate-200">
              Are you sure you want to permanently delete <strong className="text-slate-900">"{deleteConfirmRes.title}"</strong> ({deleteConfirmRes.quantityAvailable} {deleteConfirmRes.unit} available)?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmRes(null)}
                className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingResource}
                onClick={handleConfirmDeleteResource}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded shadow-xs disabled:opacity-50"
              >
                {deletingResource ? 'Deleting...' : 'Delete Resource'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REJECT REQUEST */}
      {rejectModalReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-xs animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Decline Emergency Request</h3>
            <p className="text-slate-500 text-[11px] mb-3">
              Provide a reason to notify the seeker why this request cannot be fulfilled at this depot.
            </p>
            <div className="mb-4">
              <label className="block font-medium text-slate-700 mb-1">Rejection Reason</label>
              <textarea
                rows={3}
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-orange-500 focus:outline-none"
                placeholder="e.g. Stock exhausted, damaged in transit, or reserved for critical triage"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectModalReq(null)}
                className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={rejectingRequest}
                onClick={handleConfirmRejectRequest}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded shadow-xs disabled:opacity-50"
              >
                {rejectingRequest ? 'Declining...' : 'Decline Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM FULFILL HANDOVER */}
      {fulfillModalReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-blue-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Confirm Physical Handover</h3>
                <p className="text-slate-500 text-[11px]">Finalize release of reserved supplies to seeker.</p>
              </div>
            </div>
            <p className="text-slate-600 mb-4 bg-slate-50 p-3 rounded border border-slate-200">
              Confirm that {fulfillModalReq.approvedQuantity || fulfillModalReq.requestedQuantity} units have been verified and transferred to{' '}
              <strong className="text-slate-900">{fulfillModalReq.seekerId?.name || 'seeker'}</strong>.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setFulfillModalReq(null)}
                className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={fulfillingRequest}
                onClick={handleConfirmFulfillRequest}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded shadow-xs disabled:opacity-50"
              >
                {fulfillingRequest ? 'Processing...' : 'Confirm Handover & Fulfill'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
