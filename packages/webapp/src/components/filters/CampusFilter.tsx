'use client';

import { useAppStore } from '../../stores/app-store';
import MultiSelect from './MultiSelect';

export default function CampusFilter() {
  const { metadata, filters, setFilters } = useAppStore();

  if (!metadata) return null;

  const campuses = metadata.filters.campuses
    .sort((a, b) => b.count - a.count) // Sort by count descending
    .map((campus) => ({
      value: campus.name,
      label: `${campus.name} (${campus.count})`,
    }));

  return (
    <MultiSelect
      label="Campus"
      options={campuses}
      selectedValues={filters.campuses}
      onChange={(selected) => setFilters({ campuses: selected })}
      placeholder="All campuses"
    />
  );
}
