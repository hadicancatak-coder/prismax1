/**
 * Keyword Intel Processing Engine
 * 
 * Deterministic keyword classification engine supporting English and Arabic.
 * No embeddings, no semantic guessing, no paid APIs.
 */

// =====================================================
// TYPES
// =====================================================

export interface DictionaryEntry {
  id: string;
  dict_name: 'brand_terms' | 'competitors';
  canonical: string;
  alias: string;
  enabled: boolean;
}

export interface CustomRule {
  id: string;
  rule_name: string;
  pattern: string;
  match_type: 'contains_phrase' | 'regex';
  target_cluster_primary: string;
  enabled: boolean;
}

export interface NormalizedTerm {
  search_term_norm: string;
  search_term_norm_ascii: string;
  language: 'ar' | 'en' | 'mixed';
}

export interface ClassificationResult {
  cluster_primary: string;
  cluster_secondary: string | null;
  matched_rule: string;
  confidence: number;
}

export interface IntentResult {
  intent: string;
  matched_pattern: string;
}

export interface Tags {
  asset_tag?: string;
  platform_tag?: string;
  language?: 'ar' | 'en' | 'mixed';
}

export interface ProcessedKeyword {
  // Original fields
  keyword: string;
  clicks: number;
  impressions: number;
  ctr: number | null;
  cost: number | null;
  conversions: number | null;
  campaign: string | null;
  ad_group: string | null;
  match_type: string | null;
  
  // Engine-computed fields
  cluster_primary: string;
  cluster_secondary: string | null;
  intent: string;
  matched_rule: string;
  confidence: number;
  tags: Tags;
  opportunity_score: number | null;
  
  // Normalized forms (for debugging)
  search_term_norm?: string;
  search_term_norm_ascii?: string;
}

export interface CsvParseResult {
  cleanRows: Record<string, string>[];
  rowCountRaw: number;
  rowCountClean: number;
  headers: string[];
}

export interface LeakageSuggestion {
  suggestion_type: 'alias_candidate' | 'dictionary_candidate' | 'new_rule_candidate';
  extracted_phrase: string;
  evidence_terms: string[];
  evidence_cost: number;
  evidence_clicks: number;
  proposed_dict_name?: string;
  proposed_canonical?: string;
  proposed_alias?: string;
}

// =====================================================
// CLUSTER TAXONOMY
// =====================================================

export const CLUSTER_TAXONOMY = [
  'Brand - CFI',
  'Competitors',
  'Platform - TradingView',
  'Platform - MetaTrader',
  'Crypto - Bitcoin',
  'Crypto - Ethereum',
  'Crypto - Stablecoins',
  'Crypto - Altcoins',
  'Crypto - Generic',
  'Commodity - Gold',
  'Commodity - Silver',
  'Commodity - Energy',
  'Commodity - Other Metals',
  'FX - Majors/Minors',
  'Indices',
  'ETFs',
  'Stocks - Single Names',
  'Stocks - Generic',
  'AI / Bots / Automation',
  'Charts / Analysis',
  'Education / How-To',
  'App / Download',
  'Trading - Generic',
  'Other - Price/Today',
  'Other - News/Calendar',
  'Other - Regulation/Legal',
  'Other - Login/Access',
  'Other - General Longtail',
  'Junk / Noise',
] as const;

export type ClusterPrimary = typeof CLUSTER_TAXONOMY[number];

// =====================================================
// INTENT TAXONOMY
// =====================================================

export const INTENT_TAXONOMY = [
  'login_access',
  'transactional_open_account',
  'app_download',
  'price_today',
  'charts_analysis',
  'how_to_education',
  'regulation_trust',
  'news_calendar',
  'generic',
] as const;

export type Intent = typeof INTENT_TAXONOMY[number];

// =====================================================
// ARABIC NORMALIZATION
// =====================================================

const ARABIC_CHAR_MAP: Record<string, string> = {
  'أ': 'ا', 'إ': 'ا', 'آ': 'ا',
  'ة': 'ه',
  'ى': 'ي',
};

// Arabic diacritics/harakat to remove
const ARABIC_DIACRITICS = /[\u064B-\u0652\u0670]/g;
// Tatweel (kashida)
const TATWEEL = /\u0640/g;

function normalizeArabic(text: string): string {
  let result = text;
  
  // Replace mapped characters
  for (const [from, to] of Object.entries(ARABIC_CHAR_MAP)) {
    result = result.replace(new RegExp(from, 'g'), to);
  }
  
  // Remove diacritics and tatweel
  result = result.replace(ARABIC_DIACRITICS, '');
  result = result.replace(TATWEEL, '');
  
  return result;
}

function containsArabic(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
}

function containsLatin(text: string): boolean {
  return /[a-zA-Z]/.test(text);
}

// =====================================================
// TERM NORMALIZATION
// =====================================================

