'use client';

import { useAppStore } from '../../stores/app-store';
import { useMemo } from 'react';

export default function YearlyChart() {
  const { projects } = useAppStore();

  const yearData = useMemo(() => {
    const counts = new Map<number, number>();

    projects.forEach(project => {
      counts.set(project.year, (counts.get(project.year) || 0) + 1);
    });

    const years = Array.from(counts.keys()).sort((a, b) => a - b);
    const maxCount = Math.max(...counts.values());

    return years.map(year => ({
      year,
      count: counts.get(year) || 0,
      percentage: ((counts.get(year) || 0) / maxCount) * 100
    }));
  }, [projects]);

  if (yearData.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm text-gray-700">
          Projects by Year
        </h3>
        <p className="text-xs text-gray-600">
          Total: {projects.length} projects
        </p>
      </div>

      <div className="flex items-end justify-between gap-2 h-48">
        {yearData.map(({ year, count, percentage }) => (
          <div
            key={year}
            className="flex-1 flex flex-col items-center gap-2 group"
          >
            <div className="relative w-full flex items-end justify-center h-full">
              <div
                className="w-full bg-aau-blue hover:bg-aau-light-blue transition-all duration-300 rounded-t-md relative group"
                style={{ height: `${percentage}%`, minHeight: '4px' }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                  {count} {count === 1 ? 'project' : 'projects'}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-600 font-medium transform -rotate-45 origin-top-left mt-2">
              {year}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
