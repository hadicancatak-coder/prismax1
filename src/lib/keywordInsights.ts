/**
 * Keyword Insights Engine
 * 
 * Deterministic computation of unified actions for Google Ads.
 * Focuses on detecting STRUCTURAL MISMATCHES (keywords in wrong ad groups)
 * and only adding negatives for truly irrelevant terms.
 */

import { ProcessedKeyword, normalizeTerm } from './keywordEngine';

// =====================================================
// CONFIGURATION PRESETS
// =====================================================

export type InsightsPreset = 'conservative' | 'balanced' | 'aggressive';

export interface InsightsConfig {
  minCostForReview: number;           // Min cost to even consider a term
  wastedSpendThreshold: number;       // Cost with 0 conversions = "wasted"
  minCostForNegative: number;         // Min cost before suggesting negative
}

export const INSIGHTS_PRESETS: Record<InsightsPreset, InsightsConfig> = {
  conservative: {
    minCostForReview: 50,
    wastedSpendThreshold: 200,
    minCostForNegative: 100,
  },
  balanced: {
    minCostForReview: 20,
    wastedSpendThreshold: 100,
    minCostForNegative: 50,
  },
  aggressive: {
    minCostForReview: 10,
    wastedSpendThreshold: 50,
    minCostForNegative: 20,
  },
};

export const DEFAULT_INSIGHTS_CONFIG = INSIGHTS_PRESETS.balanced;

// =====================================================
// UNIFIED ACTION TYPE
// =====================================================

export interface UnifiedAction {
  id: string;
  search_term: string;
  current_campaign: string | null;
  current_ad_group: string | null;
  action_type: 'add_negative' | 'move_term' | 'create_ad_group';
  target: string;              // Where to move / which AG to add negative
  reason: string;              // Simple 1-line explanation
  estimated_savings: number;
  cost: number;
  clicks: number;
  conversions: number;
  cpa: number | null;
  cluster: string;             // Keyword's detected cluster
}

// =====================================================
// EXECUTIVE SUMMARY
// =====================================================

export interface ExecutiveSummary {
  bullets: { icon: 'red' | 'yellow' | 'green'; text: string }[];
  totalSpend: number;
  totalWasted: number;
  totalMisplacedSpend: number;
  totalActions: number;
  moveActions: number;
  negativeActions: number;
}

// =====================================================
// CONFIDENCE STATS
// =====================================================

export interface ConfidenceStats {
  dictionaryMatched: number;
  regexMatched: number;
  otherMatched: number;
  totalTerms: number;
  dictionaryPercent: number;
  regexPercent: number;
  otherPercent: number;
}

export function computeConfidenceStats(keywords: ProcessedKeyword[]): ConfidenceStats {
  let dictionaryMatched = 0;
  let regexMatched = 0;
  let otherMatched = 0;

  for (const kw of keywords) {
    if (kw.confidence >= 1.0 || kw.matched_rule.startsWith('DICT:')) {
      dictionaryMatched++;
    } else if (kw.confidence >= 0.9 || kw.matched_rule.startsWith('REGEX:')) {
      regexMatched++;
    } else {
      otherMatched++;
    }
  }

  const total = keywords.length || 1;
  return {
    dictionaryMatched,
    regexMatched,
    otherMatched,
    totalTerms: keywords.length,
    dictionaryPercent: (dictionaryMatched / total) * 100,
    regexPercent: (regexMatched / total) * 100,
    otherPercent: (otherMatched / total) * 100,
  };
}

// =====================================================
// AD GROUP INTENT DETECTION
// =====================================================

interface AdGroupIntent {
  expectedClusters: string[];  // Clusters that belong in this ad group
  label: string;               // Human-readable label for the ad group intent
}

/**
 * Parse an ad group name to understand what cluster/topic it's meant to target.
 * This helps detect when keywords are in the WRONG ad group.
 */
