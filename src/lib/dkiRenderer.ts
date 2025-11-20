// Dynamic Keyword Insertion (DKI) Renderer with safe fallback logic

const STOPWORDS = ['the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of'];

// Parse template and extract DKI syntax
export interface DKITemplate {
  template: string;
  hasKW: boolean;
  defaultFallback?: string;
}

export const parseDKITemplate = (template: string): DKITemplate => {
  const hasKW = /{(KW|kw|Kw)}/.test(template);
  const defaultMatch = template.match(/{DEFAULT:([^}]+)}/);
  const defaultFallback = defaultMatch ? defaultMatch[1] : undefined;

  return {
    template,
    hasKW,
    defaultFallback,
  };
};

// Format keyword based on DKI syntax
const formatKeyword = (keyword: string, format: 'KW' | 'kw' | 'Kw'): string => {
  switch (format) {
    case 'KW': // Title Case
      return keyword
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    case 'kw': // lowercase
      return keyword.toLowerCase();
    case 'Kw': // Capitalized (first word only)
      return keyword.charAt(0).toUpperCase() + keyword.slice(1).toLowerCase();
    default:
      return keyword;
  }
};

// Compact keyword by removing stopwords and separators
const compactKeyword = (keyword: string): string => {
  return keyword
    .split(/[\s—|&]+/)
    .filter(word => !STOPWORDS.includes(word.toLowerCase()))
    .join(' ')
    .trim();
};

// Safe truncate (avoid mid-word cuts)
const safeTruncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;

  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace).trim();
  }

  return truncated.trim();
};

// Render headline with DKI
export interface DKIRenderResult {
  rendered: string;
  usedFallback: boolean;
  fallbackReason?: string;
}

export const renderDKI = (
  template: string,
  keyword: string,
  maxLength: number = 30
): DKIRenderResult => {
  const parsed = parseDKITemplate(template);

  if (!parsed.hasKW) {
    return {
      rendered: template,
      usedFallback: false,
    };
  }

  // Extract format (KW, kw, Kw)
  const formatMatch = template.match(/{(KW|kw|Kw)}/);
  const format = formatMatch ? (formatMatch[1] as 'KW' | 'kw' | 'Kw') : 'KW';

  // Try direct replacement first
  const formattedKeyword = formatKeyword(keyword, format);
  let rendered = template.replace(/{(KW|kw|Kw)}/, formattedKeyword);

  // Check if it exceeds max length
  if (rendered.length <= maxLength) {
    return {
      rendered: rendered.replace(/{DEFAULT:[^}]+}/, '').trim(),
      usedFallback: false,
    };
  }

  // Try compacting the keyword
  const compactedKeyword = compactKeyword(keyword);
  rendered = template.replace(/{(KW|kw|Kw)}/, formatKeyword(compactedKeyword, format));

  if (rendered.length <= maxLength) {
    return {
      rendered: rendered.replace(/{DEFAULT:[^}]+}/, '').trim(),
      usedFallback: false,
    };
  }

  // Use DEFAULT fallback if provided
  if (parsed.defaultFallback) {
    rendered = template
      .replace(/{(KW|kw|Kw)}/, '')
      .replace(/{DEFAULT:([^}]+)}/, parsed.defaultFallback)
      .replace(/\s+/g, ' ')
      .trim();

    if (rendered.length <= maxLength) {
      return {
        rendered,
        usedFallback: true,
        fallbackReason: 'Keyword too long, used DEFAULT',
      };
    }
  }

  // Last resort: safe truncate
  rendered = safeTruncate(
    template.replace(/{(KW|kw|Kw)}/, formattedKeyword).replace(/{DEFAULT:[^}]+}/, ''),
    maxLength
  );

  return {
    rendered,
    usedFallback: true,
    fallbackReason: 'Truncated to fit character limit',
  };
};

// Batch render for multiple keywords (stress test)
export const renderDKIBatch = (
  template: string,
  keywords: string[],
  maxLength: number = 30
): DKIRenderResult[] => {
  return keywords.map(keyword => renderDKI(template, keyword, maxLength));
};
