// Ad Quality Score Calculator for Google Search Ads
// Scores ads 0-100 based on best practices

export interface AdStrengthResult {
  score: number;
  strength: 'poor' | 'average' | 'good' | 'excellent';
  suggestions: string[];
  breakdown: {
    headlines: number;
    descriptions: number;
    sitelinks: number;
    callouts: number;
  };
}

export const calculateAdStrength = (
  headlines: string[],
  descriptions: string[],
  sitelinks: string[],
  callouts: string[]
): AdStrengthResult => {
  const suggestions: string[] = [];
  const breakdown = {
    headlines: 0,
    descriptions: 0,
    sitelinks: 0,
    callouts: 0,
  };

  // Headlines scoring (40 points max)
  const validHeadlines = headlines.filter(h => h.trim().length > 0);
  if (validHeadlines.length >= 15) {
    breakdown.headlines = 40;
  } else if (validHeadlines.length >= 10) {
    breakdown.headlines = 30;
    suggestions.push('Add 5+ more headlines to reach "Excellent" (15 total recommended)');
  } else if (validHeadlines.length >= 5) {
    breakdown.headlines = 20;
    suggestions.push('Add more headlines (at least 10 recommended)');
  } else {
    breakdown.headlines = 10;
    suggestions.push('Add more headlines (minimum 5, recommended 15)');
  }

  // Check for uniqueness (Google's #1 priority)
  const uniqueHeadlines = new Set(validHeadlines.map(h => h.toLowerCase()));
  if (uniqueHeadlines.size < validHeadlines.length) {
    suggestions.push('Remove duplicate headlines - Google prioritizes unique variations');
    breakdown.headlines = Math.max(0, breakdown.headlines - 5);
  }

  // Check character utilization - Google favors well-utilized headlines
  const shortHeadlines = validHeadlines.filter(h => h.length < 20);
  if (shortHeadlines.length > validHeadlines.length / 2) {
    suggestions.push('Use more characters in headlines (25-30 optimal) for better performance');
  }

  // Check for variety in headline types
  const hasQuestions = validHeadlines.some(h => /^(what|how|why|when|where|who)/i.test(h.trim()));
  const hasCTAs = validHeadlines.some(h => /(get|try|start|buy|learn|discover|find|shop)/i.test(h));
  const hasNumbers = validHeadlines.some(h => /\d/.test(h));
  const hasBenefits = validHeadlines.some(h => /(free|save|best|top|trusted|award|guarantee)/i.test(h));
  
  const varietyCount = [hasQuestions, hasCTAs, hasNumbers, hasBenefits].filter(Boolean).length;
  if (varietyCount < 2 && validHeadlines.length >= 5) {
    suggestions.push('Add variety: mix questions, CTAs, benefits, and specific numbers');
  }

  // Context-aware number suggestion (only if relevant)
  const hasPricing = validHeadlines.some(h => /\$|price|cost|save|discount|%/i.test(h));
  if (!hasNumbers && hasPricing && validHeadlines.length >= 5) {
    suggestions.push('Add specific numbers to pricing headlines (e.g., "Save 20%")');
  }

  // Descriptions scoring (30 points max)
  const validDescriptions = descriptions.filter(d => d.trim().length > 0);
  if (validDescriptions.length >= 4) {
    breakdown.descriptions = 30;
  } else if (validDescriptions.length >= 2) {
    breakdown.descriptions = 20;
    suggestions.push('Add 2+ more descriptions (4 total recommended)');
  } else {
    breakdown.descriptions = 10;
    suggestions.push('Add more descriptions (minimum 2, recommended 4)');
  }

  // Check description length utilization
  const shortDescriptions = validDescriptions.filter(d => d.length < 60);
  if (shortDescriptions.length > 0) {
    suggestions.push(`${shortDescriptions.length} description(s) are short - use full 90 characters when possible`);
  }

  // Sitelinks scoring (15 points max)
  const validSitelinks = sitelinks.filter(s => s.trim().length > 0);
  if (validSitelinks.length >= 4) {
    breakdown.sitelinks = 15;
  } else if (validSitelinks.length >= 2) {
    breakdown.sitelinks = 10;
    suggestions.push('Add more sitelinks (4 recommended for best visibility)');
  } else if (validSitelinks.length > 0) {
    breakdown.sitelinks = 5;
    suggestions.push('Add at least 4 sitelinks for better ad real estate');
  } else {
    suggestions.push('Add sitelinks to increase ad visibility and CTR');
  }

  // Callouts scoring (15 points max)
  const validCallouts = callouts.filter(c => c.trim().length > 0);
  if (validCallouts.length >= 4) {
    breakdown.callouts = 15;
  } else if (validCallouts.length >= 2) {
    breakdown.callouts = 10;
    suggestions.push('Add more callouts (4-6 recommended)');
  } else if (validCallouts.length > 0) {
    breakdown.callouts = 5;
    suggestions.push('Add at least 4 callouts to highlight key benefits');
  } else {
    suggestions.push('Add callouts (e.g., "24/7 Support", "Free Demo")');
  }

  // Calculate total score
  const score = breakdown.headlines + breakdown.descriptions + breakdown.sitelinks + breakdown.callouts;

  // Determine strength level (aligned with Google's tiers)
  let strength: 'poor' | 'average' | 'good' | 'excellent';
  if (score >= 80) {
    strength = 'excellent';
  } else if (score >= 60) {
    strength = 'good';
  } else if (score >= 40) {
    strength = 'average';
  } else {
    strength = 'poor';
  }

  return {
    score,
    strength,
    suggestions: suggestions.slice(0, 5), // Top 5 suggestions
    breakdown,
  };
};

