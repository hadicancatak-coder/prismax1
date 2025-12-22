import { useState, useMemo, useCallback } from "react";
import { Search, Upload, TrendingUp, Layers, Lightbulb, Download, Copy, AlertCircle, CheckCircle2 } from "lucide-react";
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
import { cn } from "@/lib/utils";

// Types
interface KeywordRow {
  keyword: string;
  clicks: number;
  impressions: number;
  ctr: number;
  avg_position: number;
  page_url: string;
  country: string;
  device: string;
  date_range: string;
  conversion_rate?: number;
  revenue?: number;
  intent_label?: string;
  opportunity_score?: number;
}

interface KeywordCluster {
  id: string;
  name: string;
  pageUrl: string;
  keywords: KeywordRow[];
  totalImpressions: number;
  avgPosition: number;
  avgScore: number;
}

const REQUIRED_COLUMNS = ['keyword', 'clicks', 'impressions', 'ctr', 'avg_position', 'page_url', 'country', 'device', 'date_range'];

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
  const [activeTab, setActiveTab] = useState("upload");
  const [parsedData, setParsedData] = useState<KeywordRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<KeywordRow[]>([]);
  const [isUploaded, setIsUploaded] = useState(false);

  // Filters
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [minScore, setMinScore] = useState<number>(0);
  const [intentFilter, setIntentFilter] = useState<string>("all");

  // Parse CSV
  const parseCSV = useCallback((text: string): { data: KeywordRow[]; error: string | null } => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return { data: [], error: "CSV file is empty or has no data rows" };

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    const missingColumns = REQUIRED_COLUMNS.filter(col => !headers.includes(col));

    if (missingColumns.length > 0) {
      return { data: [], error: `Missing required columns: ${missingColumns.join(', ')}` };
    }

    const data: KeywordRow[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''));
      if (values.length < headers.length) continue;

      try {
        const row: KeywordRow = {
          keyword: values[headers.indexOf('keyword')] || '',
          clicks: parseInt(values[headers.indexOf('clicks')]) || 0,
          impressions: parseInt(values[headers.indexOf('impressions')]) || 0,
          ctr: parseFloat(values[headers.indexOf('ctr')]) || 0,
          avg_position: parseFloat(values[headers.indexOf('avg_position')]) || 0,
          page_url: values[headers.indexOf('page_url')] || '',
          country: values[headers.indexOf('country')] || '',
          device: values[headers.indexOf('device')] || '',
          date_range: values[headers.indexOf('date_range')] || '',
        };

        // Optional columns
        if (headers.includes('conversion_rate')) {
          row.conversion_rate = parseFloat(values[headers.indexOf('conversion_rate')]) || undefined;
        }
        if (headers.includes('revenue')) {
          row.revenue = parseFloat(values[headers.indexOf('revenue')]) || undefined;
        }
        if (headers.includes('intent_label')) {
          row.intent_label = values[headers.indexOf('intent_label')] || undefined;
        }

        if (row.keyword) data.push(row);
      } catch {
        errors.push(`Row ${i + 1}: Invalid data format`);
      }
    }

    if (errors.length > 0 && data.length === 0) {
      return { data: [], error: errors.slice(0, 3).join('; ') };
    }

    return { data, error: null };
  }, []);

  // Calculate opportunity score
  const calculateOpportunityScore = useCallback((keyword: KeywordRow, avgCTR: number): number => {
    let score = 0;

    // 1. Impression Volume (0-40 points)
    const impressionScore = Math.min(40, Math.log10(keyword.impressions + 1) * 10);
    score += impressionScore;

    // 2. CTR Gap Bonus (0-25 points)
    if (keyword.ctr < avgCTR) {
      const ctrGap = (avgCTR - keyword.ctr) / avgCTR;
      score += Math.min(25, ctrGap * 50);
    }

    // 3. Position Sweet Spot (0-25 points) - positions 4-15
    if (keyword.avg_position >= 4 && keyword.avg_position <= 15) {
      const positionScore = 25 - Math.abs(keyword.avg_position - 8) * 2;
      score += Math.max(0, positionScore);
    }

    // 4. Intent Multiplier (0-10 points)
    if (keyword.intent_label) {
      const intentBonus: Record<string, number> = { 
        'transactional': 10, 
        'commercial': 8, 
        'informational': 4, 
        'navigational': 2 
      };
      score += intentBonus[keyword.intent_label.toLowerCase()] || 0;
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
      if (countryFilter !== "all" && kw.country !== countryFilter) return false;
      if (kw.opportunity_score !== undefined && kw.opportunity_score < minScore) return false;
      if (intentFilter !== "all" && kw.intent_label !== intentFilter) return false;
      return true;
    }).sort((a, b) => (b.opportunity_score || 0) - (a.opportunity_score || 0));
  }, [scoredData, countryFilter, minScore, intentFilter]);

  // Get unique values for filters
  const uniqueCountries = useMemo(() => 
    [...new Set(scoredData.map(k => k.country).filter(Boolean))], 
    [scoredData]
  );
  const uniqueIntents = useMemo(() => 
    [...new Set(scoredData.map(k => k.intent_label).filter(Boolean))], 
    [scoredData]
  );
  const hasIntentColumn = uniqueIntents.length > 0;

  // Cluster keywords
  const clusters = useMemo((): KeywordCluster[] => {
    const clusterMap = new Map<string, KeywordRow[]>();

    filteredData.forEach(kw => {
      const stem = kw.keyword.split(' ').slice(0, 2).join(' ').toLowerCase();
      const pageKey = kw.page_url || 'no-page';
      const clusterKey = `${pageKey}|${stem}`;

      if (!clusterMap.has(clusterKey)) clusterMap.set(clusterKey, []);
      clusterMap.get(clusterKey)!.push(kw);
    });

    return Array.from(clusterMap.entries())
      .map(([key, items]) => ({
        id: key,
        name: items[0].keyword.split(' ').slice(0, 2).join(' '),
        pageUrl: items[0].page_url,
        keywords: items,
        totalImpressions: items.reduce((sum, k) => sum + k.impressions, 0),
        avgPosition: items.reduce((sum, k) => sum + k.avg_position, 0) / items.length,
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
    const headers = ['keyword', 'opportunity_score', 'clicks', 'impressions', 'ctr', 'avg_position', 'page_url', 'country'];
    const rows = filteredData.map(k => [
      k.keyword,
      k.opportunity_score,
      k.clicks,
      k.impressions,
      k.ctr,
      k.avg_position,
      k.page_url,
      k.country
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
    const text = filteredData.map(k => 
      `${k.keyword}\t${k.opportunity_score}\t${k.clicks}\t${k.impressions}\t${k.ctr}\t${k.avg_position}`
    ).join('\n');
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const getScoreBadge = (score: number) => {
    if (score >= 70) return <Badge className="bg-success/15 text-success border-success/30">{score}</Badge>;
    if (score >= 40) return <Badge className="bg-warning/15 text-warning border-warning/30">{score}</Badge>;
    return <Badge variant="secondary">{score}</Badge>;
  };

  return (
    <PageContainer>
      <PageHeader
        icon={Search}
        title="Keyword Intel"
        description="Analyze keyword performance and discover optimization opportunities"
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
        </TabsList>

        <TabsContent value="upload" className="mt-lg">
          <DataCard>
            <DataCardHeader 
              title="Upload Search Console Export" 
              description="Upload a CSV file with keyword performance data"
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
                <p>{REQUIRED_COLUMNS.join(', ')}</p>
                <p className="mt-xs text-metadata">Optional: conversion_rate, revenue, intent_label</p>
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
                      Found {parsedData.length} keywords. Preview below (first 20 rows).
                    </AlertDescription>
                  </Alert>

                  <ScrollArea className="h-[300px] rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Keyword</TableHead>
                          <TableHead>Clicks</TableHead>
                          <TableHead>Impressions</TableHead>
                          <TableHead>CTR</TableHead>
                          <TableHead>Position</TableHead>
                          <TableHead>Country</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewRows.map((row, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{row.keyword}</TableCell>
                            <TableCell>{row.clicks}</TableCell>
                            <TableCell>{row.impressions}</TableCell>
                            <TableCell>{(row.ctr * 100).toFixed(2)}%</TableCell>
                            <TableCell>{row.avg_position.toFixed(1)}</TableCell>
                            <TableCell>{row.country}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>

                  <Button onClick={confirmUpload}>
                    Confirm & Analyze {parsedData.length} Keywords
                  </Button>
                </div>
              )}

              {!previewRows.length && !parseError && (
                <EmptyState
                  icon={Upload}
                  title="No file uploaded"
                  description="Upload a CSV export from Google Search Console to get started"
                />
              )}
            </div>
          </DataCard>
        </TabsContent>

        <TabsContent value="opportunities" className="mt-lg space-y-md">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-md">
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {uniqueCountries.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

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

            {hasIntentColumn && (
              <Select value={intentFilter} onValueChange={setIntentFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Intent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Intents</SelectItem>
                  {uniqueIntents.map(i => (
                    <SelectItem key={i} value={i!}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="ml-auto flex gap-xs">
              <Button variant="outline" size="sm" onClick={copyTable}>
                <Copy className="h-4 w-4 mr-xs" /> Copy
              </Button>
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-xs" /> Export CSV
              </Button>
            </div>
          </div>

          <DataCard>
            <DataCardHeader title={`Keyword Opportunities (${filteredData.length})`} />
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Impressions</TableHead>
                    <TableHead>CTR</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Page URL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium max-w-[200px] truncate">{row.keyword}</TableCell>
                      <TableCell>{getScoreBadge(row.opportunity_score || 0)}</TableCell>
                      <TableCell>{row.clicks.toLocaleString()}</TableCell>
                      <TableCell>{row.impressions.toLocaleString()}</TableCell>
                      <TableCell>{(row.ctr * 100).toFixed(2)}%</TableCell>
                      <TableCell>{row.avg_position.toFixed(1)}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">{row.page_url}</TableCell>
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
              title={`Keyword Clusters (${clusters.length})`} 
              description="Keywords grouped by shared stem and ranking page"
            />
            {clusters.length === 0 ? (
              <EmptyState
                icon={Layers}
                title="No clusters found"
                description="Clusters require at least 2 keywords with shared characteristics"
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
                            <Badge variant="secondary">{cluster.keywords.length} keywords</Badge>
                          </div>
                          <div className="flex items-center gap-md text-body-sm text-muted-foreground">
                            <span>{cluster.totalImpressions.toLocaleString()} impr.</span>
                            <span>Pos: {cluster.avgPosition.toFixed(1)}</span>
                            {getScoreBadge(Math.round(cluster.avgScore))}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-xs ml-lg border-l-2 border-border pl-md">
                          {cluster.keywords.map((kw, i) => (
                            <div key={i} className="py-xs flex items-center justify-between text-body-sm">
                              <span>{kw.keyword}</span>
                              <div className="flex items-center gap-md text-muted-foreground">
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
              description="Template-based expansions from your top-performing keywords"
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
                description="Upload keyword data to generate expansion ideas"
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
      </Tabs>
    </PageContainer>
  );
}
