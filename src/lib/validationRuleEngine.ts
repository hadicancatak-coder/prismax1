// Enhanced validation rule engine for ad best practices

import type { EntityAdRules } from "@/hooks/useEntityAdRules";

export type ValidationSeverity = 'critical' | 'error' | 'warning' | 'info';

export interface ValidationIssue {
  id: string;
  field: string;
  severity: ValidationSeverity;
  message: string;
  suggestion?: string;
  autoFix?: () => void;
}

export interface ValidationResult {
  score: number; // 0-100
  issues: ValidationIssue[];
  breakdown: {
    length: number;
    keywords: number;
    cta: number;
    compliance: number;
    style: number;
  };
}

const CTA_WORDS = [
  'start', 'get', 'try', 'learn', 'discover', 'find', 'shop', 'buy',
  'join', 'sign up', 'register', 'download', 'call', 'contact', 'request',
];

const SUPERLATIVES = ['best', 'top', '#1', 'guaranteed', 'perfect', 'ultimate'];

// Validate headline length
const validateLength = (
  headlines: string[],
  descriptions: string[]
): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];

  headlines.forEach((h, idx) => {
    if (h.trim().length === 0) return;

    if (h.length > 30) {
      issues.push({
        id: `headline_${idx}_too_long`,
        field: `Headline ${idx + 1}`,
        severity: 'error',
        message: `Headline exceeds 30 characters (${h.length}/30)`,
        suggestion: 'Shorten to fit Google Ads limit',
      });
    } else if (h.length < 15) {
      issues.push({
        id: `headline_${idx}_too_short`,
        field: `Headline ${idx + 1}`,
        severity: 'info',
        message: `Headline is short (${h.length}/30) - consider using more characters`,
        suggestion: 'Aim for 25-30 characters for optimal performance',
      });
    }
  });

  descriptions.forEach((d, idx) => {
    if (d.trim().length === 0) return;

    if (d.length > 90) {
      issues.push({
        id: `description_${idx}_too_long`,
        field: `Description ${idx + 1}`,
        severity: 'error',
        message: `Description exceeds 90 characters (${d.length}/90)`,
        suggestion: 'Shorten to fit Google Ads limit',
      });
    } else if (d.length < 60) {
      issues.push({
        id: `description_${idx}_too_short`,
        field: `Description ${idx + 1}`,
        severity: 'warning',
        message: `Description could use more detail (${d.length}/90)`,
        suggestion: 'Aim for 80-90 characters for better messaging',
      });
    }
  });

  return issues;
};

// Validate keyword alignment (check if primary keyword appears)
const validateKeywords = (
  headlines: string[],
  primaryKeyword?: string
): ValidationIssue[] => {
  if (!primaryKeyword) return [];

  const issues: ValidationIssue[] = [];
  const keywordLower = primaryKeyword.toLowerCase();
  const headlinesWithKeyword = headlines.filter(h =>
    h.toLowerCase().includes(keywordLower)
  );

  if (headlinesWithKeyword.length === 0) {
    issues.push({
      id: 'no_keyword_headlines',
      field: 'Headlines',
      severity: 'warning',
      message: `Primary keyword "${primaryKeyword}" not found in any headline`,
      suggestion: 'Include your target keyword in at least 2-3 headlines',
    });
  } else if (headlinesWithKeyword.length < 2) {
    issues.push({
      id: 'few_keyword_headlines',
      field: 'Headlines',
      severity: 'info',
      message: `Primary keyword appears in only ${headlinesWithKeyword.length} headline`,
      suggestion: 'Add keyword to 1-2 more headlines for better relevance',
    });
  }

  return issues;
};

// Validate CTA presence
const validateCTA = (descriptions: string[]): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const descriptionsWithCTA = descriptions.filter(d =>
    CTA_WORDS.some(cta => d.toLowerCase().includes(cta))
  );

  if (descriptionsWithCTA.length === 0) {
    issues.push({
      id: 'no_cta_descriptions',
      field: 'Descriptions',
      severity: 'warning',
      message: 'No clear call-to-action found in descriptions',
      suggestion: `Use action words like: ${CTA_WORDS.slice(0, 5).join(', ')}`,
    });
  }

  return issues;
};

