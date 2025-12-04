/**
 * Types for external organizations (collaborators)
 */

import { Location } from './project';

export interface Organization {
  id: string;
  name: string;
  type: string;
  location?: Location;
  projectCount?: number;
}

/**
 * Data wrapper for organizations.json blob
 */
export interface OrganizationsData {
  version: string;
  lastUpdated: string;
  totalCount: number;
  organizations: Organization[];
}
