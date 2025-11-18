import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMediaLocations, MediaLocation, getLocationCategory } from "@/hooks/useMediaLocations";
import { usePlannedCampaigns } from "@/hooks/usePlannedCampaigns";
import { useLocationCampaigns } from "@/hooks/useLocationCampaigns";
import { logger } from "@/lib/logger";
import { LocationMap, LocationMapRef } from "@/components/location/LocationMap";
import { LocationSearch } from "@/components/location/LocationSearch";
import { LocationDetailPopup } from "@/components/location/LocationDetailPopup";
import { LocationFormDialog } from "@/components/location/LocationFormDialog";
import { supabase } from "@/integrations/supabase/client";
import { CampaignPlannerDialog } from "@/components/location/CampaignPlannerDialog";
import { BulkLocationUploadDialog } from "@/components/location/BulkLocationUploadDialog";
import { LocationFilters } from "@/components/location/LocationFilters";
import type { LocationFilters as Filters } from "@/components/location/LocationFilters";
import { Button } from "@/components/ui/button";
import { Target, Plus, Upload, ChevronDown, ChevronUp, Filter, X } from "lucide-react";
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
    setEditingLocation(null);
    setFormOpen(true);
  };

  const handleLocationSelect = (location: MediaLocation) => {
    mapRef.current?.flyToLocation(location);
    setSelectedLocation(location);
    setDetailOpen(true);
  };

  const handleEdit = (location: MediaLocation) => {
    setEditingLocation(location);
    setClickedCoordinates(null);
    setFormOpen(true);
  };

  const handleDelete = async (locationId: string) => {
    try {
      await supabase.from('media_locations').delete().eq('id', locationId);
      toast.success("Location deleted successfully");
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
    <div className="relative h-[calc(100vh-64px)] w-full overflow-hidden">
      {/* Full-screen map background */}
      <div className="absolute inset-0">
        <LocationMap
          locations={filteredLocations}
          selectedLocationId={selectedLocations.map(l => l.id)}
          campaignLocationIds={campaignLocationIds}
          onLocationClick={handleLocationClick}
          onMapClick={isAdmin ? handleMapClick : undefined}
          ref={mapRef}
        />
      </div>

      {/* Top-left overlay - Search & Filters */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 max-w-sm">
        <LocationSearch 
          locations={filteredLocations} 
          onLocationSelect={handleLocationSelect} 
        />
        
        <Button 
          variant="secondary" 
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="bg-background/90 backdrop-blur-md shadow-xl border border-white/10 justify-start"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {showFilters ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
        </Button>
        
        {showFilters && (
          <div className="bg-background/90 backdrop-blur-md rounded-lg shadow-xl border border-white/10 p-4 transition-all duration-300 max-h-[calc(100vh-200px)] overflow-y-auto">
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

      {/* Top-right overlay - Admin actions */}
      {isAdmin && (
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <Button 
            onClick={() => { 
              setEditingLocation(null); 
              setClickedCoordinates(null);
              setFormOpen(true); 
            }} 
            className="bg-background/90 backdrop-blur-md shadow-xl border border-white/10"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Location
          </Button>
          <Button 
            onClick={() => setUploadOpen(true)} 
            variant="secondary" 
            className="bg-background/90 backdrop-blur-md shadow-xl border border-white/10"
          >
            <Upload className="h-4 w-4 mr-2" />
            Bulk Upload
          </Button>
        </div>
      )}

      {/* Bottom-left overlay - Stats */}
      <div className="absolute bottom-4 left-4 z-10 bg-background/90 backdrop-blur-md rounded-lg shadow-xl border border-white/10 p-4">
        <div className="flex gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Total:</span>
            <span className="ml-2 font-semibold">{filteredLocations.length}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Selected:</span>
            <span className="ml-2 font-semibold text-primary">{selectedLocations.length}</span>
          </div>
        </div>
      </div>

      {/* Bottom-right overlay - Selected locations panel */}
      {selectedLocations.length > 0 && (
        <div className="absolute bottom-4 right-4 z-10 bg-background/90 backdrop-blur-md rounded-lg shadow-xl border border-white/10 p-4 max-w-sm w-80 max-h-[500px] overflow-hidden flex flex-col">
          <h3 className="font-semibold mb-3">Selected Locations ({selectedLocations.length})</h3>
          <div className="space-y-2 mb-4 overflow-y-auto flex-1">
            {selectedLocations.map(loc => (
              <div key={loc.id} className="flex justify-between items-center p-2 bg-background/50 rounded text-sm">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{loc.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{loc.city}</div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleLocationClick(loc)}
                  className="ml-2 h-6 w-6 p-0 hover:bg-background/70"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2 border-t border-white/10">
            <Button
              onClick={handleClearSelection}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Clear
            </Button>
            <Button
              onClick={handleCreateCampaign}
              size="sm"
              className="flex-1"
            >
              <Target className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      {selectedLocation && (
        <LocationDetailPopup
          location={selectedLocation as any}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onEdit={() => handleEdit(selectedLocation)}
          onDelete={() => handleDelete(selectedLocation.id)}
        />
      )}

      <LocationFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        location={editingLocation as any}
        initialCoordinates={clickedCoordinates}
      />

      <CampaignPlannerDialog
        open={plannerOpen}
        onClose={() => {
          setSelectedLocations([]);
          setPlannerOpen(false);
        }}
        locations={selectedLocations}
        mode="create"
      />

      <BulkLocationUploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
      />
    </div>
  );
}
