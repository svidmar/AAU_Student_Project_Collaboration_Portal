/**
 * Data Sync Script for AAU Thesis Portal
 * Fetches project data from Pure API and generates JSON files
 */

import * as fs from 'fs';
import * as path from 'path';

const PURE_API_BASE_URL = process.env.PURE_API_BASE_URL || 'https://vbn.aau.dk/ws/api/524';
const PURE_API_KEY = process.env.PURE_API_KEY;
// Write to root /data directory (not scripts/data)
const DATA_DIR = path.join(__dirname, '..', '..', 'data');

if (!PURE_API_KEY) {
  console.error('Error: PURE_API_KEY environment variable is required');
  process.exit(1);
}

interface PureProject {
  uuid: string;
  title?: { text?: Array<{ value?: string }> };
  type?: { term?: { text?: Array<{ value?: string }> } };
  publicationDate?: {
    year: number;
  };
  externalCollaboration?: boolean;
  externalCollaborators?: Array<{
    externalOrganisation: {
      name: { text: Array<{ value: string }> };
      type?: { term?: { text?: Array<{ value: string }> } };
      address?: {
        country?: { term?: { text?: Array<{ value: string }> } };
      };
    };
  }>;
  authors?: Array<{
    name?: { firstName?: string; lastName?: string };
  }>;
}

