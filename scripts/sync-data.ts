/**
 * Complete Data Sync Script for AAU Thesis Portal
 * Fetches and enriches project data from Pure API with pagination and geocoding
 */

import * as fs from 'fs';
import * as path from 'path';

const PURE_API_BASE_URL = process.env.PURE_API_BASE_URL || 'https://vbn.aau.dk/ws/api/524';
const PURE_API_KEY = process.env.PURE_API_KEY;
const DATA_DIR = path.join(__dirname, '..', 'data');
const GEOCODING_API_URL = 'https://nominatim.openstreetmap.org/search';

if (!PURE_API_KEY) {
  console.error('Error: PURE_API_KEY environment variable is required');
  process.exit(1);
}

interface EnrichedProject {
  id: string;
  title: string;
  abstract?: string;
  type: string;
  year: number;
  educationProgram: {
    name: string;
    code: string;
  };
  authors: Array<{ name: string }>;
  supervisors: Array<{
    name: string;
    vbnUrl?: string;
    isActive?: boolean;
  }>;
  projectUrl: string;
  hasCollaboration: boolean;
  collaborations: Array<{
    name: string;
    type: string;
    location?: {
      country?: string;
      city?: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
  }>;
  campus?: string;
}

async function fetchFromPure(endpoint: string): Promise<any> {
  const url = `${PURE_API_BASE_URL}/${endpoint}`;
  console.log(`Fetching: ${url}`);

  const response = await fetch(url, {
    headers: {
      'api-key': PURE_API_KEY!,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Pure API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function fetchAllProjects(): Promise<any[]> {
  console.log('Fetching all student projects from Pure API with pagination...');

  const allProjects: any[] = [];
  let offset = 0;
  const pageSize = 100;
  let hasMore = true;

  while (hasMore) {
    const data = await fetchFromPure(`student-projects?size=${pageSize}&offset=${offset}`);
    const projects = data.items || [];

    allProjects.push(...projects);
    console.log(`Fetched ${projects.length} projects (offset: ${offset}, total so far: ${allProjects.length})`);

    hasMore = projects.length === pageSize;
    offset += pageSize;

    // Add small delay to avoid rate limiting
    if (hasMore) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`Fetched ${allProjects.length} total projects`);
  return allProjects;
}

function extractText(data: any): string {
  if (!data) return '';
  if (typeof data === 'string') return data;
  if (data.value) return data.value;
  if (Array.isArray(data) && data.length > 0) {
    const first = data[0];
    if (typeof first === 'string') return first;
    if (first.value) return first.value;
  }
  if (data.text && Array.isArray(data.text)) {
    return extractText(data.text);
  }
  return '';
}

async function geocode(organizationName: string, city?: string, country?: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const query = city && country ? `${city}, ${country}` : country || organizationName;
    const url = `${GEOCODING_API_URL}?q=${encodeURIComponent(query)}&format=json&limit=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AAU-Student-Project-Portal/1.0'
      }
    });

    if (!response.ok) return null;

    const data = await response.json() as any[];
    if (Array.isArray(data) && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
  } catch (error) {
    console.warn(`Geocoding failed for ${organizationName}:`, error);
  }

  return null;
}

async function enrichProject(project: any): Promise<EnrichedProject | null> {
  // Extract external collaborations
  const externalOrgs = project.managingOrganizationalUnit?.externalOrganizations || [];

  if (externalOrgs.length === 0) {
    return null; // Skip projects without collaborations
  }

  // Extract education program
  const educationProgram = {
    name: extractText(project.managingOrganizationalUnit?.name) || 'Unknown',
    code: project.managingOrganizationalUnit?.uuid?.substring(0, 8) || 'unknown'
  };

  // Extract year
  const year = project.period?.endDate
    ? new Date(project.period.endDate).getFullYear()
    : new Date().getFullYear();

  // Extract authors and supervisors
  const authors: Array<{ name: string }> = [];
  const supervisors: Array<{ name: string; vbnUrl?: string; isActive?: boolean }> = [];

  (project.persons || []).forEach((person: any) => {
    const role = extractText(person.role?.term?.text).toLowerCase();
    const firstName = person.name?.firstName || '';
    const lastName = person.name?.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();

    if (!fullName) return;

    if (role.includes('author') || role.includes('student')) {
      authors.push({ name: fullName });
    } else if (role.includes('supervisor') || role.includes('advisor')) {
      supervisors.push({
        name: fullName,
        vbnUrl: person.externalId ? `https://vbn.aau.dk/da/persons/${person.externalId}` : undefined,
        isActive: person.isActive !== false
      });
    }
  });

  // Enrich collaborations with location data
  const collaborations = await Promise.all(
    externalOrgs.map(async (org: any) => {
      const name = extractText(org.name?.text);
      const type = org.type?.uri?.split('/').pop() || 'unknown';
      const country = extractText(org.addresses?.[0]?.country?.term?.text);
      const city = extractText(org.addresses?.[0]?.city);

      let coordinates = null;
      if (city || country) {
        coordinates = await geocode(name, city, country);
        // Small delay between geocoding requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return {
        name,
        type,
        location: (city || country || coordinates) ? {
          country,
          city,
          coordinates
        } : undefined
      };
    })
  );

