/**
 * Keyword Extraction Service
 * Extracts most common keywords/topics from project data
 */

import { EnrichedProject } from '@aau-thesis-portal/shared';
import { stripHtml, extractKeywords } from '../lib/text-utils';

export interface SubjectOption {
  subject: string;
  count: number;
}

/**
 * Extract top keywords from all projects
 * Returns the most frequently occurring keywords across all projects
 */
export function extractSubjects(projects: EnrichedProject[], topN: number = 30): SubjectOption[] {
  // Map of keyword -> Set of project IDs that contain it
  const keywordProjectMap = new Map<string, Set<string>>();

  projects.forEach((project) => {
    // Get clean text from title and abstract
    const titleText = stripHtml(project.title);
    const abstractText = stripHtml(project.abstract);
    const combinedText = `${titleText} ${abstractText}`;

    // Extract keywords from this project
    const projectKeywords = extractKeywords(combinedText, 4); // Min length 4

    // Add to global keyword map (deduplicate per project)
    const uniqueKeywords = new Set(projectKeywords.slice(0, 20)); // Top 20 per project

    uniqueKeywords.forEach((keyword) => {
      if (!keywordProjectMap.has(keyword)) {
        keywordProjectMap.set(keyword, new Set());
      }
      keywordProjectMap.get(keyword)!.add(project.id);
    });
  });

  // Convert to array and sort by project count (most common keywords first)
  const sortedKeywords = Array.from(keywordProjectMap.entries())
    .map(([keyword, projectIds]) => ({
      subject: keyword.charAt(0).toUpperCase() + keyword.slice(1), // Capitalize first letter
      count: projectIds.size,
    }))
    .sort((a, b) => b.count - a.count);

  // Return top N keywords that appear in at least 10 projects
  return sortedKeywords
    .filter((kw) => kw.count >= 10)
    .slice(0, topN);
}

/**
 * Check if a project matches a keyword
 */
export function projectMatchesSubject(project: EnrichedProject, keyword: string): boolean {
  const titleText = stripHtml(project.title).toLowerCase();
  const abstractText = stripHtml(project.abstract).toLowerCase();
  const combinedText = `${titleText} ${abstractText}`;

  // Match the keyword (case-insensitive, whole word)
  const keywordLower = keyword.toLowerCase();

  // Use word boundaries to avoid partial matches
  const regex = new RegExp(`\\b${keywordLower}\\w*\\b`, 'i');

  return regex.test(combinedText);
}
