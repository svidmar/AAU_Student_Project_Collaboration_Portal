/**
 * Data Sync Script for AAU Thesis Portal
 * Fetches project data from Pure API and generates JSON files
 */

import * as fs from 'fs';
import * as path from 'path';

const PURE_API_BASE_URL = process.env.PURE_API_BASE_URL || 'https://vbn.aau.dk/ws/api/524';
const PURE_API_KEY = process.env.PURE_API_KEY;
// Write to root /data directory (not scripts/data)
const DATA_DIR = path.join(__dirname, '..', 'data');

if (!PURE_API_KEY) {
  console.error('Error: PURE_API_KEY environment variable is required');
  process.exit(1);
}

interface PureProject {
  uuid: string;
  title?: { value?: string };
  type?: { term?: { text?: Array<{ value?: string }> } };
  managingOrganizationalUnit?: {
    externalOrganizations?: Array<{
      name?: { text?: Array<{ value?: string }> };
      type?: { uri?: string };
      addresses?: Array<{
        country?: { term?: { text?: Array<{ value?: string }> } };
      }>;
    }>;
  };
  period?: {
    startDate?: string;
    endDate?: string;
  };
  persons?: Array<{
    name?: { firstName?: string; lastName?: string };
    role?: { term?: { text?: Array<{ value?: string }> } };
  }>;
  relatedProjects?: Array<{
    type?: { term?: { text?: Array<{ value?: string }> } };
  }>;
}

interface ProcessedProject {
  id: string;
  title: string;
  type: string;
  year: number;
  collaborations: Array<{
    organization: string;
    type: string;
    country?: string;
  }>;
  persons?: Array<{
    name: string;
    role: string;
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

  const data = await fetchFromPure('student-project');
  const projects = data.items || [];

  console.log(`Fetched ${projects.length} total projects`);
  return projects;
}

function extractText(textArray: Array<{ value?: string }> | undefined): string {
  if (!textArray || textArray.length === 0) return '';
  return textArray[0].value || '';
}

function processProject(project: PureProject): ProcessedProject | null {
  const externalOrgs = project.managingOrganizationalUnit?.externalOrganizations || [];

  if (externalOrgs.length === 0) {
    return null; // No collaborations
  }

  const collaborations = externalOrgs.map(org => ({
    organization: extractText(org.name?.text),
    type: org.type?.uri?.split('/').pop() || 'unknown',
    country: extractText(org.addresses?.[0]?.country?.term?.text)
  })).filter(c => c.organization);

  if (collaborations.length === 0) {
    return null;
  }

  const year = project.period?.endDate
    ? new Date(project.period.endDate).getFullYear()
    : new Date().getFullYear();

  return {
    id: project.uuid,
    title: extractText(project.title?.value ? [{ value: project.title.value }] : []),
    type: extractText(project.type?.term?.text) || 'Unknown',
    year,
    collaborations,
    persons: project.persons?.map(p => ({
      name: `${p.name?.firstName || ''} ${p.name?.lastName || ''}`.trim(),
      role: extractText(p.role?.term?.text)
    }))
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
      organizations.set(collab.organization, (organizations.get(collab.organization) || 0) + 1);
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
      if (!orgsMap.has(collab.organization)) {
        orgsMap.set(collab.organization, {
          name: collab.organization,
          type: collab.type,
          country: collab.country,
          projectCount: 0
        });
      }
      const org = orgsMap.get(collab.organization)!;
      org.projectCount++;
    });
  });

  return Array.from(orgsMap.values()).sort((a, b) => b.projectCount - a.projectCount);
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
      { name: 'projects.json', data: processedProjects },
      { name: 'metadata.json', data: metadata },
      { name: 'organizations.json', data: organizations },
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
