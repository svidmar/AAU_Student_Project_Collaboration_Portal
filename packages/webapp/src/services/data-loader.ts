/**
 * Data Loader Service
 * Handles loading and caching of project data from JSON files
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import {
  ProjectsData,
  OrganizationsData,
  MetadataData,
  EnrichedProject,
  Organization,
} from '@aau-thesis-portal/shared';

// IndexedDB Schema
interface ThesisPortalDB extends DBSchema {
  projects: {
    key: string;
    value: EnrichedProject;
  };
  organizations: {
    key: string;
    value: Organization;
  };
  metadata: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'aau-thesis-portal';
const DB_VERSION = 1;

// Data base URL
// In production, this points to GitHub raw content URL
// In development, this points to local /data directory
const DATA_BASE_URL = process.env.NEXT_PUBLIC_DATA_URL || '/data';
const USE_API = process.env.NEXT_PUBLIC_USE_API === 'true';

export class DataLoader {
  private db: IDBPDatabase<ThesisPortalDB> | null = null;

  /**
   * Initialize IndexedDB
   */
  private async initDB(): Promise<IDBPDatabase<ThesisPortalDB>> {
    if (this.db) return this.db;

    this.db = await openDB<ThesisPortalDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create object stores
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('organizations')) {
          db.createObjectStore('organizations', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata');
        }
      },
    });

    return this.db;
  }

  /**
   * Load projects data
   */
  async loadProjects(): Promise<EnrichedProject[]> {
    const db = await this.initDB();

    // Check if we have cached data
    const cachedMetadata = await db.get('metadata', 'projects-metadata');

    // Try to fetch fresh data
    try {
      // Add cache-busting parameter to bypass GitHub CDN cache
      const cacheBuster = `_cache=${Date.now()}`;
      const url = USE_API
        ? `${DATA_BASE_URL}?file=projects.json&${cacheBuster}`
        : `${DATA_BASE_URL}/projects.json?${cacheBuster}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch projects');

      const data: ProjectsData = await response.json();

      // Check if data is newer than cache
      if (
        !cachedMetadata ||
        data.lastUpdated !== cachedMetadata.lastUpdated
      ) {
        console.log('Updating projects cache...');

        // Clear and update cache
        const tx = db.transaction('projects', 'readwrite');
        await tx.store.clear();

        for (const project of data.projects) {
          await tx.store.add(project);
        }

        await tx.done;

        // Update metadata
        await db.put('metadata', {
          lastUpdated: data.lastUpdated,
          totalCount: data.totalCount,
        }, 'projects-metadata');

        return data.projects;
      }
    } catch (error) {
      console.warn('Failed to fetch fresh data, using cache:', error);
    }

    // Return cached data
    const projects = await db.getAll('projects');
    return projects;
  }

  /**
   * Load organizations data
   */
  async loadOrganizations(): Promise<Organization[]> {
    const db = await this.initDB();

    // Check if we have cached data
    const cachedMetadata = await db.get('metadata', 'organizations-metadata');

    // Try to fetch fresh data
    try {
      // Add cache-busting parameter to bypass GitHub CDN cache
      const cacheBuster = `_cache=${Date.now()}`;
      const url = USE_API
        ? `${DATA_BASE_URL}?file=organizations.json&${cacheBuster}`
        : `${DATA_BASE_URL}/organizations.json?${cacheBuster}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch organizations');

      const data: OrganizationsData = await response.json();

      // Check if data is newer than cache
      if (
        !cachedMetadata ||
        data.lastUpdated !== cachedMetadata.lastUpdated
      ) {
        console.log('Updating organizations cache...');

        // Clear and update cache
        const tx = db.transaction('organizations', 'readwrite');
        await tx.store.clear();

        for (const org of data.organizations) {
          await tx.store.add(org);
        }

        await tx.done;

        // Update metadata
        await db.put('metadata', {
          lastUpdated: data.lastUpdated,
          totalCount: data.totalCount,
        }, 'organizations-metadata');

        return data.organizations;
      }
    } catch (error) {
      console.warn('Failed to fetch fresh data, using cache:', error);
    }

    // Return cached data
    const organizations = await db.getAll('organizations');
    return organizations;
  }

  /**
   * Load metadata (filter options, statistics)
   */
  async loadMetadata(): Promise<MetadataData> {
    const db = await this.initDB();

    // Try to fetch fresh data
    try {
      // Add cache-busting parameter to bypass GitHub CDN cache
      const cacheBuster = `_cache=${Date.now()}`;
      const url = USE_API
        ? `${DATA_BASE_URL}?file=metadata.json&${cacheBuster}`
        : `${DATA_BASE_URL}/metadata.json?${cacheBuster}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch metadata');

      const data: MetadataData = await response.json();

      // Cache it
      await db.put('metadata', data, 'metadata');

      return data;
    } catch (error) {
      console.warn('Failed to fetch metadata, using cache:', error);

      // Return cached data
      const cached = await db.get('metadata', 'metadata');
      if (!cached) {
        throw new Error('No metadata available');
      }
      return cached;
    }
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    const db = await this.initDB();

    const tx = db.transaction(['projects', 'organizations', 'metadata'], 'readwrite');
    await Promise.all([
      tx.objectStore('projects').clear(),
      tx.objectStore('organizations').clear(),
      tx.objectStore('metadata').clear(),
    ]);
    await tx.done;

    console.log('Cache cleared');
  }
}

// Singleton instance
export const dataLoader = new DataLoader();
