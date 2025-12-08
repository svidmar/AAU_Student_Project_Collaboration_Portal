'use client';

import { useState } from 'react';
import { useAppStore } from '../../stores/app-store';
import YearlyChart from './YearlyChart';

export default function StatsPanel() {
  const { getFilteredProjects, metadata } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const projects = getFilteredProjects();

  if (!metadata) return null;

  const stats = {
    totalProjects: projects.length,
    totalCountries: new Set(
      projects.flatMap((p) =>
        p.collaborations.map((c) => c.location?.country).filter(Boolean)
      )
    ).size,
    totalPartners: new Set(projects.flatMap((p) => p.collaborations.map((c) => c.name))).size,
    withGPS: projects.filter((p) =>
      p.collaborations.some((c) => c.location?.coordinates)
    ).length,
  };

  const topCountries = metadata.filters.countries
    .slice(0, 5)
    .map((c) => ({ name: c.name, count: c.count }));

  const topPartners = metadata.filters.partners
    .slice(0, 5)
    .map((p) => ({ name: p.name, count: p.count }));

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div>
              <div className="text-2xl font-bold text-aau-blue">
                {stats.totalProjects.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">Projects</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-aau-light-blue">
                {stats.totalCountries}
              </div>
              <div className="text-xs text-gray-600">Countries</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-aau-dark-gray">
                {stats.totalPartners.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">Partners</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {((stats.withGPS / stats.totalProjects) * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600">With GPS</div>
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-aau-blue hover:text-aau-light-blue transition-colors text-sm font-medium"
          >
            {isExpanded ? 'Hide Details' : 'Show Details'}
          </button>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-sm text-gray-700 mb-2">Top Countries</h3>
                <div className="space-y-1">
                  {topCountries.map((country) => (
                    <div key={country.name} className="flex justify-between text-sm">
                      <span className="text-gray-600">{country.name}</span>
                      <span className="font-medium text-aau-blue">{country.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-gray-700 mb-2">Top Partners</h3>
                <div className="space-y-1">
                  {topPartners.map((partner) => (
                    <div key={partner.name} className="flex justify-between text-sm">
                      <span className="text-gray-600 truncate mr-2">{partner.name}</span>
                      <span className="font-medium text-aau-blue flex-shrink-0">{partner.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <YearlyChart />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
