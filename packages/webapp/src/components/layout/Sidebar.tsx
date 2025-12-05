'use client';

import { useState } from 'react';
import { useAppStore } from '../../stores/app-store';
import SearchFilter from '../filters/SearchFilter';
import YearFilter from '../filters/YearFilter';
import EducationFilter from '../filters/EducationFilter';
import TypeFilter from '../filters/TypeFilter';
import CollaborationTypeFilter from '../filters/CollaborationTypeFilter';
import CampusFilter from '../filters/CampusFilter';
import CountryFilter from '../filters/CountryFilter';
import PartnerFilter from '../filters/PartnerFilter';

export default function Sidebar() {
  const { resetFilters, filters } = useAppStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const hasActiveFilters = Object.values(filters).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim().length > 0;
    return false;
  });

  if (isCollapsed) {
    return (
      <aside className="w-12 bg-white border-r border-gray-200 flex flex-col items-center py-4">
        <button
          onClick={() => setIsCollapsed(false)}
          className="text-aau-blue hover:text-aau-light-blue transition-colors"
          title="Show Filters"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-aau-blue">Filters</h2>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-sm text-aau-light-blue hover:text-aau-blue transition-colors"
            >
              Clear All
            </button>
          )}
          <button
            onClick={() => setIsCollapsed(true)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            title="Hide Filters"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <SearchFilter />
        <YearFilter />
        <EducationFilter />
        <TypeFilter />
        <CollaborationTypeFilter />
        <CampusFilter />
        <CountryFilter />
        <PartnerFilter />
      </div>
    </aside>
  );
}