// Validate compliance (prohibited words, competitors)
const validateCompliance = (
  headlines: string[],
  descriptions: string[],
  rules?: EntityAdRules
): ValidationIssue[] => {
  if (!rules) return [];

  const issues: ValidationIssue[] = [];
  const allText = [...headlines, ...descriptions];

  // Check prohibited words
  rules.prohibited_words.forEach(word => {
    const wordLower = word.toLowerCase();
    allText.forEach((text, idx) => {
      if (text.toLowerCase().includes(wordLower)) {
        const field = idx < headlines.length ? `Headline ${idx + 1}` : `Description ${idx - headlines.length + 1}`;
        issues.push({
          id: `prohibited_${word}_${idx}`,
          field,
          severity: 'error',
          message: `Contains prohibited term: "${word}"`,
          suggestion: 'Remove or replace this term per brand guidelines',
        });
      }
    });
  });

  // Check competitor names
  rules.competitor_names.forEach(competitor => {
    const competitorLower = competitor.toLowerCase();
    allText.forEach((text, idx) => {
      if (text.toLowerCase().includes(competitorLower)) {
        const field = idx < headlines.length ? `Headline ${idx + 1}` : `Description ${idx - headlines.length + 1}`;
        issues.push({
          id: `competitor_${competitor}_${idx}`,
          field,
          severity: 'error',
          message: `Contains competitor reference: "${competitor}"`,
          suggestion: 'Remove competitor mentions - not allowed in ads',
        });
      }
    });
  });

  return issues;
};

// Validate style (punctuation, title case, superlatives)
const validateStyle = (headlines: string[], descriptions: string[]): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];

  headlines.forEach((h, idx) => {
    if (h.trim().length === 0) return;

    // Check excessive punctuation
    const excessivePunct = /[!?]{2,}|\.{3,}/.test(h);
    if (excessivePunct) {
      issues.push({
        id: `headline_${idx}_punctuation`,
        field: `Headline ${idx + 1}`,
        severity: 'warning',
        message: 'Excessive punctuation (!!, ???, ...)',
        suggestion: 'Use standard punctuation for professional tone',
      });
    }

    // Check unproven superlatives
    const hasSuperlative = SUPERLATIVES.some(s => h.toLowerCase().includes(s));
    if (hasSuperlative) {
      issues.push({
        id: `headline_${idx}_superlative`,
        field: `Headline ${idx + 1}`,
        severity: 'info',
        message: 'Contains superlative claim (best, #1, etc.)',
        suggestion: 'Ensure claim can be substantiated or use softer language',
      });
    }
  });

  return issues;
};

// Main validation function
export const validateAd = (
  headlines: string[],
  descriptions: string[],
  primaryKeyword?: string,
  rules?: EntityAdRules
): ValidationResult => {
  const issues: ValidationIssue[] = [
    ...validateLength(headlines, descriptions),
    ...validateKeywords(headlines, primaryKeyword),
    ...validateCTA(descriptions),
    ...validateCompliance(headlines, descriptions, rules),
    ...validateStyle(headlines, descriptions),
  ];

  // Calculate score breakdown
  const maxPoints = { length: 20, keywords: 20, cta: 20, compliance: 25, style: 15 };
  const breakdown = { ...maxPoints };

  // Deduct points for issues
  issues.forEach(issue => {
    const deduction = issue.severity === 'critical' ? 10 : issue.severity === 'error' ? 5 : issue.severity === 'warning' ? 3 : 1;

    if (issue.field.includes('Headline') || issue.field.includes('Description')) {
      breakdown.length = Math.max(0, breakdown.length - deduction);
    }
    if (issue.id.includes('keyword')) {
      breakdown.keywords = Math.max(0, breakdown.keywords - deduction);
    }
    if (issue.id.includes('cta')) {
      breakdown.cta = Math.max(0, breakdown.cta - deduction);
    }
    if (issue.id.includes('prohibited') || issue.id.includes('competitor')) {
      breakdown.compliance = Math.max(0, breakdown.compliance - deduction);
    }
    if (issue.id.includes('punctuation') || issue.id.includes('superlative')) {
      breakdown.style = Math.max(0, breakdown.style - deduction);
    }
  });

  const score = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  return {
    score,
    issues,
    breakdown,
  };
};
