import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Copy, Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { useUtmCampaigns } from "@/hooks/useUtmCampaigns";
import { useUtmPlatforms } from "@/hooks/useUtmPlatforms";
import { useSystemEntities } from "@/hooks/useSystemEntities";
import { supabase } from "@/integrations/supabase/client";
import { detectLPMetadata } from "@/lib/lpDetector";
import { InlineEditSelect } from "./InlineEditSelect";
import { InlineEditBadge } from "./InlineEditBadge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { buildUtmUrl, calculateUtmMedium, generateUtmCampaignByPurpose } from "@/lib/utmHelpers";

interface SavedLP {
  id: string;
  url: string;
  country: string;
  language: string;
  purpose: string;
  platform: string;
  lpType: 'static' | 'dynamic';
}

export function ReadyLinksBuilder() {
  const queryClient = useQueryClient();
  const { data: campaigns = [] } = useUtmCampaigns();
  const { data: platforms = [] } = useUtmPlatforms();
  const { data: entities = [] } = useSystemEntities();
  const { copy: copyToClipboard } = useCopyToClipboard();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newLP, setNewLP] = useState({ url: '', country: '', language: 'EN', platform: '' });

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
    }));
  }, [templates]);

  const entityOptions = entities.map(e => ({ 
    value: e.name, 
    label: e.emoji ? `${e.emoji} ${e.name}` : e.name 
  }));

  // Mutation to create template
  const createTemplate = useMutation({
    mutationFn: async (template: Omit<typeof newLP, 'purpose'> & { purpose: string; lpType: 'static' | 'dynamic' }) => {
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
          created_by: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-page-templates'] });
      toast({ title: "Success", description: "Landing page template added" });
      setNewLP({ url: '', country: '', language: 'EN', platform: '' });
      setShowAddDialog(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

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
      const detected = detectLPMetadata(newLP.url);
      const purpose = detected.purpose || 'AO';
      const platform = newLP.platform || platforms[0]?.name || '';

      await createTemplate.mutateAsync({
        url: newLP.url,
        country: newLP.country,
        language: newLP.language,
        platform,
        purpose,
        lpType: detected.lpType || 'static',
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
    mutationFn: async ({ id, field, value }: { id: string; field: keyof SavedLP; value: string }) => {
      const updates: any = {};
      
      if (field === 'platform') {
        updates.platform = value;
      } else if (field === 'country') {
        updates.country = value;
      } else if (field === 'language') {
        updates.language = value;
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

  const updateLP = async (id: string, field: keyof SavedLP, value: string) => {
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
      utmContent: 'desktop',
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
                <TableHead>LP URL</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Final URL</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {savedLPs.map((lp) => {
                const finalUrl = buildFinalUrl(lp);
                return (
                  <TableRow key={lp.id}>
                    <TableCell className="font-mono text-xs max-w-[200px] truncate" title={lp.url}>
                      {lp.url}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded ${lp.lpType === 'static' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                        {lp.lpType}
                      </span>
                    </TableCell>
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
                      <span className="text-xs font-medium">{lp.purpose}</span>
                    </TableCell>
                    <TableCell>
                      <InlineEditSelect
                        value={lp.platform}
                        options={platforms.map(p => ({ id: p.id, name: p.name }))}
                        onChange={(val) => updateLP(lp.id, 'platform', val)}
                        placeholder="Select platform"
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs max-w-[300px]">
                      <div className="truncate" title={finalUrl}>
                        {finalUrl}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyUTM(lp)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
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

          {savedLPs.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No landing pages saved yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Landing Page</DialogTitle>
            <DialogDescription>Add a new landing page template to your library</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Landing Page URL *</Label>
              <Input
                value={newLP.url}
                onChange={(e) => setNewLP({ ...newLP, url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Country *</Label>
                <Input
                  value={newLP.country}
                  onChange={(e) => setNewLP({ ...newLP, country: e.target.value })}
                  placeholder="e.g., Lebanon"
                />
              </div>
              <div>
                <Label>Language *</Label>
                <ToggleGroup
                  type="single"
                  value={newLP.language}
                  onValueChange={(val) => val && setNewLP({ ...newLP, language: val })}
                >
                  <ToggleGroupItem value="EN">EN</ToggleGroupItem>
                  <ToggleGroupItem value="AR">AR</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddLP}>Add LP</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
