import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { Resource } from '../types/index.js';
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
} from 'lucide-react';

export const ResourceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

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
    </div>
  );
};
