import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMediaLocations, MediaLocation, getLocationCategory } from "@/hooks/useMediaLocations";
import { usePlannedCampaigns } from "@/hooks/usePlannedCampaigns";
import { useLocationCampaigns } from "@/hooks/useLocationCampaigns";
import { logger } from "@/lib/logger";
import { LocationMap, LocationMapRef } from "@/components/location/LocationMap";
import { LocationSearch } from "@/components/location/LocationSearch";
import { LocationListView } from "@/components/location/LocationListView";
import { LocationDetailPopup } from "@/components/location/LocationDetailPopup";
import { LocationFormDialog } from "@/components/location/LocationFormDialog";
import { CampaignsSection } from "@/components/location/CampaignsSection";
import { CampaignPlannerDialog } from "@/components/location/CampaignPlannerDialog";
import { BulkLocationUploadDialog } from "@/components/location/BulkLocationUploadDialog";
import { LocationFilters } from "@/components/location/LocationFilters";
import type { LocationFilters as Filters } from "@/components/location/LocationFilters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Map, List, Plus, Target, Upload } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function LocationIntelligence() {
  const { userRole } = useAuth();
  const isAdmin = userRole === "admin";
  const { locations, isLoading, deleteLocation, getLocationWithDetails } = useMediaLocations();
  const { campaigns } = usePlannedCampaigns();
  const { campaignLocations, getLocationsByCampaign } = useLocationCampaigns();
  const mapRef = useRef<LocationMapRef>(null);

  const [viewMode, setViewMode] = useState<"map" | "list" | "campaigns">("map");
  const [selectedLocation, setSelectedLocation] = useState<MediaLocation | null>(null);
  const [editingLocation, setEditingLocation] = useState<MediaLocation | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [clickedCoordinates, setClickedCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const [filters, setFilters] = useState<Filters>({
    cities: [],
    agencies: [],
    categories: [],
    campaignId: undefined,
    priceRange: { min: 0, max: 1000000 },
    scoreRange: { min: 0, max: 10 },
  });

  const cities = Array.from(new Set(locations.map(l => l.city))).sort();
  const agencies = Array.from(new Set(locations.map(l => l.agency).filter(Boolean))).sort() as string[];

  // Get location IDs for selected campaign
  const campaignLocationIds = filters.campaignId 
    ? getLocationsByCampaign(filters.campaignId).map(cl => cl.location_id)
    : [];

  // Apply filters
  const filteredLocations = locations.filter((loc) => {
    if (filters.cities.length > 0 && !filters.cities.includes(loc.city)) return false;
    if (filters.agencies.length > 0 && !filters.agencies.includes(loc.agency || "")) return false;
    if (filters.categories.length > 0) {
      const category = getLocationCategory(loc.type);
      if (!category || !filters.categories.includes(category)) return false;
    }
    if (filters.campaignId && !campaignLocationIds.includes(loc.id)) return false;
    const price = loc.price_per_month || 0;
    if (price < filters.priceRange.min || price > filters.priceRange.max) return false;
    const score = loc.manual_score || 0;
    if (score < filters.scoreRange.min || score > filters.scoreRange.max) return false;
    return true;
  });

  const handleLocationClick = (location: MediaLocation) => {
    setSelectedLocation(location);
    setDetailOpen(true);
  };

  const handleMapClick = (coords: { lat: number; lng: number }) => {
    setClickedCoordinates(coords);
    setFormOpen(true);
    toast.success(`Location selected at ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
  };

  const handleEdit = (location?: MediaLocation) => {
    setEditingLocation(location || selectedLocation);
    setClickedCoordinates(null);
    setFormOpen(true);
    setDetailOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteLocation.mutate(id);
  };

  const handleView = (location: MediaLocation) => {
    setSelectedLocation(location);
    setDetailOpen(true);
  };

  const handleSearchSelect = (location: MediaLocation) => {
    setViewMode("map"); // Switch to map view
    setSelectedLocation(location);
    
    // Fly to location on map
    if (mapRef.current) {
      mapRef.current.flyToLocation(location);
    }
    
    // Open detail popup after a delay to allow map animation
    setTimeout(() => {
      setDetailOpen(true);
    }, 800);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Location Intelligence</h1>
          <p className="text-muted-foreground mt-1">
            Manage offline media inventory and outdoor advertising spaces
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setPlannerOpen(true)}>
            <Target className="h-4 w-4 mr-2" />
            Plan Campaign
          </Button>
          {isAdmin && (
            <>
              <Button onClick={() => handleEdit()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Location
              </Button>
              <Button onClick={() => setUploadOpen(true)} variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Upload CSV
              </Button>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[700px]" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-4">
            <LocationSearch 
              locations={filteredLocations} 
              onLocationSelect={handleSearchSelect}
            />
            <div className="flex gap-2">
              <Button
                variant={viewMode === "map" ? "default" : "outline"}
                onClick={() => setViewMode("map")}
              >
                <Map className="h-4 w-4 mr-2" />
                Map View
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4 mr-2" />
                List View
              </Button>
              <Button
                variant={viewMode === "campaigns" ? "default" : "outline"}
                onClick={() => setViewMode("campaigns")}
              >
                <Target className="h-4 w-4 mr-2" />
                Campaigns
              </Button>
            </div>
          </div>

          <LocationFilters
            filters={filters}
            onFiltersChange={setFilters}
            availableCities={cities}
            availableAgencies={agencies}
            availableCampaigns={campaigns.map(c => ({ id: c.id, name: c.name }))}
          />

        {viewMode === "map" ? (
          <div className="h-[calc(100vh-220px)] min-h-[700px] rounded-lg overflow-hidden border">
            <LocationMap
              ref={mapRef}
              locations={filteredLocations}
              onLocationClick={handleLocationClick}
              onMapClick={handleMapClick}
              selectedLocationId={selectedLocation?.id}
              campaignLocationIds={campaignLocationIds}
            />
          </div>
        ) : viewMode === "list" ? (
            <LocationListView
              locations={filteredLocations}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isAdmin={isAdmin}
            />
          ) : (
            <CampaignsSection />
          )}
        </>
      )}

      <LocationDetailPopup
        location={selectedLocation ? getLocationWithDetails(selectedLocation.id) || null : null}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedLocation(null);
        }}
        onEdit={() => handleEdit()}
        isAdmin={isAdmin}
      />

      <LocationFormDialog
        location={editingLocation ? getLocationWithDetails(editingLocation.id) || null : null}
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingLocation(null);
          setClickedCoordinates(null);
        }}
        initialCoordinates={clickedCoordinates}
      />

      <CampaignPlannerDialog
        open={plannerOpen}
        onClose={() => setPlannerOpen(false)}
        locations={filteredLocations}
      />

      <BulkLocationUploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
      />
    </div>
  );
}
