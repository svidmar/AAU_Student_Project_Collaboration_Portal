/**
 * Core types for AAU Student Thesis Projects
 */

export interface Author {
  name: string;
}

export interface Supervisor {
  name: string;
  vbnUrl: string;
  isActive?: boolean; // Whether supervisor is currently employed at AAU
}

export interface EducationProgram {
  name: string;
  code: string;
}

export interface Location {
  country: string;
  city?: string;
  coordinates?: Coordinates;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Collaboration {
  name: string;
  type: string;
  location?: Location;
}

/**
 * Enriched project data (transformed from Pure API responses)
 * This is the main data structure used throughout the application
 */
export interface EnrichedProject {
  id: string;
  title: string;
  abstract?: string;
  type: string;
  year: number;
  campus?: string;
  educationProgram: EducationProgram;
  authors: Author[];
  supervisors: Supervisor[];
  projectUrl: string;
  hasCollaboration: boolean;
  collaborations: Collaboration[];
}

/**
 * Data wrapper for projects.json blob
 */
export interface ProjectsData {
  version: string;
  lastUpdated: string;
  totalCount: number;
  projects: EnrichedProject[];
}
