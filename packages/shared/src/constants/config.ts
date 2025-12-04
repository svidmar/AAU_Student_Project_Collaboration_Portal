/**
 * Shared constants and configuration
 */

export const API_CONFIG = {
  PURE_BASE_URL: 'https://vbn.aau.dk/ws/api/524',
  RATE_LIMIT_DELAY_MS: 500,
  MAX_RATE_LIMIT_DELAY_MS: 5000,
  MAX_RETRIES: 5,
  PAGE_SIZE: 100,
  TIMEOUT_MS: 30000,
} as const;

export const BLOB_STORAGE = {
  CONTAINER_NAME: 'data',
  FILES: {
    PROJECTS: 'projects.json',
    METADATA: 'metadata.json',
    ORGANIZATIONS: 'organizations.json',
    SEARCH_INDEX: 'search-index.json',
  },
  CACHE_MAX_AGE_SECONDS: 3600, // 1 hour
} as const;

export const URLS = {
  VBN_PERSON_URL: 'https://vbn.aau.dk/da/persons',
  PROJEKTER_AAU_URL: 'https://projekter.aau.dk/projekter',
} as const;

export const AAU_BRANDING = {
  COLORS: {
    PRIMARY: '#211a52',
    SECONDARY: '#594fbf',
    DARK_GRAY: '#54616e',
  },
  FONT_FAMILY: 'Barlow, Arial, sans-serif',
} as const;

export const MAP_CONFIG = {
  DEFAULT_CENTER: {
    lat: 56.26,
    lng: 9.5,
  },
  DEFAULT_ZOOM: 7,
  CLUSTER_MAX_RADIUS: 50,
} as const;

export const CACHE_CONFIG = {
  INDEXEDDB_NAME: 'aau-thesis-portal',
  INDEXEDDB_VERSION: 1,
  TTL_MS: 3600000, // 1 hour
} as const;
