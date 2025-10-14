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

  // Check for unique headlines
  const uniqueHeadlines = new Set(validHeadlines.map(h => h.toLowerCase()));
  if (uniqueHeadlines.size < validHeadlines.length) {
    suggestions.push('Remove duplicate headlines for better variety');
    breakdown.headlines = Math.max(0, breakdown.headlines - 5);
  }

  // Check for numbers in headlines (boost CTR)
  const headlinesWithNumbers = validHeadlines.filter(h => /\d/.test(h));
  if (headlinesWithNumbers.length === 0 && validHeadlines.length > 0) {
    suggestions.push('Include numbers in some headlines (e.g., "Save 20%", "2000+ Traders")');
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

  // Determine strength level
  let strength: 'poor' | 'average' | 'good' | 'excellent';
  if (score >= 85) {
    strength = 'excellent';
  } else if (score >= 65) {
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