interface ProcessedProject {
  id: string;
  title: string;
  abstract?: string;
  type: string;
  year: number;
  campus?: string;
  educationProgram: {
    name: string;
    code: string;
  };
  authors: Array<{
    name: string;
  }>;
  supervisors: Array<{
    name: string;
    vbnUrl: string;
    isActive?: boolean;
  }>;
  projectUrl: string;
  hasCollaboration: boolean;
  collaborations: Array<{
    name: string;
    type: string;
    country?: string;
  }>;
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

async function fetchAllProjects(): Promise<PureProject[]> {
  console.log('Fetching all student projects from Pure API...');

  const allProjects: PureProject[] = [];
  let offset = 0;
  const pageSize = 100; // API page size

  while (true) {
    const data = await fetchFromPure(`student-projects?size=${pageSize}&offset=${offset}`);
    const projects = data.items || [];

    allProjects.push(...projects);
    console.log(`Fetched ${allProjects.length}/${data.count || '?'} projects`);

    // Check if we've fetched all projects
    if (projects.length < pageSize || allProjects.length >= (data.count || Infinity)) {
      break;
    }

    offset += pageSize;
  }

  console.log(`✓ Fetched ${allProjects.length} total projects`);
  return allProjects;
}

function extractText(textArray: Array<{ value?: string }> | undefined): string {
  if (!textArray || textArray.length === 0) return '';
  return textArray[0].value || '';
}

function processProject(project: PureProject): ProcessedProject | null {
  // Check if project has external collaboration flag
  if (!project.externalCollaboration) {
    return null;
  }

  const externalCollaborators = project.externalCollaborators || [];
  if (externalCollaborators.length === 0) {
    return null;
  }

  // Extract collaborations from externalCollaborators
  const collaborations = externalCollaborators.map(collaborator => ({
    name: extractText(collaborator.externalOrganisation.name?.text),
    type: extractText(collaborator.externalOrganisation.type?.term?.text) || 'Unknown',
    country: extractText(collaborator.externalOrganisation.address?.country?.term?.text)
  })).filter(c => c.name);

  if (collaborations.length === 0) {
    return null;
  }

  const year = project.publicationDate?.year || new Date().getFullYear();

  return {
    id: project.uuid,
    title: extractText(project.title?.text) || 'Untitled',
    abstract: '',
    type: extractText(project.type?.term?.text) || 'Unknown',
    year,
    campus: '',
    educationProgram: {
      name: extractText(project.type?.term?.text) || 'Unknown',
      code: extractText(project.type?.uri)?.split('/').pop() || 'unknown'
    },
    authors: project.authors?.map(p => ({
      name: `${p.name?.firstName || ''} ${p.name?.lastName || ''}`.trim()
    })) || [],
    supervisors: [],
    projectUrl: `https://vbn.aau.dk/da/publications/${project.uuid}`,
    hasCollaboration: true,
    collaborations
  };
}

function generateMetadata(projects: ProcessedProject[]): any {
  const years = new Set<number>();
  const types = new Map<string, number>();
  const countries = new Map<string, number>();
  const organizations = new Map<string, number>();

  projects.forEach(project => {
    years.add(project.year);
    types.set(project.type, (types.get(project.type) || 0) + 1);

    project.collaborations.forEach(collab => {
      if (collab.country) {
        countries.set(collab.country, (countries.get(collab.country) || 0) + 1);
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
      })).sort((a, b) => b.count - a.count).slice(0, 100) // Top 100
    },
    statistics: {
      totalProjects: projects.length,
      totalCollaborations: projects.reduce((sum, p) => sum + p.collaborations.length, 0),
      uniquePartners: organizations.size,
      uniqueCountries: countries.size
    }
  };
}

function generateOrganizations(projects: ProcessedProject[]): any[] {
  const orgsMap = new Map<string, any>();

  projects.forEach(project => {
    project.collaborations.forEach(collab => {
      if (!orgsMap.has(collab.name)) {
        orgsMap.set(collab.name, {
          name: collab.name,
          type: collab.type,
          country: collab.country,
          projectCount: 0
        });
      }
      const org = orgsMap.get(collab.name)!;
      org.projectCount++;
    });
  });

  // Convert to array and assign unique IDs
  const orgsArray = Array.from(orgsMap.values()).sort((a, b) => b.projectCount - a.projectCount);
  const usedIds = new Set<string>();

  const generateOrgId = (name: string, counter: number = 0): string => {
    const baseId = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      || 'unknown';

    const id = counter === 0 ? baseId : `${baseId}-${counter}`;

    if (usedIds.has(id)) {
      return generateOrgId(name, counter + 1);
    }

    usedIds.add(id);
    return id;
  };

  return orgsArray.map(org => ({
    id: generateOrgId(org.name),
    ...org
  }));
}

function generateSearchIndex(projects: ProcessedProject[]): any {
  return projects.map(project => ({
    id: project.id,
    title: project.title.toLowerCase(),
    organizations: project.collaborations.map(c => c.organization.toLowerCase()),
    year: project.year
  }));
}

async function main() {
  try {
    console.log('Starting data sync...\n');

    // Fetch all projects
    const allProjects = await fetchAllProjects();

    // Process and filter projects with collaborations
    console.log('\nProcessing projects...');
    const processedProjects = allProjects
      .map(processProject)
      .filter((p): p is ProcessedProject => p !== null);

    console.log(`Found ${processedProjects.length} projects with collaborations\n`);

    // Generate data files
    console.log('Generating data files...');
    const metadata = generateMetadata(processedProjects);
    const organizations = generateOrganizations(processedProjects);
    const searchIndex = generateSearchIndex(processedProjects);

    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Write files
    const files = [
      {
        name: 'projects.json',
        data: {
          version: '1.0.0',
          lastUpdated: new Date().toISOString(),
          totalCount: processedProjects.length,
          projects: processedProjects
        }
      },
      { name: 'metadata.json', data: metadata },
      {
        name: 'organizations.json',
        data: {
          version: '1.0.0',
          lastUpdated: new Date().toISOString(),
          totalCount: organizations.length,
          organizations: organizations
        }
      },
      { name: 'search-index.json', data: searchIndex }
    ];

    files.forEach(({ name, data }) => {
      const filePath = path.join(DATA_DIR, name);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`✓ Generated ${name} (${(fs.statSync(filePath).size / 1024).toFixed(2)} KB)`);
    });

    console.log('\n✅ Data sync completed successfully!');
  } catch (error) {
    console.error('\n❌ Error during data sync:', error);
    process.exit(1);
  }
}

main();
