'use client';

import { useAppStore } from '../../stores/app-store';

export default function SearchFilter() {
  const { filters, setFilters } = useAppStore();

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Search</label>
      <input
        type="text"
        placeholder="Search projects, authors, partners..."
        value={filters.searchQuery || ''}
        onChange={(e) => setFilters({ searchQuery: e.target.value })}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-aau-blue text-sm"
      />
    </div>
  );
}
