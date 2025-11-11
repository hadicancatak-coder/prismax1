import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { usePlannedCampaigns, calculateDuration, suggestPlacements } from "@/hooks/usePlannedCampaigns";
import { useMediaLocations } from "@/hooks/useMediaLocations";
import { MediaLocation } from "@/hooks/useMediaLocations";
import { Calendar, DollarSign, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface CampaignPlannerDialogProps {
  open: boolean;
  onClose: () => void;
  locations: MediaLocation[];
}

export function CampaignPlannerDialog({ open, onClose, locations }: CampaignPlannerDialogProps) {
  const { createCampaign } = usePlannedCampaigns();
  const { allPrices } = useMediaLocations();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: "",
    budget: 0,
    start_date: "",
    end_date: "",
    agency: "",
    notes: "",
  });
  
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [suggestedPlacements, setSuggestedPlacements] = useState<Array<{ location: MediaLocation; cost: number }>>([]);
  const [manualSelections, setManualSelections] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const cities = Array.from(new Set(locations.map(l => l.city))).sort();

  // Auto-suggest placements when budget/cities/dates change
  useEffect(() => {
    if (formData.budget > 0 && selectedCities.length > 0 && formData.start_date && formData.end_date) {
      const duration = calculateDuration(formData.start_date, formData.end_date);
      const suggestions = suggestPlacements(locations, formData.budget, duration, selectedCities, allPrices);
      setSuggestedPlacements(suggestions);
      setManualSelections(new Set(suggestions.map(s => s.location.id)));
    } else {
      setSuggestedPlacements([]);
      setManualSelections(new Set());
    }
  }, [formData.budget, formData.start_date, formData.end_date, selectedCities, locations, allPrices]);

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

  const selectedPlacements = suggestedPlacements.filter(p => manualSelections.has(p.location.id));
  const totalCost = selectedPlacements.reduce((sum, p) => sum + p.cost, 0);
  const remainingBudget = formData.budget - totalCost;
  const duration = formData.start_date && formData.end_date 
    ? calculateDuration(formData.start_date, formData.end_date) 
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
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
      onClose();
      // Reset form
      setFormData({
        name: "",
        budget: 0,
        start_date: "",
        end_date: "",
        agency: "",
        notes: "",
      });
      setSelectedCities([]);
    } catch (error) {
      // Error handling done in hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Plan New Campaign</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Left: Form Inputs */}
            <div className="space-y-4">
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
                <h3 className="font-semibold">Suggested Placements</h3>
                
                {suggestedPlacements.length === 0 && selectedCities.length > 0 && formData.budget > 0 ? (
                  <p className="text-sm text-amber-600">
                    No locations with historic pricing found in selected cities. Please add historic prices to locations first.
                  </p>
                ) : suggestedPlacements.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Enter budget and select cities to see suggested placements
                  </p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {suggestedPlacements.map(({ location, cost }) => (
                      <div key={location.id} className="flex items-start gap-2 p-2 border rounded hover:bg-accent">
                        <Checkbox
                          checked={manualSelections.has(location.id)}
                          onCheckedChange={() => togglePlacement(location.id)}
                        />
                        <div className="flex-1 text-sm">
                          <div className="font-medium">{location.name}</div>
                          <div className="text-muted-foreground flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            {location.city} • {location.type}
                            {location.manual_score && (
                              <Badge variant="secondary" className="ml-2">
                                Score: {location.manual_score}/10
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {location.agency && `Agency: ${location.agency} • `}
                            AED {cost.toLocaleString()} ({duration} months)
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

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

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || selectedPlacements.length === 0 || remainingBudget < 0}
            >
              {loading ? "Creating..." : "Create Campaign"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
