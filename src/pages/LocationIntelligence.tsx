import { useState, useRef, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Upload, X, FolderOpen, Target, ChevronDown, ChevronUp, Filter, MapPin, Layers } from "lucide-react";
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
import { CampaignDetailDialog } from "@/components/location/CampaignDetailDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

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
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedCampaignForDetail, setSelectedCampaignForDetail] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>({
    cities: [],
    agencies: [],
    categories: [],
    campaignId: undefined,
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

  const handleViewDetails = (location: MediaLocation) => {
    setSelectedLocation(location);
    setDetailOpen(true);
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

  const handleViewCampaign = (campaignId: string) => {
    setSelectedCampaignForDetail(campaignId);
  };

  // Set up right-click context menu on map
  useEffect(() => {
    // Wait for map to be ready
    const timer = setTimeout(() => {
      const mapContainer = document.querySelector('.mapboxgl-canvas-container');
      if (!mapContainer) return;

      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        setContextMenuPos({ x: e.clientX, y: e.clientY });
      };

      const handleClick = () => {
        setContextMenuPos(null);
      };

      mapContainer.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('click', handleClick);

      return () => {
        mapContainer.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('click', handleClick);
      };
    }, 500);

    return () => clearTimeout(timer);
  }, []);

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

      <div className="absolute inset-0">
        <LocationMap
          locations={filteredLocations}
          selectedLocationId={selectedLocations.map(l => l.id)}
          campaignLocationIds={campaignLocationIds}
          onLocationClick={handleLocationClick}
          onViewDetails={handleViewDetails}
          onEdit={handleEdit}
          onMapClick={isAdmin && selectionMode === 'normal' ? handleMapClick : undefined}
          selectionMode={selectionMode}
          isAdmin={isAdmin}
          ref={mapRef}
        />
      </div>

      {/* Custom context menu portal */}
      {contextMenuPos && createPortal(
        <div
          className={cn(
            "fixed z-50 min-w-[200px] overflow-hidden rounded-lg border bg-popover p-1 text-popover-foreground shadow-xl",
            "animate-in fade-in-0 zoom-in-95"
          )}
          style={{
            left: `${contextMenuPos.x}px`,
            top: `${contextMenuPos.y}px`,
          }}
        >
          {isAdmin && (
            <button
              onClick={() => {
                setEditingLocation(null);
                setFormOpen(true);
                setContextMenuPos(null);
              }}
              className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <MapPin className="mr-2 h-4 w-4" />
              Add Location Here
            </button>
          )}
          <button
            onClick={() => {
              handleCreateCampaignSelect();
              setContextMenuPos(null);
            }}
            className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Target className="mr-2 h-4 w-4" />
            Select Locations for Campaign
          </button>
          <button
            onClick={() => {
              setPlannerOpen(true);
              setContextMenuPos(null);
            }}
            className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </button>
          <button
            onClick={() => {
              setCampaignsListOpen(true);
              setContextMenuPos(null);
            }}
            className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            View All Campaigns
          </button>
          {isAdmin && (
            <button
              onClick={() => {
                setVendorsOpen(true);
                setContextMenuPos(null);
              }}
              className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Layers className="mr-2 h-4 w-4" />
              Manage Vendors
            </button>
          )}
        </div>,
        document.body
      )}

      <div className="absolute top-4 left-4 z-30 flex flex-col gap-2 max-w-sm">
        <LocationSearch locations={filteredLocations} onLocationSelect={handleLocationSelect} />
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => setShowFilters(!showFilters)} 
          className="bg-background/95 backdrop-blur-md shadow-xl border gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {(filters.cities.length + filters.agencies.length + filters.categories.length + (filters.campaignId ? 1 : 0)) > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {filters.cities.length + filters.agencies.length + filters.categories.length + (filters.campaignId ? 1 : 0)}
            </Badge>
          )}
        </Button>
        <LocationFilters 
          filters={filters} 
          onFiltersChange={setFilters} 
          availableCities={cities} 
          availableAgencies={agencies} 
          availableCampaigns={campaigns.map(c => ({ id: c.id, name: c.name }))}
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
        />
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

      <LocationDetailPopup 
        open={detailOpen} 
        onOpenChange={setDetailOpen} 
        location={selectedLocation ? { ...selectedLocation, historic_prices: [], past_campaigns: [] } : null} 
        onEdit={() => selectedLocation && handleEdit(selectedLocation)} 
        onDelete={() => selectedLocation && handleDelete(selectedLocation.id)} 
      />
      <LocationFormDialog 
        open={formOpen} 
        onClose={() => { setFormOpen(false); setEditingLocation(null); setClickedCoordinates(null); }} 
        location={editingLocation ? { ...editingLocation, historic_prices: [], past_campaigns: [] } : null} 
        initialCoordinates={clickedCoordinates} 
      />
      <CampaignPlannerDialog
        open={plannerOpen}
        onClose={() => {
          setPlannerOpen(false);
          setSelectedLocations([]);
          setSelectionMode('normal');
        }}
        locations={selectedLocations}
      />
      <BulkLocationUploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} />
      <CampaignsListDialog 
        open={campaignsListOpen} 
        onClose={() => setCampaignsListOpen(false)} 
        onCreateNew={() => { setCampaignsListOpen(false); setPlannerOpen(true); }} 
        onViewCampaign={handleViewCampaign}
      />
      <VendorsDialog open={vendorsOpen} onClose={() => setVendorsOpen(false)} locations={locations} onFilterByAgency={handleFilterByAgency} />
      {selectedCampaignForDetail && (
        <CampaignDetailDialog
          campaign={campaigns.find(c => c.id === selectedCampaignForDetail) || null}
          open={!!selectedCampaignForDetail}
          onClose={() => setSelectedCampaignForDetail(null)}
        />
      )}
    </div>
  );
}
