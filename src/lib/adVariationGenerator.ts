import { calculateAdStrength, checkCompliance } from "./adQualityScore";

export interface AdVariation {
  id: string;
  headlines: string[];
  descriptions: string[];
  sitelinks: string[];
  callouts: string[];
  score: number;
  strength: string;
}

interface GenerateVariationsOptions {
  headlinePool: string[];
  descriptionPool: string[];
  sitelinkPool: string[];
  calloutPool: string[];
  entity?: string;
  maxVariations?: number;
  minScore?: number;
}

/**
 * Generates ad variations by intelligently mixing elements from the library
 * Ensures character limits and quality scores are maintained
 */
export function generateAdVariations({
  headlinePool,
  descriptionPool,
  sitelinkPool,
  calloutPool,
  entity,
  maxVariations = 10,
  minScore = 60,
}: GenerateVariationsOptions): AdVariation[] {
  const variations: AdVariation[] = [];
  const usedCombinations = new Set<string>();

  // Filter out invalid elements (empty or exceeding character limits)
  const validHeadlines = headlinePool.filter(h => h.trim() && h.length <= 30);
  const validDescriptions = descriptionPool.filter(d => d.trim() && d.length <= 90);
  const validSitelinks = sitelinkPool.filter(s => s.trim());
  const validCallouts = calloutPool.filter(c => c.trim() && c.length <= 25);

  if (validHeadlines.length < 3 || validDescriptions.length < 2) {
    return variations;
  }

  let attempts = 0;
  const maxAttempts = maxVariations * 10; // Prevent infinite loops

  while (variations.length < maxVariations && attempts < maxAttempts) {
    attempts++;

    // Generate random combination
    const selectedHeadlines = selectRandomElements(validHeadlines, randomBetween(3, Math.min(15, validHeadlines.length)));
    const selectedDescriptions = selectRandomElements(validDescriptions, randomBetween(2, Math.min(4, validDescriptions.length)));
    const selectedSitelinks = selectRandomElements(validSitelinks, randomBetween(0, Math.min(8, validSitelinks.length)));
    const selectedCallouts = selectRandomElements(validCallouts, randomBetween(0, Math.min(10, validCallouts.length)));

    // Create unique identifier for this combination
    const combinationKey = [
      selectedHeadlines.sort().join('|'),
      selectedDescriptions.sort().join('|'),
      selectedSitelinks.sort().join('|'),
      selectedCallouts.sort().join('|'),
    ].join('::');

    // Skip if we've already generated this combination
    if (usedCombinations.has(combinationKey)) {
      continue;
    }

    // Check compliance
    const complianceIssues = checkCompliance(
      selectedHeadlines,
      selectedDescriptions,
      selectedSitelinks,
      selectedCallouts,
      entity
    );

    // Skip if there are critical compliance errors
    const hasErrors = complianceIssues.some(issue => issue.severity === 'error');
    if (hasErrors) {
      continue;
    }

    // Calculate quality score
    const result = calculateAdStrength(
      selectedHeadlines,
      selectedDescriptions,
      selectedSitelinks,
      selectedCallouts
    );

    // Only include variations that meet minimum score
    if (result.score >= minScore) {
      variations.push({
        id: `var-${Date.now()}-${variations.length}`,
        headlines: selectedHeadlines,
        descriptions: selectedDescriptions,
        sitelinks: selectedSitelinks,
        callouts: selectedCallouts,
        score: result.score,
        strength: result.strength,
      });
      usedCombinations.add(combinationKey);
    }
  }

  // Sort by score (highest first)
  return variations.sort((a, b) => b.score - a.score);
}

/**
 * Selects random unique elements from an array
 */
function selectRandomElements<T>(array: T[], count: number): T[] {
  if (count >= array.length) {
    return shuffleArray([...array]);
  }

  const shuffled = shuffleArray([...array]);
  return shuffled.slice(0, count);
}

/**
 * Fisher-Yates shuffle algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Returns a random integer between min and max (inclusive)
 */
function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
