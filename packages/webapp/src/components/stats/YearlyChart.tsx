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
    const chartHeight = 240; // pixels

    return years.map(year => {
      const count = counts.get(year) || 0;
      const percentage = (count / maxCount);
      // Calculate pixel height with minimum of 12px for visibility
      const height = Math.max(Math.round(percentage * chartHeight), 12);

      return {
        year,
        count,
        height
      };
    });
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

      <div className="flex items-end justify-between gap-1" style={{ height: '240px' }}>
        {yearData.map(({ year, count, height }) => (
          <div
            key={year}
            className="flex-1 flex flex-col items-center gap-1 group relative"
          >
            <div className="relative w-full flex flex-col items-center justify-end" style={{ height: '240px' }}>
              {/* Count label above bar - always visible */}
              <div className="text-[9px] font-semibold text-gray-700 mb-0.5">
                {count}
              </div>
              {/* Bar */}
              <div
                className="w-full bg-aau-blue hover:bg-aau-light-blue transition-all duration-200 rounded-t"
                style={{ height: `${height}px` }}
              />
            </div>
            {/* Year label */}
            <div className="text-[9px] text-gray-600 whitespace-nowrap">
              '{year.toString().slice(-2)}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
