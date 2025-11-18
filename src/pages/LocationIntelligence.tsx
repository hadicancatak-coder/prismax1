import { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Upload, X, FolderOpen, Target, ChevronDown, ChevronUp, Filter } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMediaLocations, MediaLocation, getLocationCategory } from "@/hooks/useMediaLocations";
import { usePlannedCampaigns } from "@/hooks/usePlannedCampaigns";
import { useLocationCampaigns } from "@/hooks/useLocationCampaigns";
import { LocationMap, LocationMapRef } from "@/components/location/LocationMap";
import { LocationSearch } from "@/components/location/LocationSearch";
import { LocationFilters } from "@/components/location/LocationFilters";
import type { LocationFilters as Filters } from "@/components/location/LocationFilters";
import { LocationDetailPopup } from "@/components/location/LocationDetailPopup";
import { LocationFormDialog } from "@/components/location/LocationFormDialog";
import { CampaignPlannerDialog } from "@/components/location/CampaignPlannerDialog";
import { BulkLocationUploadDialog } from "@/components/location/BulkLocationUploadDialog";
import { CampaignsListDialog } from "@/components/location/CampaignsListDialog";
import { VendorsDialog } from "@/components/location/VendorsDialog";
import { MapContextMenu } from "@/components/location/MapContextMenu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function LocationIntelligence() {
  const { userRole } = useAuth();
  const isAdmin = userRole === "admin";
  const { locations, isLoading, deleteLocation } = useMediaLocations();
  const { campaigns } = usePlannedCampaigns();
  const { campaignLocations, getLocationsByCampaign } = useLocationCampaigns();
  
  const [selectedLocations, setSelectedLocations] = useState<MediaLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<MediaLocation | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<MediaLocation | null>(null);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [campaignsListOpen, setCampaignsListOpen] = useState(false);
  const [vendorsOpen, setVendorsOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'normal' | 'campaign-select'>('normal');
  const [clickedCoordinates, setClickedCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<LocationMapRef>(null);

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

  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
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
  }, [locations, filters, campaignLocationIds]);

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
    setFormOpen(true);
  };

  const handleDelete = async (locationId: string) => {
    try {
      await deleteLocation.mutateAsync(locationId);
      toast.success("Location deleted successfully");
      setDetailOpen(false);
    } catch (error) {
      console.error("Error deleting location:", error);
      toast.error("Failed to delete location");
    }
  };

  const handleClearSelection = () => {
    setSelectedLocations([]);
    setSelectionMode('normal');
  };

  const handleCreateCampaignSelect = () => {
    setSelectionMode('campaign-select');
    toast.info("Selection mode activated. Click pins to select locations for your campaign.");
  };

  const handleExitSelectionMode = () => {
    setSelectionMode('normal');
    setSelectedLocations([]);
  };

  const handleFilterByAgency = (agency: string) => {
    setFilters(prev => ({
      ...prev,
      agencies: [agency]
    }));
  };

  if (isLoading) {
    return (
      <div className="relative h-[calc(100vh-64px)] w-full overflow-hidden bg-muted/20">
        <Skeleton className="absolute inset-0" />
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-64px)] w-full overflow-hidden">
      {selectionMode === 'campaign-select' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-primary/90 backdrop-blur-md text-primary-foreground px-6 py-3 rounded-lg shadow-xl border border-primary-foreground/20 flex items-center gap-3">
          <Target className="h-5 w-5" />
          <span className="font-medium">Selection Mode - Click pins to select locations</span>
          <Button size="sm" variant="secondary" onClick={handleExitSelectionMode} className="ml-4">Exit</Button>
        </div>
      )}

      <MapContextMenu
        onAddLocation={() => { setEditingLocation(null); setFormOpen(true); }}
        onCreateCampaignSelect={handleCreateCampaignSelect}
        onCreateCampaign={() => setPlannerOpen(true)}
        onViewCampaigns={() => setCampaignsListOpen(true)}
        onViewVendors={() => setVendorsOpen(true)}
        disabled={!isAdmin}
      >
        <div className="absolute inset-0">
          <LocationMap
            locations={filteredLocations}
            selectedLocationId={selectedLocations.map(l => l.id)}
            campaignLocationIds={campaignLocationIds}
            onLocationClick={handleLocationClick}
            onMapClick={isAdmin && selectionMode === 'normal' ? handleMapClick : undefined}
            selectionMode={selectionMode}
            isAdmin={isAdmin}
            ref={mapRef}
          />
        </div>
      </MapContextMenu>

      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 max-w-sm">
        <LocationSearch locations={filteredLocations} onLocationSelect={handleLocationSelect} />
        <Button variant="secondary" size="sm" onClick={() => setShowFilters(!showFilters)} className="bg-background/90 backdrop-blur-md shadow-xl border border-white/10">
          <Filter className="h-4 w-4 mr-2" />Filters {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
        </Button>
        {showFilters && (
          <div className="bg-background/90 backdrop-blur-md rounded-lg shadow-xl border border-white/10 p-4 transition-all duration-300 max-h-[500px] overflow-y-auto">
            <LocationFilters filters={filters} onFiltersChange={setFilters} cities={cities} agencies={agencies} campaigns={campaigns} />
          </div>
        )}
      </div>

      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button onClick={() => setCampaignsListOpen(true)} variant="secondary" className="bg-background/90 backdrop-blur-md shadow-xl border border-white/10">
          <FolderOpen className="h-4 w-4 mr-2" />Campaigns
        </Button>
        {isAdmin && (
          <>
            <Button onClick={() => { setEditingLocation(null); setFormOpen(true); }} className="bg-background/90 backdrop-blur-md shadow-xl border border-white/10">
              <Plus className="h-4 w-4 mr-2" />Add Location
            </Button>
            <Button onClick={() => setUploadOpen(true)} variant="secondary" className="bg-background/90 backdrop-blur-md shadow-xl border border-white/10">
              <Upload className="h-4 w-4 mr-2" />Bulk Upload
            </Button>
          </>
        )}
      </div>

      <div className="absolute bottom-4 left-4 z-10 bg-background/90 backdrop-blur-md rounded-lg shadow-xl border border-white/10 p-4">
        <div className="flex gap-4 text-sm">
          <div><span className="text-muted-foreground">Total:</span><span className="ml-2 font-semibold">{filteredLocations.length}</span></div>
          <div><span className="text-muted-foreground">Selected:</span><span className="ml-2 font-semibold text-primary">{selectedLocations.length}</span></div>
        </div>
      </div>

      {selectedLocations.length > 0 && (
        <div className="absolute bottom-4 right-4 z-10 bg-background/90 backdrop-blur-md rounded-lg shadow-xl border border-white/10 p-4 max-w-sm max-h-[400px] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">{selectionMode === 'campaign-select' ? 'Selected for Campaign' : 'Selected Locations'} ({selectedLocations.length})</h3>
            {selectionMode === 'campaign-select' && <Badge variant="default" className="text-xs"><Target className="h-3 w-3 mr-1" />Active</Badge>}
          </div>
          <div className="space-y-2 mb-4">
            {selectedLocations.map(loc => (
              <div key={loc.id} className="flex justify-between items-center p-2 bg-background/50 rounded text-sm">
                <span className="truncate flex-1">{loc.name}</span>
                <Button size="sm" variant="ghost" onClick={() => handleLocationClick(loc)} className="h-6 w-6 p-0 hover:bg-destructive/20"><X className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            {selectionMode === 'campaign-select' ? (
              <>
                <Button onClick={handleExitSelectionMode} variant="outline" size="sm" className="flex-1">Exit Selection</Button>
                <Button onClick={() => setPlannerOpen(true)} size="sm" className="flex-1">Convert to Campaign</Button>
              </>
            ) : (
              <>
                <Button onClick={handleClearSelection} variant="outline" size="sm" className="flex-1">Clear</Button>
                <Button onClick={() => setPlannerOpen(true)} size="sm" className="flex-1">Create Campaign</Button>
              </>
            )}
          </div>
        </div>
      )}

      <LocationDetailPopup open={detailOpen} onClose={() => setDetailOpen(false)} location={selectedLocation} onEdit={() => selectedLocation && handleEdit(selectedLocation)} onDelete={() => selectedLocation && handleDelete(selectedLocation.id)} />
      <LocationFormDialog open={formOpen} onClose={() => { setFormOpen(false); setEditingLocation(null); setClickedCoordinates(null); }} location={editingLocation} initialCoordinates={clickedCoordinates} />
      <CampaignPlannerDialog open={plannerOpen} onClose={() => { setPlannerOpen(false); setSelectedLocations([]); setSelectionMode('normal'); }} locations={selectedLocations.length > 0 ? selectedLocations : filteredLocations} />
      <BulkLocationUploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} />
      <CampaignsListDialog open={campaignsListOpen} onClose={() => setCampaignsListOpen(false)} onCreateNew={() => { setCampaignsListOpen(false); setPlannerOpen(true); }} />
      <VendorsDialog open={vendorsOpen} onClose={() => setVendorsOpen(false)} locations={locations} onFilterByAgency={handleFilterByAgency} />
    </div>
  );
}