// Compliance checker for brand guidelines
export interface ComplianceIssue {
  type: 'prohibited_word' | 'excessive_caps' | 'character_limit' | 'entity_specific';
  severity: 'error' | 'warning';
  message: string;
  field: string;
}

export interface HeadlinePattern {
  type: 'question' | 'cta' | 'number' | 'benefit' | 'emotional' | 'none';
  indicator: string;
  description: string;
  boost: number; // CTR boost percentage
}

export const detectHeadlinePattern = (headline: string): HeadlinePattern => {
  const text = headline.toLowerCase().trim();
  
  // Check for questions (20% CTR boost)
  if (/^(what|how|why|when|where|who|can|do|does|is|are)\b/i.test(text) || text.endsWith('?')) {
    return {
      type: 'question',
      indicator: '❓',
      description: 'Question pattern - 20% higher CTR',
      boost: 20
    };
  }
  
  // Check for CTAs (25% boost when in position 1)
  if (/\b(buy|get|try|start|shop|save|join|subscribe|download|claim|discover|learn)\b/i.test(text)) {
    return {
      type: 'cta',
      indicator: '👆',
      description: 'Call-to-action - 25% higher CTR',
      boost: 25
    };
  }
  
  // Check for numbers (15% CTR boost)
  if (/\d/.test(text)) {
    return {
      type: 'number',
      indicator: '🔢',
      description: 'Contains numbers - 15% higher CTR',
      boost: 15
    };
  }
  
  // Check for benefit words (10% boost)
  if (/\b(free|save|best|top|new|exclusive|guaranteed|easy|fast|simple)\b/i.test(text)) {
    return {
      type: 'benefit',
      indicator: '💎',
      description: 'Benefit-focused - 10% higher CTR',
      boost: 10
    };
  }
  
  // Check for emotional words (10% boost)
  if (/\b(love|amazing|perfect|incredible|trusted|popular|proven|award)\b/i.test(text)) {
    return {
      type: 'emotional',
      indicator: '❤️',
      description: 'Emotional appeal - 10% higher CTR',
      boost: 10
    };
  }
  
  return {
    type: 'none',
    indicator: '',
    description: '',
    boost: 0
  };
};


const PROHIBITED_WORDS = [
  '#1', 'guaranteed profits', 'no risk', 'free money', 'get rich quick',
  'scam', 'ponzi', 'pyramid', 'mlm', 'unlimited returns', 'risk-free',
  'guaranteed wins', 'insider', 'secret system', 'loophole'
];

export const checkCompliance = (
  headlines: string[],
  descriptions: string[],
  sitelinks: string[],
  callouts: string[],
  entity?: string
): ComplianceIssue[] => {
  const issues: ComplianceIssue[] = [];

  // Check all text fields
  const allFields = [
    ...headlines.map(h => ({ text: h, field: 'headline' })),
    ...descriptions.map(d => ({ text: d, field: 'description' })),
    ...sitelinks.map(s => ({ text: s, field: 'sitelink' })),
    ...callouts.map(c => ({ text: c, field: 'callout' })),
  ];

  allFields.forEach(({ text, field }) => {
    const lowerText = text.toLowerCase();

    // Check for prohibited words
    PROHIBITED_WORDS.forEach(word => {
      if (lowerText.includes(word)) {
        issues.push({
          type: 'prohibited_word',
          severity: 'error',
          message: `Prohibited word "${word}" found in ${field}`,
          field,
        });
      }
    });

    // Check for excessive capitalization (more than 2 consecutive CAPS words)
    const words = text.split(' ');
    let capsCount = 0;
    for (const word of words) {
      if (word === word.toUpperCase() && word.length > 1) {
        capsCount++;
        if (capsCount > 2) {
          issues.push({
            type: 'excessive_caps',
            severity: 'warning',
            message: `Excessive capitalization in ${field} - Google may disapprove`,
            field,
          });
          break;
        }
      } else {
        capsCount = 0;
      }
    }
  });

  // Entity-specific compliance (e.g., financial regulations)
  if (entity === 'UK' || entity === 'United Kingdom') {
    const hasRegulationMention = allFields.some(f => 
      f.text.toLowerCase().includes('fca') || 
      f.text.toLowerCase().includes('regulated')
    );
    if (!hasRegulationMention) {
      issues.push({
        type: 'entity_specific',
        severity: 'warning',
        message: 'UK financial ads should mention FCA regulation',
        field: 'general',
      });
    }
  }

  if (entity === 'UAE' || entity === 'United Arab Emirates') {
    const hasRegulationMention = allFields.some(f => 
      f.text.toLowerCase().includes('dfsa') || 
      f.text.toLowerCase().includes('sca')
    );
    if (!hasRegulationMention) {
      issues.push({
        type: 'entity_specific',
        severity: 'warning',
        message: 'UAE financial ads should mention DFSA or SCA regulation',
        field: 'general',
      });
    }
  }

  return issues;
};
