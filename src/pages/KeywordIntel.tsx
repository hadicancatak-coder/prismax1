import { useState, useMemo, useCallback } from "react";
import { Search, Upload, TrendingUp, Layers, Lightbulb, Download, Copy, AlertCircle, CheckCircle2, FolderOpen, Save, Settings2, RotateCcw, ChevronRight, Sparkles, Check, X } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useKeywordLists } from "@/hooks/useKeywordLists";
import { useKeywordDictionaries, useLeakageSuggestions, type LeakageSuggestionWithId } from "@/hooks/useKeywordDictionaries";
import { SaveKeywordListDialog } from "@/components/keyword-intel/SaveKeywordListDialog";
import { SavedKeywordListsTab } from "@/components/keyword-intel/SavedKeywordListsTab";
import { 
  processKeywords, 
  type ProcessedKeyword, 
  type CsvParseResult,
  type LeakageSuggestion,
  CLUSTER_TAXONOMY,
} from "@/lib/keywordEngine";

// Types for UI state
interface ClusterSummary {
  name: string;
  keywords: ProcessedKeyword[];
  totalImpressions: number;
  totalClicks: number;
  totalCost: number;
  totalConversions: number;
  avgCTR: number;
  avgCPA: number;
  avgScore: number;
}

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

export default function KeywordIntel() {
  const { toast } = useToast();
  const { createList } = useKeywordLists();
  const { dictionaries, customRules, isLoading: dictionariesLoading } = useKeywordDictionaries();
  
  const [activeTab, setActiveTab] = useState("upload");
  const [processedData, setProcessedData] = useState<ProcessedKeyword[]>([]);
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [leakageSuggestions, setLeakageSuggestions] = useState<LeakageSuggestion[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [sourceFileName, setSourceFileName] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | null>(null);

  // Leakage suggestions from DB
  const { 
    suggestions: dbSuggestions, 
    saveSuggestions, 
    acceptSuggestion, 
    rejectSuggestion 
  } = useLeakageSuggestions(runId);

  // Filters
  const [campaignFilter, setCampaignFilter] = useState<string>("all");
  const [adGroupFilter, setAdGroupFilter] = useState<string>("all");
  const [matchTypeFilter, setMatchTypeFilter] = useState<string>("all");
  const [clusterFilter, setClusterFilter] = useState<string>("all");
  const [intentFilter, setIntentFilter] = useState<string>("all");
  const [minScore, setMinScore] = useState<number>(0);

  // Suggestion editing state
  const [editingSuggestion, setEditingSuggestion] = useState<string | null>(null);
  const [suggestionAcceptAs, setSuggestionAcceptAs] = useState<'competitors' | 'brand_terms' | 'custom_rules'>('competitors');
  const [suggestionCanonical, setSuggestionCanonical] = useState('');
  const [suggestionAlias, setSuggestionAlias] = useState('');
  const [suggestionCluster, setSuggestionCluster] = useState('');
  const [suggestionPattern, setSuggestionPattern] = useState('');

  // Filter data
  const filteredData = useMemo(() => {
    return processedData.filter(kw => {
      if (campaignFilter !== "all" && kw.campaign !== campaignFilter) return false;
      if (adGroupFilter !== "all" && kw.ad_group !== adGroupFilter) return false;
      if (matchTypeFilter !== "all" && kw.match_type !== matchTypeFilter) return false;
      if (clusterFilter !== "all" && kw.cluster_primary !== clusterFilter) return false;
      if (intentFilter !== "all" && kw.intent !== intentFilter) return false;
      if (kw.opportunity_score !== null && kw.opportunity_score < minScore / 100) return false;
      return true;
    }).sort((a, b) => (b.opportunity_score || 0) - (a.opportunity_score || 0));
  }, [processedData, campaignFilter, adGroupFilter, matchTypeFilter, clusterFilter, intentFilter, minScore]);

  // Get unique values for filters
  const uniqueCampaigns = useMemo(() => 
    [...new Set(processedData.map(k => k.campaign).filter(Boolean) as string[])].sort(), 
    [processedData]
  );
  const uniqueAdGroups = useMemo(() => 
    [...new Set(processedData.map(k => k.ad_group).filter(Boolean) as string[])].sort(), 
    [processedData]
  );
  const uniqueMatchTypes = useMemo(() => 
    [...new Set(processedData.map(k => k.match_type).filter(Boolean) as string[])].sort(), 
    [processedData]
  );
  const uniqueClusters = useMemo(() => 
    [...new Set(processedData.map(k => k.cluster_primary).filter(Boolean))].sort(), 
    [processedData]
  );
  const uniqueIntents = useMemo(() => 
    [...new Set(processedData.map(k => k.intent).filter(Boolean))].sort(), 
    [processedData]
  );

  // Group keywords by cluster for summary
  const clusterSummaries = useMemo((): ClusterSummary[] => {
    const clusterMap = new Map<string, ProcessedKeyword[]>();

    filteredData.forEach(kw => {
      const clusterName = kw.cluster_primary || 'Other';
      if (!clusterMap.has(clusterName)) clusterMap.set(clusterName, []);
      clusterMap.get(clusterName)!.push(kw);
    });

    return Array.from(clusterMap.entries())
      .map(([name, items]) => {
        const totalImpressions = items.reduce((sum, k) => sum + k.impressions, 0);
        const totalClicks = items.reduce((sum, k) => sum + k.clicks, 0);
        const totalCost = items.reduce((sum, k) => sum + (k.cost || 0), 0);
        const totalConversions = items.reduce((sum, k) => sum + (k.conversions || 0), 0);
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

  // Generate keyword ideas
  const generatedIdeas = useMemo(() => {
    const ideas = new Set<string>();
    const topKeywords = processedData
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 50);

    topKeywords.forEach(kw => {
      MODIFIERS.forEach(template => {
        ideas.add(template.replace('{keyword}', kw.keyword));
      });
    });

    return Array.from(ideas);
  }, [processedData]);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSourceFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      
      // Process using new engine
      const result = processKeywords(text, dictionaries, customRules);
      
      if (result.parseResult.cleanRows.length === 0) {
        setParseError("Could not find valid data rows. Make sure the file has a 'Search term' column.");
        setProcessedData([]);
        setParseResult(null);
        return;
      }

      setParseError(null);
      setProcessedData(result.rows);
      setParseResult(result.parseResult);
      setLeakageSuggestions(result.leakageSuggestions);
    };
    reader.readAsText(file);
  };

  const confirmUpload = async () => {
    setIsUploaded(true);
    
    // Generate run ID and save leakage suggestions
    const newRunId = crypto.randomUUID();
    setRunId(newRunId);
    
    if (leakageSuggestions.length > 0) {
      await saveSuggestions.mutateAsync({ runId: newRunId, suggestions: leakageSuggestions });
    }
    
    setActiveTab("opportunities");
    toast({ 
      title: "Data imported", 
      description: `${processedData.length} keywords processed with ${leakageSuggestions.length} optimization suggestions` 
    });
  };

  // Export to CSV
  const exportCSV = () => {
    const headers = ['Keyword', 'Cluster', 'Secondary', 'Intent', 'Confidence', 'Matched Rule', 'Score', 'Language', 'Campaign', 'Ad Group', 'Clicks', 'Impr', 'CTR', 'Cost', 'Conv'];
    const rows = filteredData.map(k => [
      `"${k.keyword}"`,
      k.cluster_primary,
      k.cluster_secondary || '',
      k.intent,
      k.confidence.toFixed(2),
      k.matched_rule,
      k.opportunity_score?.toFixed(2) || '0',
      k.tags.language || 'en',
      `"${k.campaign || ''}"`,
      `"${k.ad_group || ''}"`,
      k.clicks,
      k.impressions,
      k.ctr ? (k.ctr * 100).toFixed(2) + '%' : '',
      k.cost?.toFixed(2) || '',
      k.conversions || ''
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
    const headers = ['Keyword', 'Cluster', 'Intent', 'Score', 'Clicks', 'Impr', 'CTR', 'Cost', 'Conv'];
    const rows = filteredData.map(k => [
      k.keyword,
      k.cluster_primary,
      k.intent,
      k.opportunity_score?.toFixed(2) || '0',
      k.clicks,
      k.impressions,
      k.ctr ? (k.ctr * 100).toFixed(2) + '%' : '',
      k.cost?.toFixed(2) || '',
      k.conversions || ''
    ].join('\t'));

    navigator.clipboard.writeText([headers.join('\t'), ...rows].join('\n'));
    toast({ title: "Copied to clipboard" });
  };

  const getScoreBadge = (score: number) => {
    const displayScore = Math.round(score * 100);
    if (displayScore >= 70) return <Badge className="bg-success/15 text-success border-success/30">{displayScore}</Badge>;
    if (displayScore >= 40) return <Badge className="bg-warning/15 text-warning border-warning/30">{displayScore}</Badge>;
    return <Badge variant="secondary">{displayScore}</Badge>;
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) return <Badge className="bg-success/15 text-success border-success/30">{(confidence * 100).toFixed(0)}%</Badge>;
    if (confidence >= 0.7) return <Badge className="bg-warning/15 text-warning border-warning/30">{(confidence * 100).toFixed(0)}%</Badge>;
    return <Badge variant="secondary">{(confidence * 100).toFixed(0)}%</Badge>;
  };

  const getIntentBadge = (intent: string) => {
    const colors: Record<string, string> = {
      'login_access': 'bg-blue-500/15 text-blue-600 border-blue-500/30',
      'transactional_open_account': 'bg-green-500/15 text-green-600 border-green-500/30',
      'app_download': 'bg-purple-500/15 text-purple-600 border-purple-500/30',
      'price_today': 'bg-orange-500/15 text-orange-600 border-orange-500/30',
      'charts_analysis': 'bg-cyan-500/15 text-cyan-600 border-cyan-500/30',
      'how_to_education': 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30',
      'regulation_trust': 'bg-red-500/15 text-red-600 border-red-500/30',
      'news_calendar': 'bg-pink-500/15 text-pink-600 border-pink-500/30',
    };
    return <Badge className={colors[intent] || ''} variant={colors[intent] ? undefined : 'secondary'}>{intent}</Badge>;
  };

  // Handle save analysis
  const handleSaveAnalysis = async (data: { name: string; entity: string; description?: string }) => {
    const items = filteredData.map(kw => ({
      keyword: kw.keyword,
      opportunity_score: kw.opportunity_score ? Math.round(kw.opportunity_score * 100) : null,
      clicks: kw.clicks,
      impressions: kw.impressions,
      ctr: kw.ctr || null,
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

  // Handle suggestion actions
  const handleStartEditSuggestion = (suggestion: LeakageSuggestionWithId) => {
    setEditingSuggestion(suggestion.id);
    
    // Set defaults based on suggestion type
    if (suggestion.suggestion_type === 'alias_candidate' || suggestion.suggestion_type === 'dictionary_candidate') {
      setSuggestionAcceptAs(suggestion.proposed_dict_name as 'competitors' | 'brand_terms' || 'competitors');
      setSuggestionCanonical(suggestion.proposed_canonical || suggestion.extracted_phrase);
      setSuggestionAlias(suggestion.proposed_alias || suggestion.extracted_phrase);
    } else {
      setSuggestionAcceptAs('custom_rules');
      setSuggestionPattern(suggestion.extracted_phrase);
      setSuggestionCluster('Trading - Generic');
    }
  };

  const handleAcceptSuggestion = async (id: string) => {
    await acceptSuggestion.mutateAsync({
      id,
      accept_as: suggestionAcceptAs,
      chosen_canonical: suggestionCanonical,
      chosen_alias: suggestionAlias,
      chosen_cluster_primary: suggestionCluster,
      chosen_rule_pattern: suggestionPattern,
    });
    
    setEditingSuggestion(null);
    
    // Reclassify affected rows in memory
    if (suggestionAcceptAs === 'competitors' || suggestionAcceptAs === 'brand_terms') {
      setProcessedData(prev => prev.map(row => {
        const aliasLower = suggestionAlias.toLowerCase();
        if (row.cluster_primary.startsWith('Other') && row.keyword.toLowerCase().includes(aliasLower)) {
          return {
            ...row,
            cluster_primary: suggestionAcceptAs === 'competitors' ? 'Competitors' : 'Brand - CFI',
            cluster_secondary: suggestionAcceptAs === 'competitors' ? suggestionCanonical : null,
            matched_rule: `DICT:${suggestionAcceptAs}:${suggestionCanonical}`,
            confidence: 1.0,
          };
        }
        return row;
      }));
    } else if (suggestionAcceptAs === 'custom_rules' && suggestionCluster && suggestionPattern) {
      setProcessedData(prev => prev.map(row => {
        const patternLower = suggestionPattern.toLowerCase();
        if (row.cluster_primary.startsWith('Other') && row.keyword.toLowerCase().includes(patternLower)) {
          return {
            ...row,
            cluster_primary: suggestionCluster,
            matched_rule: `CUSTOM_RULE:${suggestionPattern}`,
            confidence: 0.85,
          };
        }
        return row;
      }));
    }
  };

  const handleRejectSuggestion = async (id: string) => {
    await rejectSuggestion.mutateAsync(id);
    setEditingSuggestion(null);
  };

  // Pending suggestions
  const pendingSuggestions = useMemo(() => 
    dbSuggestions.filter(s => s.status === 'pending'),
    [dbSuggestions]
  );

  return (
    <PageContainer>
      <PageHeader
        icon={Search}
        title="Keyword Intel"
        description="Analyze search term performance with AI-powered clustering and intent detection"
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
          <TabsTrigger value="suggestions" className="gap-xs" disabled={!isUploaded || pendingSuggestions.length === 0}>
            <Sparkles className="h-4 w-4" /> Suggestions
            {pendingSuggestions.length > 0 && (
              <Badge variant="secondary" className="ml-xs">{pendingSuggestions.length}</Badge>
            )}
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
              description="Upload a CSV file with search term performance data. Supports English and Arabic."
            />
            <div className="space-y-md">
              <div className="flex items-center gap-md">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="max-w-sm"
                  disabled={dictionariesLoading}
                />
                {dictionariesLoading && (
                  <span className="text-body-sm text-muted-foreground">Loading dictionaries...</span>
                )}
              </div>

              <div className="text-body-sm text-muted-foreground">
                <p className="font-medium mb-xs">Required columns:</p>
                <p>Search term (or مصطلح البحث), Clicks, Impressions, CTR</p>
                <p className="mt-xs text-metadata">Optional: Campaign, Ad group, Match type, Cost, Conversions</p>
              </div>

              {parseError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{parseError}</AlertDescription>
                </Alert>
              )}

              {parseResult && processedData.length > 0 && !parseError && (
                <div className="space-y-md">
                  <Alert>
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <AlertDescription>
                      Processed {parseResult.rowCountClean} of {parseResult.rowCountRaw} rows. 
                      Found {leakageSuggestions.length} optimization suggestions.
                    </AlertDescription>
                  </Alert>

                  {/* Stats Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
                    <div className="p-md bg-elevated rounded-lg border border-border">
                      <p className="text-metadata text-muted-foreground">Total Keywords</p>
                      <p className="text-heading-md font-semibold">{processedData.length}</p>
                    </div>
                    <div className="p-md bg-elevated rounded-lg border border-border">
                      <p className="text-metadata text-muted-foreground">Clusters Identified</p>
                      <p className="text-heading-md font-semibold">{uniqueClusters.length}</p>
                    </div>
                    <div className="p-md bg-elevated rounded-lg border border-border">
                      <p className="text-metadata text-muted-foreground">Intents Detected</p>
                      <p className="text-heading-md font-semibold">{uniqueIntents.length}</p>
                    </div>
                    <div className="p-md bg-elevated rounded-lg border border-border">
                      <p className="text-metadata text-muted-foreground">Leakage Suggestions</p>
                      <p className="text-heading-md font-semibold">{leakageSuggestions.length}</p>
                    </div>
                  </div>

                  <ScrollArea className="h-[300px] rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Search Term</TableHead>
                          <TableHead>Cluster</TableHead>
                          <TableHead>Intent</TableHead>
                          <TableHead>Confidence</TableHead>
                          <TableHead>Language</TableHead>
                          <TableHead>Clicks</TableHead>
                          <TableHead>Impr.</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {processedData.slice(0, 20).map((row, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium max-w-[200px] truncate">{row.keyword}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-metadata">
                                {row.cluster_primary}
                              </Badge>
                            </TableCell>
                            <TableCell>{getIntentBadge(row.intent)}</TableCell>
                            <TableCell>{getConfidenceBadge(row.confidence)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-metadata">{row.tags.language}</Badge>
                            </TableCell>
                            <TableCell>{row.clicks.toLocaleString()}</TableCell>
                            <TableCell>{row.impressions.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>

                  <Button onClick={confirmUpload}>
                    Confirm & Analyze {processedData.length} Search Terms
                  </Button>
                </div>
              )}

              {!processedData.length && !parseError && (
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

            {uniqueClusters.length > 0 && (
              <Select value={clusterFilter} onValueChange={setClusterFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Cluster" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clusters</SelectItem>
                  {uniqueClusters.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {uniqueIntents.length > 0 && (
              <Select value={intentFilter} onValueChange={setIntentFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Intent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Intents</SelectItem>
                  {uniqueIntents.map(i => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
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
                    <TableHead>Cluster</TableHead>
                    <TableHead>Secondary</TableHead>
                    <TableHead>Intent</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Conf.</TableHead>
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
                      <TableCell className="font-medium max-w-[200px] truncate">
                        <Tooltip>
                          <TooltipTrigger className="text-left truncate block max-w-[200px]">
                            {row.keyword}
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{row.keyword}</p>
                            <p className="text-metadata text-muted-foreground mt-xs">
                              Rule: {row.matched_rule}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-metadata">
                          {row.cluster_primary}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-metadata">
                        {row.cluster_secondary || '-'}
                      </TableCell>
                      <TableCell>{getIntentBadge(row.intent)}</TableCell>
                      <TableCell>{row.opportunity_score !== null ? getScoreBadge(row.opportunity_score) : '-'}</TableCell>
                      <TableCell>{getConfidenceBadge(row.confidence)}</TableCell>
                      <TableCell>{row.clicks.toLocaleString()}</TableCell>
                      <TableCell>{row.impressions.toLocaleString()}</TableCell>
                      <TableCell>{row.ctr ? (row.ctr * 100).toFixed(2) + '%' : '-'}</TableCell>
                      <TableCell>{row.cost ? '$' + row.cost.toFixed(2) : '-'}</TableCell>
                      <TableCell>{row.conversions || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </DataCard>
        </TabsContent>

        <TabsContent value="clusters" className="mt-lg space-y-md">
          {/* Cluster Summary Table */}
          <DataCard>
            <DataCardHeader 
              title="Cluster Summary" 
              description="Keywords auto-grouped by the engine's classification rules (dictionaries + regex patterns)"
            />
            {clusterSummaries.length === 0 ? (
              <EmptyState
                icon={Layers}
                title="No clusters found"
                description="Upload keyword data to see clusters"
              />
            ) : (
              <ScrollArea className="h-auto max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cluster</TableHead>
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
                    {clusterSummaries.map((summary) => (
                      <TableRow key={summary.name}>
                        <TableCell>
                          <Badge variant={summary.name.startsWith('Other') || summary.name === 'Junk / Noise' ? 'secondary' : 'default'}>
                            {summary.name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{summary.keywords.length}</TableCell>
                        <TableCell className="text-right">{summary.totalImpressions.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{summary.totalClicks.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{(summary.avgCTR * 100).toFixed(2)}%</TableCell>
                        <TableCell className="text-right">${summary.totalCost.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{summary.totalConversions}</TableCell>
                        <TableCell className="text-right">
                          {summary.avgCPA > 0 ? `$${summary.avgCPA.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell className="text-right">{getScoreBadge(summary.avgScore)}</TableCell>
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
              description="Expand to see keywords with their classification details"
            />
            <ScrollArea className="h-[400px]">
              <div className="space-y-sm">
                {clusterSummaries.map(summary => (
                  <Collapsible key={summary.name}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-md bg-elevated rounded-lg border border-border hover:bg-card-hover transition-smooth">
                        <div className="flex items-center gap-md">
                          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-90" />
                          <Badge variant={summary.name.startsWith('Other') ? 'secondary' : 'default'}>
                            {summary.name}
                          </Badge>
                          <span className="text-body-sm text-muted-foreground">
                            {summary.keywords.length} keywords
                          </span>
                        </div>
                        <div className="flex items-center gap-md text-body-sm text-muted-foreground">
                          <span>{summary.totalImpressions.toLocaleString()} impr.</span>
                          <span>{summary.totalClicks.toLocaleString()} clicks</span>
                          {getScoreBadge(summary.avgScore)}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-xs border border-border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-subtle">
                              <TableHead>Keyword</TableHead>
                              <TableHead>Intent</TableHead>
                              <TableHead>Matched Rule</TableHead>
                              <TableHead>Score</TableHead>
                              <TableHead className="text-right">Clicks</TableHead>
                              <TableHead className="text-right">Impr.</TableHead>
                              <TableHead className="text-right">Conv.</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {summary.keywords.slice(0, 20).map((kw, i) => (
                              <TableRow key={i}>
                                <TableCell className="font-medium max-w-[200px] truncate">{kw.keyword}</TableCell>
                                <TableCell>{getIntentBadge(kw.intent)}</TableCell>
                                <TableCell className="text-muted-foreground text-metadata max-w-[150px] truncate">
                                  {kw.matched_rule}
                                </TableCell>
                                <TableCell>{kw.opportunity_score !== null ? getScoreBadge(kw.opportunity_score) : '-'}</TableCell>
                                <TableCell className="text-right">{kw.clicks}</TableCell>
                                <TableCell className="text-right">{kw.impressions.toLocaleString()}</TableCell>
                                <TableCell className="text-right">{kw.conversions || '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {summary.keywords.length > 20 && (
                          <div className="p-sm text-center text-metadata text-muted-foreground border-t border-border">
                            +{summary.keywords.length - 20} more keywords
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

        <TabsContent value="suggestions" className="mt-lg">
          <DataCard>
            <DataCardHeader 
              title={`Leakage Suggestions (${pendingSuggestions.length})`}
              description="High-cost keywords in 'Other' that may belong to known clusters. Accept to add to dictionaries."
            />
            
            {pendingSuggestions.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title="No pending suggestions"
                description="All suggestions have been processed"
              />
            ) : (
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phrase</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Evidence (Cost)</TableHead>
                      <TableHead>Accept As</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingSuggestions.map((suggestion) => (
                      <TableRow key={suggestion.id}>
                        <TableCell className="font-medium">{suggestion.extracted_phrase}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-metadata">
                            {suggestion.suggestion_type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger>
                              <span className="text-muted-foreground">
                                ${suggestion.evidence_cost.toFixed(2)} / {suggestion.evidence_clicks} clicks
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="max-w-xs">
                                <p className="font-medium mb-xs">Evidence terms:</p>
                                <ul className="text-metadata space-y-xs">
                                  {suggestion.evidence_terms.slice(0, 5).map((t, i) => (
                                    <li key={i} className="truncate">{t}</li>
                                  ))}
                                </ul>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          {editingSuggestion === suggestion.id ? (
                            <Select value={suggestionAcceptAs} onValueChange={(v: 'competitors' | 'brand_terms' | 'custom_rules') => setSuggestionAcceptAs(v)}>
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="competitors">Competitor</SelectItem>
                                <SelectItem value="brand_terms">Brand</SelectItem>
                                <SelectItem value="custom_rules">Custom Rule</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingSuggestion === suggestion.id ? (
                            <div className="space-y-xs">
                              {suggestionAcceptAs !== 'custom_rules' ? (
                                <>
                                  <Input
                                    placeholder="Canonical"
                                    value={suggestionCanonical}
                                    onChange={(e) => setSuggestionCanonical(e.target.value)}
                                    className="h-8 text-sm"
                                  />
                                  <Input
                                    placeholder="Alias"
                                    value={suggestionAlias}
                                    onChange={(e) => setSuggestionAlias(e.target.value)}
                                    className="h-8 text-sm"
                                  />
                                </>
                              ) : (
                                <>
                                  <Select value={suggestionCluster} onValueChange={setSuggestionCluster}>
                                    <SelectTrigger className="h-8 text-sm">
                                      <SelectValue placeholder="Target cluster" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {CLUSTER_TAXONOMY.filter(c => !c.startsWith('Other') && c !== 'Junk / Noise').map(c => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    placeholder="Pattern"
                                    value={suggestionPattern}
                                    onChange={(e) => setSuggestionPattern(e.target.value)}
                                    className="h-8 text-sm"
                                  />
                                </>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-metadata">
                              {suggestion.proposed_canonical || suggestion.extracted_phrase}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingSuggestion === suggestion.id ? (
                            <div className="flex gap-xs">
                              <Button 
                                size="sm" 
                                onClick={() => handleAcceptSuggestion(suggestion.id)}
                                disabled={acceptSuggestion.isPending}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => setEditingSuggestion(null)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-xs">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleStartEditSuggestion(suggestion)}
                              >
                                Accept
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleRejectSuggestion(suggestion.id)}
                                disabled={rejectSuggestion.isPending}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
        keywords={filteredData.map(kw => ({
          keyword: kw.keyword,
          opportunity_score: kw.opportunity_score ? Math.round(kw.opportunity_score * 100) : null,
          clicks: kw.clicks,
          impressions: kw.impressions,
          ctr: kw.ctr || null,
          cost: kw.cost,
          conversions: kw.conversions,
          campaign: kw.campaign,
          ad_group: kw.ad_group,
          match_type: kw.match_type,
        }))}
        onSave={handleSaveAnalysis}
        isSaving={createList.isPending}
      />
    </PageContainer>
  );
}
