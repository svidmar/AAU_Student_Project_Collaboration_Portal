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
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <main className="flex-1 flex flex-col overflow-hidden">
          <StatsPanel />

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200">
            <span className="text-sm text-gray-600 mr-2">View:</span>
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                viewMode === 'split'
                  ? 'bg-aau-blue text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                viewMode === 'map'
                  ? 'bg-aau-blue text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              Map Only
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                viewMode === 'table'
                  ? 'bg-aau-blue text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              Table Only
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {(viewMode === 'split' || viewMode === 'map') && (
              <div className={viewMode === 'split' ? 'w-2/5 border-r border-gray-200' : 'flex-1'}>
                <MapView />
              </div>
            )}
            {(viewMode === 'split' || viewMode === 'table') && (
              <div className={viewMode === 'split' ? 'flex-1' : 'flex-1'}>
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
