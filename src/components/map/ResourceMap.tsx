import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Resource } from '../../types/index.js';
import { StatusBadge } from '../common/StatusBadge.js';
import { Package, MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ResourceMapProps {
  resources: Resource[];
  center?: [number, number];
  zoom?: number;
  onSelectResource?: (resource: Resource) => void;
  selectedResourceId?: string;
  height?: string;
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'food':
      return '#F59E0B'; // amber
    case 'water':
      return '#0284C7'; // sky
    case 'medicine':
    case 'first_aid':
      return '#E11D48'; // rose
    case 'shelter':
      return '#7C3AED'; // violet
    case 'clothing':
      return '#4F46E5'; // indigo
    case 'rescue':
      return '#059669'; // emerald
    default:
      return '#FF7A00'; // emergency orange
  }
};

const createCustomIcon = (category: string, isSelected: boolean) => {
  const color = getCategoryColor(category);
  const size = isSelected ? 36 : 28;

  const html = `
    <div style="
      background-color: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid white;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.15s ease;
    ">
      <div style="
        width: 8px;
        height: 8px;
        background-color: white;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-emergency-pin',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

export const ResourceMap: React.FC<ResourceMapProps> = ({
  resources,
  center = [37.7749, -122.4194],
  zoom = 12,
  onSelectResource,
  selectedResourceId,
  height = '500px',
}) => {
  // Filter resources that have valid coordinates
  const validResources = resources.filter(
    (r) =>
      r.coordinates &&
      typeof r.coordinates.lat === 'number' &&
      typeof r.coordinates.lng === 'number' &&
      !isNaN(r.coordinates.lat) &&
      !isNaN(r.coordinates.lng)
  );

  const initialCenter: [number, number] =
    validResources.length > 0
      ? [validResources[0].coordinates.lat, validResources[0].coordinates.lng]
      : center;

  return (
    <div
      style={{ height }}
      className="w-full rounded-lg overflow-hidden border border-slate-200 shadow-inner relative z-10"
    >
      <MapContainer
        center={initialCenter}
        zoom={zoom}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {validResources.map((res) => {
          const isSelected = selectedResourceId === res._id;
          return (
            <Marker
              key={res._id}
              position={[res.coordinates.lat, res.coordinates.lng]}
              icon={createCustomIcon(res.category, isSelected)}
              eventHandlers={{
                click: () => onSelectResource && onSelectResource(res),
              }}
            >
              <Popup className="emergency-map-popup">
                <div className="p-1 max-w-[240px]">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-500">
                      {res.category.replace('_', ' ')}
                    </span>
                    <StatusBadge status={res.availabilityStatus} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight mb-1">
                    {res.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 line-clamp-2 mb-2">
                    {res.description}
                  </p>
                  <div className="flex items-center justify-between text-xs font-medium text-slate-800 pt-2 border-t border-slate-100">
                    <span>
                      Stock: <strong className="text-emerald-700">{res.quantityAvailable}</strong> {res.unit}
                    </span>
                    <Link
                      to={`/resources/${res._id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 hover:text-orange-700"
                    >
                      Details <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
