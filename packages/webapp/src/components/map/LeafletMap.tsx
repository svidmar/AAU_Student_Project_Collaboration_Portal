'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import { EnrichedProject } from '@aau-thesis-portal/shared';
import { useAppStore } from '../../stores/app-store';
import { stripHtml } from '../../lib/text-utils';

interface LeafletMapProps {
  projects: EnrichedProject[];
}

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function LeafletMap({ projects }: LeafletMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerClusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const { setSelectedProject, mapCenter, mapZoom } = useAppStore();

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) {
      const map = L.map('map', {
        center: mapCenter,
        zoom: mapZoom,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      mapRef.current = map;

      // Create marker cluster group
      markerClusterRef.current = L.markerClusterGroup({
        chunkedLoading: true,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        maxClusterRadius: 50,
      });

      map.addLayer(markerClusterRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerClusterRef.current = null;
      }
    };
  }, [mapCenter, mapZoom]);

  // Update markers when projects change
  useEffect(() => {
    if (!markerClusterRef.current) return;

    // Clear existing markers
    markerClusterRef.current.clearLayers();

    // Group projects by coordinates
    const locationMap = new Map<string, EnrichedProject[]>();

    projects.forEach((project) => {
      project.collaborations.forEach((collab) => {
        if (collab.location?.coordinates) {
          const key = `${collab.location.coordinates.lat},${collab.location.coordinates.lng}`;
          const existing = locationMap.get(key) || [];
          locationMap.set(key, [...existing, project]);
        }
      });
    });

    // Create markers
    locationMap.forEach((projectsAtLocation, coordKey) => {
      const [lat, lng] = coordKey.split(',').map(Number);

      // Custom icon based on number of projects
      const count = projectsAtLocation.length;
      const iconHtml = count > 1
        ? `<div class="custom-marker">${count}</div>`
        : '';

      const icon = count > 1
        ? L.divIcon({
            html: iconHtml,
            className: 'custom-div-icon',
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          })
        : new L.Icon.Default();

      const marker = L.marker([lat, lng], { icon });

      // Create popup content
      const uniquePartners = new Set(
        projectsAtLocation.flatMap((p) => p.collaborations.map((c) => c.name))
      );

      const popupContent = `
        <div class="p-2">
          <div class="font-semibold text-aau-blue mb-2">
            ${projectsAtLocation[0].collaborations.find((c) => c.location?.coordinates?.lat === lat)?.location?.city || ''},
            ${projectsAtLocation[0].collaborations.find((c) => c.location?.coordinates?.lat === lat)?.location?.country}
          </div>
          <div class="text-sm mb-2">
            <strong>${projectsAtLocation.length}</strong> project${projectsAtLocation.length > 1 ? 's' : ''}
            with <strong>${uniquePartners.size}</strong> partner${uniquePartners.size > 1 ? 's' : ''}
          </div>
          ${projectsAtLocation.slice(0, 3).map((project) => `
            <div class="border-t pt-2 mt-2">
              <div class="font-medium text-sm hover:text-aau-light-blue cursor-pointer"
                   onclick="window.selectProject('${project.id}')">
                ${stripHtml(project.title)}
              </div>
              <div class="text-xs text-gray-600">${project.year} • ${project.educationProgram.name}</div>
            </div>
          `).join('')}
          ${projectsAtLocation.length > 3 ? `
            <div class="text-xs text-gray-500 mt-2">
              + ${projectsAtLocation.length - 3} more project${projectsAtLocation.length - 3 > 1 ? 's' : ''}
            </div>
          ` : ''}
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 300 });
      markerClusterRef.current!.addLayer(marker);
    });

    // Global function for popup project selection
    (window as any).selectProject = (projectId: string) => {
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        setSelectedProject(project);
      }
    };
  }, [projects, setSelectedProject]);

  return <div id="map" className="h-full w-full" />;
}
