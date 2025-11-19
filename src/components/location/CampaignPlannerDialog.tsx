import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { usePlannedCampaigns, PlannedCampaign, calculateDuration, getSeasonIndicator } from "@/hooks/usePlannedCampaigns";
import { supabase } from "@/integrations/supabase/client";
import { useMediaLocations } from "@/hooks/useMediaLocations";
import { MediaLocation } from "@/hooks/useMediaLocations";
import { Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface CampaignPlannerDialogProps {
  open: boolean;
  onClose: () => void;
  locations: MediaLocation[];
  campaign?: PlannedCampaign | null;
  mode?: 'create' | 'edit';
}

export function CampaignPlannerDialog({ open, onClose, locations, campaign, mode = 'create' }: CampaignPlannerDialogProps) {
  const { createCampaign, updateCampaign, getPlacementsForCampaign } = usePlannedCampaigns();
  const { locations: allLocations } = useMediaLocations();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: campaign?.name || "",
    start_date: campaign?.start_date || "",
    end_date: campaign?.end_date || "",
    agency: campaign?.agency || "",
    notes: campaign?.notes || "",
  });
  
  const [selectedCities, setSelectedCities] = useState<string[]>(campaign?.cities || []);
  const [manualSelections, setManualSelections] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    
    if (mode === 'edit' && campaign) {
      setFormData({
        name: campaign.name,
        start_date: campaign.start_date,
        end_date: campaign.end_date,
        agency: campaign.agency || "",
        notes: campaign.notes || "",
      });
      setSelectedCities(campaign.cities);
      
      const existingPlacements = getPlacementsForCampaign(campaign.id);
      setManualSelections(new Set(existingPlacements.map(p => p.location_id)));
    } else if (mode === 'create' && locations.length > 0) {
      const uniqueCities = Array.from(new Set(locations.map(l => l.city)));
      setSelectedCities(uniqueCities);
      setManualSelections(new Set(locations.map(l => l.id)));
    }
  }, [mode, campaign, locations, open]);

  const cities = Array.from(new Set(allLocations.map(l => l.city))).sort();
  
  const availableLocations = allLocations
    .filter(loc => selectedCities.includes(loc.city))
    .sort((a, b) => a.name.localeCompare(b.name));

  const toggleCity = (city: string) => {
    setSelectedCities(prev =>
      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
    );
  };

  const togglePlacement = (locationId: string) => {
    setManualSelections(prev => {
      const next = new Set(prev);
      if (next.has(locationId)) {
        next.delete(locationId);
      } else {
        next.add(locationId);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.name || !formData.start_date || !formData.end_date) {
      toast.error("Please fill all required fields");
      return;
    }

    if (manualSelections.size === 0) {
      toast.error("Please select at least one location");
      return;
    }

    setLoading(true);

    try {
      let campaignId: string;

      if (mode === 'edit' && campaign) {
        await updateCampaign.mutateAsync({
          id: campaign.id,
          name: formData.name,
          start_date: formData.start_date,
          end_date: formData.end_date,
          agency: formData.agency,
          notes: formData.notes,
          cities: selectedCities,
          status: campaign.status,
        });

        await supabase.from("campaign_placements").delete().eq("campaign_id", campaign.id);
        campaignId = campaign.id;
      } else {
        const result = await createCampaign.mutateAsync({
          name: formData.name,
          start_date: formData.start_date,
          end_date: formData.end_date,
          agency: formData.agency,
          notes: formData.notes,
          cities: selectedCities,
          status: 'draft',
        });
        campaignId = result.id;
      }

      const placements = Array.from(manualSelections).map(locationId => ({
        campaign_id: campaignId,
        location_id: locationId,
      }));

      const { error: placementsError } = await supabase
        .from("campaign_placements")
        .insert(placements);

      if (placementsError) throw placementsError;

      toast.success(`Campaign ${mode === 'edit' ? 'updated' : 'created'} successfully`);
      onClose();
    } catch (error: any) {
      console.error("Error saving campaign:", error);
      toast.error(error.message || "Failed to save campaign");
    } finally {
      setLoading(false);
    }
  };

  const duration = formData.start_date && formData.end_date 
    ? calculateDuration(formData.start_date, formData.end_date)
    : 0;

  const season = formData.start_date && formData.end_date
    ? getSeasonIndicator(formData.start_date, formData.end_date)
    : 'Regular Season';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-heading-lg">{mode === 'edit' ? 'Edit Campaign' : 'Plan New Campaign'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-section p-card">
            <div className="space-y-md">
              <h3 className="text-heading-sm font-semibold">Campaign Details</h3>
              
              <div className="grid grid-cols-2 gap-md">
                <div className="col-span-2">
                  <Label htmlFor="name">Campaign Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Summer OOH Blast 2024"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="end_date">End Date *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="agency">Agency</Label>
                  <Input
                    id="agency"
                    value={formData.agency}
                    onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                    placeholder="e.g., Mediahub, Starcom"
                  />
                </div>

                <div>
                  <Label>Duration & Season</Label>
                  <div className="flex items-center gap-sm h-10">
                    <Badge variant="secondary">
                      {duration} month{duration !== 1 ? 's' : ''}
                    </Badge>
                    {season !== 'Regular Season' && (
                      <Badge variant="outline" className="text-metadata">{season}</Badge>
                    )}
                  </div>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional campaign notes..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-md">
              <h3 className="text-heading-sm font-semibold">Target Cities</h3>
              <div className="flex flex-wrap gap-sm">
                {cities.map(city => (
                  <Button
                    key={city}
                    type="button"
                    variant={selectedCities.includes(city) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleCity(city)}
                  >
                    {city} ({allLocations.filter(l => l.city === city).length})
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-md">
              <div className="flex items-center justify-between">
                <h3 className="text-heading-sm font-semibold">
                  Select Media Placements ({manualSelections.size} selected)
                </h3>
              </div>

              <div className="border rounded-lg p-sm max-h-[400px] overflow-y-auto space-y-xs">
                {availableLocations.length === 0 ? (
                  <p className="text-body-sm text-muted-foreground text-center py-8">
                    Select cities above to see available locations
                  </p>
                ) : (
                  availableLocations.map(location => (
                    <div
                      key={location.id}
                      className="flex items-start gap-md p-sm rounded-lg border hover:bg-accent transition-smooth cursor-pointer"
                      onClick={() => togglePlacement(location.id)}
                    >
                      <Checkbox
                        checked={manualSelections.has(location.id)}
                        onCheckedChange={() => togglePlacement(location.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-sm flex-wrap">
                          <span className="font-medium">{location.name}</span>
                          <Badge variant="secondary" className="text-metadata">{location.city}</Badge>
                          <Badge variant="outline" className="text-metadata">{location.type}</Badge>
                          {location.agency && (
                            <Badge variant="default" className="text-metadata">🏢 {location.agency}</Badge>
                          )}
                        </div>
                        {location.notes && (
                          <p className="text-body-sm text-muted-foreground mt-xs line-clamp-1">{location.notes}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="border-t p-card space-y-md">
            <div className="flex justify-between items-center text-body-sm">
              <span className="text-muted-foreground">Selected Placements:</span>
              <Badge variant="secondary">{manualSelections.size} locations</Badge>
            </div>

            <div className="flex justify-end gap-md">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button
                type="submit"
                disabled={loading || !formData.name || manualSelections.size === 0}
              >
                {loading ? "Saving..." : mode === 'edit' ? 'Update Campaign' : 'Create Campaign'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
