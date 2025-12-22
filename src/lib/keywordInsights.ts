/**
 * Keyword Insights Engine
 * 
 * Deterministic computation of ad group stats, negatives, moves, 
 * proposed ad groups, and executive briefs.
 */

import { ProcessedKeyword, normalizeTerm } from './keywordEngine';

// =====================================================
// CONFIGURATION TYPES
// =====================================================

export interface InsightsConfig {
  minCostForNewAdGroup: number;
  minClicksForNewAdGroup: number;
  purityThreshold: number;
  maxCPA: number;
  minCostForNegative: number;
  lowIntentHandling: 'exclude' | 'isolate';
}

export const DEFAULT_INSIGHTS_CONFIG: InsightsConfig = {
  minCostForNewAdGroup: 300,
  minClicksForNewAdGroup: 200,
  purityThreshold: 0.70,
  maxCPA: 500,
  minCostForNegative: 50,
  lowIntentHandling: 'exclude',
};

// =====================================================
// RESULT TYPES
// =====================================================

export interface AdGroupStats {
  ad_group_name: string;
  campaign_name: string | null;
  keywords: ProcessedKeyword[];
  dominant_cluster: string;
  total_cost: number;
  total_clicks: number;
  total_conversions: number;
  total_impressions: number;
  purity_score: number;
  status: 'OK' | 'Improve with negatives' | 'Needs restructure';
  cpa: number | null;
  ctr: number;
}

export interface NegativeRecommendation {
  target_campaign: string | null;
  target_ad_group: string | null;
  negative_text: string;
  negative_type: 'no_money_intent' | 'login_intent' | 'performance' | 'structural_leakage' | 'unrelated';
  scope: 'campaign' | 'ad_group';
  rationale: string;
  evidence_cost: number;
  evidence_clicks: number;
  evidence_CPA: number | null;
  confidence_score: number;
}

export interface MoveRecommendation {
  search_term: string;
  current_campaign: string | null;
  current_ad_group: string | null;
  proposed_campaign: string;
  proposed_ad_group: string;
  cluster_primary: string;
  intent: string;
  cost: number;
  clicks: number;
  conversions: number;
}

export interface ProposedAdGroup {
  proposed_ad_group_name: string;
  cluster_primary: string;
  intent: string;
  estimated_cost: number;
  estimated_clicks: number;
  estimated_conversions: number;
  source_ad_groups: string[];
  notes: string;
}

export interface ExecutiveBrief {
  topClustersBySpend: { name: string; spend: number }[];
  topClustersByConversions: { name: string; conversions: number }[];
  worstCPACluster: { name: string; cpa: number; cost: number } | null;
  largestLeakageSource: string;
  proposedNewAdGroupsCount: number;
  moveRecommendationsCount: number;
  negativeRecommendationsCount: number;
  estimatedWastedSpend: number;
  totalSpend: number;
  totalConversions: number;
}

export interface ClusterKPI {
  name: string;
  spend: number;
  clicks: number;
  conversions: number;
  impressions: number;
  cpa: number | null;
  ctr: number;
  percentOfSpend: number;
  intentDistribution: Record<string, number>;
}

export interface IntentKPI {
  name: string;
  spend: number;
  clicks: number;
  conversions: number;
  impressions: number;
  cpa: number | null;
  ctr: number;
  percentOfSpend: number;
  clusterDistribution: Record<string, number>;
}

// =====================================================
// NO-MONEY INTENT PATTERNS
// =====================================================

const NO_MONEY_PATTERNS_EN = /\b(free|earn money|make money|money make|how to earn|free signals|free course|no deposit|without deposit|no investment|earn from home|work from home|passive income)\b/i;
const NO_MONEY_PATTERNS_AR = /ربح|ربح المال|كسب المال|فلوس|بدون رأس مال|بدون ايداع|بدون استثمار|مجانا|مجاني|اربح|كسب/;

export function isNoMoneyIntent(norm: string, asciiNorm: string): boolean {
  return NO_MONEY_PATTERNS_EN.test(asciiNorm) || NO_MONEY_PATTERNS_AR.test(norm);
}

// Low-intent patterns (login, news, how-to)
const LOW_INTENT_INTENTS = ['login_access', 'news_calendar', 'how_to_education'];

export function isLowIntent(intent: string): boolean {
  return LOW_INTENT_INTENTS.includes(intent);
}

// =====================================================
// AD GROUP STATS COMPUTATION
// =====================================================

