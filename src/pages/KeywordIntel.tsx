import { useState, useMemo, useCallback } from "react";
import { Search, Upload, TrendingUp, Layers, Lightbulb, Download, Copy, AlertCircle, CheckCircle2, FolderOpen, Save, Settings2, RotateCcw, ChevronRight } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataCard, DataCardHeader } from "@/components/layout/DataCard";
import { EmptyState } from "@/components/layout/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useKeywordLists } from "@/hooks/useKeywordLists";
import { SaveKeywordListDialog } from "@/components/keyword-intel/SaveKeywordListDialog";
import { SavedKeywordListsTab } from "@/components/keyword-intel/SavedKeywordListsTab";

// Types - Updated for Google Ads Search Terms Report
interface KeywordRow {
  keyword: string;
  clicks: number;
  impressions: number;
  ctr: number;
  match_type: string;
  added_excluded: string;
  campaign: string;
  ad_group: string;
  currency_code: string;
  cost: number;
  impr_top_pct: number;
  interaction_rate: number;
  engagement_rate: number;
  conv_rate: number;
  conversions: number;
  cost_per_conv: number;
  opportunity_score?: number;
  theme_cluster?: string;
  score_components?: {
    ctr_score: number;
    conv_score: number;
    cpa_score: number;
  };
}

interface ThemeRule {
  name: string;
  tokens: string[];
  priority: number;
}

interface ThemeCluster {
  name: string;
  keywords: KeywordRow[];
  totalImpressions: number;
  totalClicks: number;
  totalCost: number;
  totalConversions: number;
  avgCTR: number;
  avgCPA: number;
  avgScore: number;
}

// Default theme rules for trading company
const DEFAULT_THEME_RULES: ThemeRule[] = [
  { name: 'Gold', tokens: ['gold', 'xau', 'xauusd', 'bullion'], priority: 100 },
  { name: 'Oil', tokens: ['oil', 'wti', 'brent', 'crude'], priority: 90 },
  { name: 'Forex', tokens: ['forex', 'fx', 'currency', 'eurusd', 'gbpusd', 'usdjpy', 'eur/usd', 'gbp/usd', 'usd/jpy'], priority: 80 },
  { name: 'Crypto', tokens: ['crypto', 'bitcoin', 'btc', 'ethereum', 'eth', 'cryptocurrency'], priority: 70 },
  { name: 'Stocks', tokens: ['stocks', 'shares', 'equities', 'nasdaq', 'sp500', 's&p500', 'stock'], priority: 60 },
  { name: 'Indices', tokens: ['index', 'indices', 'dow', 'ftse', 'dax', 'nikkei'], priority: 50 },
  { name: 'Trading', tokens: ['trading', 'trade', 'broker', 'platform', 'cfd', 'spread'], priority: 40 },
];

// Column mappings for flexible header matching
const COLUMN_MAPPINGS: Record<string, string[]> = {
  keyword: ['search term', 'keyword', 'query', 'search_term'],
  clicks: ['clicks'],
  impressions: ['impr.', 'impressions', 'impr'],
  ctr: ['ctr', 'click-through rate'],
  match_type: ['match type', 'match_type'],
  added_excluded: ['added/excluded', 'status', 'added_excluded'],
  campaign: ['campaign'],
  ad_group: ['ad group', 'adgroup', 'ad_group'],
  currency_code: ['currency code', 'currency', 'currency_code'],
  cost: ['cost'],
  impr_top_pct: ['impr. (top) %', 'top impression rate', 'impr_top_pct', 'top impr %'],
  interaction_rate: ['interaction rate', 'interaction_rate'],
  engagement_rate: ['engagement rate', 'engagement_rate'],
  conv_rate: ['conv. rate', 'conversion rate', 'conv_rate'],
  conversions: ['conversions', 'conv.'],
  cost_per_conv: ['cost / conv.', 'cost per conversion', 'cpa', 'cost_per_conv'],
};

const REQUIRED_COLUMNS = ['keyword', 'clicks', 'impressions', 'ctr'];

const MODIFIERS = [
  '{keyword} for beginners',
  '{keyword} app',
  '{keyword} vs alternatives',
  'how does {keyword} work',
  'is {keyword} safe',
  'best {keyword}',
  '{keyword} near me',
  '{keyword} price',
  '{keyword} review',
  '{keyword} tutorial',
];