export function normalizeTerm(term: string): NormalizedTerm {
  // Basic normalization: lowercase, trim, collapse whitespace
  let norm = term.toLowerCase().trim().replace(/\s+/g, ' ');
  
  // Apply Arabic normalization
  norm = normalizeArabic(norm);
  
  // ASCII normalization: strip punctuation
  const asciiNorm = norm.replace(/[.,\/;:_\-\(\)\[\]\{\}\"'`!@#$%^&*+=<>?\\|~]/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Detect language
  const hasArabic = containsArabic(term);
  const hasLatin = containsLatin(term);
  
  let language: 'ar' | 'en' | 'mixed';
  if (hasArabic && hasLatin) {
    language = 'mixed';
  } else if (hasArabic) {
    language = 'ar';
  } else {
    language = 'en';
  }
  
  return {
    search_term_norm: norm,
    search_term_norm_ascii: asciiNorm,
    language,
  };
}

// =====================================================
// CSV PARSING & CLEANING
// =====================================================

const HEADER_VARIANTS = {
  search_term: ['search term', 'search_term', 'مصطلح البحث', 'مصطلح بحث'],
  clicks: ['clicks', 'click', 'النقرات'],
  impressions: ['impressions', 'impr', 'مرات الظهور'],
  ctr: ['ctr', 'click-through rate', 'نسبة النقر إلى الظهور'],
  cost: ['cost', 'spend', 'التكلفة'],
  conversions: ['conversions', 'conv', 'التحويلات'],
  campaign: ['campaign', 'campaign name', 'الحملة'],
  ad_group: ['ad group', 'ad_group', 'adgroup', 'المجموعة الإعلانية'],
  match_type: ['match type', 'match_type', 'نوع المطابقة'],
};

const TOTAL_ROW_PATTERNS = [
  /^total:?\s*$/i,
  /^total$/i,
  /^الإجمالي/,
  /^المجموع/,
  /^الاجمالي/,
  /^اجمالي/,
  /^مجموع/,
  /^\s*$/,
  /^--/,
  /^grand total/i,
  /^subtotal/i,
];

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

function findColumnIndex(headers: string[], variants: string[]): number {
  const lowerHeaders = headers.map(h => h.toLowerCase().trim());
  for (const variant of variants) {
    const idx = lowerHeaders.indexOf(variant.toLowerCase());
    if (idx !== -1) return idx;
  }
  return -1;
}

export function parseAndCleanCsv(text: string): CsvParseResult {
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  const rowCountRaw = lines.length;
  
  // Find header row
  let headerRowIndex = -1;
  let headers: string[] = [];
  
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const cells = parseCSVLine(lines[i]);
    const searchTermIdx = findColumnIndex(cells, HEADER_VARIANTS.search_term);
    
    if (searchTermIdx !== -1) {
      headerRowIndex = i;
      headers = cells;
      break;
    }
  }
  
  if (headerRowIndex === -1) {
    return { cleanRows: [], rowCountRaw, rowCountClean: 0, headers: [] };
  }
  
  // Build column index map
  const colMap = {
    search_term: findColumnIndex(headers, HEADER_VARIANTS.search_term),
    clicks: findColumnIndex(headers, HEADER_VARIANTS.clicks),
    impressions: findColumnIndex(headers, HEADER_VARIANTS.impressions),
    ctr: findColumnIndex(headers, HEADER_VARIANTS.ctr),
    cost: findColumnIndex(headers, HEADER_VARIANTS.cost),
    conversions: findColumnIndex(headers, HEADER_VARIANTS.conversions),
    campaign: findColumnIndex(headers, HEADER_VARIANTS.campaign),
    ad_group: findColumnIndex(headers, HEADER_VARIANTS.ad_group),
    match_type: findColumnIndex(headers, HEADER_VARIANTS.match_type),
  };
  
  const cleanRows: Record<string, string>[] = [];
  
  for (let i = headerRowIndex + 1; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i]);
    
    // Skip if it's a repeated header row
    if (colMap.search_term !== -1) {
      const searchTermValue = cells[colMap.search_term]?.toLowerCase().trim();
      if (HEADER_VARIANTS.search_term.includes(searchTermValue)) {
        continue;
      }
    }
    
    // Get search term
    const searchTerm = colMap.search_term !== -1 ? cells[colMap.search_term]?.trim() : '';
    
    // Skip empty search terms
    if (!searchTerm) continue;
    
    // Skip total rows
    const isTotalRow = TOTAL_ROW_PATTERNS.some(pattern => pattern.test(searchTerm));
    if (isTotalRow) continue;
    
    // Build row object
    const row: Record<string, string> = {
      search_term: searchTerm,
      clicks: colMap.clicks !== -1 ? cells[colMap.clicks] || '0' : '0',
      impressions: colMap.impressions !== -1 ? cells[colMap.impressions] || '0' : '0',
      ctr: colMap.ctr !== -1 ? cells[colMap.ctr] || '' : '',
      cost: colMap.cost !== -1 ? cells[colMap.cost] || '' : '',
      conversions: colMap.conversions !== -1 ? cells[colMap.conversions] || '' : '',
      campaign: colMap.campaign !== -1 ? cells[colMap.campaign] || '' : '',
      ad_group: colMap.ad_group !== -1 ? cells[colMap.ad_group] || '' : '',
      match_type: colMap.match_type !== -1 ? cells[colMap.match_type] || '' : '',
    };
    
    cleanRows.push(row);
  }
  
  return {
    cleanRows,
    rowCountRaw,
    rowCountClean: cleanRows.length,
    headers,
  };
}

// =====================================================
// REGEX PATTERNS (EN + AR)
// =====================================================

// Platforms
const TRADINGVIEW_PATTERN = /tradingview|trading\s*view|تريدنج\s*فيو|تريدنغ\s*فيو|ترادينغ\s*فيو/i;
const METATRADER_PATTERN = /mt4|mt5|metatrader|ميتا\s*تريدر|ميتاتريدر|mt٤|mt٥/i;

