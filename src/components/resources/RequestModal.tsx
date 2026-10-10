import React, { useState } from 'react';
import { Resource, UrgencyLevel } from '../../types/index.js';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { AlertCircle, CheckCircle2, X, Send } from 'lucide-react';

interface RequestModalProps {
  resource: Resource;
  isOpen: boolean;
  onClose: () => void;
  onRequestSubmitted: () => void;
}

export const RequestModal: React.FC<RequestModalProps> = ({
  resource,
  isOpen,
  onClose,
  onRequestSubmitted,
}) => {
  const { user } = useAuth();
  const [requestedQuantity, setRequestedQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [urgency, setUrgency] = useState<UrgencyLevel>('medium');
  const [destinationAddress, setDestinationAddress] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>(user?.phone || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (requestedQuantity < 1) {
      setError('Requested quantity must be at least 1.');
      return;
    }

    if (requestedQuantity > resource.quantityAvailable) {
      setError(`Cannot request more than the available quantity (${resource.quantityAvailable} ${resource.unit}).`);
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a brief reason or context for this emergency request.');
      return;
    }

    if (!destinationAddress.trim()) {
      setError('Please specify destination address or shelter pickup point.');
      return;
    }

    if (!contactPhone.trim()) {
      setError('A contact phone number is required for coordinating distribution.');
      return;
    }

    try {
      setLoading(true);
      await api.post('/requests', {
        resourceId: resource._id,
        requestedQuantity,
        reason,
        urgency,
        destinationAddress,
        contactPhone,
      });

      setSuccess(true);
      setTimeout(() => {
        onRequestSubmitted();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit emergency request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl border border-slate-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <span className="text-[11px] font-mono uppercase tracking-wider text-orange-600 font-semibold">
            Emergency Supply Request
          </span>
          <h3 className="text-lg font-bold text-slate-900 mt-0.5">{resource.title}</h3>
          <p className="text-xs text-slate-500 mt-1">
            Available: <strong className="text-emerald-700">{resource.quantityAvailable} {resource.unit}</strong> at {resource.locationName}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="text-base font-bold text-slate-900">Request Dispatched</h4>
            <p className="text-xs text-slate-600">
              Your request has been delivered to the resource provider. You can track status in your dashboard.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Quantity */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Requested Quantity ({resource.unit}) <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max={resource.quantityAvailable}
                  value={requestedQuantity}
                  onChange={(e) => setRequestedQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-orange-500 focus:outline-none"
                  required
                />
                <span className="text-slate-500 font-medium shrink-0">{resource.unit}</span>
              </div>
            </div>

            {/* Urgency */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Urgency Level <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['low', 'medium', 'high', 'critical'] as UrgencyLevel[]).map((level) => (
                  <button
                    type="button"
                    key={level}
                    onClick={() => setUrgency(level)}
                    className={`py-1.5 px-2 rounded text-center font-medium capitalize border transition-colors ${
                      urgency === level
                        ? level === 'critical'
                          ? 'bg-rose-600 text-white border-rose-600'
                          : level === 'high'
                          ? 'bg-orange-600 text-white border-orange-600'
                          : 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Reason & Context <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe current need, number of individuals impacted, or shelter conditions..."
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-orange-500 focus:outline-none"
                required
              />
            </div>

            {/* Destination Address */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Destination Address / Shelter Location <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={destinationAddress}
                onChange={(e) => setDestinationAddress(e.target.value)}
                placeholder="E.g. District Evacuation Camp B, Tent 14"
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-orange-500 focus:outline-none"
                required
              />
            </div>

            {/* Contact Phone */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Direct Contact Phone <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-orange-500 focus:outline-none"
                required
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 rounded bg-orange-600 hover:bg-orange-500 text-white font-medium flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {loading ? 'Submitting...' : 'Submit Emergency Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
