import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { Resource, ResourceCategory } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { ResourceCard } from '../components/resources/ResourceCard.js';
import { ResourceMap } from '../components/map/ResourceMap.js';
import { RequestModal } from '../components/resources/RequestModal.js';
import {
  Search,
  Filter,
  Map,
  Grid,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Package,
} from 'lucide-react';

export const ResourcesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [selectedResourceForRequest, setSelectedResourceForRequest] = useState<Resource | null>(null);

  const currentPage = parseInt(searchParams.get('page') || '1');
  const currentCategory = searchParams.get('category') || 'all';
  const currentStatus = searchParams.get('status') || 'all';
  const currentSearch = searchParams.get('search') || '';
  const currentLocation = searchParams.get('location') || '';
  const currentSortBy = searchParams.get('sortBy') || 'createdAt';
  const currentSortOrder = searchParams.get('sortOrder') || 'desc';

  const [searchInput, setSearchInput] = useState<string>(currentSearch);
  const [locationInput, setLocationInput] = useState<string>(currentLocation);

  useEffect(() => {
    setSearchInput(currentSearch);
    setLocationInput(currentLocation);
  }, [currentSearch, currentLocation]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', currentPage.toString());
      params.set('limit', '12');

      if (currentSearch) params.set('search', currentSearch);
      if (currentCategory && currentCategory !== 'all') params.set('category', currentCategory);
      if (currentStatus && currentStatus !== 'all') params.set('status', currentStatus);
      if (currentLocation) params.set('location', currentLocation);
      if (currentSortBy) params.set('sortBy', currentSortBy);
      if (currentSortOrder) params.set('sortOrder', currentSortOrder);

      const res = await api.get<{
        success: boolean;
        data: Resource[];
        pagination: { totalPages: number; total: number; page: number };
      }>(`/resources?${params.toString()}`);

      if (res.success) {
        setResources(res.data);
        setTotalPages(res.pagination.totalPages);
        setTotalCount(res.pagination.total);
      }
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [currentPage, currentCategory, currentStatus, currentSearch, currentLocation, currentSortBy, currentSortOrder]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (searchInput.trim()) next.set('search', searchInput.trim());
    else next.delete('search');

    if (locationInput.trim()) next.set('location', locationInput.trim());
    else next.delete('location');

    next.set('page', '1');
    setSearchParams(next);
  };

  const clearFilters = () => {
    setSearchInput('');
    setLocationInput('');
    setSearchParams(new URLSearchParams());
  };

  const handleRequestClick = (resource: Resource) => {
    if (!user) {
      navigate('/login');
    } else {
      setSelectedResourceForRequest(resource);
    }
  };

  const categories: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All Supplies' },
    { id: 'food', label: 'Food & Rations' },
    { id: 'water', label: 'Potable Water' },
    { id: 'first_aid', label: 'First Aid & Trauma' },
    { id: 'medicine', label: 'Essential Medicine' },
    { id: 'clothing', label: 'Blankets & Apparel' },
    { id: 'shelter', label: 'Tents & Shelter' },
    { id: 'hygiene', label: 'Hygiene Kits' },
    { id: 'rescue', label: 'Rescue Gear' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <span className="text-[11px] font-mono uppercase font-semibold text-orange-600 tracking-wider">
            Verified Emergency Stockpile
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
            Emergency Supplies Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Displaying {totalCount} verified items available for disaster relief deployment.
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-white p-1 rounded border border-slate-200 self-start md:self-auto shadow-xs">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              viewMode === 'grid'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            Grid View
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              viewMode === 'map'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            Map View
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-xs mb-6 space-y-4">
        {/* Search & Location Inputs */}
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-2">
          <div className="relative md:col-span-5">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by supply title or keyword..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <div className="relative md:col-span-4">
            <input
              type="text"
              placeholder="Filter by city, area, depot..."
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 md:col-span-3">
            <button
              type="submit"
              className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded shadow-xs"
            >
              Filter
            </button>
            {(currentSearch || currentLocation || currentCategory !== 'all' || currentStatus !== 'all') && (
              <button
                type="button"
                onClick={clearFilters}
                className="px-3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium rounded flex items-center gap-1 shrink-0"
                title="Reset Filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </form>

        {/* Category Pills/Buttons (Segmented controls) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => updateParam('category', cat.id)}
              className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                currentCategory === cat.id
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Secondary filters (Availability & Sorting) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Stock Filter:
            </span>
            <div className="flex items-center gap-1.5">
              {[
                { id: 'all', label: 'All' },
                { id: 'available', label: 'In Stock' },
                { id: 'partially_available', label: 'Partial' },
                { id: 'reserved', label: 'Reserved' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => updateParam('status', st.id)}
                  className={`px-2.5 py-1 rounded text-xs font-medium ${
                    currentStatus === st.id
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Sort by:</span>
            <select
              value={`${currentSortBy}:${currentSortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split(':');
                const next = new URLSearchParams(searchParams);
                next.set('sortBy', sb);
                next.set('sortOrder', so);
                next.set('page', '1');
                setSearchParams(next);
              }}
              className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 focus:outline-none"
            >
              <option value="createdAt:desc">Newest First</option>
              <option value="createdAt:asc">Oldest First</option>
              <option value="quantityAvailable:desc">Highest Stock Available</option>
              <option value="quantityAvailable:asc">Lowest Stock Available</option>
              <option value="title:asc">Title A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content Rendering */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-56 bg-slate-200 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : resources.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center max-w-md mx-auto my-8">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No matching relief supplies found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search query, selecting "All Supplies", or resetting your filters.
          </p>
          <button
            onClick={clearFilters}
            className="mt-4 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded"
          >
            Clear All Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource) => (
              <ResourceCard
                key={resource._id}
                resource={resource}
                onRequestClick={handleRequestClick}
                canRequest={true}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => updateParam('page', Math.max(1, currentPage - 1).toString())}
                disabled={currentPage <= 1}
                className="p-2 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-medium text-slate-600 px-3">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => updateParam('page', Math.min(totalPages, currentPage + 1).toString())}
                disabled={currentPage >= totalPages}
                className="p-2 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <ResourceMap resources={resources} height="560px" />
        </div>
      )}

      {/* Request Modal */}
      {selectedResourceForRequest && (
        <RequestModal
          resource={selectedResourceForRequest}
          isOpen={!!selectedResourceForRequest}
          onClose={() => setSelectedResourceForRequest(null)}
          onRequestSubmitted={() => {
            fetchResources();
          }}
        />
      )}
    </div>
  );
};