// Crypto
const BITCOIN_PATTERN = /bitcoin|btc|btcusd|بيتكوين|بتكوين/i;
const ETHEREUM_PATTERN = /ethereum|eth|ethusdt?|ايثريوم|إيثريوم/i;
const STABLECOINS_PATTERN = /usdt|tether|usdc|dai|تيثر|يو\s*اس\s*دي\s*تي/i;
const ALTCOINS_PATTERN = /\b(sol|solana|xrp|ripple|ada|cardano|doge|dogecoin|bnb|matic|avax|trx|tron|link|ltc|litecoin|atom|dot|polkadot|near|arb|arbitrum|op|optimism|apt|aptos|sui)\b/i;
const CRYPTO_GENERIC_PATTERN = /crypto|cryptocurrency|blockchain|defi|web3|coinmarketcap|coingecko|كريبتو|عملات\s*رقمي[ةه]|العملات\s*الرقمية|بلوك\s*تشين|بلوكتشين|ديفاي/i;

// Commodities
const GOLD_PATTERN = /\b(gold|xau|xauusd)\b|ذهب|الذهب|سعر\s*الذهب/i;
const SILVER_PATTERN = /\b(silver|xag|xagusd)\b|فض[ةه]|الفضة/i;
const ENERGY_PATTERN = /\b(oil|brent|wti|crude|natural\s*gas)\b|نفط|النفط|برنت|خام|غاز\s*طبيعي/i;
const OTHER_METALS_PATTERN = /\b(platinum|palladium|copper|nickel|aluminum|aluminium|zinc|tin)\b/i;

// FX
const FX_PAIRS_PATTERN = /\b(eurusd|gbpusd|usdjpy|usdtry|usdcad|audusd|nzdusd|usdchf|eurjpy|eurgbp|gbpjpy|eurchf)\b/i;
const FX_GENERIC_PATTERN = /\bforex\b|\bfx\b|فوركس|تداول\s*العملات|سوق\s*العملات|زوج\s*عملات/i;
const FX_PAIR_NOTATION = /\b[a-z]{3}\s*\/\s*[a-z]{3}\b/i;

// Indices
const INDICES_PATTERN = /\b(nasdaq|sp500|s&p|dow|dowjones|dax|ftse|cac|nikkei|hang\s*seng|vix|us30|us500|nas100)\b|مؤشر|المؤشرات|ناسداك|داو|ستاندرد\s*اند\s*بورز/i;

// ETFs
const ETFS_PATTERN = /\b(etf|spy|qqq|ishares|vanguard|ark|arkk)\b|صندوق\s*متداول|اي\s*تي\s*اف/i;

// Stocks
const STOCKS_SINGLE_NAMES = /\b(apple|aapl|tesla|tsla|amazon|amzn|google|googl|microsoft|msft|meta|nvda|nvidia)\b/i;
const STOCKS_GENERIC_PATTERN = /\b(stock|stocks|share|shares|equity|equities|dividend|earnings)\b|اسهم|أسهم|سوق\s*الاسهم|سوق\s*الأسهم/i;

// AI / Bots / Automation
const AI_BOTS_PATTERN = /\b(ai|bot|bots|robot|automated|automation|algo|algorithmic|copy\s*trad(e|ing)|signal|signals)\b/i;

// Charts / Analysis
const CHARTS_PATTERN = /\b(chart|charts|analysis|forecast|prediction|signals?|indicator|support|resistance|technical|fundamental|candle|candlestick)\b|شارت|تحليل|توقع|تنبؤ|اشار[ةه]|إشار[ةه]|مؤشر|دعم|مقاومة|تحليل\s*فني|تحليل\s*أساسي/i;

// Education / How-To
const EDUCATION_PATTERN = /\b(how\s*to|what\s*is|guide|tutorial|learn|course|academy|training|meaning|definition|explain)\b|كيفية|ما\s*هو|دليل|شرح|تعلم|كورس|دورة|تدريب|معنى/i;

// App / Download
const APP_PATTERN = /\b(app|apk|ios|android|download|install|mobile)\b|تطبيق|تحميل|اندرويد|ايفون|آيفون/i;

// Trading Generic
const TRADING_GENERIC_PATTERN = /\b(trading|trader|trade|trades|broker|brokerage|invest|investment|portfolio)\b|تداول|تاجر|وسيط|استثمار|محفظة/i;

// Other bucket patterns
const PRICE_TODAY_PATTERN = /\b(price|today|now|live|rate|quote|value|current)\b|سعر|اليوم|الان|الآن|مباشر|كم\s*سعر|سعر\s*الآن/i;
const NEWS_CALENDAR_PATTERN = /\b(news|reuters|forexfactory|calendar|economic\s*calendar|cpi|nfp|interest\s*rate)\b|اخبار|أخبار|تقويم|تقويم\s*اقتصادي|مؤشر\s*اسعار|وظائف|سعر\s*الفائدة/i;
const REGULATION_PATTERN = /\b(regulated|license|scam|safe|legit|review|complaint|trusted)\b|مرخص|ترخيص|نصاب|احتيال|آمن|موثوق|مراجعة|شكاوى/i;
const LOGIN_ACCESS_PATTERN = /\b(login|log\s*in|sign\s*in|signin|account|portal|dashboard|password|reset|forgot|withdraw|deposit|kyc|verification)\b|تسجيل\s*الدخول|دخول|حساب|بوابة|كلمة\s*المرور|نسيت|اعادة\s*تعيين|سحب|ايداع|تحقق|توثيق/i;

// Junk patterns
const JUNK_PATTERN = /^[0-9\s\-\.]+$|^\s*$/;

