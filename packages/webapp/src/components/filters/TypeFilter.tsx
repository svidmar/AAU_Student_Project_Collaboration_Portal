'use client';

import { useMemo } from 'react';
import { useAppStore } from '../../stores/app-store';
import MultiSelect from './MultiSelect';

export default function TypeFilter() {
  const { projects, filters, setFilters } = useAppStore();

  const typeOptions = useMemo(() => {
    const typeCounts = new Map<string, number>();

    projects.forEach((project) => {
      typeCounts.set(project.type, (typeCounts.get(project.type) || 0) + 1);
    });

    return Array.from(typeCounts.entries())
      .map(([type, count]) => ({
        value: type,
        label: `${type} (${count})`,
      }))
      .sort((a, b) => b.label.localeCompare(a.label));
  }, [projects]);

  return (
    <MultiSelect
      label="Project Type"
      options={typeOptions}
      selectedValues={filters.projectTypes}
      onChange={(selected) => setFilters({ projectTypes: selected })}
      placeholder="All types"
    />
  );
}