// Parsing helpers
function parsePercentage(value: string): number {
  if (!value || value === '--' || value === '') return 0;
  const cleaned = value.toString().replace('%', '').replace(/,/g, '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed / 100;
}

function parseCurrency(value: string): number {
  if (!value || value === '--' || value === '') return 0;
  const cleaned = value.toString().replace(/[$€£¥₹,\s]/g, '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

function parseNumber(value: string): number {
  if (!value || value === '--' || value === '') return 0;
  const cleaned = value.toString().replace(/,/g, '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

function findColumnIndex(headers: string[], fieldName: string): number {
  const aliases = COLUMN_MAPPINGS[fieldName] || [fieldName];
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  
  for (const alias of aliases) {
    const index = normalizedHeaders.indexOf(alias.toLowerCase());
    if (index !== -1) return index;
  }
  return -1;
}

export default function KeywordIntel() {
  const { toast } = useToast();
  const { createList } = useKeywordLists();
  const [activeTab, setActiveTab] = useState("upload");
  const [parsedData, setParsedData] = useState<KeywordRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<KeywordRow[]>([]);
  const [isUploaded, setIsUploaded] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [sourceFileName, setSourceFileName] = useState<string | null>(null);

  // Filters - Updated for Google Ads data
  const [campaignFilter, setCampaignFilter] = useState<string>("all");
  const [adGroupFilter, setAdGroupFilter] = useState<string>("all");
  const [matchTypeFilter, setMatchTypeFilter] = useState<string>("all");
  const [themeFilter, setThemeFilter] = useState<string>("all");
  const [minScore, setMinScore] = useState<number>(0);
  
  // Theme rules state (local, editable)
  const [themeRules, setThemeRules] = useState<ThemeRule[]>(DEFAULT_THEME_RULES);
  const [editingThemeRules, setEditingThemeRules] = useState<string>('');

  // Parse CSV line handling quoted values
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^["']|["']$/g, ''));
    return result;
  };

  // Parse CSV with flexible column mapping
  const parseCSV = useCallback((text: string): { data: KeywordRow[]; error: string | null } => {
    const lines = text.trim().split('\n').filter(line => line.trim());
    if (lines.length < 2) return { data: [], error: "CSV file is empty or has no data rows" };

    // Auto-detect header row - Google Ads exports have metadata rows before headers
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const line = lines[i].toLowerCase();
      // Look for known column names that indicate this is the header row
      if ((line.includes('search term') || line.includes('keyword')) && 
          (line.includes('clicks') || line.includes('impr') || line.includes('match type'))) {
        headerRowIndex = i;
        break;
      }
    }
    
    const headers = parseCSVLine(lines[headerRowIndex]);
    console.log("Detected header row index:", headerRowIndex, "Headers:", headers);
    
    // Build column index map
    const colMap: Record<string, number> = {};
    for (const field of Object.keys(COLUMN_MAPPINGS)) {
      colMap[field] = findColumnIndex(headers, field);
    }
    
    console.log("Column mapping:", colMap);

    // Validate required columns
    const missingColumns = REQUIRED_COLUMNS.filter(col => colMap[col] === -1);
    if (missingColumns.length > 0) {
      console.log("Missing columns:", missingColumns, "Headers found:", headers);
      return { data: [], error: `Missing required columns: ${missingColumns.join(', ')}` };
    }

    // Parse data rows (start after header row)
    const data: KeywordRow[] = [];

    for (let i = headerRowIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = parseCSVLine(line);
      
      // Skip "Total" summary rows (e.g., "Total", "Totals", "Total:", "Total: --")
      const firstValue = values[0]?.toLowerCase().trim();
      if (firstValue.startsWith('total')) continue;

      const getValue = (field: string): string => {
        const idx = colMap[field];
        return idx !== -1 && values[idx] ? values[idx] : '';
      };

      const row: KeywordRow = {
        keyword: getValue('keyword'),
        clicks: parseNumber(getValue('clicks')),
        impressions: parseNumber(getValue('impressions')),
        ctr: parsePercentage(getValue('ctr')),
        match_type: getValue('match_type'),
        added_excluded: getValue('added_excluded'),
        campaign: getValue('campaign'),
        ad_group: getValue('ad_group'),
        currency_code: getValue('currency_code') || 'USD',
        cost: parseCurrency(getValue('cost')),
        impr_top_pct: parsePercentage(getValue('impr_top_pct')),
        interaction_rate: parsePercentage(getValue('interaction_rate')),
        engagement_rate: parsePercentage(getValue('engagement_rate')),
        conv_rate: parsePercentage(getValue('conv_rate')),
        conversions: parseNumber(getValue('conversions')),
        cost_per_conv: parseCurrency(getValue('cost_per_conv')),
      };

      if (row.keyword) data.push(row);
    }

    return { data, error: null };
  }, []);

  // Normalize keyword for theme matching
  const normalizeKeyword = useCallback((keyword: string): string[] => {
    return keyword
      .toLowerCase()
      .trim()
      .replace(/[^\w\s/]/g, ' ') // Keep slashes for pairs like eur/usd
      .split(/\s+/)
      .filter(Boolean);
  }, []);

  // Get theme cluster for a keyword
  const getThemeCluster = useCallback((keyword: string): string => {
    const tokens = normalizeKeyword(keyword);
    let matchedTheme: { name: string; priority: number } | null = null;

    for (const rule of themeRules) {
      for (const ruleToken of rule.tokens) {
        // Check if any keyword token matches (contains) the rule token
        const found = tokens.some(t => t.includes(ruleToken) || ruleToken.includes(t));
        if (found) {
          if (!matchedTheme || rule.priority > matchedTheme.priority) {
            matchedTheme = { name: rule.name, priority: rule.priority };
          }
        }
      }
    }

    return matchedTheme?.name || 'Other';
  }, [themeRules, normalizeKeyword]);

  // Calculate opportunity score - NEW: weighted CTR + Conv + CPA
  const calculateOpportunityScore = useCallback((
    keyword: KeywordRow, 
    stats: { minCTR: number; maxCTR: number; minConv: number; maxConv: number; minCPA: number; maxCPA: number }
  ): { score: number; components: { ctr_score: number; conv_score: number; cpa_score: number } } => {
    
    // Normalize CTR (higher is better) 0-100
    let ctr_score = 50; // neutral if can't compute
    if (stats.maxCTR > stats.minCTR) {
      ctr_score = ((keyword.ctr - stats.minCTR) / (stats.maxCTR - stats.minCTR)) * 100;
    } else if (keyword.ctr > 0) {
      ctr_score = 75; // some CTR is good
    }

    // Normalize Conversions (higher is better) 0-100
    let conv_score = 50; // neutral if missing
    if (stats.maxConv > stats.minConv) {
      conv_score = ((keyword.conversions - stats.minConv) / (stats.maxConv - stats.minConv)) * 100;
    } else if (keyword.conversions > 0) {
      conv_score = 75;
    }

    // Compute CPA if possible
    let cpa = keyword.cost_per_conv;
    if (!cpa && keyword.cost > 0 && keyword.conversions > 0) {
      cpa = keyword.cost / keyword.conversions;
    }

    // Normalize CPA (lower is better, so invert) 0-100
    let cpa_score = 50; // neutral if missing
    if (cpa !== undefined && cpa > 0 && stats.maxCPA > stats.minCPA) {
      // Invert: lower CPA = higher score
      cpa_score = 100 - ((cpa - stats.minCPA) / (stats.maxCPA - stats.minCPA)) * 100;
    } else if (cpa === 0 || (keyword.conversions > 0 && keyword.cost === 0)) {
      cpa_score = 100; // free conversions!
    }

    // Clamp scores to 0-100
    ctr_score = Math.max(0, Math.min(100, ctr_score));
    conv_score = Math.max(0, Math.min(100, conv_score));
    cpa_score = Math.max(0, Math.min(100, cpa_score));

    // Weighted final score
    const score = Math.round(0.35 * ctr_score + 0.35 * conv_score + 0.30 * cpa_score);

    return {
      score,
      components: {
        ctr_score: Math.round(ctr_score),
        conv_score: Math.round(conv_score),
        cpa_score: Math.round(cpa_score),
      }
    };
  }, []);

  // Score all keywords with theme clustering
  const scoredData = useMemo(() => {
    if (parsedData.length === 0) return [];

    // Compute dataset statistics for normalization
    const ctrs = parsedData.map(k => k.ctr).filter(v => v > 0);
    const convs = parsedData.map(k => k.conversions).filter(v => v > 0);
    const cpas = parsedData.map(k => {
      if (k.cost_per_conv > 0) return k.cost_per_conv;
      if (k.conversions > 0 && k.cost > 0) return k.cost / k.conversions;
      return 0;
    }).filter(v => v > 0);

    const stats = {
      minCTR: ctrs.length > 0 ? Math.min(...ctrs) : 0,
      maxCTR: ctrs.length > 0 ? Math.max(...ctrs) : 0,
      minConv: convs.length > 0 ? Math.min(...convs) : 0,
      maxConv: convs.length > 0 ? Math.max(...convs) : 0,
      minCPA: cpas.length > 0 ? Math.min(...cpas) : 0,
      maxCPA: cpas.length > 0 ? Math.max(...cpas) : 0,
    };

    return parsedData.map(kw => {
      const { score, components } = calculateOpportunityScore(kw, stats);
      return {
        ...kw,
        opportunity_score: score,
        score_components: components,
        theme_cluster: getThemeCluster(kw.keyword),
      };
    });
  }, [parsedData, calculateOpportunityScore, getThemeCluster]);

  // Filter data
  const filteredData = useMemo(() => {
    return scoredData.filter(kw => {
      if (campaignFilter !== "all" && kw.campaign !== campaignFilter) return false;
      if (adGroupFilter !== "all" && kw.ad_group !== adGroupFilter) return false;
      if (matchTypeFilter !== "all" && kw.match_type !== matchTypeFilter) return false;
      if (themeFilter !== "all" && kw.theme_cluster !== themeFilter) return false;
      if (kw.opportunity_score !== undefined && kw.opportunity_score < minScore) return false;
      return true;
    }).sort((a, b) => (b.opportunity_score || 0) - (a.opportunity_score || 0));
  }, [scoredData, campaignFilter, adGroupFilter, matchTypeFilter, themeFilter, minScore]);

  // Get unique values for filters
  const uniqueCampaigns = useMemo(() => 
    [...new Set(scoredData.map(k => k.campaign).filter(Boolean))].sort(), 
    [scoredData]
  );
  const uniqueAdGroups = useMemo(() => 
    [...new Set(scoredData.map(k => k.ad_group).filter(Boolean))].sort(), 
    [scoredData]
  );
  const uniqueMatchTypes = useMemo(() => 
    [...new Set(scoredData.map(k => k.match_type).filter(Boolean))].sort(), 
    [scoredData]
  );
  const uniqueThemes = useMemo(() => 
    [...new Set(scoredData.map(k => k.theme_cluster).filter(Boolean))].sort(), 
    [scoredData]
  );

  // Cluster keywords by theme
  const themeClusters = useMemo((): ThemeCluster[] => {
    const clusterMap = new Map<string, KeywordRow[]>();

    filteredData.forEach(kw => {
      const theme = kw.theme_cluster || 'Other';
      if (!clusterMap.has(theme)) clusterMap.set(theme, []);
      clusterMap.get(theme)!.push(kw);
    });

    return Array.from(clusterMap.entries())
      .map(([name, items]) => {
        const totalImpressions = items.reduce((sum, k) => sum + k.impressions, 0);
        const totalClicks = items.reduce((sum, k) => sum + k.clicks, 0);
        const totalCost = items.reduce((sum, k) => sum + k.cost, 0);
        const totalConversions = items.reduce((sum, k) => sum + k.conversions, 0);
        const avgCTR = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
        const avgCPA = totalConversions > 0 ? totalCost / totalConversions : 0;
        const avgScore = items.reduce((sum, k) => sum + (k.opportunity_score || 0), 0) / items.length;

        return {
          name,
          keywords: items.sort((a, b) => (b.opportunity_score || 0) - (a.opportunity_score || 0)),
          totalImpressions,
          totalClicks,
          totalCost,
          totalConversions,
          avgCTR,
          avgCPA,
          avgScore,
        };
      })
      .sort((a, b) => b.totalImpressions - a.totalImpressions);
  }, [filteredData]);

  // Theme rules editor helpers
  const openThemeEditor = () => {
    const rulesText = themeRules
      .map(r => `${r.name}: ${r.tokens.join(', ')} [${r.priority}]`)
      .join('\n');
    setEditingThemeRules(rulesText);
  };

  const parseThemeRulesText = (text: string): ThemeRule[] => {
    const rules: ThemeRule[] = [];
    const lines = text.split('\n').filter(l => l.trim());
    
    for (const line of lines) {
      // Format: "Theme Name: token1, token2, token3 [priority]"
      const match = line.match(/^(.+?):\s*(.+?)\s*(?:\[(\d+)\])?$/);
      if (match) {
        const name = match[1].trim();
        const tokens = match[2].split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        const priority = match[3] ? parseInt(match[3]) : (rules.length + 1) * 10;
        if (name && tokens.length > 0) {
          rules.push({ name, tokens, priority });
        }
      }
    }
    
    return rules.length > 0 ? rules : themeRules;
  };

  const saveThemeRules = () => {
    const parsed = parseThemeRulesText(editingThemeRules);
    setThemeRules(parsed);
    toast({ title: "Theme rules updated", description: `${parsed.length} themes configured` });
  };

  const resetThemeRules = () => {
    setThemeRules(DEFAULT_THEME_RULES);
    setEditingThemeRules('');
    toast({ title: "Theme rules reset to defaults" });
  };

  // Generate keyword ideas
  const generatedIdeas = useMemo(() => {
    const ideas = new Set<string>();
    const topKeywords = scoredData
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 50);

    topKeywords.forEach(kw => {
      MODIFIERS.forEach(template => {
        ideas.add(template.replace('{keyword}', kw.keyword));
      });
    });

    return Array.from(ideas);
  }, [scoredData]);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSourceFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { data, error } = parseCSV(text);

      if (error) {
        setParseError(error);
        setPreviewRows([]);
        return;
      }

      setParseError(null);
      setPreviewRows(data.slice(0, 20));
      setParsedData(data);
    };
    reader.readAsText(file);
  };

  const confirmUpload = () => {
    setIsUploaded(true);
    setActiveTab("opportunities");
    toast({ title: "Data imported", description: `${parsedData.length} keywords ready for analysis` });
  };

  // Export to CSV
  const exportCSV = () => {
    const headers = ['Keyword', 'Theme Cluster', 'Opportunity Score', 'CTR Score', 'Conv Score', 'CPA Score', 'Campaign', 'Ad Group', 'Match Type', 'Clicks', 'Impressions', 'CTR', 'Cost', 'Conversions'];
    const rows = filteredData.map(k => [
      `"${k.keyword}"`,
      k.theme_cluster || 'Other',
      k.opportunity_score || 0,
      k.score_components?.ctr_score || 50,
      k.score_components?.conv_score || 50,
      k.score_components?.cpa_score || 50,
      `"${k.campaign}"`,
      `"${k.ad_group}"`,
      k.match_type,
      k.clicks,
      k.impressions,
      (k.ctr * 100).toFixed(2) + '%',
      k.cost.toFixed(2),
      k.conversions
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'keyword-opportunities.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyTable = () => {
    const headers = ['Keyword', 'Theme', 'Score', 'Campaign', 'Ad Group', 'Clicks', 'Impressions', 'CTR', 'Cost', 'Conversions'];
    const rows = filteredData.map(k => [
      k.keyword,
      k.theme_cluster || 'Other',
      k.opportunity_score || 0,
      k.campaign,
      k.ad_group,
      k.clicks,
      k.impressions,
      (k.ctr * 100).toFixed(2) + '%',
      k.cost.toFixed(2),
      k.conversions
    ].join('\t'));

    navigator.clipboard.writeText([headers.join('\t'), ...rows].join('\n'));
    toast({ title: "Copied to clipboard" });
  };

  const getScoreBadge = (score: number) => {
    if (score >= 70) return <Badge className="bg-success/15 text-success border-success/30">{score}</Badge>;
    if (score >= 40) return <Badge className="bg-warning/15 text-warning border-warning/30">{score}</Badge>;
    return <Badge variant="secondary">{score}</Badge>;
  };

  // Handle save analysis
  const handleSaveAnalysis = async (data: { name: string; entity: string; description?: string }) => {
    const items = filteredData.map(kw => ({
      keyword: kw.keyword,
      opportunity_score: kw.opportunity_score || null,
      clicks: kw.clicks,
      impressions: kw.impressions,
      ctr: kw.ctr,
      cost: kw.cost,
      conversions: kw.conversions,
      campaign: kw.campaign,
      ad_group: kw.ad_group,
      match_type: kw.match_type,
      action_taken: 'pending',
      notes: null,
    }));

    await createList.mutateAsync({
      name: data.name,
      entity: data.entity,
      description: data.description,
      source_file: sourceFileName || undefined,
      items,
    });

    setSaveDialogOpen(false);
  };

  return (
    <PageContainer>
      <PageHeader
        icon={Search}
        title="Keyword Intel"
        description="Analyze search term performance and discover optimization opportunities"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upload" className="gap-xs">
            <Upload className="h-4 w-4" /> Upload
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="gap-xs" disabled={!isUploaded}>
            <TrendingUp className="h-4 w-4" /> Opportunities
          </TabsTrigger>
          <TabsTrigger value="clusters" className="gap-xs" disabled={!isUploaded}>
            <Layers className="h-4 w-4" /> Clusters
          </TabsTrigger>
          <TabsTrigger value="ideas" className="gap-xs" disabled={!isUploaded}>
            <Lightbulb className="h-4 w-4" /> Ideas
          </TabsTrigger>
          <TabsTrigger value="saved" className="gap-xs">
            <FolderOpen className="h-4 w-4" /> Saved Lists
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-lg">
          <DataCard>
            <DataCardHeader 
              title="Upload Google Ads Search Terms Report" 
              description="Upload a CSV file with search term performance data"
            />
            <div className="space-y-md">
              <div className="flex items-center gap-md">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="max-w-sm"
                />
              </div>

              <div className="text-body-sm text-muted-foreground">
                <p className="font-medium mb-xs">Required columns:</p>
                <p>Search term, Clicks, Impr., CTR</p>
                <p className="mt-xs text-metadata">Optional: Campaign, Ad group, Match type, Cost, Conversions, Impr. (Top) %, etc.</p>
              </div>

              {parseError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{parseError}</AlertDescription>
                </Alert>
              )}

              {previewRows.length > 0 && !parseError && (
                <div className="space-y-md">
                  <Alert>
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <AlertDescription>
                      Found {parsedData.length} search terms. Preview below (first 20 rows).
                    </AlertDescription>
                  </Alert>

                  <ScrollArea className="h-[300px] rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Search Term</TableHead>
                          <TableHead>Campaign</TableHead>
                          <TableHead>Ad Group</TableHead>
                          <TableHead>Clicks</TableHead>
                          <TableHead>Impr.</TableHead>
                          <TableHead>CTR</TableHead>
                          <TableHead>Cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewRows.map((row, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium max-w-[200px] truncate">{row.keyword}</TableCell>
                            <TableCell className="max-w-[150px] truncate">{row.campaign}</TableCell>
                            <TableCell className="max-w-[120px] truncate">{row.ad_group}</TableCell>
                            <TableCell>{row.clicks.toLocaleString()}</TableCell>
                            <TableCell>{row.impressions.toLocaleString()}</TableCell>
                            <TableCell>{(row.ctr * 100).toFixed(2)}%</TableCell>
                            <TableCell>${row.cost.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>

                  <Button onClick={confirmUpload}>
                    Confirm & Analyze {parsedData.length} Search Terms
                  </Button>
                </div>
              )}

              {!previewRows.length && !parseError && (
                <EmptyState
                  icon={Upload}
                  title="No file uploaded"
                  description="Upload a CSV export from Google Ads to get started"
                />
              )}
            </div>
          </DataCard>
        </TabsContent>

        <TabsContent value="opportunities" className="mt-lg space-y-md">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-md">
            <Select value={campaignFilter} onValueChange={setCampaignFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Campaign" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                {uniqueCampaigns.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={adGroupFilter} onValueChange={setAdGroupFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Ad Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ad Groups</SelectItem>
                {uniqueAdGroups.map(ag => (
                  <SelectItem key={ag} value={ag}>{ag}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {uniqueMatchTypes.length > 0 && (
              <Select value={matchTypeFilter} onValueChange={setMatchTypeFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Match Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {uniqueMatchTypes.map(mt => (
                    <SelectItem key={mt} value={mt}>{mt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {uniqueThemes.length > 0 && (
              <Select value={themeFilter} onValueChange={setThemeFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Themes</SelectItem>
                  {uniqueThemes.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="flex items-center gap-xs">
              <span className="text-body-sm text-muted-foreground">Min Score:</span>
              <Input
                type="number"
                min={0}
                max={100}
                value={minScore}
                onChange={(e) => setMinScore(parseInt(e.target.value) || 0)}
                className="w-20"
              />
            </div>

            <div className="ml-auto flex gap-xs">
              <Button variant="outline" size="sm" onClick={copyTable}>
                <Copy className="h-4 w-4 mr-xs" /> Copy
              </Button>
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-xs" /> Export CSV
              </Button>
              <Button size="sm" onClick={() => setSaveDialogOpen(true)}>
                <Save className="h-4 w-4 mr-xs" /> Save Analysis
              </Button>
            </div>
          </div>

          <DataCard>
            <DataCardHeader title={`Search Term Opportunities (${filteredData.length})`} />
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Search Term</TableHead>
                    <TableHead>Theme</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Impr.</TableHead>
                    <TableHead>CTR</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Conv.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium max-w-[200px] truncate">{row.keyword}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-metadata">
                          {row.theme_cluster || 'Other'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger>
                            {getScoreBadge(row.opportunity_score || 0)}
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-metadata space-y-xs">
                              <p>CTR Score: {row.score_components?.ctr_score ?? 50}</p>
                              <p>Conv Score: {row.score_components?.conv_score ?? 50}</p>
                              <p>CPA Score: {row.score_components?.cpa_score ?? 50}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate text-muted-foreground">{row.campaign}</TableCell>
                      <TableCell>{row.clicks.toLocaleString()}</TableCell>
                      <TableCell>{row.impressions.toLocaleString()}</TableCell>
                      <TableCell>{(row.ctr * 100).toFixed(2)}%</TableCell>
                      <TableCell>${row.cost.toFixed(2)}</TableCell>
                      <TableCell>{row.conversions}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </DataCard>
        </TabsContent>

        <TabsContent value="clusters" className="mt-lg space-y-md">
          {/* Theme Rules Editor */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-md">
              <span className="text-body-sm text-muted-foreground">
                {themeClusters.length} theme clusters from {filteredData.length} keywords
              </span>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" onClick={openThemeEditor}>
                  <Settings2 className="h-4 w-4 mr-xs" /> Theme Rules
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px]" align="end">
                <div className="space-y-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-body-sm">Edit Theme Rules</span>
                    <Button variant="ghost" size="sm" onClick={resetThemeRules}>
                      <RotateCcw className="h-3 w-3 mr-xs" /> Reset
                    </Button>
                  </div>
                  <p className="text-metadata text-muted-foreground">
                    Format: Theme Name: token1, token2 [priority]
                  </p>
                  <Textarea
                    value={editingThemeRules}
                    onChange={(e) => setEditingThemeRules(e.target.value)}
                    rows={10}
                    className="font-mono text-metadata"
                    placeholder="Gold: gold, xau, xauusd [100]&#10;Oil: oil, wti, brent [90]"
                  />
                  <Button size="sm" className="w-full" onClick={saveThemeRules}>
                    Save Rules
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Cluster Summary Table */}
          <DataCard>
            <DataCardHeader 
              title="Theme Clusters Summary" 
              description="Keywords grouped by trading themes (Gold, Oil, Forex, etc.)"
            />
            {themeClusters.length === 0 ? (
              <EmptyState
                icon={Layers}
                title="No clusters found"
                description="Upload keyword data to see theme clusters"
              />
            ) : (
              <ScrollArea className="h-auto max-h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Theme</TableHead>
                      <TableHead className="text-right"># Keywords</TableHead>
                      <TableHead className="text-right">Impressions</TableHead>
                      <TableHead className="text-right">Clicks</TableHead>
                      <TableHead className="text-right">CTR</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Conv.</TableHead>
                      <TableHead className="text-right">Avg CPA</TableHead>
                      <TableHead className="text-right">Avg Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {themeClusters.map((cluster) => (
                      <TableRow key={cluster.name}>
                        <TableCell>
                          <Badge variant={cluster.name === 'Other' ? 'secondary' : 'default'} className={
                            cluster.name === 'Gold' ? 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30' :
                            cluster.name === 'Oil' ? 'bg-orange-500/15 text-orange-600 border-orange-500/30' :
                            cluster.name === 'Forex' ? 'bg-blue-500/15 text-blue-600 border-blue-500/30' :
                            cluster.name === 'Crypto' ? 'bg-purple-500/15 text-purple-600 border-purple-500/30' :
                            cluster.name === 'Stocks' ? 'bg-green-500/15 text-green-600 border-green-500/30' :
                            cluster.name === 'Indices' ? 'bg-cyan-500/15 text-cyan-600 border-cyan-500/30' :
                            cluster.name === 'Trading' ? 'bg-pink-500/15 text-pink-600 border-pink-500/30' :
                            ''
                          }>
                            {cluster.name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{cluster.keywords.length}</TableCell>
                        <TableCell className="text-right">{cluster.totalImpressions.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{cluster.totalClicks.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{(cluster.avgCTR * 100).toFixed(2)}%</TableCell>
                        <TableCell className="text-right">${cluster.totalCost.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{cluster.totalConversions}</TableCell>
                        <TableCell className="text-right">
                          {cluster.avgCPA > 0 ? `$${cluster.avgCPA.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell className="text-right">{getScoreBadge(Math.round(cluster.avgScore))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </DataCard>

          {/* Cluster Drilldown */}
          <DataCard>
            <DataCardHeader 
              title="Cluster Drilldown" 
              description="Expand each theme to see member keywords"
            />
            <ScrollArea className="h-[400px]">
              <div className="space-y-sm">
                {themeClusters.map(cluster => (
                  <Collapsible key={cluster.name}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-md bg-elevated rounded-lg border border-border hover:bg-card-hover transition-smooth">
                        <div className="flex items-center gap-md">
                          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-90" />
                          <Badge variant={cluster.name === 'Other' ? 'secondary' : 'default'} className={
                            cluster.name === 'Gold' ? 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30' :
                            cluster.name === 'Oil' ? 'bg-orange-500/15 text-orange-600 border-orange-500/30' :
                            cluster.name === 'Forex' ? 'bg-blue-500/15 text-blue-600 border-blue-500/30' :
                            cluster.name === 'Crypto' ? 'bg-purple-500/15 text-purple-600 border-purple-500/30' :
                            cluster.name === 'Stocks' ? 'bg-green-500/15 text-green-600 border-green-500/30' :
                            cluster.name === 'Indices' ? 'bg-cyan-500/15 text-cyan-600 border-cyan-500/30' :
                            cluster.name === 'Trading' ? 'bg-pink-500/15 text-pink-600 border-pink-500/30' :
                            ''
                          }>
                            {cluster.name}
                          </Badge>
                          <span className="text-body-sm text-muted-foreground">
                            {cluster.keywords.length} keywords
                          </span>
                        </div>
                        <div className="flex items-center gap-md text-body-sm text-muted-foreground">
                          <span>{cluster.totalImpressions.toLocaleString()} impr.</span>
                          <span>{cluster.totalClicks.toLocaleString()} clicks</span>
                          <span>${cluster.totalCost.toFixed(2)}</span>
                          {getScoreBadge(Math.round(cluster.avgScore))}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-xs border border-border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-subtle">
                              <TableHead>Keyword</TableHead>
                              <TableHead>Score</TableHead>
                              <TableHead className="text-right">Clicks</TableHead>
                              <TableHead className="text-right">Impr.</TableHead>
                              <TableHead className="text-right">CTR</TableHead>
                              <TableHead className="text-right">Conv.</TableHead>
                              <TableHead className="text-right">CPA</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {cluster.keywords.slice(0, 20).map((kw, i) => (
                              <TableRow key={i}>
                                <TableCell className="font-medium max-w-[250px] truncate">{kw.keyword}</TableCell>
                                <TableCell>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      {getScoreBadge(kw.opportunity_score || 0)}
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="text-metadata space-y-xs">
                                        <p>CTR Score: {kw.score_components?.ctr_score ?? 50}</p>
                                        <p>Conv Score: {kw.score_components?.conv_score ?? 50}</p>
                                        <p>CPA Score: {kw.score_components?.cpa_score ?? 50}</p>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TableCell>
                                <TableCell className="text-right">{kw.clicks}</TableCell>
                                <TableCell className="text-right">{kw.impressions.toLocaleString()}</TableCell>
                                <TableCell className="text-right">{(kw.ctr * 100).toFixed(2)}%</TableCell>
                                <TableCell className="text-right">{kw.conversions}</TableCell>
                                <TableCell className="text-right">
                                  {kw.cost_per_conv > 0 ? `$${kw.cost_per_conv.toFixed(2)}` : 
                                   (kw.conversions > 0 && kw.cost > 0) ? `$${(kw.cost / kw.conversions).toFixed(2)}` : '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {cluster.keywords.length > 20 && (
                          <div className="p-sm text-center text-metadata text-muted-foreground border-t border-border">
                            +{cluster.keywords.length - 20} more keywords
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </ScrollArea>
          </DataCard>
        </TabsContent>

        <TabsContent value="ideas" className="mt-lg">
          <DataCard>
            <DataCardHeader 
              title={`Generated Keyword Ideas (${generatedIdeas.length})`} 
              description="Template-based expansions from your top-performing search terms"
              action={
                <Button variant="outline" size="sm" onClick={() => {
                  navigator.clipboard.writeText(generatedIdeas.join('\n'));
                  toast({ title: "Copied all ideas to clipboard" });
                }}>
                  <Copy className="h-4 w-4 mr-xs" /> Copy All
                </Button>
              }
            />
            
            {generatedIdeas.length === 0 ? (
              <EmptyState
                icon={Lightbulb}
                title="No ideas generated"
                description="Upload search term data to generate expansion ideas"
              />
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-xs">
                  {generatedIdeas.map((idea, i) => (
                    <div 
                      key={i} 
                      className="p-sm bg-elevated rounded border border-border text-body-sm hover:bg-card-hover transition-smooth cursor-pointer"
                      onClick={() => {
                        navigator.clipboard.writeText(idea);
                        toast({ title: "Copied", description: idea });
                      }}
                    >
                      {idea}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </DataCard>
        </TabsContent>

        <TabsContent value="saved" className="mt-lg">
          <SavedKeywordListsTab />
        </TabsContent>
      </Tabs>

      <SaveKeywordListDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        keywords={filteredData}
        onSave={handleSaveAnalysis}
        isSaving={createList.isPending}
      />
    </PageContainer>
  );
}
