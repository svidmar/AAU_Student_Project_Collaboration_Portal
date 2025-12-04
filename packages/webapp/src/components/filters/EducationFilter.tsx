'use client';

import { useAppStore } from '../../stores/app-store';
import MultiSelect from './MultiSelect';

export default function EducationFilter() {
  const { metadata, filters, setFilters } = useAppStore();

  if (!metadata) return null;

  const programs = metadata.filters.educationPrograms.map((prog) => ({
    value: prog.code,
    label: `${prog.name} (${prog.count})`,
  }));

  return (
    <MultiSelect
      label="Education Program"
      options={programs}
      selectedValues={filters.educationPrograms}
      onChange={(selected) => setFilters({ educationPrograms: selected })}
      placeholder="All programs"
      searchable={true}
    />
  );
}
