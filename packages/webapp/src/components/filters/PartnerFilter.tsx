'use client';

import { useAppStore } from '../../stores/app-store';
import MultiSelect from './MultiSelect';

export default function PartnerFilter() {
  const { metadata, filters, setFilters } = useAppStore();

  if (!metadata) return null;

  const partners = metadata.filters.partners
    .sort((a, b) => b.count - a.count) // Sort by count descending
    .map((partner) => ({
      value: partner.name,
      label: `${partner.name} (${partner.count})`,
    }));

  return (
    <MultiSelect
      label="Collaborator Organization"
      options={partners}
      selectedValues={filters.partners}
      onChange={(selected) => setFilters({ partners: selected })}
      placeholder="All collaborators"
      searchable
    />
  );
}
