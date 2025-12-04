'use client';

import { useAppStore } from '../../stores/app-store';
import MultiSelect from './MultiSelect';

export default function CountryFilter() {
  const { metadata, filters, setFilters } = useAppStore();

  if (!metadata) return null;

  const countries = metadata.filters.countries
    .sort((a, b) => b.count - a.count) // Sort by count descending
    .map((country) => ({
      value: country.name,
      label: `${country.name} (${country.count})`,
    }));

  return (
    <MultiSelect
      label="Country"
      options={countries}
      selectedValues={filters.countries}
      onChange={(selected) => setFilters({ countries: selected })}
      placeholder="All countries"
      searchable
    />
  );
}
