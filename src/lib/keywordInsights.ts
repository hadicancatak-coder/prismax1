/**
 * Keyword Insights Engine
 * 
 * Deterministic computation of unified actions for Google Ads.
 * Simplified for a Google Search person to understand and execute.
 */

import { ProcessedKeyword, normalizeTerm } from './keywordEngine';

// =====================================================
// CONFIGURATION PRESETS
// =====================================================

export type InsightsPreset = 'conservative' | 'balanced' | 'aggressive';

export interface InsightsConfig {
  minCostForNewAdGroup: number;
  minClicksForNewAdGroup: number;
  purityThreshold: number;
  maxCPA: number;
  minCostForNegative: number;
  lowIntentHandling: 'exclude' | 'isolate';
}

export const INSIGHTS_PRESETS: Record<InsightsPreset, InsightsConfig> = {
  conservative: {
    minCostForNewAdGroup: 500,
    minClicksForNewAdGroup: 500,
    purityThreshold: 0.60,
    maxCPA: 800,
    minCostForNegative: 100,
    lowIntentHandling: 'exclude',
  },
  balanced: {
    minCostForNewAdGroup: 300,
    minClicksForNewAdGroup: 200,
    purityThreshold: 0.70,
    maxCPA: 500,
    minCostForNegative: 50,
    lowIntentHandling: 'exclude',
  },
  aggressive: {
    minCostForNewAdGroup: 100,
    minClicksForNewAdGroup: 100,
    purityThreshold: 0.80,
    maxCPA: 300,
    minCostForNegative: 20,
    lowIntentHandling: 'isolate',
  },
};

export const DEFAULT_INSIGHTS_CONFIG = INSIGHTS_PRESETS.balanced;

// =====================================================
// UNIFIED ACTION TYPE - Simplified!
// =====================================================

export interface UnifiedAction {
  id: string;
  search_term: string;
  current_campaign: string | null;
  current_ad_group: string | null;
  action_type: 'add_negative' | 'move_term' | 'create_ad_group';
  target: string; // Where to add negative / move to / new AG name
  reason: string; // Simple 1-line explanation
  estimated_savings: number;
  cost: number;
  clicks: number;
  conversions: number;
  cpa: number | null;
}

// =====================================================
// EXECUTIVE SUMMARY - Plain English bullets
// =====================================================

export interface ExecutiveSummary {
  bullets: { icon: 'red' | 'yellow' | 'green'; text: string }[];
  totalSpend: number;
  totalWasted: number;
  totalActions: number;
}

// =====================================================
// CONFIDENCE STATS
// =====================================================

