import React from 'react';
import { AvailabilityStatus, RequestStatus, ModerationStatus } from '../../types/index.js';

interface StatusBadgeProps {
  status: AvailabilityStatus | RequestStatus | ModerationStatus | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'available':
    case 'approved':
    case 'fulfilled':
    case 'verified':
      return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
        </span>
      );

    case 'partially_available':
      return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Partially In Stock
        </span>
      );

    case 'reserved':
    case 'pending':
    case 'assigned':
    case 'collected':
      return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
        </span>
      );

    case 'unavailable':
    case 'rejected':
    case 'cancelled':
    case 'suspended':
    case 'failed':
      return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
        </span>
      );

    default:
      return (
        <span className={`inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded ${className}`}>
          {status}
        </span>
      );
  }
};