// No-money intent patterns (users looking for free/earn money without investment)
export const NO_MONEY_PATTERNS_EN = /\b(free|earn money|make money|money make|how to earn|free signals|free course|no deposit|without deposit|no investment|earn from home|work from home|passive income)\b/i;
export const NO_MONEY_PATTERNS_AR = /ربح|ربح المال|كسب المال|فلوس|بدون رأس مال|بدون ايداع|بدون استثمار|مجانا|مجاني|اربح|كسب/;

export function isNoMoneyIntent(norm: string, asciiNorm: string): boolean {
  return NO_MONEY_PATTERNS_EN.test(asciiNorm) || NO_MONEY_PATTERNS_AR.test(norm);
}

// =====================================================
// INTENT PATTERNS
// =====================================================

const INTENT_PATTERNS: Array<{ intent: Intent; pattern: RegExp }> = [
  { intent: 'login_access', pattern: LOGIN_ACCESS_PATTERN },
  { intent: 'transactional_open_account', pattern: /\b(open\s*account|create\s*account|sign\s*up|register|registration|minimum\s*deposit|bonus)\b|فتح\s*حساب|انشاء\s*حساب|تسجيل|سجل|حد\s*ادنى\s*للايداع|بونص|مكافأة/i },
  { intent: 'app_download', pattern: APP_PATTERN },
  { intent: 'price_today', pattern: PRICE_TODAY_PATTERN },
  { intent: 'charts_analysis', pattern: CHARTS_PATTERN },
  { intent: 'how_to_education', pattern: EDUCATION_PATTERN },
  { intent: 'regulation_trust', pattern: REGULATION_PATTERN },
  { intent: 'news_calendar', pattern: NEWS_CALENDAR_PATTERN },
];

// =====================================================
// DICTIONARY MATCHING
// =====================================================

