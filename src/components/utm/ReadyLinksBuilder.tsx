import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Copy, Trash2, Link as LinkIcon, AlertTriangle } from "lucide-react";
import { InlineEditBadge } from "./InlineEditBadge";
import { InlineEditSelect } from "./InlineEditSelect";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { useSystemEntities } from "@/hooks/useSystemEntities";
import { useUtmCampaigns } from "@/hooks/useUtmCampaigns";
import { useUtmPlatforms } from "@/hooks/useUtmPlatforms";
import { useUtmLinks, useCreateUtmLink, useUpdateUtmLink, useDeleteUtmLink } from "@/hooks/useUtmLinks";
import { toast } from "sonner";
import { buildUtmUrl, calculateUtmMedium, generateUtmCampaignByPurpose } from "@/lib/utmHelpers";
import { detectLPMetadata } from "@/lib/lpDetector";

interface SavedLP {
  id: string;
  url: string;
  country: string;
  language: string;
  campaign: string;
  platform: string;
  purpose: string;
  lpType: 'static' | 'dynamic';
}

export function ReadyLinksBuilder() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newLpUrl, setNewLpUrl] = useState("");
  const [newCountry, setNewCountry] = useState("");
  const [newLanguage, setNewLanguage] = useState("en");
  const [newCampaign, setNewCampaign] = useState("");
  const [newPlatform, setNewPlatform] = useState("");
  const [newPurpose, setNewPurpose] = useState("");

  const { data: campaigns = [] } = useUtmCampaigns();
  const { data: platforms = [] } = useUtmPlatforms();
  const { data: entities = [] } = useSystemEntities();
  const { data: allLinks = [] } = useUtmLinks({});
  const createUtmLink = useCreateUtmLink();
  const updateUtmLink = useUpdateUtmLink();
  const deleteUtmLink = useDeleteUtmLink();

  const entityOptions = entities.map(e => ({ 
    value: e.name, 
    label: e.emoji ? `${e.emoji} ${e.name}` : e.name 
  }));

  // Transform utm_links to SavedLP format
  const savedLPs: SavedLP[] = allLinks
    .filter(link => link.is_template)
    .map(link => {
      const detection = detectLPMetadata(link.base_url || link.full_url || '');
      return {
        id: link.id,
        url: link.base_url || link.full_url || '',
        country: link.entity?.[0] || detection.country || 'Global',
        language: (link.utm_term as 'en' | 'ar') || detection.language || 'en',
        campaign: link.link_purpose || detection.purpose || 'AO',
        platform: link.platform || '',
        purpose: link.link_purpose || detection.purpose || 'AO',
        lpType: detection.lpType,
      };
    });

  const handleAddLP = () => {
    if (!newLpUrl.trim()) {
      toast.error("Please enter a landing page URL");
      return;
    }

    const detection = detectLPMetadata(newLpUrl);
    
    createUtmLink.mutate({
      name: `LP - ${newPlatform || 'Facebook'}`,
      full_url: newLpUrl,
      base_url: newLpUrl,
      utm_source: 'manual',
      utm_medium: 'none',
      utm_campaign: 'template',
      utm_term: newLanguage,
      entity: [newCountry || detection.country || 'Global'],
      platform: newPlatform || 'Facebook',
      link_purpose: newPurpose || detection.purpose || 'AO',
      is_template: true,
    }, {
      onSuccess: () => {
        toast.success("Landing page added to library");
        setShowAddDialog(false);
        setNewLpUrl("");
        setNewCountry("");
        setNewLanguage("en");
        setNewCampaign("");
        setNewPlatform("");
        setNewPurpose("");
      }
    });
  };

  const updateLP = (id: string, field: string, value: string) => {
    const lp = savedLPs.find(l => l.id === id);
    if (!lp) return;

    const updatedData: any = {};
    if (field === 'country') updatedData.entity = [value];
    if (field === 'campaign') updatedData.link_purpose = value;
    if (field === 'platform') updatedData.platform = value;
    if (field === 'language') updatedData.utm_term = value;

    updateUtmLink.mutate({ id, ...updatedData });
  };

  const buildFinalUrl = (lp: SavedLP) => {
    const utmMedium = calculateUtmMedium(lp.platform);
    const utmCampaign = generateUtmCampaignByPurpose(
      lp.purpose as 'AO' | 'Webinar' | 'Seminar',
      lp.campaign
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
    navigator.clipboard.writeText(url);
    toast.success("UTM link copied to clipboard");
  };

  const deleteLP = (id: string) => {
    deleteUtmLink.mutate(id, {
      onSuccess: () => {
        toast.success("Landing page removed from library");
      }
    });
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
            <div>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-primary" />
                Ready Links - LP Library
              </CardTitle>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add LP
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {savedLPs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <LinkIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No landing pages saved yet</p>
              <p className="text-sm">Add your first LP to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">LP URL</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead className="w-[300px]">Final URL</TableHead>
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
                          <ToggleGroupItem value="en">EN</ToggleGroupItem>
                          <ToggleGroupItem value="ar">AR</ToggleGroupItem>
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
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Landing Page to Library</DialogTitle>
            <DialogDescription>
              Add a landing page URL to quickly generate UTM links
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-lp-url">Landing Page URL *</Label>
              <Input
                id="new-lp-url"
                type="url"
                placeholder="https://cfi.trade/..."
                value={newLpUrl}
                onChange={(e) => setNewLpUrl(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-country">Country (optional)</Label>
                <Input
                  id="new-country"
                  placeholder="Auto-detected"
                  value={newCountry}
                  onChange={(e) => setNewCountry(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Language</Label>
                <ToggleGroup
                  type="single"
                  value={newLanguage}
                  onValueChange={(val) => val && setNewLanguage(val)}
                >
                  <ToggleGroupItem value="en">EN</ToggleGroupItem>
                  <ToggleGroupItem value="ar">AR</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddLP}>
              Add LP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
