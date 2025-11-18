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
    <div className="fixed inset-0 z-50 bg-background">
      {/* Full-screen Map */}
      <div className="absolute inset-0">
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
      <div className="absolute top-4 left-4 z-10 space-y-2 w-80">
        <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg p-3">
          <LocationSearch
            locations={locations}
            onLocationSelect={(location) => {
              mapRef.current?.flyToLocation(location);
              setSelectedLocation(location);
              setDetailOpen(true);
            }}
          />
        </div>
        
        <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full justify-between rounded-lg"
          >
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span>Filters</span>
            </div>
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          {showFilters && (
            <div className="p-3 border-t">
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
            className="bg-background/95 backdrop-blur-sm shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Location
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setUploadOpen(true)}
            className="bg-background/95 backdrop-blur-sm shadow-lg"
          >
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>
        </div>
      )}

      {/* Bottom-left: Location Stats */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg p-4 min-w-[200px]">
          <div className="flex items-center gap-6 text-sm">
            <div>
              <div className="text-muted-foreground text-xs">Total Locations</div>
              <div className="text-2xl font-bold">{filteredLocations.length}</div>
            </div>
            {selectedLocations.length > 0 && (
              <>
                <div className="h-10 w-px bg-border" />
                <div>
                  <div className="text-muted-foreground text-xs">Selected</div>
                  <div className="text-2xl font-bold text-primary">{selectedLocations.length}</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom-right: Selected Locations Panel */}
      {selectedLocations.length > 0 && (
        <div className="absolute bottom-4 right-4 z-10 w-96 max-w-[calc(100vw-2rem)]">
          <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg p-4 max-h-[60vh] flex flex-col">
            <div className="flex items-center justify-between mb-3 pb-3 border-b">
              <h3 className="font-semibold text-lg">Selected ({selectedLocations.length})</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
              >
                Clear All
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-2">
              {selectedLocations.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded hover:bg-muted transition-colors cursor-pointer group"
                  onClick={() => {
                    setSelectedLocation(location);
                    setDetailOpen(true);
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{location.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>{location.city}</span>
                      {location.manual_score && (
                        <>
                          <span>•</span>
                          <span>Score: {location.manual_score}/10</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
              size="lg"
              disabled={selectedLocations.length === 0}
            >
              <Target className="w-4 h-4 mr-2" />
              Create Campaign with {selectedLocations.length} location{selectedLocations.length !== 1 ? 's' : ''}
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
