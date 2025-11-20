// Headline Similarity Detection using Jaccard, N-gram, and Levenshtein

const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'be', 'been',
]);

const SYNONYMS: Record<string, string[]> = {
  trade: ['invest', 'exchange', 'deal', 'transact'],
  start: ['begin', 'launch', 'initiate', 'commence'],
  get: ['obtain', 'acquire', 'receive', 'gain'],
  best: ['top', 'premier', 'leading', 'finest'],
  free: ['complimentary', 'no-cost', 'zero-fee'],
  save: ['reduce', 'cut', 'lower', 'decrease'],
  now: ['today', 'immediately', 'instantly'],
  learn: ['discover', 'explore', 'understand'],
};

// Tokenize and remove stopwords
const tokenize = (text: string): string[] => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0 && !STOPWORDS.has(word));
};

// Jaccard Similarity (token overlap)
export const jaccardSimilarity = (text1: string, text2: string): number => {
  const tokens1 = new Set(tokenize(text1));
  const tokens2 = new Set(tokenize(text2));

  if (tokens1.size === 0 && tokens2.size === 0) return 1.0;
  if (tokens1.size === 0 || tokens2.size === 0) return 0.0;

  const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
  const union = new Set([...tokens1, ...tokens2]);

  return intersection.size / union.size;
};

// N-gram overlap (bigrams and trigrams)
const getNgrams = (tokens: string[], n: number): Set<string> => {
  const ngrams = new Set<string>();
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.add(tokens.slice(i, i + n).join(' '));
  }
  return ngrams;
};

export const ngramSimilarity = (text1: string, text2: string): number => {
  const tokens1 = tokenize(text1);
  const tokens2 = tokenize(text2);

  if (tokens1.length < 2 || tokens2.length < 2) return 0.0;

  const bigrams1 = getNgrams(tokens1, 2);
  const bigrams2 = getNgrams(tokens2, 2);
  const trigrams1 = getNgrams(tokens1, 3);
  const trigrams2 = getNgrams(tokens2, 3);

  const bigramIntersection = new Set([...bigrams1].filter(x => bigrams2.has(x)));
  const bigramUnion = new Set([...bigrams1, ...bigrams2]);
  const bigramScore = bigramUnion.size > 0 ? bigramIntersection.size / bigramUnion.size : 0;

  const trigramIntersection = new Set([...trigrams1].filter(x => trigrams2.has(x)));
  const trigramUnion = new Set([...trigrams1, ...trigrams2]);
  const trigramScore = trigramUnion.size > 0 ? trigramIntersection.size / trigramUnion.size : 0;

  return (bigramScore + trigramScore) / 2;
};

// Levenshtein distance (normalized)
export const levenshteinSimilarity = (text1: string, text2: string): number => {
  const s1 = text1.toLowerCase();
  const s2 = text2.toLowerCase();

  const m = s1.length;
  const n = s2.length;

  if (m === 0 && n === 0) return 1.0;
  if (m === 0 || n === 0) return 0.0;

  const dp: number[][] = Array(m + 1)
    .fill(0)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const maxLen = Math.max(m, n);
  return 1 - dp[m][n] / maxLen;
};

// Combined weighted similarity score
export const calculateSimilarity = (text1: string, text2: string): number => {
  const jaccard = jaccardSimilarity(text1, text2);
  const ngram = ngramSimilarity(text1, text2);
  const levenshtein = levenshteinSimilarity(text1, text2);

  return 0.4 * jaccard + 0.3 * ngram + 0.3 * levenshtein;
};

// Find similar pairs
export interface SimilarPair {
  headline1: string;
  headline2: string;
  similarity: number;
  index1: number;
  index2: number;
}

export const findSimilarPairs = (
  headlines: string[],
  threshold: number = 0.75
): SimilarPair[] => {
  const validHeadlines = headlines.filter(h => h.trim().length > 0);
  const pairs: SimilarPair[] = [];

  for (let i = 0; i < validHeadlines.length; i++) {
    for (let j = i + 1; j < validHeadlines.length; j++) {
      const similarity = calculateSimilarity(validHeadlines[i], validHeadlines[j]);
      if (similarity >= threshold) {
        pairs.push({
          headline1: validHeadlines[i],
          headline2: validHeadlines[j],
          similarity,
          index1: headlines.indexOf(validHeadlines[i]),
          index2: headlines.indexOf(validHeadlines[j]),
        });
      }
    }
  }

  return pairs.sort((a, b) => b.similarity - a.similarity);
};

// Generate alternative headline using synonym replacement
export const generateAlternative = (headline: string): string => {
  const tokens = headline.toLowerCase().split(/\s+/);
  const newTokens = tokens.map(token => {
    const cleanToken = token.replace(/[^\w]/g, '');
    for (const [word, synonyms] of Object.entries(SYNONYMS)) {
      if (cleanToken === word && synonyms.length > 0) {
        return synonyms[Math.floor(Math.random() * synonyms.length)];
      }
    }
    return token;
  });

  // Capitalize first letter
  const result = newTokens.join(' ');
  return result.charAt(0).toUpperCase() + result.slice(1);
};
