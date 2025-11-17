import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Plus, Copy, Trash2, ExternalLink, Monitor, Smartphone } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { useUtmCampaigns } from "@/hooks/useUtmCampaigns";
import { useUtmPlatforms } from "@/hooks/useUtmPlatforms";
import { useSystemEntities } from "@/hooks/useSystemEntities";
import { useUtmLpTypes } from "@/hooks/useUtmLpTypes";
import { supabase } from "@/integrations/supabase/client";
import { buildUtmUrl, calculateUtmMedium, generateUtmCampaignByPurpose } from "@/lib/utmHelpers";
import { detectLPMetadata, LPDetectionResult } from "@/lib/lpDetector";
import { LPDetectionCard } from "./LPDetectionCard";
import { InlineEditSelect } from "./InlineEditSelect";
import { InlineEditBadge } from "./InlineEditBadge";

interface SavedLP {
  id: string;
  url: string;
  country: string;
  language: string;
  purpose: string;
  platform: string;
  lpType: 'static' | 'dynamic';
  utmContent: 'web' | 'mobile';
  lpTypeId?: string | null;
}

export function ReadyLinksBuilder() {
  const queryClient = useQueryClient();
  const { data: campaigns = [] } = useUtmCampaigns();
  const { data: platforms = [] } = useUtmPlatforms();
  const { data: entities = [] } = useSystemEntities();
  const { data: lpTypes = [] } = useUtmLpTypes();
  const { copy: copyToClipboard } = useCopyToClipboard();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newLP, setNewLP] = useState({ url: '', country: '', language: 'EN', platform: '', utmContent: 'web' as 'web' | 'mobile', lpTypeId: null as string | null });
  const [detectionResult, setDetectionResult] = useState<LPDetectionResult | null>(null);

  // Fetch landing page templates
  const { data: templates = [] } = useQuery({
    queryKey: ['landing-page-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_page_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Transform templates into SavedLP format
  const savedLPs: SavedLP[] = useMemo(() => {
    return templates.map(template => ({
      id: template.id,
      url: template.base_url,
      country: template.country || '',
      language: template.language || 'EN',
      purpose: template.purpose || '',
      platform: template.platform || '',
      lpType: (template.lp_type as 'static' | 'dynamic') || 'static',
      utmContent: (template.utm_content as 'web' | 'mobile') || 'web',
      lpTypeId: template.lp_type_id || null,
    }));
  }, [templates]);

  const entityOptions = entities.map(e => ({ 
    value: e.name, 
    label: e.emoji ? `${e.emoji} ${e.name}` : e.name 
  }));

  // Mutation to create template
  const createTemplate = useMutation({
    mutationFn: async (template: Omit<typeof newLP, 'purpose'> & { purpose: string; lpType: 'static' | 'dynamic'; utmContent: 'web' | 'mobile' }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('landing_page_templates')
        .insert({
          base_url: template.url,
          lp_type: template.lpType,
          purpose: template.purpose,
          country: template.country,
          language: template.language,
          platform: template.platform,
          utm_content: template.utmContent || 'web',
          created_by: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-page-templates'] });
      toast({ title: "Success", description: "Landing page template added" });
      setNewLP({ url: '', country: '', language: 'EN', platform: '', utmContent: 'web', lpTypeId: null });
      setDetectionResult(null);
      setShowAddDialog(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleUrlChange = (url: string) => {
    setNewLP({ ...newLP, url });
    
    if (url && url.length > 10) {
      const detected = detectLPMetadata(url);
      setDetectionResult(detected);
      
      // Auto-populate fields if empty
      if (detected.country && !newLP.country) {
        setNewLP(prev => ({ ...prev, country: detected.country || '' }));
      }
      if (detected.language && !newLP.language) {
        setNewLP(prev => ({ ...prev, language: detected.language?.toUpperCase() || 'EN' }));
      }
    } else {
      setDetectionResult(null);
    }
  };

  const handleAddLP = async () => {
    if (!newLP.url || !newLP.country || !newLP.language) {
      toast({
        title: "Missing Information",
        description: "Please fill in URL, Country, and Language",
        variant: "destructive",
      });
      return;
    }

    try {
      const detected = detectionResult || detectLPMetadata(newLP.url);
      const purpose = detected.purpose || 'AO';
      const platform = newLP.platform || platforms[0]?.name || '';

      await createTemplate.mutateAsync({
        url: newLP.url,
        country: newLP.country,
        language: newLP.language,
        platform,
        purpose,
        lpType: detected.lpType || 'static',
        utmContent: newLP.utmContent || 'web',
        lpTypeId: newLP.lpTypeId,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add landing page",
        variant: "destructive",
      });
    }
  };

  // Mutation to update template
  const updateTemplate = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: string }) => {
      const updates: any = {};
      
      if (field === 'platform') {
        updates.platform = value;
      } else if (field === 'country') {
        updates.country = value;
      } else if (field === 'language') {
        updates.language = value;
      } else if (field === 'lpType') {
        updates.lp_type = value;
      } else if (field === 'utmContent') {
        updates.utm_content = value;
      }

      const { error } = await supabase
        .from('landing_page_templates')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-page-templates'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateLP = async (id: string, field: string, value: string) => {
    try {
      await updateTemplate.mutateAsync({ id, field, value });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update landing page",
        variant: "destructive",
      });
    }
  };

  const buildFinalUrl = (lp: SavedLP) => {
    const utmMedium = calculateUtmMedium(lp.platform);
    const utmCampaign = generateUtmCampaignByPurpose(
      lp.purpose as 'AO' | 'Webinar' | 'Seminar',
      ''
    );

    return buildUtmUrl({
      baseUrl: lp.url,
      utmSource: lp.platform.toLowerCase().replace(/\s+/g, ''),
      utmMedium,
      utmCampaign,
      utmContent: lp.utmContent || 'web',
      dynamicLanguage: lp.lpType === 'dynamic' ? lp.language.toUpperCase() : undefined,
    });
  };

  const copyUTM = (lp: SavedLP) => {
    const url = buildFinalUrl(lp);
    copyToClipboard(url, "UTM link copied");
  };

  // Mutation to delete template
  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('landing_page_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-page-templates'] });
      toast({ title: "Success", description: "Template deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteLP = async (id: string) => {
    try {
      await deleteTemplate.mutateAsync(id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete landing page",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <AlertBanner
        variant="warning"
        message="⚠️ Link Accuracy Responsibility: You are responsible for ensuring all UTM links are correct before use. Always verify the final URL matches your campaign requirements."
        autoDismiss={false}
      />

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Ready Links - LP Library</CardTitle>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add LP
            </Button>
          </div>
          <CardDescription>Manage your landing page templates</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Country</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>LP URL</TableHead>
                <TableHead>LP Type</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Final UTM URL</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {savedLPs.map((lp) => {
                const finalUrl = buildFinalUrl(lp);
                return (
                  <TableRow key={lp.id}>
                    <TableCell>
                      <InlineEditBadge
                        value={lp.country}
                        options={entityOptions}
                        onChange={(val) => updateLP(lp.id, 'country', val)}
                      />
                    </TableCell>
                    <TableCell>
                      <ToggleGroup
                        type="single"
                        value={lp.language}
                        onValueChange={(val) => val && updateLP(lp.id, 'language', val)}
                        size="sm"
                      >
                        <ToggleGroupItem value="EN">EN</ToggleGroupItem>
                        <ToggleGroupItem value="AR">AR</ToggleGroupItem>
                      </ToggleGroup>
                    </TableCell>
                    <TableCell>
                      <InlineEditSelect
                        value={lp.platform}
                        options={platforms.map(p => ({ id: p.id, name: p.name }))}
                        onChange={(val) => updateLP(lp.id, 'platform', val)}
                        placeholder="Select platform"
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs max-w-[200px] truncate" title={lp.url}>
                      {lp.url}
                    </TableCell>
                    <TableCell>
                      <ToggleGroup
                        type="single"
                        value={lp.lpType}
                        onValueChange={(val) => val && updateLP(lp.id, 'lpType', val)}
                        size="sm"
                      >
                        <ToggleGroupItem value="static" className="text-xs">
                          Static
                        </ToggleGroupItem>
                        <ToggleGroupItem value="dynamic" className="text-xs">
                          Dynamic
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </TableCell>
                    <TableCell>
                      <ToggleGroup
                        type="single"
                        value={lp.utmContent || 'web'}
                        onValueChange={(val) => val && updateLP(lp.id, 'utmContent', val)}
                        size="sm"
                      >
                        <ToggleGroupItem value="web" className="text-xs gap-1">
                          <Monitor className="h-3 w-3" /> Web
                        </ToggleGroupItem>
                        <ToggleGroupItem value="mobile" className="text-xs gap-1">
                          <Smartphone className="h-3 w-3" /> Mobile
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{lp.purpose}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs max-w-[300px]">
                      <div className="truncate" title={finalUrl}>
                        {finalUrl}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyUTM(lp)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(finalUrl, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteLP(lp.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Landing Page Template</DialogTitle>
            <DialogDescription>
              Paste your LP URL and we'll auto-detect country, language, and type
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Landing Page URL *</Label>
              <Input
                value={newLP.url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://cfi.trade/en/ae/ or https://campaigns.cfifinancial.com/en/lb/"
                className="font-mono text-sm"
              />
            </div>

            {detectionResult && (
              <LPDetectionCard detection={detectionResult} />
            )}

            {detectionResult && (
              <div>
                <Label>Landing Page Type</Label>
                <ToggleGroup
                  type="single"
                  value={detectionResult?.lpType || 'static'}
                  onValueChange={(val) => {
                    setDetectionResult(prev => prev ? { ...prev, lpType: val as 'static' | 'dynamic' } : null);
                  }}
                  className="justify-start"
                >
                  <ToggleGroupItem value="static" className="gap-2">
                    <span className="text-blue-600">●</span> Static
                    <span className="text-xs text-muted-foreground">(campaigns.cfifinancial.com)</span>
                  </ToggleGroupItem>
                  <ToggleGroupItem value="dynamic" className="gap-2">
                    <span className="text-green-600">●</span> Dynamic
                    <span className="text-xs text-muted-foreground">(cfi.trade with ?lang=)</span>
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            )}

            <div>
              <Label>Device Type (utm_content)</Label>
              <ToggleGroup
                type="single"
                value={newLP.utmContent || 'web'}
                onValueChange={(val) => val && setNewLP({ ...newLP, utmContent: val as 'web' | 'mobile' })}
                className="justify-start"
              >
                <ToggleGroupItem value="web" className="gap-2">
                  <Monitor className="h-4 w-4" /> Web
                </ToggleGroupItem>
                <ToggleGroupItem value="mobile" className="gap-2">
                  <Smartphone className="h-4 w-4" /> Mobile
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Country *</Label>
                <Input
                  value={newLP.country}
                  onChange={(e) => setNewLP({ ...newLP, country: e.target.value })}
                  placeholder={detectionResult?.country || "e.g., Lebanon"}
                  className={detectionResult?.country ? "border-green-500" : ""}
                />
                {detectionResult?.country && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Auto-detected from URL
                  </p>
                )}
              </div>
              
              <div>
                <Label>Language *</Label>
                <ToggleGroup
                  type="single"
                  value={newLP.language}
                  onValueChange={(val) => val && setNewLP({ ...newLP, language: val })}
                >
                  <ToggleGroupItem value="EN">🇬🇧 EN</ToggleGroupItem>
                  <ToggleGroupItem value="AR">🇦🇪 AR</ToggleGroupItem>
                </ToggleGroup>
                {detectionResult?.language && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Detected: {detectionResult.language.toUpperCase()}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label>Platform</Label>
              <Select
                value={newLP.platform}
                onValueChange={(val) => setNewLP({ ...newLP, platform: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map(p => (
                    <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false);
              setNewLP({ url: '', country: '', language: 'EN', platform: '', utmContent: 'web', lpTypeId: null });
              setDetectionResult(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddLP} disabled={!newLP.url || !newLP.country || !newLP.language}>
              Add LP Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
