/**
 * Complete Data Sync Script for AAU Thesis Portal
 * Fetches project data from Pure API with external collaborations
 */

import * as fs from 'fs';
import * as path from 'path';

const PURE_API_BASE_URL = process.env.PURE_API_BASE_URL || 'https://vbn.aau.dk/ws/api/524';
const PURE_API_KEY = process.env.PURE_API_KEY;
const DATA_DIR = path.join(__dirname, '..', 'data');

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

// Cache for external organizations to avoid duplicate fetches
const orgCache = new Map<string, any>();

async function fetchFromPure(endpoint: string): Promise<any> {
  const url = `${PURE_API_BASE_URL}/${endpoint}`;

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
  console.log('Fetching all student projects from Pure API...\n');

  // First request to get total count
  const firstPage = await fetchFromPure('student-projects?size=100&offset=0');
  const totalCount = firstPage.count || 0;
  const allProjects: any[] = [...(firstPage.items || [])];

  console.log(`Total projects in Pure API: ${totalCount}`);
  console.log(`Fetched ${allProjects.length} projects (page 1 of ${Math.ceil(totalCount / 100)})`);

  // Fetch remaining pages
  const pageSize = 100;
  let offset = pageSize;

  while (offset < totalCount) {
    const data = await fetchFromPure(`student-projects?size=${pageSize}&offset=${offset}`);
    const projects = data.items || [];

    allProjects.push(...projects);
    const currentPage = Math.floor(offset / pageSize) + 1;
    const totalPages = Math.ceil(totalCount / pageSize);
    console.log(`Fetched ${projects.length} projects (page ${currentPage + 1} of ${totalPages}, total: ${allProjects.length}/${totalCount})`);

    offset += pageSize;

    // Small delay to avoid rate limiting
    if (offset < totalCount) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  console.log(`\nFetched ${allProjects.length} total projects`);
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
  if (data.formatted === true && data.text) {
    return extractText(data.text);
  }
  return '';
}

async function fetchExternalOrganization(uuid: string): Promise<any | null> {
  // Check cache first
  if (orgCache.has(uuid)) {
    return orgCache.get(uuid);
  }

  try {
    const org = await fetchFromPure(`external-organisations/${uuid}`);
    orgCache.set(uuid, org);

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));

    return org;
  } catch (error) {
    console.warn(`Failed to fetch organization ${uuid}:`, error);
    orgCache.set(uuid, null);
    return null;
  }
}

async function enrichProject(project: any): Promise<EnrichedProject | null> {
  // Skip projects without external collaboration
  if (!project.externalCollaboration || !project.externalCollaborators || project.externalCollaborators.length === 0) {
    return null;
  }

  // Extract education program
  const educationAssoc = project.educationAssociations?.[0];
  const educationProgram = {
    name: extractText(educationAssoc?.education?.name) || 'Unknown',
    code: educationAssoc?.education?.uuid?.substring(0, 8) || 'unknown'
  };

  // Extract year
  const pubDate = project.publicationDate;
  const year = pubDate?.year || new Date().getFullYear();

  // Extract authors
  const authors: Array<{ name: string }> = (project.authors || []).map((author: any) => ({
    name: `${author.name?.firstName || ''} ${author.name?.lastName || ''}`.trim()
  })).filter((a: any) => a.name);

  // Extract supervisors
  const supervisors: Array<{ name: string; vbnUrl?: string; isActive?: boolean }> = (project.supervisors || []).map((sup: any) => {
    const person = sup.person;
    const name = extractText(person?.name);

    return {
      name,
      vbnUrl: person?.uuid ? `https://vbn.aau.dk/da/persons/${person.uuid}` : undefined,
      isActive: person?.externallyManaged !== false
    };
  }).filter((s: any) => s.name);

  // Extract abstract
  const abstract = extractText(project.abstract);

  // Extract project URL from documents
  const projectUrl = project.documents?.[0]?.url || `https://vbn.aau.dk/en/publications/${project.uuid}`;

  // Extract campus
  const campus = extractText(project.campus?.term);

  // Fetch and enrich external collaborations
  const collaborations: Array<{
    name: string;
    type: string;
    location?: {
      country?: string;
      city?: string;
      coordinates?: { lat: number; lng: number };
    };
  }> = [];

  for (const collab of project.externalCollaborators) {
    const orgUuid = collab.externalOrganisation?.uuid;
    if (!orgUuid) continue;

    const org = await fetchExternalOrganization(orgUuid);
    if (!org) continue;

    const name = extractText(org.name);
    if (!name) continue;

    const type = extractText(org.type?.term) || 'Unknown';
    const city = org.address?.city;
    const country = extractText(org.address?.country?.term);

    // Parse geoLocation if available (format: "lat,lng")
    let coordinates: { lat: number; lng: number } | undefined = undefined;
    if (org.address?.geoLocation?.point) {
      const point = org.address.geoLocation.point;
      const [latStr, lngStr] = point.split(',');
      if (latStr && lngStr) {
        coordinates = {
          lat: parseFloat(latStr.trim()),
          lng: parseFloat(lngStr.trim())
        };
      }
    }

    collaborations.push({
      name,
      type,
      location: (city || country || coordinates) ? {
        country,
        city,
        coordinates
      } : undefined
    });
  }

  if (collaborations.length === 0) {
    return null;
  }

  return {
    id: project.uuid,
    title: extractText(project.title),
    abstract,
    type: extractText(project.type?.term) || 'Unknown',
    year,
    educationProgram,
    authors,
    supervisors,
    projectUrl,
    hasCollaboration: true,
    collaborations,
    campus
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
    console.log('Starting complete data sync from Pure API...\n');

    // Fetch all projects with pagination
    const allProjects = await fetchAllProjects();

    // Enrich projects with external collaborations
    console.log('\nEnriching projects with external collaboration data...');
    const enrichedProjects: EnrichedProject[] = [];

    for (let i = 0; i < allProjects.length; i++) {
      const project = allProjects[i];

      // Log progress every 100 projects
      if (i % 100 === 0 || i === allProjects.length - 1) {
        console.log(`Processing ${i + 1}/${allProjects.length} (${enrichedProjects.length} with collaborations so far, ${orgCache.size} orgs cached)`);
      }

      const enriched = await enrichProject(project);
      if (enriched) {
        enrichedProjects.push(enriched);
      }
    }

    console.log(`\nFound ${enrichedProjects.length} projects with external collaborations`);
    console.log(`Cached ${orgCache.size} unique organizations\n`);

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
