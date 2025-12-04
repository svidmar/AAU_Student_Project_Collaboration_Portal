/**
 * Global Application Store using Zustand
 * Manages application state including filters, projects, and UI state
 */

import { create } from 'zustand';
import {
  EnrichedProject,
  Organization,
  MetadataData,
  FilterState,
} from '@aau-thesis-portal/shared';

interface AppState {
  // Data
  projects: EnrichedProject[];
  organizations: Organization[];
  metadata: MetadataData | null;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Filters
  filters: FilterState;

  // UI state
  selectedProject: EnrichedProject | null;
  hoveredProject: EnrichedProject | null;
  mapCenter: [number, number];
  mapZoom: number;

  // Actions
  setProjects: (projects: EnrichedProject[]) => void;
  setOrganizations: (organizations: Organization[]) => void;
  setMetadata: (metadata: MetadataData) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  setSelectedProject: (project: EnrichedProject | null) => void;
  setHoveredProject: (project: EnrichedProject | null) => void;
  setMapView: (center: [number, number], zoom: number) => void;

  // Computed
  getFilteredProjects: () => EnrichedProject[];
}

const DEFAULT_FILTERS: FilterState = {
  years: [],
  educationPrograms: [],
  collaborationTypes: [],
  countries: [],
  partners: [],
  projectTypes: [],
  searchQuery: '',
};

const DEFAULT_MAP_CENTER: [number, number] = [56.1629, 10.2039]; // Aalborg, Denmark
const DEFAULT_MAP_ZOOM = 3;

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  projects: [],
  organizations: [],
  metadata: null,
  isLoading: false,
  error: null,
  filters: DEFAULT_FILTERS,
  selectedProject: null,
  hoveredProject: null,
  mapCenter: DEFAULT_MAP_CENTER,
  mapZoom: DEFAULT_MAP_ZOOM,

  // Actions
  setProjects: (projects) => set({ projects }),
  setOrganizations: (organizations) => set({ organizations }),
  setMetadata: (metadata) => set({ metadata }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  setSelectedProject: (selectedProject) => set({ selectedProject }),
  setHoveredProject: (hoveredProject) => set({ hoveredProject }),

  setMapView: (center, zoom) =>
    set({ mapCenter: center, mapZoom: zoom }),

  // Computed: Get filtered projects
  getFilteredProjects: () => {
    const { projects, filters } = get();

    return projects.filter((project) => {
      // Year filter
      if (filters.years.length > 0 && !filters.years.includes(project.year)) {
        return false;
      }

      // Education program filter
      if (
        filters.educationPrograms.length > 0 &&
        !filters.educationPrograms.includes(project.educationProgram.code)
      ) {
        return false;
      }

      // Collaboration type filter
      if (filters.collaborationTypes.length > 0) {
        const projectTypes = project.collaborations.map((c) => c.type);
        if (
          !filters.collaborationTypes.some((type) =>
            projectTypes.includes(type)
          )
        ) {
          return false;
        }
      }

      // Country filter
      if (filters.countries.length > 0) {
        const projectCountries = project.collaborations
          .map((c) => c.location?.country)
          .filter((c): c is string => !!c);
        if (
          !filters.countries.some((country) =>
            projectCountries.includes(country)
          )
        ) {
          return false;
        }
      }

      // Partner filter
      if (filters.partners.length > 0) {
        const projectPartners = project.collaborations.map((c) => c.name);
        if (
          !filters.partners.some((partner) =>
            projectPartners.includes(partner)
          )
        ) {
          return false;
        }
      }

      // Project type filter
      if (filters.projectTypes.length > 0 && !filters.projectTypes.includes(project.type)) {
        return false;
      }

      // Search query filter
      if (filters.searchQuery && filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const searchableText = [
          project.title,
          project.abstract || '',
          project.educationProgram.name,
          ...project.authors.map((a) => a.name),
          ...project.supervisors.map((s) => s.name),
          ...project.collaborations.map((c) => c.name),
        ].join(' ').toLowerCase();

        if (!searchableText.includes(query)) {
          return false;
        }
      }

      return true;
    });
  },
}));
