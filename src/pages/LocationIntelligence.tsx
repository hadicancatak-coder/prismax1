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
import { supabase } from "@/integrations/supabase/client";
import { CampaignsSection } from "@/components/location/CampaignsSection";
import { CampaignPlannerDialog } from "@/components/location/CampaignPlannerDialog";
import { BulkLocationUploadDialog } from "@/components/location/BulkLocationUploadDialog";
import { LocationFilters } from "@/components/location/LocationFilters";
import type { LocationFilters as Filters } from "@/components/location/LocationFilters";
import { Button } from "@/components/ui/button";
import { Target, Plus, Upload, ChevronDown, ChevronUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function LocationIntelligence() {
  const { userRole } = useAuth();
  const isAdmin = userRole === "admin";
  const { locations, isLoading, deleteLocation, getLocationWithDetails } = useMediaLocations();
  const { campaigns } = usePlannedCampaigns();
  const { campaignLocations, getLocationsByCampaign } = useLocationCampaigns();
  const mapRef = useRef<LocationMapRef>(null);

  const [selectedLocations, setSelectedLocations] = useState<MediaLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<MediaLocation | null>(null);
  const [editingLocation, setEditingLocation] = useState<MediaLocation | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [clickedCoordinates, setClickedCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [showFilters, setShowFilters] = useState(false);

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

  const campaignLocationIds = filters.campaignId 
    ? getLocationsByCampaign(filters.campaignId).map(cl => cl.location_id)
    : [];

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
    const isSelected = selectedLocations.some(loc => loc.id === location.id);
    if (isSelected) {
      setSelectedLocations(selectedLocations.filter(loc => loc.id !== location.id));
    } else {
      setSelectedLocations([...selectedLocations, location]);
    }
  };

  const handleMapClick = (coords: { lat: number; lng: number }) => {
    setClickedCoordinates(coords);
    setFormOpen(true);
    toast.success(`Location selected at ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
  };

  const handleEdit = (location?: MediaLocation) => {
    setEditingLocation(location || selectedLocation || null);
    setDetailOpen(false);
    setFormOpen(true);
  };

  const handleDelete = async (locationId: string) => {
    try {
      // Use the deleteLocation hook properly
      await supabase.from('media_locations').delete().eq('id', locationId);
      toast.success("Location deleted successfully");
      setDetailOpen(false);
      setSelectedLocation(null);
    } catch (error) {
      logger.error("Failed to delete location", { error });
      toast.error("Failed to delete location");
    }
  };

  const handleCreateCampaign = () => {
    setPlannerOpen(true);
  };

  const handleClearSelection = () => {
    setSelectedLocations([]);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Full-screen Map */}
      <div className="flex-1 relative w-full">
        <LocationMap
          ref={mapRef}
          locations={filteredLocations}
          onLocationClick={handleLocationClick}
          onMapClick={isAdmin ? handleMapClick : undefined}
          selectedLocationId={selectedLocations.map(loc => loc.id)}
          campaignLocationIds={campaignLocationIds}
        />
      </div>

      {/* Top-left: Search and Filters */}
      <div className="absolute top-4 left-4 z-10 space-y-2 max-w-sm">
        <LocationSearch
          locations={locations}
          onLocationSelect={(location) => {
            mapRef.current?.flyToLocation(location);
            setSelectedLocation(location);
            setDetailOpen(true);
          }}
        />
        
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="w-full"
        >
          <Target className="w-4 h-4 mr-2" />
          Filters
          {showFilters && <ChevronUp className="ml-2 h-4 w-4" />}
          {!showFilters && <ChevronDown className="ml-2 h-4 w-4" />}
        </Button>

        {showFilters && (
          <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg p-3 max-w-md">
            <LocationFilters
              filters={filters}
              onFiltersChange={setFilters}
              availableCities={cities}
              availableAgencies={agencies}
              availableCampaigns={campaigns.map(c => ({ id: c.id, name: c.name }))}
            />
          </div>
        )}
      </div>

      {/* Top-right: Admin Actions */}
      {isAdmin && (
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setEditingLocation(null);
              setClickedCoordinates(null);
              setFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Location
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setUploadOpen(true)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>
        </div>
      )}

      {/* Bottom-left: Location Stats */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg p-4">
          <div className="flex items-center gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Total</div>
              <div className="text-xl font-bold">{filteredLocations.length}</div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <div className="text-muted-foreground">Selected</div>
              <div className="text-xl font-bold text-primary">{selectedLocations.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom-right: Selected Locations Panel */}
      {selectedLocations.length > 0 && (
        <div className="absolute bottom-4 right-4 z-10 w-96">
          <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg p-4 max-h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">Selected Locations ({selectedLocations.length})</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
              >
                Clear All
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 mb-3">
              {selectedLocations.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center justify-between p-2 bg-muted rounded hover:bg-muted/80 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedLocation(location);
                    setDetailOpen(true);
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{location.name}</div>
                    <div className="text-xs text-muted-foreground">{location.city}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLocations(selectedLocations.filter(loc => loc.id !== location.id));
                    }}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>

            <Button
              onClick={handleCreateCampaign}
              className="w-full"
              disabled={selectedLocations.length === 0}
            >
              <Target className="w-4 h-4 mr-2" />
              Create Campaign ({selectedLocations.length} locations)
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <LocationDetailPopup
        location={selectedLocation ? getLocationWithDetails(selectedLocation.id) || null : null}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <LocationFormDialog
        location={editingLocation ? getLocationWithDetails(editingLocation.id) || null : null}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initialCoordinates={clickedCoordinates}
      />

      <CampaignPlannerDialog
        open={plannerOpen}
        onClose={() => setPlannerOpen(false)}
        locations={selectedLocations.length > 0 ? selectedLocations : filteredLocations}
      />

      <BulkLocationUploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
      />
    </div>
  );
}
