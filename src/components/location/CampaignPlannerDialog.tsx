import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { usePlannedCampaigns, PlannedCampaign, calculateDuration, suggestPlacements, calculateReach } from "@/hooks/usePlannedCampaigns";
import { supabase } from "@/integrations/supabase/client";
import { useMediaLocations } from "@/hooks/useMediaLocations";
import { MediaLocation } from "@/hooks/useMediaLocations";
import { Calendar, DollarSign, MapPin, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface CampaignPlannerDialogProps {
  open: boolean;
  onClose: () => void;
  locations: MediaLocation[];
  campaign?: PlannedCampaign | null;
  mode?: 'create' | 'edit';
}

export function CampaignPlannerDialog({ open, onClose, locations, campaign, mode = 'create' }: CampaignPlannerDialogProps) {
  const { createCampaign, updateCampaign, getPlacementsForCampaign } = usePlannedCampaigns();
  const { allPrices } = useMediaLocations();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: campaign?.name || "",
    budget: campaign?.budget || 0,
    start_date: campaign?.start_date || "",
    end_date: campaign?.end_date || "",
    agency: campaign?.agency || "",
    notes: campaign?.notes || "",
  });
  
  const [selectedCities, setSelectedCities] = useState<string[]>(campaign?.cities || []);
  const [suggestedPlacements, setSuggestedPlacements] = useState<Array<{ location: MediaLocation; cost: number }>>([]);
  const [manualSelections, setManualSelections] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [showAllLocations, setShowAllLocations] = useState(false);
  const [agencyFilter, setAgencyFilter] = useState<string[]>([]);

  // Initialize form data when editing
  useEffect(() => {
    if (mode === 'edit' && campaign) {
      setFormData({
        name: campaign.name,
        budget: campaign.budget,
        start_date: campaign.start_date,
        end_date: campaign.end_date,
        agency: campaign.agency || "",
        notes: campaign.notes || "",
      });
      setSelectedCities(campaign.cities);
      
      // Load existing placements
      const existingPlacements = getPlacementsForCampaign(campaign.id);
      const placementsWithLocations = existingPlacements
        .map(p => {
          const location = locations.find(l => l.id === p.location_id);
          return location ? { location, cost: p.allocated_budget } : null;
        })
        .filter(Boolean) as Array<{ location: MediaLocation; cost: number }>;
      
      setSuggestedPlacements(placementsWithLocations);
      setManualSelections(new Set(placementsWithLocations.map(p => p.location.id)));
    }
  }, [mode, campaign, locations, getPlacementsForCampaign]);

  const cities = Array.from(new Set(locations.map(l => l.city))).sort();
  
  const availableLocations = locations
    .filter(loc => selectedCities.includes(loc.city))
    .filter(loc => agencyFilter.length === 0 || agencyFilter.includes(loc.agency || ''));

  const availableAgencies = Array.from(
    new Set(
      locations
        .filter(loc => selectedCities.includes(loc.city))
        .map(loc => loc.agency)
        .filter(Boolean)
    )
  ).sort() as string[];

  // Calculate derived values with useMemo for stable references
  const selectedPlacements = useMemo(() => {
    return suggestedPlacements.filter(p => manualSelections.has(p.location.id));
  }, [suggestedPlacements, manualSelections]);

  const totalCost = selectedPlacements.reduce((sum, p) => sum + p.cost, 0);
  const remainingBudget = formData.budget - totalCost;
  const duration = formData.start_date && formData.end_date
    ? calculateDuration(formData.start_date, formData.end_date) 
    : 0;

  // Auto-suggest placements when budget/cities/dates change
  useEffect(() => {
    if (formData.budget > 0 && selectedCities.length > 0 && formData.start_date && formData.end_date) {
      const duration = calculateDuration(formData.start_date, formData.end_date);
      const suggestions = suggestPlacements(
        locations, 
        formData.budget, 
        duration, 
        selectedCities, 
        allPrices,
        formData.start_date,
        formData.end_date
      );
      setSuggestedPlacements(suggestions);
      setManualSelections(new Set(suggestions.map(s => s.location.id)));
    } else {
      setSuggestedPlacements([]);
      setManualSelections(new Set());
    }
  }, [formData.budget, formData.start_date, formData.end_date, selectedCities, locations, allPrices]);
  
  // Calculate reach metrics with useMemo instead of useEffect
  const reachMetrics = useMemo(() => {
    if (selectedPlacements.length > 0 && formData.start_date && formData.end_date) {
      const duration = formData.start_date && formData.end_date 
        ? calculateDuration(formData.start_date, formData.end_date) 
        : 0;
      return calculateReach(
        selectedPlacements,
        duration,
        formData.start_date,
        formData.end_date
      );
    }
    return null;
  }, [selectedPlacements, formData.start_date, formData.end_date]);

  const toggleCity = (city: string) => {
    setSelectedCities(prev =>
      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
    );
  };

  const togglePlacement = (locationId: string) => {
    setManualSelections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(locationId)) {
        newSet.delete(locationId);
      } else {
        newSet.add(locationId);
      }
      return newSet;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'edit' && campaign) {
        // Update existing campaign
        await updateCampaign.mutateAsync({
          id: campaign.id,
          ...formData,
          cities: selectedCities,
        });
        
        // Delete existing placements and recreate
        const { error: deleteError } = await supabase
          .from('campaign_placements')
          .delete()
          .eq('campaign_id', campaign.id);
        
        if (deleteError) throw deleteError;
        
        const { error: insertError } = await supabase
          .from('campaign_placements')
          .insert(selectedPlacements.map(p => ({
            campaign_id: campaign.id,
            location_id: p.location.id,
            allocated_budget: p.cost,
          })));
        
        if (insertError) throw insertError;
      } else {
        // Create new campaign
        await createCampaign.mutateAsync({
          campaign: {
            ...formData,
            cities: selectedCities,
            status: 'draft',
            created_by: user?.id,
          },
          placements: selectedPlacements.map(p => ({
            location_id: p.location.id,
            allocated_budget: p.cost,
          })),
        });
      }
      
      onClose();
      
      // Reset form only for create mode
      if (mode === 'create') {
        setFormData({
          name: "",
          budget: 0,
          start_date: "",
          end_date: "",
          agency: "",
          notes: "",
        });
        setSelectedCities([]);
      }
    } catch (error) {
      // Error handling done in hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit Campaign' : 'Plan New Campaign'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-6 min-h-0">
              {/* Left: Form Inputs */}
              <div className="space-y-4 flex flex-col min-h-0">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Ramadan 2025"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Total Budget (AED) *</Label>
                <Input
                  id="budget"
                  type="number"
                  value={formData.budget || ""}
                  onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                  placeholder="100000"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    min={formData.start_date}
                    required
                  />
                </div>
              </div>

              {duration > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Duration: {duration} month{duration !== 1 ? 's' : ''}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="agency">Agency</Label>
                <Input
                  id="agency"
                  value={formData.agency}
                  onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                  placeholder="e.g., Mediahub"
                />
              </div>

              <div className="space-y-2">
                <Label>Select Cities *</Label>
                <div className="flex flex-wrap gap-2">
                  {cities.map(city => (
                    <Badge
                      key={city}
                      variant={selectedCities.includes(city) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleCity(city)}
                    >
                      {city}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            {/* Right: Placement Suggestions */}
            <div className="space-y-4">
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    {showAllLocations ? 'All Available Locations' : (
                      <>
                        <Sparkles className="h-4 w-4 text-primary" />
                        AI Suggested Placements
                      </>
                    )}
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAllLocations(!showAllLocations);
                      setAgencyFilter([]);
                    }}
                  >
                    {showAllLocations ? 'Show AI Suggestions' : 'Browse All'}
                  </Button>
                </div>
                
                {showAllLocations && availableAgencies.length > 0 && (
                  <div className="mb-3">
                    <Label className="text-xs mb-1">Filter by Agency</Label>
                    <div className="flex flex-wrap gap-1">
                      <Badge
                        variant={agencyFilter.length === 0 ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() => setAgencyFilter([])}
                      >
                        All Agencies
                      </Badge>
                      {availableAgencies.map(agency => (
                        <Badge
                          key={agency}
                          variant={agencyFilter.includes(agency) ? "default" : "outline"}
                          className="cursor-pointer text-xs"
                          onClick={() => {
                            setAgencyFilter(prev =>
                              prev.includes(agency)
                                ? prev.filter(a => a !== agency)
                                : [...prev, agency]
                            );
                          }}
                        >
                          {agency}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {!showAllLocations && suggestedPlacements.length === 0 && selectedCities.length > 0 && formData.budget > 0 ? (
                  <p className="text-sm text-amber-600">
                    No locations with historic pricing found in selected cities. Please add historic prices to locations first.
                  </p>
                ) : !showAllLocations && suggestedPlacements.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Enter budget and select cities to see suggested placements
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {(showAllLocations ? availableLocations : suggestedPlacements.map(s => s.location))
                      .map(location => {
                        const suggestedItem = suggestedPlacements.find(s => s.location.id === location.id);
                        const locationPrices = allPrices.filter(p => p.location_id === location.id);
                        const avgPrice = locationPrices.length > 0
                          ? locationPrices.reduce((sum, p) => sum + p.price, 0) / locationPrices.length
                          : (location.price_per_month || 0);
                        const cost = suggestedItem?.cost || (avgPrice * duration);
                        const isSelected = manualSelections.has(location.id);
                        const isAISuggested = !!suggestedItem && !showAllLocations;

                        return (
                          <div
                            key={location.id}
                            className={`flex items-start gap-2 p-2 border rounded hover:bg-accent ${
                              isAISuggested ? 'border-primary/30 bg-primary/5' : ''
                            }`}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => {
                                if (!isSelected) {
                                  setManualSelections(prev => new Set([...prev, location.id]));
                                  if (!suggestedItem) {
                                    setSuggestedPlacements(prev => [
                                      ...prev,
                                      { location, cost }
                                    ]);
                                  }
                                } else {
                                  setManualSelections(prev => {
                                    const newSet = new Set(prev);
                                    newSet.delete(location.id);
                                    return newSet;
                                  });
                                }
                              }}
                            />
                            <div className="flex-1 text-sm">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">{location.name}</span>
                                {isAISuggested && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    AI Pick
                                  </Badge>
                                )}
                              </div>
                              <div className="text-muted-foreground flex items-center gap-2 flex-wrap mt-1">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {location.city} • {location.type}
                                </span>
                                {location.agency && (
                                  <Badge variant="outline" className="text-xs">
                                    {location.agency}
                                  </Badge>
                                )}
                                {location.manual_score && (
                                  <Badge variant="secondary" className="text-xs">
                                    Score: {location.manual_score}/10
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                AED {cost.toLocaleString()} ({duration} months)
                                {location.est_daily_traffic && (
                                  <span className="ml-2">
                                    • ~{(location.est_daily_traffic * duration * 30).toLocaleString()} impressions
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Reach & CPM Metrics */}
              {reachMetrics && (
                <div className="p-4 border rounded-lg space-y-2 bg-primary/5 border-primary/20">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Estimated Performance
                  </h4>
                  <div className="flex justify-between text-sm">
                    <span>Total Reach:</span>
                    <span className="font-semibold">
                      {reachMetrics.totalReach.toLocaleString()} impressions
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Estimated CPM:</span>
                    <span className="font-semibold">
                      AED {reachMetrics.cpm.toFixed(2)}
                    </span>
                  </div>
                  {reachMetrics.seasonalInfo.season !== 'Regular Season' && (
                    <div className="text-xs text-primary pt-2 border-t border-primary/20">
                      <Badge variant="secondary" className="mb-1">
                        {reachMetrics.seasonalInfo.season}
                      </Badge>
                      <p className="mt-1">
                        Reach adjusted by {((reachMetrics.seasonalInfo.reachMultiplier - 1) * 100).toFixed(0)}% 
                        based on seasonal trends
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Budget Summary */}
              {selectedPlacements.length > 0 && (
                <div className="p-4 border rounded-lg space-y-2 bg-accent/50">
                  <div className="flex justify-between text-sm">
                    <span>Selected Placements:</span>
                    <span className="font-semibold">{selectedPlacements.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Cost:</span>
                    <span className="font-semibold">AED {totalCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Budget:</span>
                    <span className="font-semibold">AED {formData.budget.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span>Remaining:</span>
                    <span className={`font-semibold ${remainingBudget < 0 ? 'text-destructive' : 'text-green-600'}`}>
                      AED {remainingBudget.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t mt-4 pr-12">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || selectedPlacements.length === 0 || remainingBudget < 0}
            >
              {loading 
                ? (mode === 'edit' ? "Updating..." : "Creating...")
                : (mode === 'edit' ? "Update Campaign" : "Create Campaign")
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
