'use client';

import dynamic from 'next/dynamic';
import { useAppStore } from '../../stores/app-store';

// Dynamically import the map component (Leaflet requires window)
const DynamicMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="spinner mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Loading map...</p>
      </div>
    </div>
  ),
});

export default function MapView() {
  const { getFilteredProjects } = useAppStore();
  const projects = getFilteredProjects();

  // Filter to only projects with GPS coordinates
  const projectsWithCoordinates = projects.filter((p) =>
    p.collaborations.some((c) => c.location?.coordinates)
  );

  return (
    <div className="h-full w-full relative">
      <DynamicMap projects={projectsWithCoordinates} />

      <div className="absolute bottom-4 left-4 bg-white px-3 py-2 rounded shadow-lg text-sm z-[1000]">
        <div className="text-gray-600">
          Showing <span className="font-semibold text-aau-blue">{projectsWithCoordinates.length}</span> projects
          with GPS coordinates
        </div>
      </div>
    </div>
  );
}
