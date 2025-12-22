import { useState, useMemo, useCallback } from "react";
import { Search, Upload, TrendingUp, Layers, Lightbulb, Download, Copy, AlertCircle, CheckCircle2, FolderOpen, Save } from "lucide-react";
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
}

interface KeywordCluster {
  id: string;
  name: string;
  campaign: string;
  adGroup: string;
  keywords: KeywordRow[];
  totalImpressions: number;
  totalClicks: number;
  totalCost: number;
  avgScore: number;
}

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
  const [minScore, setMinScore] = useState<number>(0);

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
      
      // Skip "Total" summary rows
      const firstValue = values[0]?.toLowerCase().trim();
      if (firstValue === 'total' || firstValue === 'totals') continue;

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

  // Calculate opportunity score - Updated for Google Ads data
  const calculateOpportunityScore = useCallback((keyword: KeywordRow, avgCTR: number): number => {
    let score = 0;

    // 1. Impression Volume (0-40 points)
    const impressionScore = Math.min(40, Math.log10(keyword.impressions + 1) * 10);
    score += impressionScore;

    // 2. CTR Gap Bonus (0-25 points)
    if (keyword.ctr < avgCTR && avgCTR > 0) {
      const ctrGap = (avgCTR - keyword.ctr) / avgCTR;
      score += Math.min(25, ctrGap * 50);
    }

    // 3. Top Impression Potential (0-25 points) - lower top impr % = more room to improve
    if (keyword.impr_top_pct < 0.5) {
      score += Math.min(25, (0.5 - keyword.impr_top_pct) * 50);
    }

    // 4. Conversion Performance (0-10 points)
    if (keyword.conversions > 0) {
      score += Math.min(10, keyword.conversions * 2);
    }

    return Math.round(Math.min(100, score));
  }, []);

  // Score all keywords
  const scoredData = useMemo(() => {
    if (parsedData.length === 0) return [];
    const avgCTR = parsedData.reduce((sum, k) => sum + k.ctr, 0) / parsedData.length;
    return parsedData.map(kw => ({
      ...kw,
      opportunity_score: calculateOpportunityScore(kw, avgCTR)
    }));
  }, [parsedData, calculateOpportunityScore]);

  // Filter data
  const filteredData = useMemo(() => {
    return scoredData.filter(kw => {
      if (campaignFilter !== "all" && kw.campaign !== campaignFilter) return false;
      if (adGroupFilter !== "all" && kw.ad_group !== adGroupFilter) return false;
      if (matchTypeFilter !== "all" && kw.match_type !== matchTypeFilter) return false;
      if (kw.opportunity_score !== undefined && kw.opportunity_score < minScore) return false;
      return true;
    }).sort((a, b) => (b.opportunity_score || 0) - (a.opportunity_score || 0));
  }, [scoredData, campaignFilter, adGroupFilter, matchTypeFilter, minScore]);

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

  // Cluster keywords - by Campaign + Ad Group + stem
  const clusters = useMemo((): KeywordCluster[] => {
    const clusterMap = new Map<string, KeywordRow[]>();

    filteredData.forEach(kw => {
      const campaignKey = kw.campaign || 'no-campaign';
      const adGroupKey = kw.ad_group || 'no-adgroup';
      const stem = kw.keyword.split(' ').slice(0, 2).join(' ').toLowerCase();
      const clusterKey = `${campaignKey}|${adGroupKey}|${stem}`;

      if (!clusterMap.has(clusterKey)) clusterMap.set(clusterKey, []);
      clusterMap.get(clusterKey)!.push(kw);
    });

    return Array.from(clusterMap.entries())
      .map(([key, items]) => ({
        id: key,
        name: items[0].keyword.split(' ').slice(0, 2).join(' '),
        campaign: items[0].campaign,
        adGroup: items[0].ad_group,
        keywords: items,
        totalImpressions: items.reduce((sum, k) => sum + k.impressions, 0),
        totalClicks: items.reduce((sum, k) => sum + k.clicks, 0),
        totalCost: items.reduce((sum, k) => sum + k.cost, 0),
        avgScore: items.reduce((sum, k) => sum + (k.opportunity_score || 0), 0) / items.length,
      }))
      .filter(c => c.keywords.length > 1)
      .sort((a, b) => b.avgScore - a.avgScore);
  }, [filteredData]);

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
    const headers = ['Keyword', 'Opportunity Score', 'Campaign', 'Ad Group', 'Match Type', 'Clicks', 'Impressions', 'CTR', 'Top Impr %', 'Cost', 'Conversions'];
    const rows = filteredData.map(k => [
      `"${k.keyword}"`,
      k.opportunity_score || 0,
      `"${k.campaign}"`,
      `"${k.ad_group}"`,
      k.match_type,
      k.clicks,
      k.impressions,
      (k.ctr * 100).toFixed(2) + '%',
      (k.impr_top_pct * 100).toFixed(1) + '%',
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
    const headers = ['Keyword', 'Score', 'Campaign', 'Ad Group', 'Clicks', 'Impressions', 'CTR', 'Cost', 'Conversions'];
    const rows = filteredData.map(k => [
      k.keyword,
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
                    <TableHead>Score</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Impr.</TableHead>
                    <TableHead>CTR</TableHead>
                    <TableHead>Top Impr %</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Conv.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium max-w-[200px] truncate">{row.keyword}</TableCell>
                      <TableCell>{getScoreBadge(row.opportunity_score || 0)}</TableCell>
                      <TableCell className="max-w-[150px] truncate text-muted-foreground">{row.campaign}</TableCell>
                      <TableCell>{row.clicks.toLocaleString()}</TableCell>
                      <TableCell>{row.impressions.toLocaleString()}</TableCell>
                      <TableCell>{(row.ctr * 100).toFixed(2)}%</TableCell>
                      <TableCell>{(row.impr_top_pct * 100).toFixed(1)}%</TableCell>
                      <TableCell>${row.cost.toFixed(2)}</TableCell>
                      <TableCell>{row.conversions}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </DataCard>
        </TabsContent>

        <TabsContent value="clusters" className="mt-lg">
          <DataCard>
            <DataCardHeader 
              title={`Search Term Clusters (${clusters.length})`} 
              description="Search terms grouped by campaign, ad group, and shared stem"
            />
            {clusters.length === 0 ? (
              <EmptyState
                icon={Layers}
                title="No clusters found"
                description="Clusters require at least 2 search terms with shared characteristics"
              />
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-sm">
                  {clusters.map(cluster => (
                    <Collapsible key={cluster.id}>
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between p-md bg-elevated rounded-lg border border-border hover:bg-card-hover transition-smooth">
                          <div className="flex items-center gap-md">
                            <Layers className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{cluster.name}</span>
                            <Badge variant="secondary">{cluster.keywords.length} terms</Badge>
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
                        <div className="mt-xs ml-lg border-l-2 border-border pl-md">
                          <p className="text-metadata text-muted-foreground py-xs">
                            {cluster.campaign} / {cluster.adGroup}
                          </p>
                          {cluster.keywords.map((kw, i) => (
                            <div key={i} className="py-xs flex items-center justify-between text-body-sm">
                              <span>{kw.keyword}</span>
                              <div className="flex items-center gap-md text-muted-foreground">
                                <span>{kw.match_type}</span>
                                <span>{kw.impressions.toLocaleString()}</span>
                                {getScoreBadge(kw.opportunity_score || 0)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </ScrollArea>
            )}
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