function parseAdGroupIntent(agName: string): AdGroupIntent | null {
  if (!agName) return null;
  
  const norm = agName.toLowerCase().trim();
  
  // Commodity - Gold variations
  if (/\b(gold|xau|xauusd)\b/i.test(norm)) {
    return { expectedClusters: ['Commodity - Gold', 'Gold', 'XAU'], label: 'Gold' };
  }
  
  // Commodity - Silver
  if (/\b(silver|xag)\b/i.test(norm)) {
    return { expectedClusters: ['Commodity - Silver', 'Silver', 'XAG'], label: 'Silver' };
  }
  
  // Commodity - Oil
  if (/\b(oil|crude|wti|brent)\b/i.test(norm)) {
    return { expectedClusters: ['Commodity - Oil', 'Oil', 'Crude', 'WTI', 'Brent'], label: 'Oil' };
  }
  
  // Crypto - Bitcoin
  if (/\b(bitcoin|btc)\b/i.test(norm) && !/\b(eth|ethereum|crypto)\b/i.test(norm)) {
    return { expectedClusters: ['Crypto - Bitcoin', 'Bitcoin', 'BTC', 'Crypto'], label: 'Bitcoin' };
  }
  
  // Crypto - Ethereum
  if (/\b(ethereum|eth)\b/i.test(norm)) {
    return { expectedClusters: ['Crypto - Ethereum', 'Ethereum', 'ETH', 'Crypto'], label: 'Ethereum' };
  }
  
  // Crypto - General
  if (/\b(crypto|cryptocurrency)\b/i.test(norm)) {
    return { expectedClusters: ['Crypto', 'Crypto - Bitcoin', 'Crypto - Ethereum', 'Bitcoin', 'Ethereum'], label: 'Crypto' };
  }
  
  // Platform - TradingView
  if (/\b(tradingview|trading\s*view)\b/i.test(norm)) {
    return { expectedClusters: ['Platform - TradingView', 'TradingView'], label: 'TradingView' };
  }
  
  // Platform - MetaTrader
  if (/\b(metatrader|mt4|mt5)\b/i.test(norm)) {
    return { expectedClusters: ['Platform - MetaTrader', 'MetaTrader', 'MT4', 'MT5'], label: 'MetaTrader' };
  }
  
  // FX - Major pairs
  if (/\b(forex|fx|eurusd|gbpusd|usdjpy|currency)\b/i.test(norm)) {
    return { expectedClusters: ['FX - Majors', 'FX', 'Forex', 'Currency'], label: 'Forex' };
  }
  
  // Stocks
  if (/\b(stock|stocks|shares|equities)\b/i.test(norm)) {
    return { expectedClusters: ['Stocks', 'Equities', 'Shares'], label: 'Stocks' };
  }
  
  // Indices
  if (/\b(index|indices|sp500|nasdaq|dow|dax)\b/i.test(norm)) {
    return { expectedClusters: ['Indices', 'Index', 'SP500', 'NASDAQ'], label: 'Indices' };
  }
  
  // Competitors
  if (/\b(competitor|etoro|plus500|xtb|ig\s*market|avatrade)\b/i.test(norm)) {
    return { expectedClusters: ['Competitors', 'Competitor'], label: 'Competitors' };
  }
  
  // Brand
  if (/\b(brand|branded)\b/i.test(norm)) {
    return { expectedClusters: ['Brand', 'Branded'], label: 'Brand' };
  }
  
  return null; // No clear intent detected
}

/**
 * Check if a keyword's cluster matches the ad group's expected clusters.
 */