  return {
    id: project.uuid,
    title: extractText(project.title),
    abstract: extractText(project.abstract),
    type: extractText(project.type?.term?.text) || 'Unknown',
    year,
    educationProgram,
    authors,
    supervisors,
    projectUrl: project.electronicVersions?.[0]?.link?.href || `https://vbn.aau.dk/en/publications/${project.uuid}`,
    hasCollaboration: true,
    collaborations: collaborations.filter(c => c.name),
    campus: extractText(project.campus)
  };
}

function generateMetadata(projects: EnrichedProject[]): any {
  const years = new Set<number>();
  const types = new Map<string, number>();
  const countries = new Map<string, number>();
  const organizations = new Map<string, number>();
  const educationPrograms = new Map<string, { name: string; code: string; count: number }>();

  projects.forEach(project => {
    years.add(project.year);
    types.set(project.type, (types.get(project.type) || 0) + 1);

    // Track education programs
    const progKey = project.educationProgram.code;
    if (!educationPrograms.has(progKey)) {
      educationPrograms.set(progKey, {
        name: project.educationProgram.name,
        code: project.educationProgram.code,
        count: 0
      });
    }
    educationPrograms.get(progKey)!.count++;

    project.collaborations.forEach(collab => {
      if (collab.location?.country) {
        countries.set(collab.location.country, (countries.get(collab.location.country) || 0) + 1);
      }
      organizations.set(collab.name, (organizations.get(collab.name) || 0) + 1);
    });
  });

  return {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    filters: {
      years: {
        min: Math.min(...Array.from(years)),
        max: Math.max(...Array.from(years)),
        available: Array.from(years).sort()
      },
      educationPrograms: Array.from(educationPrograms.values())
        .sort((a, b) => b.count - a.count),
      collaborationTypes: Array.from(types.entries()).map(([type, count]) => ({
        type,
        count
      })),
      countries: Array.from(countries.entries()).map(([name, count]) => ({
        name,
        count
      })).sort((a, b) => b.count - a.count),
      partners: Array.from(organizations.entries()).map(([name, count]) => ({
        name,
        count
      })).sort((a, b) => b.count - a.count).slice(0, 100)
    },
    statistics: {
      totalProjects: projects.length,
      totalCollaborations: projects.reduce((sum, p) => sum + p.collaborations.length, 0),
      uniquePartners: organizations.size,
      uniqueCountries: countries.size
    }
  };
}

function generateOrganizations(projects: EnrichedProject[]): any[] {
  const orgsMap = new Map<string, any>();
  const usedIds = new Set<string>();

  const generateOrgId = (name: string, counter: number = 0): string => {
    const baseId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unknown';
    const id = counter === 0 ? baseId : `${baseId}-${counter}`;
    if (usedIds.has(id)) {
      return generateOrgId(name, counter + 1);
    }
    usedIds.add(id);
    return id;
  };

  projects.forEach(project => {
    project.collaborations.forEach(collab => {
      if (!orgsMap.has(collab.name)) {
        orgsMap.set(collab.name, {
          id: generateOrgId(collab.name),
          name: collab.name,
          type: collab.type,
          country: collab.location?.country,
          projectCount: 0
        });
      }
      const org = orgsMap.get(collab.name)!;
      org.projectCount++;
    });
  });

  return Array.from(orgsMap.values()).sort((a, b) => b.projectCount - a.projectCount);
}

async function main() {
  try {
    console.log('Starting complete data sync with enrichment...\n');

    // Fetch all projects with pagination
    const allProjects = await fetchAllProjects();

    // Enrich projects with full data and geocoding
    console.log('\nEnriching projects with full data and geocoding...');
    const enrichedProjects: EnrichedProject[] = [];

    for (let i = 0; i < allProjects.length; i++) {
      const project = allProjects[i];
      console.log(`Processing ${i + 1}/${allProjects.length}: ${extractText(project.title).substring(0, 60)}...`);

      const enriched = await enrichProject(project);
      if (enriched) {
        enrichedProjects.push(enriched);
      }
    }

    console.log(`\nFound ${enrichedProjects.length} projects with collaborations\n`);

    // Generate data files
    console.log('Generating data files...');
    const metadata = generateMetadata(enrichedProjects);
    const organizations = generateOrganizations(enrichedProjects);

    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Write files with proper structure
    const files = [
      {
        name: 'projects.json',
        data: {
          version: '1.0.0',
          lastUpdated: new Date().toISOString(),
          totalCount: enrichedProjects.length,
          projects: enrichedProjects
        }
      },
      { name: 'metadata.json', data: metadata },
      {
        name: 'organizations.json',
        data: {
          version: '1.0.0',
          lastUpdated: new Date().toISOString(),
          totalCount: organizations.length,
          organizations
        }
      }
    ];

    files.forEach(({ name, data }) => {
      const filePath = path.join(DATA_DIR, name);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`✓ Generated ${name} (${(fs.statSync(filePath).size / 1024).toFixed(2)} KB)`);
    });

    console.log('\n✅ Complete data sync finished successfully!');
  } catch (error) {
    console.error('\n❌ Error during data sync:', error);
    process.exit(1);
  }
}

main();
