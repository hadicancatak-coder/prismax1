import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LocationWithDetails, useMediaLocations, LocationType } from "@/hooks/useMediaLocations";
import { Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

interface LocationFormDialogProps {
  location: LocationWithDetails | null;
  open: boolean;
  onClose: () => void;
  initialCoordinates?: { lat: number; lng: number } | null;
}

const LOCATION_TYPES = [
  'Billboard',
  'LED Screen',
  'LED',
  'Digital Screen',
  'Unipoles/Megacorns',
  'Lampposts',
  'Mupis',
  'Bus Shelter',
  'Street Furniture',
  'In-Mall Media',
  'Hoardings',
  'Wall Wraps',
  'Roof Top Screens',
  'Transit',
  'Airport',
  'Tram',
  'Metro',
  'Elevator Screen',
  'Other'
];

export function LocationFormDialog({ location, open, onClose, initialCoordinates }: LocationFormDialogProps) {
  const { createLocation, updateLocation, upsertPrices, upsertCampaigns, uploadImage } = useMediaLocations();
  
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    type: "Billboard" as LocationType,
    latitude: 0,
    longitude: 0,
    notes: "",
    manual_score: undefined as number | undefined,
    agency: "",
    price_per_month: undefined as number | undefined,
  });

  const [prices, setPrices] = useState<Array<{ year: number; price: number }>>([]);
  const [campaigns, setCampaigns] = useState<Array<{ campaign_name: string; budget: number; campaign_date: string; notes: string }>>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name,
        city: location.city,
        type: location.type as LocationType,
        latitude: Number(location.latitude),
        longitude: Number(location.longitude),
        notes: location.notes || "",
        manual_score: location.manual_score,
        agency: location.agency || "",
        price_per_month: location.price_per_month,
      });
      setPrices(location.historic_prices.map(p => ({ year: p.year, price: Number(p.price) })));
      setCampaigns(location.past_campaigns.map(c => ({
        campaign_name: c.campaign_name,
        budget: Number(c.budget),
        campaign_date: c.campaign_date,
        notes: c.notes || "",
      })));
      setImagePreview(location.image_url || null);
    } else if (initialCoordinates) {
      setFormData({
        name: "",
        city: "",
        type: "Billboard",
        latitude: initialCoordinates.lat,
        longitude: initialCoordinates.lng,
        notes: "",
        manual_score: undefined,
        agency: "",
        price_per_month: undefined,
      });
      setPrices([]);
      setCampaigns([]);
      setImageFile(null);
      setImagePreview(null);
    } else {
      setFormData({
        name: "",
        city: "",
        type: "Billboard",
        latitude: 0,
        longitude: 0,
        notes: "",
        manual_score: undefined,
        agency: "",
        price_per_month: undefined,
      });
      setPrices([]);
      setCampaigns([]);
      setImageFile(null);
      setImagePreview(null);
    }
  }, [location, open, initialCoordinates]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error("Only JPG, PNG, and WebP images are allowed");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = location?.image_url;

      if (location) {
        // Update existing location
        const updated = await updateLocation.mutateAsync({
          id: location.id,
          ...formData,
        });

        if (imageFile) {
          imageUrl = await uploadImage(imageFile, location.id);
          await updateLocation.mutateAsync({ id: location.id, image_url: imageUrl });
        }

        if (prices.length > 0) {
          await upsertPrices.mutateAsync({ locationId: location.id, prices });
        }

        if (campaigns.length > 0) {
          await upsertCampaigns.mutateAsync({ locationId: location.id, campaigns });
        }
      } else {
        // Create new location
        const created = await createLocation.mutateAsync({
          ...formData,
          created_by: undefined,
        });

        if (imageFile && created) {
          imageUrl = await uploadImage(imageFile, created.id);
          await updateLocation.mutateAsync({ id: created.id, image_url: imageUrl });
        }

        if (prices.length > 0 && created) {
          await upsertPrices.mutateAsync({ locationId: created.id, prices });
        }

        if (campaigns.length > 0 && created) {
          await upsertCampaigns.mutateAsync({ locationId: created.id, campaigns });
        }
      }

      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to save location");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{location ? "Edit Location" : "Add New Location"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select value={formData.type} onValueChange={(value: LocationType) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCATION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="score">Manual Score (1-10)</Label>
              <Input
                id="score"
                type="number"
                min={1}
                max={10}
                value={formData.manual_score || ""}
                onChange={(e) => setFormData({ ...formData, manual_score: e.target.value ? Number(e.target.value) : undefined })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agency">Agency</Label>
              <Input
                id="agency"
                value={formData.agency}
                onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                placeholder="e.g., Mediahub, Starcom"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_per_month">Price per Month (AED)</Label>
              <Input
                id="price_per_month"
                type="number"
                value={formData.price_per_month || ""}
                onChange={(e) => setFormData({ ...formData, price_per_month: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Monthly rental price"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude *</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude *</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) })}
                required
              />
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

          <div className="space-y-2">
            <Label htmlFor="image">Location Image (Max 5MB)</Label>
            <div className="flex items-center gap-4">
              <Input
                id="image"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageChange}
                className="flex-1"
              />
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded border" />
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Historic Prices</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setPrices([...prices, { year: new Date().getFullYear(), price: 0 }])}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Price
              </Button>
            </div>
            {prices.map((price, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Year"
                  value={price.year}
                  onChange={(e) => {
                    const updated = [...prices];
                    updated[index].year = Number(e.target.value);
                    setPrices(updated);
                  }}
                />
                <Input
                  type="number"
                  placeholder="Price"
                  value={price.price}
                  onChange={(e) => {
                    const updated = [...prices];
                    updated[index].price = Number(e.target.value);
                    setPrices(updated);
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => setPrices(prices.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Past Campaigns</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setCampaigns([...campaigns, { campaign_name: "", budget: 0, campaign_date: "", notes: "" }])}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Campaign
              </Button>
            </div>
            {campaigns.map((campaign, index) => (
              <div key={index} className="space-y-2 p-3 border rounded">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Campaign Name"
                    value={campaign.campaign_name}
                    onChange={(e) => {
                      const updated = [...campaigns];
                      updated[index].campaign_name = e.target.value;
                      setCampaigns(updated);
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="Budget"
                    value={campaign.budget}
                    onChange={(e) => {
                      const updated = [...campaigns];
                      updated[index].budget = Number(e.target.value);
                      setCampaigns(updated);
                    }}
                  />
                  <Input
                    type="date"
                    value={campaign.campaign_date}
                    onChange={(e) => {
                      const updated = [...campaigns];
                      updated[index].campaign_date = e.target.value;
                      setCampaigns(updated);
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setCampaigns(campaigns.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
                <Input
                  placeholder="Notes (optional)"
                  value={campaign.notes}
                  onChange={(e) => {
                    const updated = [...campaigns];
                    updated[index].notes = e.target.value;
                    setCampaigns(updated);
                  }}
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : location ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