function isClusterMatch(kwCluster: string, agIntent: AdGroupIntent): boolean {
  const kwNorm = kwCluster.toLowerCase();
  
  // Check against all expected clusters
  for (const expected of agIntent.expectedClusters) {
    const expNorm = expected.toLowerCase();
    
    // Exact match
    if (kwNorm === expNorm) return true;
    
    // Substring match (e.g., "Commodity - Gold" contains "Gold")
    if (kwNorm.includes(expNorm) || expNorm.includes(kwNorm)) return true;
    
    // Word-level match
    const kwWords = kwNorm.split(/[\s\-–—]+/).filter(Boolean);
    const expWords = expNorm.split(/[\s\-–—]+/).filter(Boolean);
    
    for (const kw of kwWords) {
      for (const ew of expWords) {
        if (kw.length > 2 && ew.length > 2 && (kw === ew || kw.includes(ew) || ew.includes(kw))) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// =====================================================
// INTENT DETECTION HELPERS
// =====================================================

const NO_MONEY_PATTERNS_EN = /\b(free\s+signals?|free\s+trading|free\s+forex|free\s+crypto|earn\s+money|make\s+money|money\s+make|how\s+to\s+earn|no\s+deposit\s+bonus|without\s+deposit|no\s+investment|earn\s+from\s+home|work\s+from\s+home|passive\s+income|get\s+rich\s+quick)\b/i;
const NO_MONEY_PATTERNS_AR = /ربح|ربح المال|كسب المال|فلوس|بدون رأس مال|بدون ايداع|بدون استثمار|مجانا|مجاني|اربح|كسب/;

/** Truly worthless "no-money" intent - should always be negative */
export function isNoMoneyIntent(norm: string, asciiNorm: string): boolean {
  return NO_MONEY_PATTERNS_EN.test(asciiNorm) || NO_MONEY_PATTERNS_AR.test(norm);
}

/** Competitor login/app - negative unless in competitor campaign */
function isCompetitorLogin(searchTerm: string): boolean {
  const norm = searchTerm.toLowerCase();
  const competitors = ['etoro', 'plus500', 'xtb', 'ig markets', 'avatrade', 'pepperstone', 'fxcm', 'oanda', 'xm', 'fxpro'];
  const loginPatterns = ['login', 'sign in', 'log in', 'signin', 'app download', 'download app', 'app'];
  
  return competitors.some(comp => norm.includes(comp)) && 
         loginPatterns.some(login => norm.includes(login));
}

/** Random junk/typos that shouldn't convert */
function isJunkTerm(searchTerm: string): boolean {
  const norm = searchTerm.toLowerCase().replace(/\s+/g, '');
  
  // Very short
  if (norm.length < 3) return true;
  
  // Just numbers
  if (/^\d+$/.test(norm)) return true;
  
  // Keyboard mashing patterns
  if (/^[asdfghjkl]+$/i.test(norm) && norm.length > 4) return true;
  if (/^[qwertyuiop]+$/i.test(norm) && norm.length > 4) return true;
  
  return false;
}

const LOW_INTENT_INTENTS = ['login_access', 'news_calendar', 'how_to_education', 'informational', 'navigational_other'];

export function isLowIntent(intent: string): boolean {
  return LOW_INTENT_INTENTS.includes(intent?.toLowerCase() || '');
}

// =====================================================
// COMPUTE UNIFIED ACTIONS - Fixed logic!
// =====================================================

export function computeUnifiedActions(
  keywords: ProcessedKeyword[],
  config: InsightsConfig = DEFAULT_INSIGHTS_CONFIG
): UnifiedAction[] {
  const actions: UnifiedAction[] = [];
  const seenTerms = new Set<string>();

  // Build ad group intent map once
  const adGroupIntents = new Map<string, AdGroupIntent | null>();
  
  for (const kw of keywords) {
    const agKey = kw.ad_group || '';
    if (!adGroupIntents.has(agKey)) {
      adGroupIntents.set(agKey, parseAdGroupIntent(agKey));
    }
  }

  for (const kw of keywords) {
    const norm = normalizeTerm(kw.keyword);
    const termKey = norm.search_term_norm;
    
    // Dedupe by normalized term
    if (seenTerms.has(termKey)) continue;
    seenTerms.add(termKey);

    const cost = kw.cost || 0;
    const clicks = kw.clicks;
    const conversions = kw.conversions || 0;
    const cpa = conversions > 0 ? cost / conversions : null;
    const cluster = kw.cluster_primary || 'Uncategorized';
    const campaign = kw.campaign || null;
    const adGroup = kw.ad_group || null;
    const searchTerm = kw.keyword;

    // Skip low-cost terms (not worth optimizing)
    if (cost < config.minCostForReview) continue;

    // ─────────────────────────────────────────────────────────────────
    // Priority 1: Add Negative for TRULY bad terms
    // ─────────────────────────────────────────────────────────────────

    // 1a. No-money intent (free signals, earn money, etc.)
    if (isNoMoneyIntent(norm.search_term_norm, norm.search_term_norm_ascii)) {
      actions.push({
        id: `neg-nomoney-${actions.length}`,
        search_term: searchTerm,
        current_campaign: campaign,
        current_ad_group: adGroup,
        action_type: 'add_negative',
        target: campaign || 'Account',
        reason: 'No-money intent (free/earn patterns)',
        estimated_savings: cost,
        cost,
        clicks,
        conversions,
        cpa,
        cluster,
      });
      continue;
    }

    // 1b. Competitor login/app (unless in competitor campaign)
    if (isCompetitorLogin(searchTerm)) {
      const isCompetitorCampaign = campaign?.toLowerCase().includes('competitor') || 
                                    adGroup?.toLowerCase().includes('competitor') ||
                                    cluster.toLowerCase().includes('competitor');
      if (!isCompetitorCampaign) {
        actions.push({
          id: `neg-complogin-${actions.length}`,
          search_term: searchTerm,
          current_campaign: campaign,
          current_ad_group: adGroup,
          action_type: 'add_negative',
          target: campaign || 'Account',
          reason: 'Competitor login/app (not in competitor campaign)',
          estimated_savings: cost * 0.9,
          cost,
          clicks,
          conversions,
          cpa,
          cluster,
        });
        continue;
      }
    }

    // 1c. Junk/typo terms
    if (isJunkTerm(searchTerm)) {
      actions.push({
        id: `neg-junk-${actions.length}`,
        search_term: searchTerm,
        current_campaign: campaign,
        current_ad_group: adGroup,
        action_type: 'add_negative',
        target: campaign || 'Account',
        reason: 'Junk/typo term',
        estimated_savings: cost,
        cost,
        clicks,
        conversions,
        cpa,
        cluster,
      });
      continue;
    }

    // ─────────────────────────────────────────────────────────────────
    // Priority 2: Move Term if keyword cluster doesn't match ad group intent
    // This is the KEY improvement - detect structural mismatches!
    // ─────────────────────────────────────────────────────────────────

    const agIntent = adGroupIntents.get(adGroup || '');
    
    if (agIntent && !isClusterMatch(cluster, agIntent)) {
      // This is a structural mismatch - keyword is in wrong ad group!
      actions.push({
        id: `move-mismatch-${actions.length}`,
        search_term: searchTerm,
        current_campaign: campaign,
        current_ad_group: adGroup,
        action_type: 'move_term',
        target: `${cluster} AG`,
        reason: `"${cluster}" keyword in "${agIntent.label}" ad group`,
        estimated_savings: 0, // Not wasted, just misplaced
        cost,
        clicks,
        conversions,
        cpa,
        cluster,
      });
      continue;
    }

    // ─────────────────────────────────────────────────────────────────
    // Priority 3: High wasted spend with zero conversions + low intent
    // Only flag as negative if it's truly informational AND high cost
    // ─────────────────────────────────────────────────────────────────

    if (cost >= config.wastedSpendThreshold && conversions === 0) {
      const intent = kw.intent || '';
      
      // Only add negative if it's low-intent (informational, login, etc.)
      if (isLowIntent(intent)) {
        actions.push({
          id: `neg-wasted-${actions.length}`,
          search_term: searchTerm,
          current_campaign: campaign,
          current_ad_group: adGroup,
          action_type: 'add_negative',
          target: adGroup || campaign || 'Account',
          reason: `High cost ($${cost.toFixed(0)}) + 0 conversions + low intent`,
          estimated_savings: cost * 0.8,
          cost,
          clicks,
          conversions,
          cpa,
          cluster,
        });
      }
      // If high intent but no conversions, don't auto-negative - could be landing page issue
    }
  }

  // Sort by cost descending (biggest opportunities first)
  return actions.sort((a, b) => b.cost - a.cost);
}

// =====================================================
// EXECUTIVE SUMMARY - Plain bullets
// =====================================================

export function generateExecutiveSummary(
  keywords: ProcessedKeyword[],
  actions: UnifiedAction[]
): ExecutiveSummary {
  const totalSpend = keywords.reduce((s, k) => s + (k.cost || 0), 0);
  
  const negatives = actions.filter(a => a.action_type === 'add_negative');
  const moves = actions.filter(a => a.action_type === 'move_term');
  
  const totalWasted = negatives.reduce((s, a) => s + a.estimated_savings, 0);
  const totalMisplacedSpend = moves.reduce((s, a) => s + a.cost, 0);
  
  const bullets: ExecutiveSummary['bullets'] = [];

  // Misplaced keywords are the MOST important finding
  if (moves.length > 0) {
    const topMismatches = moves.slice(0, 3);
    bullets.push({
      icon: 'yellow',
      text: `🔄 ${moves.length} keywords in wrong ad groups ($${totalMisplacedSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}) — ` +
            `e.g., ${topMismatches.map(m => `"${m.search_term.slice(0, 20)}${m.search_term.length > 20 ? '...' : ''}" → ${m.target}`).join(', ')}`,
    });
  }

  // Negative candidates
  if (totalWasted > 0) {
    // Group by reason type
    const noMoney = negatives.filter(n => n.reason.includes('No-money'));
    const competitor = negatives.filter(n => n.reason.includes('Competitor'));
    const junk = negatives.filter(n => n.reason.includes('Junk'));
    const wasted = negatives.filter(n => n.reason.includes('High cost'));
    
    let reasonParts: string[] = [];
    if (noMoney.length > 0) reasonParts.push(`${noMoney.length} no-money`);
    if (competitor.length > 0) reasonParts.push(`${competitor.length} competitor login`);
    if (junk.length > 0) reasonParts.push(`${junk.length} junk`);
    if (wasted.length > 0) reasonParts.push(`${wasted.length} high-cost-zero-conv`);
    
    bullets.push({
      icon: 'red',
      text: `❌ $${totalWasted.toLocaleString(undefined, { maximumFractionDigits: 0 })} wasted → add ${negatives.length} negatives (${reasonParts.join(', ')})`,
    });
  }

  // Cluster breakdown for misplaced keywords
  if (moves.length > 0) {
    const clusterCounts = moves.reduce((acc, m) => {
      acc[m.cluster] = (acc[m.cluster] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topClusters = Object.entries(clusterCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cluster, count]) => `${cluster} (${count})`);
    
    bullets.push({
      icon: 'yellow',
      text: `📊 Most misplaced clusters: ${topClusters.join(', ')}`,
    });
  }

  // Find uncategorized spend
  const uncategorizedSpend = keywords
    .filter(k => k.cluster_primary?.startsWith('Other') || k.cluster_primary === 'Junk / Noise' || k.cluster_primary === 'Uncategorized')
    .reduce((s, k) => s + (k.cost || 0), 0);
  
  if (uncategorizedSpend > 100) {
    bullets.push({
      icon: 'yellow',
      text: `❓ $${uncategorizedSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })} spent on uncategorized terms → review and classify`,
    });
  }

  if (bullets.length === 0) {
    bullets.push({
      icon: 'green',
      text: '✅ Account structure looks healthy. No major issues found.',
    });
  }

  return {
    bullets,
    totalSpend,
    totalWasted,
    totalMisplacedSpend,
    totalActions: actions.length,
    moveActions: moves.length,
    negativeActions: negatives.length,
  };
}

// =====================================================
// CSV EXPORTS
// =====================================================

export function exportUnifiedActionsCSV(actions: UnifiedAction[]): string {
  const headers = [
    'action_type',
    'search_term',
    'current_campaign',
    'current_ad_group',
    'target',
    'cluster',
    'reason',
    'cost',
    'clicks',
    'conversions',
    'cpa',
    'estimated_savings',
  ];

  const rows = actions.map(a => [
    a.action_type === 'move_term' ? 'Move' : 'Add Negative',
    `"${a.search_term.replace(/"/g, '""')}"`,
    `"${(a.current_campaign || '').replace(/"/g, '""')}"`,
    `"${(a.current_ad_group || '').replace(/"/g, '""')}"`,
    `"${a.target.replace(/"/g, '""')}"`,
    `"${(a.cluster || '').replace(/"/g, '""')}"`,
    `"${a.reason.replace(/"/g, '""')}"`,
    a.cost.toFixed(2),
    a.clicks.toString(),
    a.conversions.toString(),
    a.cpa !== null ? a.cpa.toFixed(2) : '',
    a.estimated_savings.toFixed(2),
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

export function exportNegativesOnlyCSV(actions: UnifiedAction[]): string {
  const negatives = actions.filter(a => a.action_type === 'add_negative');
  
  const headers = [
    'negative_keyword',
    'campaign',
    'ad_group',
    'match_type',
    'reason',
    'cost',
  ];

  const rows = negatives.map(n => [
    `"${n.search_term.replace(/"/g, '""')}"`,
    `"${(n.current_campaign || '').replace(/"/g, '""')}"`,
    `"${(n.current_ad_group || '').replace(/"/g, '""')}"`,
    'Exact',
    `"${n.reason.replace(/"/g, '""')}"`,
    n.cost.toFixed(2),
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

export function exportMovesOnlyCSV(actions: UnifiedAction[]): string {
  const moves = actions.filter(a => a.action_type === 'move_term');
  
  const headers = [
    'search_term',
    'current_campaign',
    'current_ad_group',
    'move_to',
    'cluster',
    'reason',
    'cost',
    'conversions',
  ];

  const rows = moves.map(m => [
    `"${m.search_term.replace(/"/g, '""')}"`,
    `"${(m.current_campaign || '').replace(/"/g, '""')}"`,
    `"${(m.current_ad_group || '').replace(/"/g, '""')}"`,
    `"${m.target.replace(/"/g, '""')}"`,
    `"${(m.cluster || '').replace(/"/g, '""')}"`,
    `"${m.reason.replace(/"/g, '""')}"`,
    m.cost.toFixed(2),
    m.conversions.toString(),
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

// =====================================================
// CLUSTER KPI (kept for cluster tab)
// =====================================================

export interface ClusterKPI {
  name: string;
  spend: number;
  clicks: number;
  conversions: number;
  impressions: number;
  cpa: number | null;
  ctr: number;
  percentOfSpend: number;
}

export function computeClusterKPIs(keywords: ProcessedKeyword[]): ClusterKPI[] {
  const clusterMap = new Map<string, ProcessedKeyword[]>();
  let totalSpend = 0;

  for (const kw of keywords) {
    const cluster = kw.cluster_primary;
    if (!clusterMap.has(cluster)) clusterMap.set(cluster, []);
    clusterMap.get(cluster)!.push(kw);
    totalSpend += kw.cost || 0;
  }

  const results: ClusterKPI[] = [];

  for (const [name, kwList] of clusterMap) {
    const spend = kwList.reduce((s, k) => s + (k.cost || 0), 0);
    const clicks = kwList.reduce((s, k) => s + k.clicks, 0);
    const conversions = kwList.reduce((s, k) => s + (k.conversions || 0), 0);
    const impressions = kwList.reduce((s, k) => s + k.impressions, 0);

    results.push({
      name,
      spend,
      clicks,
      conversions,
      impressions,
      cpa: conversions > 0 ? spend / conversions : null,
      ctr: impressions > 0 ? clicks / impressions : 0,
      percentOfSpend: totalSpend > 0 ? (spend / totalSpend) * 100 : 0,
    });
  }

  return results.sort((a, b) => b.spend - a.spend);
}
