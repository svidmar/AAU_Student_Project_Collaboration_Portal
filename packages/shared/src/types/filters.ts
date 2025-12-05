/**
 * Types for filtering and metadata
 */

import { EducationProgram } from './project';

export interface FilterState {
  years: number[];
  educationPrograms: string[]; // program codes
  collaborationTypes: string[];
  campuses: string[];
  countries: string[];
  partners: string[]; // organization names
  projectTypes: string[]; // project types (Master Thesis, etc.)
  searchQuery?: string;
}

export interface YearRange {
  min: number;
  max: number;
  available: number[];
}

export interface EducationProgramOption extends EducationProgram {
  count: number;
}

export interface CollaborationTypeOption {
  type: string;
  count: number;
}

export interface CampusOption {
  name: string;
  count: number;
}

export interface CountryOption {
  name: string;
  count: number;
}

export interface PartnerOption {
  name: string;
  type: string;
  count: number;
}

export interface FilterOptions {
  years: YearRange;
  educationPrograms: EducationProgramOption[];
  collaborationTypes: CollaborationTypeOption[];
  campuses: CampusOption[];
  countries: CountryOption[];
  partners: PartnerOption[];
}

export interface Statistics {
  totalProjects: number;
  projectsWithCollaboration: number;
  collaborationsByYear: Record<number, number>;
  topPartners: PartnerOption[];
  projectsByEducation: Record<string, number>;
  projectsByCountry: Record<string, number>;
}

/**
 * Data wrapper for metadata.json blob
 */
export interface MetadataData {
  version: string;
  lastUpdated: string;
  filters: FilterOptions;
  statistics: Statistics;
}
