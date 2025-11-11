import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Plus, X } from "lucide-react";
import { WebIntelSite, HistoricPrice, PastCampaign } from "@/hooks/useWebIntelSites";
import { enrichUrl } from "./UrlEnrichmentService";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface WebIntelFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  site?: WebIntelSite;
  historicPrices?: HistoricPrice[];
  pastCampaigns?: PastCampaign[];
  onSave: (
    site: Omit<WebIntelSite, "id" | "created_at" | "updated_at" | "created_by">,
    prices: Omit<HistoricPrice, "id" | "created_at" | "site_id">[],
    campaigns: Omit<PastCampaign, "id" | "created_at" | "site_id">[]
  ) => void;
}

const COUNTRIES = ['UAE', 'Saudi Arabia', 'Egypt', 'Kuwait', 'Qatar', 'Bahrain', 'Jordan', 'Lebanon', 'Morocco'];
const SITE_TYPES: ('Website' | 'App' | 'Portal' | 'Forum')[] = ['Website', 'App', 'Portal', 'Forum'];
const CATEGORIES = ['Trading', 'Generic', 'Business', 'App'];
const AVAILABLE_TAGS = ['GDN', 'DV360', 'Direct', 'Mobile-only'];

export function WebIntelFormDialog({
  open,
  onOpenChange,
  site,
  historicPrices = [],
  pastCampaigns = [],
  onSave,
}: WebIntelFormDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    country: 'UAE',
    type: 'Website' as 'Website' | 'App' | 'Portal' | 'Forum',
    category: '',
    estimated_monthly_traffic: 0,
    entity: '',
    tags: [] as string[],
    notes: '',
  });

  const [prices, setPrices] = useState<Omit<HistoricPrice, "id" | "created_at" | "site_id">[]>([]);
  const [campaigns, setCampaigns] = useState<Omit<PastCampaign, "id" | "created_at" | "site_id">[]>([]);
  const [enriching, setEnriching] = useState(false);

  useEffect(() => {
    if (site) {
      setFormData({
        name: site.name,
        url: site.url,
        country: site.country,
        type: site.type,
        category: site.category || '',
        estimated_monthly_traffic: site.estimated_monthly_traffic || 0,
        entity: site.entity || '',
        tags: site.tags,
        notes: site.notes || '',
      });
      setPrices(historicPrices.map(p => ({ year: p.year, price: p.price, notes: p.notes })));
      setCampaigns(pastCampaigns.map(c => ({ 
        campaign_name: c.campaign_name, 
        campaign_date: c.campaign_date, 
        budget: c.budget, 
        ctr: c.ctr,
        notes: c.notes 
      })));
    } else {
      setFormData({
        name: '',
        url: '',
        country: 'UAE',
        type: 'Website',
        category: '',
        estimated_monthly_traffic: 0,
        entity: '',
        tags: [],
        notes: '',
      });
      setPrices([]);
      setCampaigns([]);
    }
  }, [site, historicPrices, pastCampaigns, open]);

  const handleEnrichUrl = async () => {
    if (!formData.url) {
      toast.error("Please enter a URL first");
      return;
    }

    setEnriching(true);
    try {
      const result = await enrichUrl(formData.url);
      setFormData(prev => ({
        ...prev,
        category: result.category,
        type: result.detectedType,
        estimated_monthly_traffic: result.estimatedTraffic || prev.estimated_monthly_traffic,
      }));
      toast.success("URL enriched successfully");
    } catch (error) {
      toast.error("Failed to enrich URL");
    } finally {
      setEnriching(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.url) {
      toast.error("Please fill in required fields");
      return;
    }

    onSave(formData, prices, campaigns);
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const addPrice = () => {
    setPrices([...prices, { year: new Date().getFullYear(), price: 0, notes: '' }]);
  };

  const removePrice = (index: number) => {
    setPrices(prices.filter((_, i) => i !== index));
  };

  const updatePrice = (index: number, field: keyof Omit<HistoricPrice, "id" | "created_at" | "site_id">, value: any) => {
    const updated = [...prices];
    updated[index] = { ...updated[index], [field]: value };
    setPrices(updated);
  };

  const addCampaign = () => {
    setCampaigns([...campaigns, { 
      campaign_name: '', 
      campaign_date: new Date().toISOString().split('T')[0], 
      budget: 0,
      ctr: 0,
      notes: '' 
    }]);
  };

  const removeCampaign = (index: number) => {
    setCampaigns(campaigns.filter((_, i) => i !== index));
  };

  const updateCampaign = (index: number, field: keyof Omit<PastCampaign, "id" | "created_at" | "site_id">, value: any) => {
    const updated = [...campaigns];
    updated[index] = { ...updated[index], [field]: value };
    setCampaigns(updated);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{site ? 'Edit Site' : 'Add New Site'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Gulf News"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">URL *</Label>
                <div className="flex gap-2">
                  <Input
                    id="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://gulfnews.com"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleEnrichUrl}
                    disabled={enriching}
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select value={formData.country} onValueChange={(value) => setFormData({ ...formData, country: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SITE_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="traffic">Est. Monthly Traffic</Label>
                <Input
                  id="traffic"
                  type="number"
                  value={formData.estimated_monthly_traffic}
                  onChange={(e) => setFormData({ ...formData, estimated_monthly_traffic: Number(e.target.value) })}
                  placeholder="2500000"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="entity">Publisher/Entity Name</Label>
                <Input
                  id="entity"
                  value={formData.entity}
                  onChange={(e) => setFormData({ ...formData, entity: e.target.value })}
                  placeholder="Gulf News Publishing"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Historic Prices */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Historic Prices</h3>
              <Button type="button" variant="outline" size="sm" onClick={addPrice}>
                <Plus className="h-4 w-4 mr-1" />
                Add Price
              </Button>
            </div>
            {prices.map((price, index) => (
              <div key={index} className="flex gap-2 items-start">
                <Input
                  type="number"
                  placeholder="Year"
                  value={price.year}
                  onChange={(e) => updatePrice(index, 'year', Number(e.target.value))}
                  className="w-24"
                />
                <Input
                  type="number"
                  placeholder="Price"
                  value={price.price}
                  onChange={(e) => updatePrice(index, 'price', Number(e.target.value))}
                  className="w-32"
                />
                <Input
                  placeholder="Notes"
                  value={price.notes || ''}
                  onChange={(e) => updatePrice(index, 'notes', e.target.value)}
                  className="flex-1"
                />
                <Button type="button" variant="ghost" size="sm" onClick={() => removePrice(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Separator />

          {/* Past Campaigns */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Past Campaigns</h3>
              <Button type="button" variant="outline" size="sm" onClick={addCampaign}>
                <Plus className="h-4 w-4 mr-1" />
                Add Campaign
              </Button>
            </div>
            {campaigns.map((campaign, index) => (
              <div key={index} className="space-y-2 p-3 border rounded">
                <div className="flex gap-2">
                  <Input
                    placeholder="Campaign Name"
                    value={campaign.campaign_name}
                    onChange={(e) => updateCampaign(index, 'campaign_name', e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeCampaign(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={campaign.campaign_date}
                    onChange={(e) => updateCampaign(index, 'campaign_date', e.target.value)}
                    className="w-40"
                  />
                  <Input
                    type="number"
                    placeholder="Budget"
                    value={campaign.budget}
                    onChange={(e) => updateCampaign(index, 'budget', Number(e.target.value))}
                    className="w-32"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="CTR %"
                    value={campaign.ctr || ''}
                    onChange={(e) => updateCampaign(index, 'ctr', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-24"
                  />
                </div>
                <Input
                  placeholder="Notes"
                  value={campaign.notes || ''}
                  onChange={(e) => updateCampaign(index, 'notes', e.target.value)}
                />
              </div>
            ))}
          </div>

          <Separator />

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="font-semibold">Tags</h3>
            <div className="flex flex-wrap gap-4">
              {AVAILABLE_TAGS.map(tag => (
                <div key={tag} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tag-${tag}`}
                    checked={formData.tags.includes(tag)}
                    onCheckedChange={() => toggleTag(tag)}
                  />
                  <Label htmlFor={`tag-${tag}`}>{tag}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional information..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {site ? 'Update Site' : 'Add Site'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
