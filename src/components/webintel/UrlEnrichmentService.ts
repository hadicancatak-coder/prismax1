export interface EnrichmentResult {
  category: string;
  estimatedTraffic: number | null;
  detectedType: 'Website' | 'App' | 'Portal' | 'Forum';
}

const CATEGORY_PATTERNS: Record<string, string[]> = {
  'News': ['news', 'times', 'post', 'gazette', 'tribune', 'herald', 'journal'],
  'Shopping': ['shop', 'store', 'buy', 'cart', 'amazon', 'ebay', 'souq', 'noon'],
  'Tech': ['tech', 'digital', 'software', 'app', 'dev', 'code', 'github'],
  'Entertainment': ['entertainment', 'movie', 'film', 'music', 'game', 'netflix', 'youtube'],
  'Sports': ['sport', 'football', 'cricket', 'fifa', 'espn', 'goal'],
  'Social Media': ['facebook', 'instagram', 'twitter', 'linkedin', 'snapchat', 'tiktok'],
  'Finance': ['bank', 'finance', 'money', 'invest', 'trade', 'crypto'],
  'Education': ['edu', 'school', 'university', 'course', 'learn', 'academy'],
  'Travel': ['travel', 'flight', 'hotel', 'booking', 'trip', 'tour'],
  'Food': ['food', 'recipe', 'restaurant', 'delivery', 'talabat', 'zomato'],
  'Health': ['health', 'medical', 'doctor', 'hospital', 'fitness', 'wellness'],
  'Real Estate': ['property', 'real', 'estate', 'house', 'apartment', 'rent'],
};

const detectCategory = (domain: string, url: string): string => {
  const searchText = (domain + ' ' + url).toLowerCase();
  
  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    if (patterns.some(pattern => searchText.includes(pattern))) {
      return category;
    }
  }
  
  return 'Other';
};

const detectType = (domain: string, url: string): 'Website' | 'App' | 'Portal' | 'Forum' => {
  const searchText = (domain + ' ' + url).toLowerCase();
  
  // Check for app stores
  if (searchText.includes('apps.apple.com') || 
      searchText.includes('play.google.com') ||
      searchText.includes('app.')) {
    return 'App';
  }
  
  // Check for forums
  if (searchText.includes('forum') || 
      searchText.includes('discuss') ||
      searchText.includes('community') ||
      searchText.includes('reddit')) {
    return 'Forum';
  }
  
  // Check for portals
  if (searchText.includes('portal') || 
      searchText.includes('gateway') ||
      searchText.includes('hub')) {
    return 'Portal';
  }
  
  return 'Website';
};

const estimateTraffic = (domain: string): number | null => {
  // Simple estimation based on popular domains
  // In production, this would use an API like SimilarWeb
  const popularSites: Record<string, number> = {
    'google.com': 100000000000,
    'youtube.com': 50000000000,
    'facebook.com': 30000000000,
    'instagram.com': 20000000000,
    'twitter.com': 15000000000,
    'linkedin.com': 10000000000,
    'amazon.com': 8000000000,
    'wikipedia.org': 5000000000,
    'cnn.com': 2500000000,
    'bbc.com': 2000000000,
    'gulfnews.com': 2500000,
    'khaleejtimes.com': 2000000,
    'arabianbusiness.com': 1500000,
  };
  
  const cleanDomain = domain.replace('www.', '').toLowerCase();
  
  return popularSites[cleanDomain] || null;
};

export const enrichUrl = async (url: string): Promise<EnrichmentResult> => {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    const domain = urlObj.hostname;
    
    const category = detectCategory(domain, url);
    const detectedType = detectType(domain, url);
    const estimatedTraffic = estimateTraffic(domain);
    
    return {
      category,
      detectedType,
      estimatedTraffic,
    };
  } catch (error) {
    console.error('URL enrichment failed:', error);
    return {
      category: 'Other',
      detectedType: 'Website',
      estimatedTraffic: null,
    };
  }
};
