import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LocationWithDetails, useMediaLocations, LocationType, LOCATION_CATEGORIES } from "@/hooks/useMediaLocations";
import { Upload, MapPin } from "lucide-react";
import { toast } from "sonner";

const MAPBOX_TOKEN = "pk.eyJ1IjoiaGFkaWNhbiIsImEiOiJjbWh1YjY5bWkwNDI2MmpzYmQ0MmkwaXBnIn0.ScDl8LTtKyGxmLBFC8R4rw";

interface LocationFormDialogProps {
  location: LocationWithDetails | null;
  open: boolean;
  onClose: () => void;
  initialCoordinates?: { lat: number; lng: number } | null;
}


export function LocationFormDialog({ location, open, onClose, initialCoordinates }: LocationFormDialogProps) {
  const { createLocation, updateLocation, uploadImage } = useMediaLocations();
  
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    type: "Hoarding" as LocationType,
    latitude: 0,
    longitude: 0,
    notes: "",
    agency: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [detectingCity, setDetectingCity] = useState(false);

  // Reverse geocode to get city from coordinates
  const detectCityFromCoordinates = async (lat: number, lng: number) => {
    setDetectingCity(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=place`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const city = data.features[0].text;
        setFormData(prev => ({ ...prev, city }));
        toast.success(`City detected: ${city}`);
      }
    } catch (error) {
      console.error("Error detecting city:", error);
      toast.error("Could not detect city from coordinates");
    } finally {
      setDetectingCity(false);
    }
  };

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name,
        city: location.city,
        type: location.type as LocationType,
        latitude: Number(location.latitude),
        longitude: Number(location.longitude),
        notes: location.notes || "",
        agency: location.agency || "",
      });
      setImagePreview(location.image_url || null);
    } else if (initialCoordinates) {
      setFormData({
        name: "",
        city: "",
        type: "Hoarding",
        latitude: initialCoordinates.lat,
        longitude: initialCoordinates.lng,
        notes: "",
        agency: "",
      });
      setImageFile(null);
      setImagePreview(null);
      // Auto-detect city from coordinates
      detectCityFromCoordinates(initialCoordinates.lat, initialCoordinates.lng);
    } else {
      setFormData({
        name: "",
        city: "",
        type: "Hoarding",
        latitude: 0,
        longitude: 0,
        notes: "",
        agency: "",
      });
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
        await updateLocation.mutateAsync({
          id: location.id,
          ...formData,
        });

        if (imageFile) {
          imageUrl = await uploadImage(imageFile, location.id);
          await updateLocation.mutateAsync({ id: location.id, image_url: imageUrl });
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
      }

      toast.success(location ? "Location updated" : "Location created");
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

        <form onSubmit={handleSubmit} className="space-y-lg">
          <div className="grid grid-cols-2 gap-md">
            <div className="space-y-sm">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-sm">
              <Label htmlFor="city">City * {detectingCity && <span className="text-metadata text-muted-foreground ml-sm">(detecting...)</span>}</Label>
              <div className="flex gap-sm">
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                  className={detectingCity ? "border-primary" : ""}
                />
                {formData.latitude !== 0 && formData.longitude !== 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => detectCityFromCoordinates(formData.latitude, formData.longitude)}
                    disabled={detectingCity}
                  >
                    <MapPin className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-sm">
              <Label htmlFor="type">Type *</Label>
              <Select value={formData.type} onValueChange={(value: LocationType) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-96">
                  {Object.entries(LOCATION_CATEGORIES).map(([category, config]) => (
                    <div key={category}>
                      <div className="px-sm py-1.5 text-metadata font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                        {config.emoji} {category}
                      </div>
                      {config.types.map((type) => (
                        <SelectItem key={type} value={type} className="pl-6">
                          {type}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-sm">
              <Label htmlFor="agency">Agency</Label>
              <Input
                id="agency"
                value={formData.agency}
                onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                placeholder="e.g., Mediahub, Starcom"
              />
            </div>

            <div className="space-y-sm">
              <Label htmlFor="latitude">Latitude * {initialCoordinates && <span className="text-metadata text-muted-foreground ml-sm">(from map click)</span>}</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) })}
                required
                className={initialCoordinates ? "border-primary" : ""}
              />
            </div>

            <div className="space-y-sm">
              <Label htmlFor="longitude">Longitude * {initialCoordinates && <span className="text-metadata text-muted-foreground ml-sm">(from map click)</span>}</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) })}
                required
                className={initialCoordinates ? "border-primary" : ""}
              />
            </div>
          </div>

          <div className="space-y-sm">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-sm">
            <Label htmlFor="image">Location Image (Max 5MB)</Label>
            <div className="flex items-center gap-md">
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
