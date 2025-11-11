import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMediaLocations, MediaLocation } from "@/hooks/useMediaLocations";
import { LocationStats } from "@/components/location/LocationStats";
import { LocationMap } from "@/components/location/LocationMap";
import { LocationListView } from "@/components/location/LocationListView";
import { LocationDetailPopup } from "@/components/location/LocationDetailPopup";
import { LocationFormDialog } from "@/components/location/LocationFormDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Map, List, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function LocationIntelligence() {
  const { userRole } = useAuth();
  const isAdmin = userRole === "admin";
  const { locations, isLoading, deleteLocation, getLocationWithDetails } = useMediaLocations();

  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<MediaLocation | null>(null);
  const [editingLocation, setEditingLocation] = useState<MediaLocation | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [mapboxToken, setMapboxToken] = useState<string | null>(
    localStorage.getItem("mapbox_token")
  );

  const cities = Array.from(new Set(locations.map(l => l.city))).sort();
  
  const getCityCount = (city: string) => {
    return locations.filter(l => l.city === city).length;
  };

  const handleTokenSubmit = (token: string) => {
    localStorage.setItem("mapbox_token", token);
    setMapboxToken(token);
  };

  const handleLocationClick = (location: MediaLocation) => {
    setSelectedLocation(location);
    setDetailOpen(true);
  };

  const handleEdit = (location?: MediaLocation) => {
    setEditingLocation(location || selectedLocation);
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
          {isAdmin && (
            <Button onClick={() => handleEdit()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-[600px]" />
        </div>
      ) : (
        <>
          <LocationStats locations={locations} />

          <div className="flex items-center justify-between">
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
            </div>

            {viewMode === "map" && (
              <div className="flex gap-2 flex-wrap">
                <Badge
                  variant={selectedCity === null ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedCity(null)}
                >
                  All Cities ({locations.length})
                </Badge>
                {cities.map(city => (
                  <Badge
                    key={city}
                    variant={selectedCity === city ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedCity(city)}
                  >
                    {city} ({getCityCount(city)})
                  </Badge>
                ))}
                {cities.length === 0 && (
                  <span className="text-sm text-muted-foreground">
                    Add locations to see city filters
                  </span>
                )}
              </div>
            )}
          </div>

          {viewMode === "map" ? (
            <LocationMap
              locations={locations}
              selectedCity={selectedCity}
              onLocationClick={handleLocationClick}
              mapboxToken={mapboxToken}
              onTokenSubmit={handleTokenSubmit}
            />
          ) : (
            <LocationListView
              locations={locations}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isAdmin={isAdmin}
            />
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
        }}
      />
    </div>
  );
}
