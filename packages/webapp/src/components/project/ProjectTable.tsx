'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '../../stores/app-store';
import { EnrichedProject } from '@aau-thesis-portal/shared';
import { stripHtml } from '../../lib/text-utils';

type SortField = 'title' | 'year' | 'education' | 'collaborations' | 'gps';
type SortOrder = 'asc' | 'desc';

export default function ProjectTable() {
  const { getFilteredProjects, setSelectedProject } = useAppStore();
  const projects = getFilteredProjects();

  const [sortField, setSortField] = useState<SortField>('year');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const sortedProjects = useMemo(() => {
    const sorted = [...projects].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'year':
          comparison = a.year - b.year;
          break;
        case 'education':
          comparison = a.educationProgram.name.localeCompare(b.educationProgram.name);
          break;
        case 'collaborations':
          comparison = a.collaborations.length - b.collaborations.length;
          break;
        case 'gps':
          const aHasGPS = a.collaborations.some((c) => c.location?.coordinates) ? 1 : 0;
          const bHasGPS = b.collaborations.some((c) => c.location?.coordinates) ? 1 : 0;
          comparison = aHasGPS - bHasGPS;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [projects, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4 text-aau-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-aau-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const getGPSStatus = (project: EnrichedProject) => {
    const withGPS = project.collaborations.filter((c) => c.location?.coordinates).length;
    const total = project.collaborations.length;

    if (withGPS === 0) {
      return <span className="text-red-600">No GPS</span>;
    }
    if (withGPS === total) {
      return <span className="text-green-600">All GPS</span>;
    }
    return <span className="text-yellow-600">{withGPS}/{total} GPS</span>;
  };

  const exportToCSV = () => {
    // CSV header
    const headers = [
      'Title',
      'Authors',
      'Year',
      'Type',
      'Education Program',
      'Supervisors',
      'Partners',
      'Collaboration Types',
      'Countries',
      'Abstract',
      'Project URL',
    ];

    // CSV rows
    const rows = sortedProjects.map((project) => [
      stripHtml(project.title),
      project.authors.map((a) => a.name).join('; '),
      project.year,
      project.type,
      project.educationProgram.name,
      project.supervisors.map((s) => s.name).join('; '),
      project.collaborations.map((c) => c.name).join('; '),
      [...new Set(project.collaborations.map((c) => c.type))].join('; '),
      [...new Set(project.collaborations.map((c) => c.location?.country).filter(Boolean))].join('; '),
      stripHtml(project.abstract || ''),
      project.projectUrl,
    ]);

    // Escape CSV fields (handle quotes and commas)
    const escapeCSV = (field: any): string => {
      const str = String(field || '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Build CSV content
    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map((row) => row.map(escapeCSV).join(',')),
    ].join('\n');

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `aau-projects-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-700">
              Projects ({sortedProjects.length.toLocaleString()})
            </h3>
            <div className="text-xs text-gray-500 mt-1">
              {sortedProjects.filter(p => p.collaborations.some(c => c.location?.coordinates)).length} with GPS,{' '}
              {sortedProjects.filter(p => !p.collaborations.some(c => c.location?.coordinates)).length} without
            </div>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-3 py-2 bg-aau-blue text-white text-sm rounded hover:bg-aau-light-blue transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('title')}
                  className="flex items-center gap-1 hover:text-aau-blue font-semibold"
                >
                  Title
                  <SortIcon field="title" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('year')}
                  className="flex items-center gap-1 hover:text-aau-blue font-semibold"
                >
                  Year
                  <SortIcon field="year" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('education')}
                  className="flex items-center gap-1 hover:text-aau-blue font-semibold"
                >
                  Program
                  <SortIcon field="education" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('collaborations')}
                  className="flex items-center gap-1 hover:text-aau-blue font-semibold"
                >
                  Partners
                  <SortIcon field="collaborations" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('gps')}
                  className="flex items-center gap-1 hover:text-aau-blue font-semibold"
                >
                  GPS
                  <SortIcon field="gps" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedProjects.map((project) => (
              <tr
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 line-clamp-2">{stripHtml(project.title)}</div>
                  {project.authors.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {project.authors.map((a) => a.name).join(', ')}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-700">{project.year}</td>
                <td className="px-4 py-3">
                  <div className="text-gray-700 line-clamp-2">{project.educationProgram.name}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-gray-700 line-clamp-2">
                    {project.collaborations.map((c) => c.name).join(', ')}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {project.collaborations.length} partner{project.collaborations.length !== 1 ? 's' : ''}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs font-medium">
                  {getGPSStatus(project)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sortedProjects.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-500">
            No projects found. Try adjusting your filters.
          </div>
        )}
      </div>
    </div>
  );
}
