'use client';

import { useAppStore } from '../../stores/app-store';
import MultiSelect from './MultiSelect';
import type { CollaborationTypeOption } from '@aau-thesis-portal/shared';

export default function CollaborationTypeFilter() {
  const { metadata, filters, setFilters } = useAppStore();

  if (!metadata) return null;

  const types = metadata.filters.collaborationTypes.map((type: CollaborationTypeOption) => ({
    value: type.type,
    label: `${type.type} (${type.count})`,
  }));

  return (
    <MultiSelect
      label="Collaborator Type"
      options={types}
      selectedValues={filters.collaborationTypes}
      onChange={(selected) => setFilters({ collaborationTypes: selected })}
      placeholder="All types"
    />
  );
}