export interface ConfidenceStats {
  dictionaryMatched: number; // confidence = 1.0
  regexMatched: number; // confidence >= 0.9
  otherMatched: number; // confidence < 0.9
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
// NO-MONEY INTENT PATTERNS
// =====================================================

const NO_MONEY_PATTERNS_EN = /\b(free|earn money|make money|money make|how to earn|free signals|free course|no deposit|without deposit|no investment|earn from home|work from home|passive income)\b/i;
const NO_MONEY_PATTERNS_AR = /ربح|ربح المال|كسب المال|فلوس|بدون رأس مال|بدون ايداع|بدون استثمار|مجانا|مجاني|اربح|كسب/;

export function isNoMoneyIntent(norm: string, asciiNorm: string): boolean {
  return NO_MONEY_PATTERNS_EN.test(asciiNorm) || NO_MONEY_PATTERNS_AR.test(norm);
}

const LOW_INTENT_INTENTS = ['login_access', 'news_calendar', 'how_to_education'];

export function isLowIntent(intent: string): boolean {
  return LOW_INTENT_INTENTS.includes(intent);
}

// =====================================================
// COMPUTE UNIFIED ACTIONS - One list to rule them all
// =====================================================

export function computeUnifiedActions(
  keywords: ProcessedKeyword[],
  config: InsightsConfig
): UnifiedAction[] {
  const actions: UnifiedAction[] = [];
  const seenTerms = new Set<string>();

  // Build ad group dominant cluster map
  const adGroupCosts = new Map<string, Map<string, number>>();
  for (const kw of keywords) {
    const ag = kw.ad_group || 'Unmapped';
    if (!adGroupCosts.has(ag)) adGroupCosts.set(ag, new Map());
    const clusterMap = adGroupCosts.get(ag)!;
    clusterMap.set(kw.cluster_primary, (clusterMap.get(kw.cluster_primary) || 0) + (kw.cost || 0));
  }
  
  const adGroupDominant = new Map<string, string>();
  for (const [ag, clusterMap] of adGroupCosts) {
    let maxCost = 0;
    let dominant = 'Other';
    for (const [cluster, cost] of clusterMap) {
      if (cost > maxCost) {
        maxCost = cost;
        dominant = cluster;
      }
    }
    adGroupDominant.set(ag, dominant);
  }

  for (const kw of keywords) {
    const norm = normalizeTerm(kw.keyword);
    const termKey = norm.search_term_norm;
    if (seenTerms.has(termKey)) continue;
    seenTerms.add(termKey);

    const cost = kw.cost || 0;
    const clicks = kw.clicks;
    const conversions = kw.conversions || 0;
    const cpa = conversions > 0 ? cost / conversions : null;

    // 1) NO-MONEY INTENT → Add Negative (campaign level)
    if (isNoMoneyIntent(norm.search_term_norm, norm.search_term_norm_ascii)) {
      actions.push({
        id: `neg-nomoney-${actions.length}`,
        search_term: kw.keyword,
        current_campaign: kw.campaign,
        current_ad_group: kw.ad_group,
        action_type: 'add_negative',
        target: kw.campaign || 'All campaigns',
        reason: 'No-money intent: users looking for free money/signals',
        estimated_savings: cost,
        cost,
        clicks,
        conversions,
        cpa,
      });
      continue;
    }

    // 2) LOGIN INTENT in non-competitor campaigns → Add Negative
    if (kw.intent === 'login_access' && cost >= config.minCostForNegative) {
      const isCompetitor = kw.cluster_primary === 'Competitors';
      if (!isCompetitor) {
        actions.push({
          id: `neg-login-${actions.length}`,
          search_term: kw.keyword,
          current_campaign: kw.campaign,
          current_ad_group: kw.ad_group,
          action_type: 'add_negative',
          target: kw.ad_group || kw.campaign || 'Account',
          reason: 'Login intent: users trying to access existing accounts',
          estimated_savings: cost * 0.8, // Estimate 80% is wasted
          cost,
          clicks,
          conversions,
          cpa,
        });
        continue;
      }
    }

    // 3) HIGH COST + ZERO CONVERSIONS → Add Negative
    if (cost >= 500 && conversions === 0) {
      actions.push({
        id: `neg-perf-${actions.length}`,
        search_term: kw.keyword,
        current_campaign: kw.campaign,
        current_ad_group: kw.ad_group,
        action_type: 'add_negative',
        target: kw.ad_group || kw.campaign || 'Account',
        reason: `$${cost.toFixed(0)} spent with 0 conversions`,
        estimated_savings: cost,
        cost,
        clicks,
        conversions,
        cpa,
      });
      continue;
    }

    // 4) CPA > THRESHOLD → Add Negative
    if (cpa !== null && cpa > config.maxCPA && cost >= config.minCostForNegative) {
      actions.push({
        id: `neg-cpa-${actions.length}`,
        search_term: kw.keyword,
        current_campaign: kw.campaign,
        current_ad_group: kw.ad_group,
        action_type: 'add_negative',
        target: kw.ad_group || kw.campaign || 'Account',
        reason: `CPA $${cpa.toFixed(0)} exceeds $${config.maxCPA} target`,
        estimated_savings: cost * 0.5,
        cost,
        clicks,
        conversions,
        cpa,
      });
      continue;
    }

    // 5) CLUSTER MISMATCH → Move term
    const agName = kw.ad_group || 'Unmapped';
    const dominant = adGroupDominant.get(agName);
    if (dominant && kw.cluster_primary !== dominant && cost >= config.minCostForNegative) {
      // Skip low-intent if configured
      if (isLowIntent(kw.intent) && config.lowIntentHandling === 'exclude') continue;

      const proposedAg = `AG | ${kw.cluster_primary} | ${kw.intent}`;
      actions.push({
        id: `move-${actions.length}`,
        search_term: kw.keyword,
        current_campaign: kw.campaign,
        current_ad_group: kw.ad_group,
        action_type: 'move_term',
        target: proposedAg,
        reason: `Belongs to "${kw.cluster_primary}" but in "${dominant}" ad group`,
        estimated_savings: 0,
        cost,
        clicks,
        conversions,
        cpa,
      });
    }
  }

  // Sort by cost descending
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
  
  const bullets: ExecutiveSummary['bullets'] = [];

  if (totalWasted > 0) {
    bullets.push({
      icon: 'red',
      text: `$${totalWasted.toLocaleString(undefined, { maximumFractionDigits: 0 })} identified as wasted spend → add ${negatives.length} negatives`,
    });
  }

  if (moves.length > 0) {
    const moveCost = moves.reduce((s, m) => s + m.cost, 0);
    bullets.push({
      icon: 'yellow',
      text: `${moves.length} terms ($${moveCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}) are in wrong ad groups → should be moved`,
    });
  }

  // Find biggest leakage cluster
  const clusterCosts = new Map<string, number>();
  for (const kw of keywords) {
    if (kw.cluster_primary.startsWith('Other') || kw.cluster_primary === 'Junk / Noise') {
      clusterCosts.set(kw.cluster_primary, (clusterCosts.get(kw.cluster_primary) || 0) + (kw.cost || 0));
    }
  }
  const biggestOther = [...clusterCosts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (biggestOther && biggestOther[1] > 100) {
    bullets.push({
      icon: 'yellow',
      text: `$${biggestOther[1].toLocaleString(undefined, { maximumFractionDigits: 0 })} spent on uncategorized terms ("${biggestOther[0]}") → review and classify`,
    });
  }

  if (bullets.length === 0) {
    bullets.push({
      icon: 'green',
      text: 'Account structure looks healthy. No major issues found.',
    });
  }

  return {
    bullets,
    totalSpend,
    totalWasted,
    totalActions: actions.length,
  };
}

// =====================================================
// CSV EXPORTS
// =====================================================

export function exportUnifiedActionsCSV(actions: UnifiedAction[]): string {
  const headers = [
    'search_term',
    'current_campaign',
    'current_ad_group',
    'action_type',
    'target',
    'reason',
    'cost',
    'clicks',
    'conversions',
    'cpa',
    'estimated_savings',
  ];

  const rows = actions.map(a => [
    `"${a.search_term.replace(/"/g, '""')}"`,
    `"${(a.current_campaign || '').replace(/"/g, '""')}"`,
    `"${(a.current_ad_group || '').replace(/"/g, '""')}"`,
    a.action_type,
    `"${a.target.replace(/"/g, '""')}"`,
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
    'campaign',
    'ad_group',
    'negative_keyword',
    'match_type',
    'reason',
    'cost',
  ];

  const rows = negatives.map(n => [
    `"${(n.current_campaign || '').replace(/"/g, '""')}"`,
    `"${(n.current_ad_group || '').replace(/"/g, '""')}"`,
    `"${n.search_term.replace(/"/g, '""')}"`,
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
    'proposed_ad_group',
    'reason',
    'cost',
    'conversions',
  ];

  const rows = moves.map(m => [
    `"${m.search_term.replace(/"/g, '""')}"`,
    `"${(m.current_campaign || '').replace(/"/g, '""')}"`,
    `"${(m.current_ad_group || '').replace(/"/g, '""')}"`,
    `"${m.target.replace(/"/g, '""')}"`,
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