export function computeAdGroupStats(keywords: ProcessedKeyword[]): AdGroupStats[] {
  // Group keywords by ad_group
  const adGroupMap = new Map<string, ProcessedKeyword[]>();
  
  keywords.forEach(kw => {
    const agName = kw.ad_group || 'Unmapped';
    if (!adGroupMap.has(agName)) {
      adGroupMap.set(agName, []);
    }
    adGroupMap.get(agName)!.push(kw);
  });
  
  const results: AdGroupStats[] = [];
  
  for (const [agName, kwList] of adGroupMap) {
    // Find dominant cluster (highest cost share)
    const clusterCosts = new Map<string, number>();
    let totalCost = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    let totalImpressions = 0;
    
    kwList.forEach(kw => {
      const cost = kw.cost || 0;
      const cluster = kw.cluster_primary;
      clusterCosts.set(cluster, (clusterCosts.get(cluster) || 0) + cost);
      totalCost += cost;
      totalClicks += kw.clicks;
      totalConversions += kw.conversions || 0;
      totalImpressions += kw.impressions;
    });
    
    // Find dominant cluster
    let dominantCluster = 'Other - General Longtail';
    let maxCost = 0;
    for (const [cluster, cost] of clusterCosts) {
      if (cost > maxCost) {
        maxCost = cost;
        dominantCluster = cluster;
      }
    }
    
    // Compute purity score
    const inClusterCost = clusterCosts.get(dominantCluster) || 0;
    const purityScore = totalCost > 0 ? inClusterCost / totalCost : 1;
    
    // Classify status
    let status: 'OK' | 'Improve with negatives' | 'Needs restructure';
    if (purityScore < 0.70) {
      status = 'Needs restructure';
    } else if (purityScore < 0.85) {
      status = 'Improve with negatives';
    } else {
      status = 'OK';
    }
    
    const campaignName = kwList[0]?.campaign || null;
    
    results.push({
      ad_group_name: agName,
      campaign_name: campaignName,
      keywords: kwList,
      dominant_cluster: dominantCluster,
      total_cost: totalCost,
      total_clicks: totalClicks,
      total_conversions: totalConversions,
      total_impressions: totalImpressions,
      purity_score: purityScore,
      status,
      cpa: totalConversions > 0 ? totalCost / totalConversions : null,
      ctr: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
    });
  }
  
  return results.sort((a, b) => b.total_cost - a.total_cost);
}

// =====================================================
// NEGATIVE RECOMMENDATIONS
// =====================================================

