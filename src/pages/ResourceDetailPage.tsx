import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { Resource, ResourceCategory } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { StatusBadge } from '../components/common/StatusBadge.js';
import { ResourceMap } from '../components/map/ResourceMap.js';
import { RequestModal } from '../components/resources/RequestModal.js';
import {
  MapPin,
  ShieldCheck,
  ChevronLeft,
  Calendar,
  AlertCircle,
  Package,
  Layers,
  ArrowRight,
  Phone,
  Mail,
  Edit2,
  Trash2,
  CheckCircle,
} from 'lucide-react';

export const ResourceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Edit modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ success: boolean; data: Resource }>(`/resources/${id}`);
      if (res.success) {
        setResource(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Resource not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  const openEditModal = () => {
    if (!resource) return;
    setEditTitle(resource.title);
    setEditCategory(resource.category);
    setEditDescription(resource.description);
    setEditQuantityAvailable(resource.quantityAvailable);
    setEditUnit(resource.unit);
    setEditCondition(resource.condition);
    setEditLocationName(resource.locationName);
    setEditAddress(resource.address);
    setEditLat(resource.coordinates?.lat || 37.7749);
    setEditLng(resource.coordinates?.lng || -122.4194);
    setEditAvailabilityStatus(resource.availabilityStatus);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resource) return;
    try {
      setSavingEdit(true);
      setActionError(null);
      await api.put(`/resources/${resource._id}`, {
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

      setActionSuccess('Resource details updated successfully in MongoDB.');
      setEditModalOpen(false);
      fetchDetail();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update resource');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleUpdateAvailability = async (newStatus: string) => {
    if (!resource) return;
    try {
      setActionError(null);
      await api.patch(`/resources/${resource._id}/availability`, {
        availabilityStatus: newStatus,
      });
      setActionSuccess(`Status updated to '${newStatus}'.`);
      fetchDetail();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update availability');
    }
  };

  const handleConfirmDelete = async () => {
    if (!resource) return;
    try {
      setDeleting(true);
      setActionError(null);
      await api.delete(`/resources/${resource._id}`);
      navigate('/resources');
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete resource');
      setDeleteConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 max-w-lg mx-auto text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Resource Unavailable</h2>
        <p className="text-xs text-slate-600 mt-1 mb-4">{error || 'Resource listing could not be found.'}</p>
        <Link
          to="/resources"
          className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold"
        >
          Return to Supplies Catalog
        </Link>
      </div>
    );
  }

  const isAvailable = resource.quantityAvailable > 0;
  const isOwner = user && resource.providerId && resource.providerId._id === user.id;
  const isAdmin = user && (user.role === 'admin' || user.role === 'super_admin');
  const canManage = isOwner || isAdmin;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      {/* Back button */}
      <div className="mb-4">
        <Link
          to="/resources"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Emergency Catalog
        </Link>
      </div>

      {actionSuccess && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-slate-400">✕</button>
        </div>
      )}

      {actionError && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-slate-400">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-500">
                <span>{resource.category.replace('_', ' ')}</span>
                <span aria-hidden="true">·</span>
                <span className="capitalize">{resource.condition} condition</span>
              </div>
              <StatusBadge status={resource.availabilityStatus} />
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900 leading-tight mb-3">
              {resource.title}
            </h1>

            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line mb-6">
              {resource.description}
            </p>

            {/* Inventory Breakdown Metric Bar */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded border border-slate-100">
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Available Units</span>
                <span className="text-2xl font-black text-emerald-700">
                  {resource.quantityAvailable}
                </span>
                <span className="text-xs text-slate-500 block">{resource.unit}</span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Reserved in Transit</span>
                <span className="text-2xl font-black text-amber-700">
                  {resource.quantityReserved}
                </span>
                <span className="text-xs text-slate-500 block">{resource.unit}</span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Total Staged</span>
                <span className="text-2xl font-black text-slate-900">
                  {resource.quantityAvailable + resource.quantityReserved}
                </span>
                <span className="text-xs text-slate-500 block">{resource.unit}</span>
              </div>
            </div>
          </div>

          {/* Location & Map Preview */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-600" />
              Staging Depot & Distribution Center
            </h3>
            <p className="text-xs font-medium text-slate-800">{resource.locationName}</p>
            <p className="text-xs text-slate-600 mb-4">{resource.address}</p>

            <ResourceMap
              resources={[resource]}
              center={[resource.coordinates.lat, resource.coordinates.lng]}
              zoom={14}
              height="280px"
            />
          </div>
        </div>

        {/* Action & Provider Sidebar (1 col) */}
        <div className="space-y-6">
          {/* Owner / Admin Management Card */}
          {canManage && (
            <div className="bg-orange-50/60 rounded-lg border border-orange-200 p-5 shadow-xs space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-orange-200/80">
                <span className="font-bold text-orange-950 uppercase font-mono tracking-wider text-[11px]">
                  Owner / Admin Controls
                </span>
                <span className="text-[10px] text-orange-700 font-semibold">Authorized</span>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Update Availability Status</label>
                <select
                  value={resource.availabilityStatus}
                  onChange={(e) => handleUpdateAvailability(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-orange-500"
                >
                  <option value="available">Available</option>
                  <option value="partially_available">Partially Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={openEditModal}
                  className="flex-1 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Listing
                </button>
                <button
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="py-1.5 px-3 border border-rose-300 hover:bg-rose-50 text-rose-700 rounded font-medium flex items-center justify-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          )}

          {/* Request Action Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Request this Resource</h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Requests are reviewed by verified providers and staged for collection or delivery.
            </p>

            {isAvailable ? (
              <button
                onClick={() => {
                  if (!user) navigate('/login');
                  else setModalOpen(true);
                }}
                className="w-full py-2.5 px-4 rounded bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>Request Supplies Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="p-3 bg-slate-100 rounded text-center text-xs text-slate-600">
                This item is currently fully reserved or distributed.
              </div>
            )}
          </div>

          {/* Provider / Organization Credentials */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              Provider Information
            </h4>

            {resource.organizationId ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-blue-700 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{resource.organizationId.name}</span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <p>Status: <span className="text-emerald-700 font-semibold">Verified NGO</span></p>
                  {resource.organizationId.address && <p>Base: {resource.organizationId.address}</p>}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-700 space-y-1">
                <p className="font-semibold text-slate-900">{resource.providerId.name}</p>
                <p className="text-slate-500 capitalize">Role: {resource.providerId.role}</p>
                {resource.providerId.phone && (
                  <p className="flex items-center gap-1 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {resource.providerId.phone}
                  </p>
                )}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-mono">
              Listed on: {new Date(resource.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <RequestModal
          resource={resource}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onRequestSubmitted={() => {
            setModalOpen(false);
            fetchDetail();
          }}
        />
      )}

      {/* EDIT MODAL FOR RESOURCE DETAIL */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-xl w-full p-6 shadow-xl border border-slate-200 relative text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Edit Resource Details: {resource.title}
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
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

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded shadow-xs disabled:opacity-50"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* DELETE RESOURCE CONFIRMATION MODAL */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Resource Listing</h3>
                <p className="text-slate-500 text-[11px]">This permanently removes the resource from MongoDB.</p>
              </div>
            </div>
            <p className="text-slate-600 mb-4 bg-slate-50 p-3 rounded border border-slate-200">
              Are you sure you want to permanently delete <strong className="text-slate-900">"{resource.title}"</strong> from the crisis database?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded shadow-xs disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
