import { useState } from "react";
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
import { Plus, Copy, Trash2, Link as LinkIcon } from "lucide-react";
import { InlineEditBadge } from "./InlineEditBadge";
import { InlineEditSelect } from "./InlineEditSelect";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
    .map(link => ({
      id: link.id,
      url: link.full_url || '',
      country: link.entity?.[0] || 'Global',
      language: 'en',
      campaign: link.link_purpose || '',
      platform: link.platform || '',
      purpose: link.link_purpose || 'AO',
    }));

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
      entity: [newCountry || detection.country || 'Global'],
      platform: newPlatform || 'Facebook',
      link_purpose: newPurpose || detection.purpose || 'AO',
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

    updateUtmLink.mutate({ id, ...updatedData });
  };

  const copyUTM = (lp: SavedLP) => {
    const utmMedium = calculateUtmMedium(lp.platform);
    const utmCampaign = generateUtmCampaignByPurpose(
      lp.purpose as 'AO' | 'Webinar' | 'Seminar',
      lp.campaign
    );

    const url = buildUtmUrl({
      baseUrl: lp.url,
      utmSource: lp.platform.toLowerCase().replace(/\s+/g, ''),
      utmMedium,
      utmCampaign,
      utmContent: 'desktop',
      dynamicLanguage: lp.language,
    });

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
                  <TableHead className="w-[300px]">LP URL</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {savedLPs.map((lp) => (
                  <TableRow key={lp.id}>
                    <TableCell className="font-mono text-xs max-w-[300px] truncate" title={lp.url}>
                      {lp.url}
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
                      <InlineEditSelect
                        value={lp.campaign}
                        options={campaigns.map(c => ({ id: c.id, name: c.name }))}
                        onChange={(val) => updateLP(lp.id, 'campaign', val)}
                        placeholder="Select campaign"
                      />
                    </TableCell>
                    <TableCell>
                      <InlineEditSelect
                        value={lp.platform}
                        options={platforms.map(p => ({ id: p.id, name: p.name }))}
                        onChange={(val) => updateLP(lp.id, 'platform', val)}
                        placeholder="Select platform"
                      />
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
                ))}
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