export function generateNegativeRecommendations(
  keywords: ProcessedKeyword[],
  config: InsightsConfig
): NegativeRecommendation[] {
  const negatives: NegativeRecommendation[] = [];
  const seenTerms = new Set<string>();
  
  for (const kw of keywords) {
    const norm = normalizeTerm(kw.keyword);
    const termKey = norm.search_term_norm;
    
    // Skip duplicates
    if (seenTerms.has(termKey)) continue;
    seenTerms.add(termKey);
    
    const cost = kw.cost || 0;
    const clicks = kw.clicks;
    const conversions = kw.conversions || 0;
    const cpa = conversions > 0 ? cost / conversions : null;
    
    // 1) NO-MONEY INTENT (HARD NEGATIVES) - Campaign level
    if (isNoMoneyIntent(norm.search_term_norm, norm.search_term_norm_ascii)) {
      negatives.push({
        target_campaign: kw.campaign,
        target_ad_group: null,
        negative_text: kw.keyword,
        negative_type: 'no_money_intent',
        scope: 'campaign',
        rationale: 'No-money intent detected: users looking for free/earn money offers without investment intent',
        evidence_cost: cost,
        evidence_clicks: clicks,
        evidence_CPA: cpa,
        confidence_score: 1.0,
      });
      continue;
    }
    
    // 2) LOGIN / SIGN-IN (CONTEXTUAL)
    if (kw.intent === 'login_access' && cost >= config.minCostForNegative) {
      // For brand/generic campaigns, recommend negative
      // For competitor campaigns, we'd recommend isolate (handled in config)
      const isBrandCampaign = kw.cluster_primary === 'Brand - CFI';
      const isCompetitorCampaign = kw.cluster_primary === 'Competitors';
      
      if (!isCompetitorCampaign) {
        negatives.push({
          target_campaign: kw.campaign,
          target_ad_group: isBrandCampaign ? null : kw.ad_group,
          negative_text: kw.keyword,
          negative_type: 'login_intent',
          scope: isBrandCampaign ? 'campaign' : 'ad_group',
          rationale: 'Login/sign-in intent in non-acquisition campaign - users looking to access existing accounts',
          evidence_cost: cost,
          evidence_clicks: clicks,
          evidence_CPA: cpa,
          confidence_score: 0.9,
        });
        continue;
      }
    }
    
    // 3) PERFORMANCE NEGATIVES
    if (cost >= 500 && conversions === 0) {
      negatives.push({
        target_campaign: kw.campaign,
        target_ad_group: kw.ad_group,
        negative_text: kw.keyword,
        negative_type: 'performance',
        scope: 'ad_group',
        rationale: `High cost ($${cost.toFixed(0)}) with zero conversions`,
        evidence_cost: cost,
        evidence_clicks: clicks,
        evidence_CPA: null,
        confidence_score: 0.95,
      });
      continue;
    }
    
    if (cpa !== null && cpa > config.maxCPA && cost >= config.minCostForNegative) {
      negatives.push({
        target_campaign: kw.campaign,
        target_ad_group: kw.ad_group,
        negative_text: kw.keyword,
        negative_type: 'performance',
        scope: 'ad_group',
        rationale: `CPA ($${cpa.toFixed(0)}) exceeds threshold ($${config.maxCPA})`,
        evidence_cost: cost,
        evidence_clicks: clicks,
        evidence_CPA: cpa,
        confidence_score: 0.85,
      });
      continue;
    }
    
    // 5) UNRELATED / IRRELEVANT
    if (kw.cluster_primary === 'Other - General Longtail' && 
        cost >= config.minCostForNegative && 
        !kw.tags.asset_tag && !kw.tags.platform_tag) {
      negatives.push({
        target_campaign: kw.campaign,
        target_ad_group: kw.ad_group,
        negative_text: kw.keyword,
        negative_type: 'unrelated',
        scope: 'ad_group',
        rationale: 'Unrelated term with no identifiable asset or platform',
        evidence_cost: cost,
        evidence_clicks: clicks,
        evidence_CPA: cpa,
        confidence_score: 0.7,
      });
    }
  }
  
  return negatives.sort((a, b) => b.evidence_cost - a.evidence_cost);
}

// =====================================================
// STRUCTURAL LEAKAGE NEGATIVES
// =====================================================

export function generateStructuralLeakageNegatives(
  keywords: ProcessedKeyword[],
  adGroupStats: AdGroupStats[],
  config: InsightsConfig
): NegativeRecommendation[] {
  const negatives: NegativeRecommendation[] = [];
  
  // Build map of ad group -> dominant cluster
  const adGroupDominantCluster = new Map<string, string>();
  adGroupStats.forEach(ag => {
    adGroupDominantCluster.set(ag.ad_group_name, ag.dominant_cluster);
  });
  
  for (const kw of keywords) {
    const agName = kw.ad_group || 'Unmapped';
    const dominantCluster = adGroupDominantCluster.get(agName);
    const cost = kw.cost || 0;
    
    if (dominantCluster && kw.cluster_primary !== dominantCluster && cost >= config.minCostForNegative) {
      negatives.push({
        target_campaign: kw.campaign,
        target_ad_group: kw.ad_group,
        negative_text: kw.keyword,
        negative_type: 'structural_leakage',
        scope: 'ad_group',
        rationale: `Term cluster (${kw.cluster_primary}) differs from ad group dominant cluster (${dominantCluster})`,
        evidence_cost: cost,
        evidence_clicks: kw.clicks,
        evidence_CPA: kw.conversions ? cost / kw.conversions : null,
        confidence_score: 0.8,
      });
    }
  }
  
  return negatives.sort((a, b) => b.evidence_cost - a.evidence_cost);
}

// =====================================================
// MOVE RECOMMENDATIONS
// =====================================================

