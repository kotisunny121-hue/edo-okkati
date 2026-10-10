import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { Resource } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { ResourceMap } from '../components/map/ResourceMap.js';
import { ResourceCard } from '../components/resources/ResourceCard.js';
import { RequestModal } from '../components/resources/RequestModal.js';
import {
  Search,
  ShieldAlert,
  PhoneCall,
  MapPin,
  ArrowRight,
  Package,
  Layers,
  Heart,
  Droplets,
  Utensils,
  Stethoscope,
  Home,
  Sparkles,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user, getDashboardPath } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResourceForRequest, setSelectedResourceForRequest] = useState<Resource | null>(null);

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        setLoading(true);
        const res = await api.get<{ success: boolean; data: Resource[] }>('/resources?limit=6');
        if (res.success) {
          setResources(res.data);
        }
      } catch (err) {
        console.error('Failed to load landing resources:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLandingData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/resources?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/resources');
    }
  };

  const handleRequestClick = (resource: Resource) => {
    if (!user) {
      navigate('/login');
    } else {
      setSelectedResourceForRequest(resource);
    }
  };

  const categories = [
    { label: 'Food & Rations', id: 'food', icon: Utensils, count: '650+ packs' },
    { label: 'Drinking Water', id: 'water', icon: Droplets, count: '1.2k+ gal' },
    { label: 'Medical & Triage', id: 'first_aid', icon: Stethoscope, count: '45+ kits' },
    { label: 'Shelter & Tents', id: 'shelter', icon: Home, count: '28+ units' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Hero Section */}
      <section className="bg-[#0B132B] text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800 relative overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-slate-800/80 border border-slate-700/80 text-orange-400 text-xs font-mono font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            LIVE DISASTER LOGISTICS & RESOURCE DISPATCH
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Centralized Emergency Supply Coordination Platform
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Connecting disaster victims, verified supply providers, frontline NGOs, and volunteer teams. Real-time inventory tracking with zero double-allocation.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="mt-8 max-w-2xl mx-auto">
            <div className="flex items-center bg-white rounded-lg p-1.5 shadow-lg border border-slate-200">
              <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                placeholder="Search food, potable water, first-aid kits, blankets, or shelter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded shadow-xs transition-colors shrink-0"
              >
                Search Supplies
              </button>
            </div>
          </form>

          {/* Quick Action Links */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs">
            <Link
              to="/resources"
              className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition-colors inline-flex items-center gap-2"
            >
              <Package className="w-4 h-4 text-orange-400" />
              Browse Verified Catalog
            </Link>

            {user ? (
              <Link
                to={getDashboardPath(user.role)}
                className="px-4 py-2 rounded bg-orange-600 hover:bg-orange-500 text-white font-semibold transition-colors inline-flex items-center gap-2"
              >
                Go to {user.role.toUpperCase()} Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/register"
                className="px-4 py-2 rounded bg-orange-600 hover:bg-orange-500 text-white font-semibold transition-colors inline-flex items-center gap-2"
              >
                Join as Provider or NGO
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Category Shortcut Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.id}
                to={`/resources?category=${c.id}`}
                className="bg-white p-4 rounded-lg border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all group flex items-center gap-3.5"
              >
                <div className="w-10 h-10 rounded bg-slate-100 group-hover:bg-orange-50 text-slate-700 group-hover:text-orange-600 flex items-center justify-center shrink-0 transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                    {c.label}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">{c.count}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Map & Live Staging Hub */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-6">
          <div>
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-orange-600">
              Interactive Geospatial Staging
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
              Regional Supply Depot Map
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Live operational locations with verified stockpiles ready for distribution.
            </p>
          </div>
          <Link
            to="/resources"
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1.5"
          >
            Open Full Screen GIS Map <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <ResourceMap resources={resources} height="420px" />
      </section>

      {/* Recently Published Supplies */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Active Relief Supplies
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Available for immediate request by affected community members and coordinators.
            </p>
          </div>
          <Link
            to="/resources"
            className="text-xs font-semibold text-slate-700 hover:text-slate-900"
          >
            View All ({resources.length})
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-slate-200 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((res) => (
              <ResourceCard
                key={res._id}
                resource={res}
                onRequestClick={handleRequestClick}
                canRequest={true}
              />
            ))}
          </div>
        )}
      </section>

      {/* Request Modal */}
      {selectedResourceForRequest && (
        <RequestModal
          resource={selectedResourceForRequest}
          isOpen={!!selectedResourceForRequest}
          onClose={() => setSelectedResourceForRequest(null)}
          onRequestSubmitted={() => {
            setSelectedResourceForRequest(null);
          }}
        />
      )}
    </div>
  );
};
