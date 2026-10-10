import React from 'react';
import { Link } from 'react-router-dom';
import { Resource } from '../../types/index.js';
import { StatusBadge } from '../common/StatusBadge.js';
import { MapPin, Package, Clock, ShieldCheck, ArrowRight } from 'lucide-react';

interface ResourceCardProps {
  resource: Resource;
  onRequestClick?: (resource: Resource) => void;
  canRequest?: boolean;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  onRequestClick,
  canRequest = true,
}) => {
  const isAvailable = resource.quantityAvailable > 0;

  return (
    <div className="bg-white rounded-lg border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between p-5">
      <div>
        {/* Category & Status */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 uppercase tracking-wider font-mono">
            <span>{resource.category.replace('_', ' ')}</span>
            <span aria-hidden="true">·</span>
            <span className="capitalize">{resource.condition} condition</span>
          </div>
          <StatusBadge status={resource.availabilityStatus} />
        </div>

        {/* Title */}
        <Link to={`/resources/${resource._id}`}>
          <h3 className="text-base font-bold text-slate-900 leading-snug hover:text-orange-600 transition-colors mb-1.5 line-clamp-1">
            {resource.title}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
          {resource.description}
        </p>

        {/* Inventory numbers */}
        <div className="bg-slate-50/80 rounded p-3 mb-4 border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">Available Now</span>
            <span className="text-base font-extrabold text-slate-900">
              {resource.quantityAvailable}{' '}
              <span className="text-xs font-normal text-slate-600">{resource.unit}</span>
            </span>
          </div>

          {resource.quantityReserved > 0 && (
            <div className="text-right">
              <span className="text-[11px] font-medium text-slate-500 block">Reserved</span>
              <span className="text-sm font-semibold text-amber-700">
                {resource.quantityReserved}{' '}
                <span className="text-xs font-normal text-slate-500">{resource.unit}</span>
              </span>
            </div>
          )}
        </div>

        {/* Location & Organization */}
        <div className="space-y-1.5 text-xs text-slate-600 mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{resource.locationName}</span>
          </div>

          {resource.organizationId && (
            <div className="flex items-center gap-2 text-blue-700 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span className="truncate">{resource.organizationId.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Actions */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <Link
          to={`/resources/${resource._id}`}
          className="text-xs font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
        >
          View Details
        </Link>

        {canRequest && isAvailable && onRequestClick && (
          <button
            onClick={() => onRequestClick(resource)}
            className="px-3 py-1.5 rounded text-xs font-semibold bg-orange-600 hover:bg-orange-500 text-white shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            <span>Request</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