export function generateMoveRecommendations(
  keywords: ProcessedKeyword[],
  adGroupStats: AdGroupStats[],
  config: InsightsConfig
): MoveRecommendation[] {
  const moves: MoveRecommendation[] = [];
  
  // Build map of ad group -> dominant cluster
  const adGroupDominantCluster = new Map<string, string>();
  adGroupStats.forEach(ag => {
    adGroupDominantCluster.set(ag.ad_group_name, ag.dominant_cluster);
  });
  
  for (const kw of keywords) {
    const agName = kw.ad_group || 'Unmapped';
    const dominantCluster = adGroupDominantCluster.get(agName);
    const cost = kw.cost || 0;
    
    // Skip low cost terms
    if (cost < config.minCostForNegative) continue;
    
    // Handle low-intent based on config
    if (isLowIntent(kw.intent)) {
      if (config.lowIntentHandling === 'exclude') continue;
      // For 'isolate', we'll propose a dedicated ad group
    }
    
    // Check for cluster mismatch
    if (dominantCluster && kw.cluster_primary !== dominantCluster) {
      const proposedAgName = `AG | ${kw.cluster_primary} | ${kw.intent}`;
      
      moves.push({
        search_term: kw.keyword,
        current_campaign: kw.campaign,
        current_ad_group: kw.ad_group,
        proposed_campaign: kw.campaign || 'New Campaign',
        proposed_ad_group: proposedAgName,
        cluster_primary: kw.cluster_primary,
        intent: kw.intent,
        cost: cost,
        clicks: kw.clicks,
        conversions: kw.conversions || 0,
      });
    }
  }
  
  return moves.sort((a, b) => b.cost - a.cost);
}

// =====================================================
// PROPOSED NEW AD GROUPS
// =====================================================

