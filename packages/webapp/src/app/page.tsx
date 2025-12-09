'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '../stores/app-store';
import { dataLoader } from '../services/data-loader';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import MapView from '../components/map/MapView';
import ProjectModal from '../components/project/ProjectModal';
import StatsPanel from '../components/stats/StatsPanel';
import ProjectTable from '../components/project/ProjectTable';

type ViewMode = 'split' | 'map' | 'table';

export default function HomePage() {
  const { setProjects, setOrganizations, setMetadata, setLoading, setError, isLoading } = useAppStore();
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        console.log('Loading data...');

        const [projects, organizations, metadata] = await Promise.all([
          dataLoader.loadProjects(),
          dataLoader.loadOrganizations(),
          dataLoader.loadMetadata(),
        ]);

        console.log(`Loaded ${projects.length} projects, ${organizations.length} organizations`);

        setProjects(projects);
        setOrganizations(organizations);
        setMetadata(metadata);
      } catch (error: any) {
        console.error('Error loading data:', error);
        setError(error.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [setProjects, setOrganizations, setMetadata, setLoading, setError]);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-aau-blue text-lg font-medium">Loading collaboration data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Header onMenuClick={() => setSidebarOpen(true)} />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - drawer on mobile, fixed on desktop */}
        <div
          className={`
            fixed lg:relative inset-y-0 left-0 z-50 lg:z-0
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>

        <main className="flex-1 flex flex-col overflow-hidden">
          <StatsPanel />

          {/* View Mode Toggle - hide split on mobile */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200 overflow-x-auto">
            <span className="text-sm text-gray-600 mr-2 flex-shrink-0">View:</span>
            <button
              onClick={() => setViewMode('split')}
              className={`hidden lg:inline-block px-3 py-1 text-sm rounded transition-colors ${
                viewMode === 'split'
                  ? 'bg-aau-blue text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 text-sm rounded transition-colors flex-shrink-0 ${
                viewMode === 'map'
                  ? 'bg-aau-blue text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              Map
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 text-sm rounded transition-colors flex-shrink-0 ${
                viewMode === 'table'
                  ? 'bg-aau-blue text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              Table
            </button>
          </div>

          {/* Content Area - stack on mobile, split on desktop */}
          <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden">
            {(viewMode === 'split' || viewMode === 'map') && (
              <div className={viewMode === 'split' ? 'lg:w-2/5 flex-1 lg:border-r border-gray-200 min-h-0' : 'flex-1 min-h-0'}>
                <MapView />
              </div>
            )}
            {(viewMode === 'split' || viewMode === 'table') && (
              <div className={viewMode === 'split' ? 'flex-1 min-h-0' : 'flex-1 min-h-0'}>
                <ProjectTable />
              </div>
            )}
          </div>
        </main>
      </div>

      <ProjectModal />
    </div>
  );
}
