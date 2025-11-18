import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { WebIntelDeal } from "@/hooks/useWebIntelDeals";
import { useWebIntelSites } from "@/hooks/useWebIntelSites";
import { usePlannedCampaigns } from "@/hooks/usePlannedCampaigns";
import { useUtmLinks } from "@/hooks/useUtmLinks";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface DealFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: WebIntelDeal;
  onSave: (dealData: Omit<WebIntelDeal, 'id' | 'created_at' | 'updated_at' | 'created_by'>, campaignIds: string[], utmLinkIds: string[]) => void;
  initialCampaignIds?: string[];
  initialUtmLinkIds?: string[];
}

const STATUSES: ('Active' | 'Pending' | 'Expired' | 'Cancelled')[] = ['Active', 'Pending', 'Expired', 'Cancelled'];

export function DealFormDialog({ open, onOpenChange, deal, onSave, initialCampaignIds = [], initialUtmLinkIds = [] }: DealFormDialogProps) {
  const { sites } = useWebIntelSites();
  const { campaigns } = usePlannedCampaigns();
  const { data: utmLinks = [] } = useUtmLinks();

  const [formData, setFormData] = useState({
    name: deal?.name || '',
    status: deal?.status || 'Active' as 'Active' | 'Pending' | 'Expired' | 'Cancelled',
    contract_link: deal?.contract_link || '',
    contact_email: deal?.contact_email || '',
    contact_name: deal?.contact_name || '',
    website_id: deal?.website_id || null,
    entity: deal?.entity || '',
    notes: deal?.notes || '',
    start_date: deal?.start_date || '',
    end_date: deal?.end_date || '',
    deal_value: deal?.deal_value || null,
  });

  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>(initialCampaignIds);
  const [selectedUtmLinkIds, setSelectedUtmLinkIds] = useState<string[]>(initialUtmLinkIds);

  const handleSubmit = () => {
    if (!formData.name) {
      return;
    }

    onSave(formData, selectedCampaignIds, selectedUtmLinkIds);
    onOpenChange(false);
  };

  const toggleCampaign = (campaignId: string) => {
    setSelectedCampaignIds(prev =>
      prev.includes(campaignId)
        ? prev.filter(id => id !== campaignId)
        : [...prev, campaignId]
    );
  };

  const toggleUtmLink = (utmLinkId: string) => {
    setSelectedUtmLinkIds(prev =>
      prev.includes(utmLinkId)
        ? prev.filter(id => id !== utmLinkId)
        : [...prev, utmLinkId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{deal ? 'Edit Deal' : 'Create Deal'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Deal Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter deal name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Select
                value={formData.website_id || undefined}
                onValueChange={(value) => setFormData({ ...formData, website_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select website" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deal_value">Cost</Label>
              <Input
                id="deal_value"
                type="number"
                value={formData.deal_value || ''}
                onChange={(e) => setFormData({ ...formData, deal_value: e.target.value ? Number(e.target.value) : null })}
                placeholder="Deal value"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="entity">Entity</Label>
            <Input
              id="entity"
              value={formData.entity}
              onChange={(e) => setFormData({ ...formData, entity: e.target.value })}
              placeholder="Entity name"
            />
          </div>

          <div className="space-y-2">
            <Label>Campaigns</Label>
            <Command className="border rounded-lg">
              <CommandInput placeholder="Search campaigns..." />
              <CommandList className="max-h-[200px]">
                <CommandEmpty>No campaigns found</CommandEmpty>
                <CommandGroup>
                  {campaigns.map((campaign) => (
                    <CommandItem
                      key={campaign.id}
                      onSelect={() => toggleCampaign(campaign.id)}
                      className="flex items-center gap-2"
                    >
                      <Checkbox
                        checked={selectedCampaignIds.includes(campaign.id)}
                        onCheckedChange={() => toggleCampaign(campaign.id)}
                      />
                      <span className="flex-1">{campaign.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
            {selectedCampaignIds.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedCampaignIds.map((id) => {
                  const campaign = campaigns.find((c) => c.id === id);
                  return campaign ? (
                    <Badge key={id} variant="secondary" className="gap-1">
                      {campaign.name}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => toggleCampaign(id)}
                      />
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {deal ? 'Update Deal' : 'Create Deal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