export function proposeNewAdGroups(
  keywords: ProcessedKeyword[],
  config: InsightsConfig
): ProposedAdGroup[] {
  // Group terms by cluster_primary + intent
  const groupMap = new Map<string, ProcessedKeyword[]>();
  
  for (const kw of keywords) {
    // Skip low-intent if configured to exclude
    if (isLowIntent(kw.intent) && config.lowIntentHandling === 'exclude') continue;
    
    const key = `${kw.cluster_primary}|${kw.intent}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }
    groupMap.get(key)!.push(kw);
  }
  
  const proposals: ProposedAdGroup[] = [];
  
  for (const [key, kwList] of groupMap) {
    const [cluster, intent] = key.split('|');
    
    const totalCost = kwList.reduce((sum, kw) => sum + (kw.cost || 0), 0);
    const totalClicks = kwList.reduce((sum, kw) => sum + kw.clicks, 0);
    const totalConversions = kwList.reduce((sum, kw) => sum + (kw.conversions || 0), 0);
    
    // Check thresholds
    if (totalCost < config.minCostForNewAdGroup && totalClicks < config.minClicksForNewAdGroup) {
      continue;
    }
    
    // Get unique source ad groups
    const sourceAdGroups = [...new Set(kwList.map(kw => kw.ad_group).filter(Boolean) as string[])];
    
    // Skip if only one source and it's already well-structured
    if (sourceAdGroups.length <= 1) continue;
    
    const proposedName = `AG | ${cluster} | ${intent}`;
    
    proposals.push({
      proposed_ad_group_name: proposedName,
      cluster_primary: cluster,
      intent: intent,
      estimated_cost: totalCost,
      estimated_clicks: totalClicks,
      estimated_conversions: totalConversions,
      source_ad_groups: sourceAdGroups,
      notes: `${kwList.length} terms from ${sourceAdGroups.length} ad groups`,
    });
  }
  
  return proposals.sort((a, b) => b.estimated_cost - a.estimated_cost);
}

// =====================================================
// EXECUTIVE BRIEF
// =====================================================

export function generateExecutiveBrief(
  keywords: ProcessedKeyword[],
  negatives: NegativeRecommendation[],
  moves: MoveRecommendation[],
  newAdGroups: ProposedAdGroup[]
): ExecutiveBrief {
  // Compute cluster-level stats
  const clusterStats = new Map<string, { spend: number; conversions: number; clicks: number }>();
  let totalSpend = 0;
  let totalConversions = 0;
  
  for (const kw of keywords) {
    const cost = kw.cost || 0;
    const conv = kw.conversions || 0;
    totalSpend += cost;
    totalConversions += conv;
    
    const cluster = kw.cluster_primary;
    const existing = clusterStats.get(cluster) || { spend: 0, conversions: 0, clicks: 0 };
    clusterStats.set(cluster, {
      spend: existing.spend + cost,
      conversions: existing.conversions + conv,
      clicks: existing.clicks + kw.clicks,
    });
  }
  
  // Top 3 by spend
  const topBySpend = [...clusterStats.entries()]
    .sort((a, b) => b[1].spend - a[1].spend)
    .slice(0, 3)
    .map(([name, stats]) => ({ name, spend: stats.spend }));
  
  // Top 3 by conversions
  const topByConversions = [...clusterStats.entries()]
    .sort((a, b) => b[1].conversions - a[1].conversions)
    .slice(0, 3)
    .map(([name, stats]) => ({ name, conversions: stats.conversions }));
  
  // Worst CPA cluster (only if cost >= $500)
  let worstCPACluster: { name: string; cpa: number; cost: number } | null = null;
  for (const [name, stats] of clusterStats) {
    if (stats.spend >= 500 && stats.conversions > 0) {
      const cpa = stats.spend / stats.conversions;
      if (!worstCPACluster || cpa > worstCPACluster.cpa) {
        worstCPACluster = { name, cpa, cost: stats.spend };
      }
    } else if (stats.spend >= 500 && stats.conversions === 0) {
      // Infinite CPA
      if (!worstCPACluster || worstCPACluster.cpa < Infinity) {
        worstCPACluster = { name, cpa: Infinity, cost: stats.spend };
      }
    }
  }
  
  // Largest leakage source
  const noMoneyNegatives = negatives.filter(n => n.negative_type === 'no_money_intent');
  const loginNegatives = negatives.filter(n => n.negative_type === 'login_intent');
  const structuralNegatives = negatives.filter(n => n.negative_type === 'structural_leakage');
  const unrelatedNegatives = negatives.filter(n => n.negative_type === 'unrelated');
  
  const leakageSources = [
    { name: 'No-money intent', count: noMoneyNegatives.length, cost: noMoneyNegatives.reduce((s, n) => s + n.evidence_cost, 0) },
    { name: 'Login intent leakage', count: loginNegatives.length, cost: loginNegatives.reduce((s, n) => s + n.evidence_cost, 0) },
    { name: 'Structural/cluster mismatch', count: structuralNegatives.length, cost: structuralNegatives.reduce((s, n) => s + n.evidence_cost, 0) },
    { name: 'Unrelated terms', count: unrelatedNegatives.length, cost: unrelatedNegatives.reduce((s, n) => s + n.evidence_cost, 0) },
  ];
  
  const largestLeakage = leakageSources.sort((a, b) => b.cost - a.cost)[0];
  
  // Estimated wasted spend
  const estimatedWastedSpend = negatives.reduce((sum, n) => sum + n.evidence_cost, 0);
  
  return {
    topClustersBySpend: topBySpend,
    topClustersByConversions: topByConversions,
    worstCPACluster,
    largestLeakageSource: largestLeakage.count > 0 ? `${largestLeakage.name} ($${largestLeakage.cost.toFixed(0)})` : 'None identified',
    proposedNewAdGroupsCount: newAdGroups.length,
    moveRecommendationsCount: moves.length,
    negativeRecommendationsCount: negatives.length,
    estimatedWastedSpend,
    totalSpend,
    totalConversions,
  };
}

// =====================================================
// KPI COMPUTATIONS
// =====================================================

export function computeClusterKPIs(keywords: ProcessedKeyword[]): ClusterKPI[] {
  const clusterMap = new Map<string, ProcessedKeyword[]>();
  let totalSpend = 0;
  
  for (const kw of keywords) {
    const cluster = kw.cluster_primary;
    if (!clusterMap.has(cluster)) {
      clusterMap.set(cluster, []);
    }
    clusterMap.get(cluster)!.push(kw);
    totalSpend += kw.cost || 0;
  }
  
  const results: ClusterKPI[] = [];
  
  for (const [name, kwList] of clusterMap) {
    const spend = kwList.reduce((s, k) => s + (k.cost || 0), 0);
    const clicks = kwList.reduce((s, k) => s + k.clicks, 0);
    const conversions = kwList.reduce((s, k) => s + (k.conversions || 0), 0);
    const impressions = kwList.reduce((s, k) => s + k.impressions, 0);
    
    // Intent distribution
    const intentDist: Record<string, number> = {};
    for (const kw of kwList) {
      intentDist[kw.intent] = (intentDist[kw.intent] || 0) + (kw.cost || 0);
    }
    
    results.push({
      name,
      spend,
      clicks,
      conversions,
      impressions,
      cpa: conversions > 0 ? spend / conversions : null,
      ctr: impressions > 0 ? clicks / impressions : 0,
      percentOfSpend: totalSpend > 0 ? (spend / totalSpend) * 100 : 0,
      intentDistribution: intentDist,
    });
  }
  
  return results.sort((a, b) => b.spend - a.spend);
}

export function computeIntentKPIs(keywords: ProcessedKeyword[]): IntentKPI[] {
  const intentMap = new Map<string, ProcessedKeyword[]>();
  let totalSpend = 0;
  
  for (const kw of keywords) {
    const intent = kw.intent;
    if (!intentMap.has(intent)) {
      intentMap.set(intent, []);
    }
    intentMap.get(intent)!.push(kw);
    totalSpend += kw.cost || 0;
  }
  
  const results: IntentKPI[] = [];
  
  for (const [name, kwList] of intentMap) {
    const spend = kwList.reduce((s, k) => s + (k.cost || 0), 0);
    const clicks = kwList.reduce((s, k) => s + k.clicks, 0);
    const conversions = kwList.reduce((s, k) => s + (k.conversions || 0), 0);
    const impressions = kwList.reduce((s, k) => s + k.impressions, 0);
    
    // Cluster distribution
    const clusterDist: Record<string, number> = {};
    for (const kw of kwList) {
      clusterDist[kw.cluster_primary] = (clusterDist[kw.cluster_primary] || 0) + (kw.cost || 0);
    }
    
    results.push({
      name,
      spend,
      clicks,
      conversions,
      impressions,
      cpa: conversions > 0 ? spend / conversions : null,
      ctr: impressions > 0 ? clicks / impressions : 0,
      percentOfSpend: totalSpend > 0 ? (spend / totalSpend) * 100 : 0,
      clusterDistribution: clusterDist,
    });
  }
  
  return results.sort((a, b) => b.spend - a.spend);
}

// =====================================================
// CSV EXPORT HELPERS
// =====================================================

export function exportNegativesSuggestionsCSV(negatives: NegativeRecommendation[]): string {
  const headers = [
    'campaign_name',
    'ad_group_name',
    'negative_text',
    'negative_type',
    'scope',
    'rationale',
    'evidence_cost',
    'evidence_clicks',
    'evidence_CPA',
  ];
  
  const rows = negatives.map(n => [
    `"${(n.target_campaign || '').replace(/"/g, '""')}"`,
    `"${(n.target_ad_group || '').replace(/"/g, '""')}"`,
    `"${n.negative_text.replace(/"/g, '""')}"`,
    n.negative_type,
    n.scope,
    `"${n.rationale.replace(/"/g, '""')}"`,
    n.evidence_cost.toFixed(2),
    n.evidence_clicks.toString(),
    n.evidence_CPA !== null ? n.evidence_CPA.toFixed(2) : '',
  ].join(','));
  
  return [headers.join(','), ...rows].join('\n');
}

