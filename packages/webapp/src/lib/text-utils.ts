/**
 * Text utility functions
 */

/**
 * Strip HTML tags from text
 */
export function stripHtml(html: string | undefined): string {
  if (!html) return '';

  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, ' ');

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/**
 * Extract keywords from text (works for both English and Danish)
 * Uses simple frequency analysis with stop word filtering
 */
export function extractKeywords(text: string, minLength: number = 4): string[] {
  if (!text) return [];

  // Common stop words in English and Danish
  const stopWords = new Set([
    // English
    'the', 'and', 'this', 'that', 'with', 'from', 'have', 'has', 'been',
    'will', 'would', 'could', 'should', 'their', 'there', 'which', 'what',
    'when', 'where', 'about', 'into', 'through', 'than', 'also', 'more',
    'some', 'such', 'other', 'only', 'very', 'can', 'may', 'these', 'those',
    // Danish
    'det', 'den', 'der', 'som', 'var', 'til', 'med', 'for', 'ikke', 'har',
    'vil', 'blev', 'eller', 'denne', 'dette', 'kan', 'skal', 'ved', 'blive',
    'hvis', 'hvor', 'hvad', 'alle', 'ingen', 'nogle', 'være', 'blevet',
  ]);

  // Extract words (letters, numbers, hyphens)
  const words = text
    .toLowerCase()
    .match(/[a-zæøåäöü0-9-]+/gi) || [];

  // Filter and count
  const wordCounts = new Map<string, number>();

  words.forEach((word) => {
    // Filter criteria
    if (
      word.length >= minLength &&
      !stopWords.has(word) &&
      !/^\d+$/.test(word) // Not just numbers
    ) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }
  });

  // Return words sorted by frequency
  return Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);
}

/**
 * Categorize keywords into broad academic subjects
 */
export function categorizeKeyword(keyword: string): string | null {
  const categories: Record<string, string[]> = {
    'Computer Science': ['software', 'programming', 'algorithm', 'data', 'machine', 'learning', 'computer', 'system', 'network', 'database', 'cloud', 'artificial', 'intelligence', 'web', 'mobile', 'app'],
    'Engineering': ['design', 'control', 'optimization', 'simulation', 'model', 'analysis', 'development', 'prototype', 'testing', 'system', 'technical', 'engineering', 'mechanical', 'electrical'],
    'Business': ['business', 'management', 'strategy', 'marketing', 'finance', 'economics', 'organization', 'customer', 'market', 'value', 'innovation', 'entrepreneurship'],
    'Healthcare': ['health', 'patient', 'medical', 'clinical', 'care', 'treatment', 'therapy', 'hospital', 'disease', 'diagnosis'],
    'Energy': ['energy', 'power', 'renewable', 'solar', 'wind', 'battery', 'grid', 'electricity', 'sustainability', 'emission'],
    'IoT & Sensors': ['sensor', 'iot', 'wireless', 'monitoring', 'smart', 'device', 'measurement', 'signal', 'embedded'],
    'Robotics': ['robot', 'robotics', 'autonomous', 'automation', 'drone', 'uav', 'manipulator'],
    'Communication': ['communication', 'network', 'protocol', 'wireless', '5g', 'antenna', 'transmission'],
  };

  const lowerKeyword = keyword.toLowerCase();

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((kw) => lowerKeyword.includes(kw))) {
      return category;
    }
  }

  return null;
}