function matchDictionary(
  norm: string,
  asciiNorm: string,
  dictionaries: DictionaryEntry[]
): { canonical: string; dictName: 'brand_terms' | 'competitors' } | null {
  for (const entry of dictionaries) {
    if (!entry.enabled) continue;
    
    const aliasNorm = entry.alias.toLowerCase().trim();
    const aliasAscii = aliasNorm.replace(/[.,\/;:_\-\(\)\[\]\{\}\"'`!@#$%^&*+=<>?\\|~]/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Check boundary-aware matching
    // Create word boundary pattern
    const escapedAlias = aliasNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const boundaryPattern = new RegExp(`(^|\\s|[^a-zA-Z0-9])${escapedAlias}($|\\s|[^a-zA-Z0-9])`, 'i');
    
    if (boundaryPattern.test(norm) || boundaryPattern.test(` ${norm} `)) {
      return { canonical: entry.canonical, dictName: entry.dict_name };
    }
    
    // Also check ASCII normalized version
    const escapedAscii = aliasAscii.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const asciiBoundaryPattern = new RegExp(`(^|\\s)${escapedAscii}($|\\s)`, 'i');
    
    if (asciiBoundaryPattern.test(asciiNorm) || asciiBoundaryPattern.test(` ${asciiNorm} `)) {
      return { canonical: entry.canonical, dictName: entry.dict_name };
    }
  }
  
  return null;
}

// =====================================================
// CUSTOM RULES MATCHING
// =====================================================

function matchCustomRules(
  norm: string,
  asciiNorm: string,
  customRules: CustomRule[]
): { ruleName: string; targetCluster: string } | null {
  for (const rule of customRules) {
    if (!rule.enabled) continue;
    
    if (rule.match_type === 'contains_phrase') {
      const patternNorm = rule.pattern.toLowerCase().trim();
      if (norm.includes(patternNorm) || asciiNorm.includes(patternNorm)) {
        return { ruleName: rule.rule_name, targetCluster: rule.target_cluster_primary };
      }
    } else if (rule.match_type === 'regex') {
      try {
        const regex = new RegExp(rule.pattern, 'i');
        if (regex.test(norm) || regex.test(asciiNorm)) {
          return { ruleName: rule.rule_name, targetCluster: rule.target_cluster_primary };
        }
      } catch {
        // Invalid regex, skip
        continue;
      }
    }
  }
  
  return null;
}

// =====================================================
// PRIMARY CLASSIFICATION
// =====================================================

export function classifyPrimary(
  norm: string,
  asciiNorm: string,
  dictionaries: DictionaryEntry[],
  customRules: CustomRule[] = []
): ClassificationResult {
  // Priority 1: Brand - CFI (DICT)
  const brandEntries = dictionaries.filter(d => d.dict_name === 'brand_terms');
  const brandMatch = matchDictionary(norm, asciiNorm, brandEntries);
  if (brandMatch) {
    return {
      cluster_primary: 'Brand - CFI',
      cluster_secondary: null,
      matched_rule: `DICT:brand_terms:${brandMatch.canonical}`,
      confidence: 1.0,
    };
  }
  
  // Priority 2: Competitors (DICT)
  const competitorEntries = dictionaries.filter(d => d.dict_name === 'competitors');
  const competitorMatch = matchDictionary(norm, asciiNorm, competitorEntries);
  if (competitorMatch) {
    return {
      cluster_primary: 'Competitors',
      cluster_secondary: competitorMatch.canonical,
      matched_rule: `DICT:competitors:${competitorMatch.canonical}`,
      confidence: 1.0,
    };
  }
  
  // Priority 2.5: Custom Rules
  const customMatch = matchCustomRules(norm, asciiNorm, customRules);
  if (customMatch) {
    return {
      cluster_primary: customMatch.targetCluster,
      cluster_secondary: null,
      matched_rule: `CUSTOM_RULE:${customMatch.ruleName}`,
      confidence: 0.85,
    };
  }
  
  // Priority 3: Platform - TradingView
  if (TRADINGVIEW_PATTERN.test(norm) || TRADINGVIEW_PATTERN.test(asciiNorm)) {
    return {
      cluster_primary: 'Platform - TradingView',
      cluster_secondary: null,
      matched_rule: 'REGEX:platform_tradingview',
      confidence: 0.9,
    };
  }
  
  // Priority 4: Platform - MetaTrader
  if (METATRADER_PATTERN.test(norm) || METATRADER_PATTERN.test(asciiNorm)) {
    return {
      cluster_primary: 'Platform - MetaTrader',
      cluster_secondary: null,
      matched_rule: 'REGEX:platform_metatrader',
      confidence: 0.9,
    };
  }
  
  // Priority 5: Crypto
  if (BITCOIN_PATTERN.test(norm) || BITCOIN_PATTERN.test(asciiNorm)) {
    return { cluster_primary: 'Crypto - Bitcoin', cluster_secondary: null, matched_rule: 'REGEX:crypto_bitcoin', confidence: 0.9 };
  }
  if (ETHEREUM_PATTERN.test(norm) || ETHEREUM_PATTERN.test(asciiNorm)) {
    return { cluster_primary: 'Crypto - Ethereum', cluster_secondary: null, matched_rule: 'REGEX:crypto_ethereum', confidence: 0.9 };
  }
  if (STABLECOINS_PATTERN.test(norm) || STABLECOINS_PATTERN.test(asciiNorm)) {
    return { cluster_primary: 'Crypto - Stablecoins', cluster_secondary: null, matched_rule: 'REGEX:crypto_stablecoins', confidence: 0.9 };
  }
  if (ALTCOINS_PATTERN.test(norm) || ALTCOINS_PATTERN.test(asciiNorm)) {
    return { cluster_primary: 'Crypto - Altcoins', cluster_secondary: null, matched_rule: 'REGEX:crypto_altcoins', confidence: 0.9 };
  }
  if (CRYPTO_GENERIC_PATTERN.test(norm) || CRYPTO_GENERIC_PATTERN.test(asciiNorm)) {
    return { cluster_primary: 'Crypto - Generic', cluster_secondary: null, matched_rule: 'REGEX:crypto_generic', confidence: 0.85 };
  }
  
  // Priority 6: Commodities
  if (GOLD_PATTERN.test(norm) || GOLD_PATTERN.test(asciiNorm)) {
    return { cluster_primary: 'Commodity - Gold', cluster_secondary: null, matched_rule: 'REGEX:commodity_gold', confidence: 0.9 };
  }
  if (SILVER_PATTERN.test(norm) || SILVER_PATTERN.test(asciiNorm)) {
    return { cluster_primary: 'Commodity - Silver', cluster_secondary: null, matched_rule: 'REGEX:commodity_silver', confidence: 0.9 };
  }
  if (ENERGY_PATTERN.test(norm) || ENERGY_PATTERN.test(asciiNorm)) {
    return { cluster_primary: 'Commodity - Energy', cluster_secondary: null, matched_rule: 'REGEX:commodity_energy', confidence: 0.9 };
  }
  if (OTHER_METALS_PATTERN.test(norm) || OTHER_METALS_PATTERN.test(asciiNorm)) {
    return { cluster_primary: 'Commodity - Other Metals', cluster_secondary: null, matched_rule: 'REGEX:commodity_other_metals', confidence: 0.85 };
  }
  
  // Priority 7: FX
  if (FX_PAIRS_PATTERN.test(norm) || FX_PAIRS_PATTERN.test(asciiNorm) || FX_PAIR_NOTATION.test(norm)) {
    return { cluster_primary: 'FX - Majors/Minors', cluster_secondary: null, matched_rule: 'REGEX:fx_pairs', confidence: 0.9 };
  }
  if (FX_GENERIC_PATTERN.test(norm) || FX_GENERIC_PATTERN.test(asciiNorm)) {
    return { cluster_primary: 'FX - Majors/Minors', cluster_secondary: null, matched_rule: 'REGEX:fx_generic', confidence: 0.85 };
  }
  
  // Priority 8: Indices
  if (INDICES_PATTERN.test(norm) || INDICES_PATTERN.test(asciiNorm)) {
    return { cluster_primary: 'Indices', cluster_secondary: null, matched_rule: 'REGEX:indices', confidence: 0.9 };
  }
  
  // Priority 9: ETFs
  if (ETFS_PATTERN.test(norm) || ETFS_PATTERN.test(asciiNorm)) {
    return { cluster_primary: 'ETFs', cluster_secondary: null, matched_rule: 'REGEX:etfs', confidence: 0.85 };
  }
  
  // Priority 10: Stocks
  if (STOCKS_SINGLE_NAMES.test(norm) || STOCKS_SINGLE_NAMES.test(asciiNorm)) {
    return { cluster_primary: 'Stocks - Single Names', cluster_secondary: null, matched_rule: 'REGEX:stocks_single', confidence: 0.9 };
  }
  if (STOCKS_GENERIC_PATTERN.test(norm) || STOCKS_GENERIC_PATTERN.test(asciiNorm)) {
    return { cluster_primary: 'Stocks - Generic', cluster_secondary: null, matched_rule: 'REGEX:stocks_generic', confidence: 0.8 };
  }
  
  // Priority 11: AI / Bots / Automation
  if (AI_BOTS_PATTERN.test(norm) || AI_BOTS_PATTERN.test(asciiNorm)) {
    return { cluster_primary: 'AI / Bots / Automation', cluster_secondary: null, matched_rule: 'REGEX:ai_bots', confidence: 0.8 };
  }
  
  // Priority 12: Charts / Analysis
  if (CHARTS_PATTERN.test(norm) || CHARTS_PATTERN.test(asciiNorm)) {
    return { cluster_primary: 'Charts / Analysis', cluster_secondary: null, matched_rule: 'REGEX:charts_analysis', confidence: 0.8 };
  }
  
  // Priority 13: Education / How-To
  if (EDUCATION_PATTERN.test(norm) || EDUCATION_PATTERN.test(asciiNorm)) {
    return { cluster_primary: 'Education / How-To', cluster_secondary: null, matched_rule: 'REGEX:education', confidence: 0.8 };
  }
  
  // Priority 14: App / Download
  if (APP_PATTERN.test(norm) || APP_PATTERN.test(asciiNorm)) {
    return { cluster_primary: 'App / Download', cluster_secondary: null, matched_rule: 'REGEX:app_download', confidence: 0.8 };
  }
  
  // Priority 15: Trading - Generic
  if (TRADING_GENERIC_PATTERN.test(norm) || TRADING_GENERIC_PATTERN.test(asciiNorm)) {
    return { cluster_primary: 'Trading - Generic', cluster_secondary: null, matched_rule: 'REGEX:trading_generic', confidence: 0.7 };
  }
  
  // Priority 16: Other sub-buckets (intent-based)
  if (PRICE_TODAY_PATTERN.test(norm) || PRICE_TODAY_PATTERN.test(asciiNorm)) {
    return { cluster_primary: 'Other - Price/Today', cluster_secondary: null, matched_rule: 'OTHER:price_today', confidence: 0.55 };
  }
  if (NEWS_CALENDAR_PATTERN.test(norm) || NEWS_CALENDAR_PATTERN.test(asciiNorm)) {
    return { cluster_primary: 'Other - News/Calendar', cluster_secondary: null, matched_rule: 'OTHER:news_calendar', confidence: 0.55 };
  }
  if (REGULATION_PATTERN.test(norm) || REGULATION_PATTERN.test(asciiNorm)) {
    return { cluster_primary: 'Other - Regulation/Legal', cluster_secondary: null, matched_rule: 'OTHER:regulation', confidence: 0.55 };
  }
  if (LOGIN_ACCESS_PATTERN.test(norm) || LOGIN_ACCESS_PATTERN.test(asciiNorm)) {
    return { cluster_primary: 'Other - Login/Access', cluster_secondary: null, matched_rule: 'OTHER:login_access', confidence: 0.55 };
  }
  
  // Priority 17: Junk / Noise
  if (JUNK_PATTERN.test(norm) || norm.length < 2) {
    return { cluster_primary: 'Junk / Noise', cluster_secondary: null, matched_rule: 'JUNK', confidence: 0.2 };
  }
  
  // Default: General Longtail
  return {
    cluster_primary: 'Other - General Longtail',
    cluster_secondary: null,
    matched_rule: 'OTHER:general_longtail',
    confidence: 0.4,
  };
}

// =====================================================
// INTENT CLASSIFICATION
// =====================================================

export function classifyIntent(norm: string, asciiNorm: string): IntentResult {
  for (const { intent, pattern } of INTENT_PATTERNS) {
    if (pattern.test(norm) || pattern.test(asciiNorm)) {
      return { intent, matched_pattern: intent };
    }
  }
  
  return { intent: 'generic', matched_pattern: 'generic' };
}

// =====================================================
// TAG COMPUTATION
// =====================================================

export function computeTags(norm: string, asciiNorm: string, language: 'ar' | 'en' | 'mixed'): Tags {
  const tags: Tags = { language };
  
  // Detect asset tags
  if (GOLD_PATTERN.test(norm)) tags.asset_tag = 'gold';
  else if (SILVER_PATTERN.test(norm)) tags.asset_tag = 'silver';
  else if (BITCOIN_PATTERN.test(norm)) tags.asset_tag = 'bitcoin';
  else if (ETHEREUM_PATTERN.test(norm)) tags.asset_tag = 'ethereum';
  else if (ENERGY_PATTERN.test(norm)) tags.asset_tag = 'energy';
  else if (FX_PAIRS_PATTERN.test(norm) || FX_GENERIC_PATTERN.test(norm)) tags.asset_tag = 'fx';
  else if (INDICES_PATTERN.test(norm)) tags.asset_tag = 'indices';
  else if (CRYPTO_GENERIC_PATTERN.test(norm) || ALTCOINS_PATTERN.test(norm) || STABLECOINS_PATTERN.test(norm)) tags.asset_tag = 'crypto';
  
  // Detect platform tags
  if (METATRADER_PATTERN.test(norm)) tags.platform_tag = 'metatrader';
  else if (TRADINGVIEW_PATTERN.test(norm)) tags.platform_tag = 'tradingview';
  
  return tags;
}

// =====================================================
// OPPORTUNITY SCORING
// =====================================================

function parseNumeric(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  
  // Remove currency symbols, commas, percentage signs
  const cleaned = value.replace(/[$€£¥,٪%]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function computeScores(rows: ProcessedKeyword[]): ProcessedKeyword[] {
  // Group by cluster_primary for within-cluster normalization
  const clusterGroups = new Map<string, ProcessedKeyword[]>();
  
  for (const row of rows) {
    const group = clusterGroups.get(row.cluster_primary) || [];
    group.push(row);
    clusterGroups.set(row.cluster_primary, group);
  }
  
  // Compute scores within each cluster
  for (const [, group] of clusterGroups) {
    // Calculate metrics
    const metrics = group.map(row => {
      const clicks = row.clicks || 0;
      const impressions = row.impressions || 0;
      const cost = row.cost || 0;
      const conversions = row.conversions || 0;
      
      const ctr = impressions > 0 ? clicks / impressions : 0;
      const cvr = clicks > 0 ? conversions / clicks : 0;
      const cpa = conversions > 0 ? cost / conversions : Infinity;
      
      return { row, ctr, cvr, cpa, cost };
    });
    
    // Find min/max for normalization
    const ctrs = metrics.map(m => m.ctr);
    const cvrs = metrics.map(m => m.cvr);
    const cpas = metrics.filter(m => m.cpa !== Infinity).map(m => m.cpa);
    
    const minCtr = Math.min(...ctrs);
    const maxCtr = Math.max(...ctrs);
    const minCvr = Math.min(...cvrs);
    const maxCvr = Math.max(...cvrs);
    const minCpa = cpas.length > 0 ? Math.min(...cpas) : 0;
    const maxCpa = cpas.length > 0 ? Math.max(...cpas) : 1;
    
    const hasConversions = metrics.some(m => (m.row.conversions || 0) > 0);
    
    // Compute normalized scores
    for (const m of metrics) {
      const normCtr = maxCtr > minCtr ? (m.ctr - minCtr) / (maxCtr - minCtr) : 0.5;
      const normCvr = maxCvr > minCvr ? (m.cvr - minCvr) / (maxCvr - minCvr) : 0.5;
      const normInvCpa = m.cpa !== Infinity && maxCpa > minCpa 
        ? 1 - (m.cpa - minCpa) / (maxCpa - minCpa) 
        : 0.5;
      
      if (hasConversions) {
        // Full formula: 0.40*CTR + 0.40*CVR + 0.20*(1/CPA)
        m.row.opportunity_score = Math.round((0.4 * normCtr + 0.4 * normCvr + 0.2 * normInvCpa) * 100) / 100;
      } else {
        // CTR-heavy fallback: 0.80*CTR + 0.20*0.5
        m.row.opportunity_score = Math.round((0.8 * normCtr + 0.2 * 0.5) * 100) / 100;
      }
    }
  }
  
  return rows;
}

// =====================================================
// LEAKAGE SUGGESTION BUILDER
// =====================================================

// English stopwords
const EN_STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does',
  'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
  'this', 'that', 'these', 'those', 'what', 'which', 'who', 'whom', 'whose', 'when', 'where',
  'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also',
]);

// Arabic function words
const AR_STOPWORDS = new Set([
  'في', 'من', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'ذلك', 'تلك', 'التي', 'الذي', 'التى',
  'ما', 'هو', 'هي', 'هم', 'هن', 'أنا', 'أنت', 'نحن', 'أنتم', 'كل', 'بعض', 'أي', 'كيف',
  'لماذا', 'متى', 'أين', 'كان', 'كانت', 'يكون', 'تكون', 'و', 'أو', 'ثم', 'لكن', 'بل',
]);

function extractTokens(text: string, language: 'ar' | 'en' | 'mixed'): string[] {
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  
  return words.filter(word => {
    if (language === 'ar' || language === 'mixed') {
      if (containsArabic(word)) {
        return word.length >= 3 && !AR_STOPWORDS.has(word);
      }
    }
    if (language === 'en' || language === 'mixed') {
      return word.length >= 4 && !EN_STOPWORDS.has(word);
    }
    return word.length >= 4;
  });
}

function extractBigrams(tokens: string[]): string[] {
  const bigrams: string[] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    bigrams.push(`${tokens[i]} ${tokens[i + 1]}`);
  }
  return bigrams;
}

export function buildLeakageSuggestions(
  rows: ProcessedKeyword[],
  dictionaries: DictionaryEntry[]
): LeakageSuggestion[] {
  // Filter "Other - General Longtail" rows
  const longtailRows = rows.filter(r => r.cluster_primary === 'Other - General Longtail');
  
  // Sort by cost desc, then clicks desc
  longtailRows.sort((a, b) => {
    const costDiff = (b.cost || 0) - (a.cost || 0);
    if (costDiff !== 0) return costDiff;
    return (b.clicks || 0) - (a.clicks || 0);
  });
  
  // Take top 200
  const topRows = longtailRows.slice(0, 200);
  
  if (topRows.length === 0) return [];
  
  // Extract tokens and bigrams
  const tokenCounts = new Map<string, { count: number; totalCost: number; totalClicks: number; terms: string[] }>();
  const bigramCounts = new Map<string, { count: number; totalCost: number; totalClicks: number; terms: string[] }>();
  
  for (const row of topRows) {
    const { search_term_norm, language } = normalizeTerm(row.keyword);
    const tokens = extractTokens(search_term_norm, language);
    const bigrams = extractBigrams(tokens);
    
    for (const token of tokens) {
      const existing = tokenCounts.get(token) || { count: 0, totalCost: 0, totalClicks: 0, terms: [] };
      existing.count++;
      existing.totalCost += row.cost || 0;
      existing.totalClicks += row.clicks || 0;
      if (existing.terms.length < 5) existing.terms.push(row.keyword);
      tokenCounts.set(token, existing);
    }
    
    for (const bigram of bigrams) {
      const existing = bigramCounts.get(bigram) || { count: 0, totalCost: 0, totalClicks: 0, terms: [] };
      existing.count++;
      existing.totalCost += row.cost || 0;
      existing.totalClicks += row.clicks || 0;
      if (existing.terms.length < 5) existing.terms.push(row.keyword);
      bigramCounts.set(bigram, existing);
    }
  }
  
  const suggestions: LeakageSuggestion[] = [];
  
  // Get existing aliases for comparison
  const existingAliases = new Set(dictionaries.map(d => d.alias.toLowerCase()));
  const existingCanonicals = new Set(dictionaries.map(d => d.canonical.toLowerCase()));
  
  // Analyze tokens
  for (const [token, data] of tokenCounts) {
    if (data.count < 3) continue; // Must appear in at least 3 terms
    
    // Check if it looks like a competitor (domain-like or brand-like)
    const looksLikeDomain = /\.(com|net|org|io|co)$/i.test(token) || token.includes('.');
    const looksLikeBrand = token.length >= 4 && !EN_STOPWORDS.has(token) && /^[a-z]+$/i.test(token);
    
    // Check for near-matches to existing entries
    for (const canonical of existingCanonicals) {
      const similarity = token.includes(canonical) || canonical.includes(token);
      if (similarity && !existingAliases.has(token)) {
        suggestions.push({
          suggestion_type: 'alias_candidate',
          extracted_phrase: token,
          evidence_terms: data.terms,
          evidence_cost: data.totalCost,
          evidence_clicks: data.totalClicks,
          proposed_dict_name: 'competitors',
          proposed_canonical: canonical,
          proposed_alias: token,
        });
        break;
      }
    }
    
    // New dictionary candidate
    if ((looksLikeDomain || looksLikeBrand) && !existingAliases.has(token) && data.count >= 5) {
      suggestions.push({
        suggestion_type: 'dictionary_candidate',
        extracted_phrase: token,
        evidence_terms: data.terms,
        evidence_cost: data.totalCost,
        evidence_clicks: data.totalClicks,
        proposed_dict_name: 'competitors',
        proposed_canonical: token,
        proposed_alias: token,
      });
    }
  }
  
  // Analyze bigrams for rule candidates
  for (const [bigram, data] of bigramCounts) {
    if (data.count < 3) continue;
    
    // Check if bigram maps to a known cluster pattern
    const { search_term_norm } = normalizeTerm(bigram);
    
    // See if this bigram would match a cluster if processed standalone
    if (GOLD_PATTERN.test(search_term_norm) || BITCOIN_PATTERN.test(search_term_norm) || 
        FX_GENERIC_PATTERN.test(search_term_norm) || CRYPTO_GENERIC_PATTERN.test(search_term_norm)) {
      suggestions.push({
        suggestion_type: 'new_rule_candidate',
        extracted_phrase: bigram,
        evidence_terms: data.terms,
        evidence_cost: data.totalCost,
        evidence_clicks: data.totalClicks,
      });
    }
  }
  
  // Sort by evidence cost (highest first)
  suggestions.sort((a, b) => b.evidence_cost - a.evidence_cost);
  
  // Limit to top 50 suggestions
  return suggestions.slice(0, 50);
}

// =====================================================
// MAIN PROCESSING FUNCTION
// =====================================================

export function processKeywords(
  csvText: string,
  dictionaries: DictionaryEntry[],
  customRules: CustomRule[] = []
): {
  rows: ProcessedKeyword[];
  parseResult: CsvParseResult;
  leakageSuggestions: LeakageSuggestion[];
} {
  // Parse and clean CSV
  const parseResult = parseAndCleanCsv(csvText);
  
  if (parseResult.cleanRows.length === 0) {
    return { rows: [], parseResult, leakageSuggestions: [] };
  }
  
  // Process each row
  const rows: ProcessedKeyword[] = parseResult.cleanRows.map(rawRow => {
    const keyword = rawRow.search_term;
    const { search_term_norm, search_term_norm_ascii, language } = normalizeTerm(keyword);
    
    // Classify primary cluster
    const classification = classifyPrimary(search_term_norm, search_term_norm_ascii, dictionaries, customRules);
    
    // Classify intent
    const { intent } = classifyIntent(search_term_norm, search_term_norm_ascii);
    
    // Compute tags
    const tags = computeTags(search_term_norm, search_term_norm_ascii, language);
    
    return {
      keyword,
      clicks: parseNumeric(rawRow.clicks),
      impressions: parseNumeric(rawRow.impressions),
      ctr: parseNumeric(rawRow.ctr) || null,
      cost: parseNumeric(rawRow.cost) || null,
      conversions: parseNumeric(rawRow.conversions) || null,
      campaign: rawRow.campaign || null,
      ad_group: rawRow.ad_group || null,
      match_type: rawRow.match_type || null,
      
      cluster_primary: classification.cluster_primary,
      cluster_secondary: classification.cluster_secondary,
      intent,
      matched_rule: classification.matched_rule,
      confidence: classification.confidence,
      tags,
      opportunity_score: null, // Will be computed next
      
      search_term_norm,
      search_term_norm_ascii,
    };
  });
  
  // Compute opportunity scores
  const scoredRows = computeScores(rows);
  
  // Build leakage suggestions
  const leakageSuggestions = buildLeakageSuggestions(scoredRows, dictionaries);
  
  return {
    rows: scoredRows,
    parseResult,
    leakageSuggestions,
  };
}