export function exportProposedChangesCSV(moves: MoveRecommendation[]): string {
  const headers = [
    'search_term',
    'current_campaign',
    'current_ad_group',
    'proposed_campaign',
    'proposed_ad_group',
    'cluster_primary',
    'intent',
    'cost',
    'clicks',
    'conversions',
  ];
  
  const rows = moves.map(m => [
    `"${m.search_term.replace(/"/g, '""')}"`,
    `"${(m.current_campaign || '').replace(/"/g, '""')}"`,
    `"${(m.current_ad_group || '').replace(/"/g, '""')}"`,
    `"${m.proposed_campaign.replace(/"/g, '""')}"`,
    `"${m.proposed_ad_group.replace(/"/g, '""')}"`,
    m.cluster_primary,
    m.intent,
    m.cost.toFixed(2),
    m.clicks.toString(),
    m.conversions.toString(),
  ].join(','));
  
  return [headers.join(','), ...rows].join('\n');
}

export function exportNewAdGroupsPlanCSV(proposals: ProposedAdGroup[]): string {
  const headers = [
    'proposed_ad_group_name',
    'cluster_primary',
    'intent',
    'estimated_cost',
    'estimated_clicks',
    'source_ad_groups',
    'notes',
  ];
  
  const rows = proposals.map(p => [
    `"${p.proposed_ad_group_name.replace(/"/g, '""')}"`,
    p.cluster_primary,
    p.intent,
    p.estimated_cost.toFixed(2),
    p.estimated_clicks.toString(),
    `"${p.source_ad_groups.join('; ').replace(/"/g, '""')}"`,
    `"${p.notes.replace(/"/g, '""')}"`,
  ].join(','));
  
  return [headers.join(','), ...rows].join('\n');
}
