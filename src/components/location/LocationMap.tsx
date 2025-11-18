import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MediaLocation, getLocationCategory, LOCATION_CATEGORIES } from "@/hooks/useMediaLocations";
import { MapPin } from "lucide-react";

const MAPBOX_TOKEN = "pk.eyJ1IjoiaGFkaWNhbiIsImEiOiJjbWh1YjY5bWkwNDI2MmpzYmQ0MmkwaXBnIn0.ScDl8LTtKyGxmLBFC8R4rw";

interface LocationMapProps {
  locations: MediaLocation[];
  onLocationClick: (location: MediaLocation) => void;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  selectedLocationId?: string[] | null;
  campaignLocationIds?: string[];
}

export interface LocationMapRef {
  flyToLocation: (location: MediaLocation) => void;
}

export const LocationMap = forwardRef<LocationMapRef, LocationMapProps>(
  ({ locations, onLocationClick, onMapClick, selectedLocationId, campaignLocationIds = [] }, ref) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markers = useRef<mapboxgl.Marker[]>([]);
    const highlightMarker = useRef<mapboxgl.Marker | null>(null);

    // Expose map control methods
    useImperativeHandle(ref, () => ({
      flyToLocation: (location: MediaLocation) => {
        if (!map.current) return;

        map.current.flyTo({
          center: [Number(location.longitude), Number(location.latitude)],
          zoom: 15,
          duration: 1500,
        });

        // Highlight selected location
        if (highlightMarker.current) {
          highlightMarker.current.remove();
        }

        const el = document.createElement('div');
        el.className = 'highlight-marker';
        el.style.width = '40px';
        el.style.height = '40px';
        el.style.borderRadius = '50%';
        el.style.border = '4px solid hsl(var(--primary))';
        el.style.backgroundColor = 'hsl(var(--primary) / 0.3)';
        el.style.animation = 'pulse 2s ease-in-out infinite';

        highlightMarker.current = new mapboxgl.Marker(el)
          .setLngLat([Number(location.longitude), Number(location.latitude)])
          .addTo(map.current);

        // Remove highlight after 3 seconds
        setTimeout(() => {
          highlightMarker.current?.remove();
          highlightMarker.current = null;
        }, 3000);
      },
    }));

    useEffect(() => {
      if (!mapContainer.current) return;

      mapboxgl.accessToken = MAPBOX_TOKEN;

      // Center on UAE coordinates, will adjust when markers are added
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [55.2708, 25.2048], // UAE
        zoom: 8,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

      // Add right-click handler for adding new locations
      if (onMapClick) {
        map.current.on('contextmenu', (e) => {
          e.preventDefault(); // Prevent browser context menu
          
          const { lng, lat } = e.lngLat;
          onMapClick({ lat, lng });

          // Show temporary marker with pulse animation
          const tempMarker = new mapboxgl.Marker({ 
            color: '#22c55e',
            scale: 1.2 
          })
            .setLngLat([lng, lat])
            .addTo(map.current!);

          // Add pulse effect
          const markerEl = tempMarker.getElement();
          markerEl.style.animation = 'pulse 1s ease-in-out';

          // Remove after 3 seconds
          setTimeout(() => tempMarker.remove(), 3000);
        });
      }

      return () => {
        map.current?.remove();
      };
    }, [onMapClick]);

    // Render individual markers (no clustering)
    const updateMarkers = () => {
      if (!map.current) return;

      // Clear existing markers
      markers.current.forEach(marker => marker.remove());
      markers.current = [];

      // Render individual markers for all locations
      locations.forEach(location => {
        const category = getLocationCategory(location.type);
        const color = category ? LOCATION_CATEGORIES[category].color : '#6b7280';
        const isInCampaign = campaignLocationIds.includes(location.id);

        const el = document.createElement('div');
        el.className = 'location-marker';
        el.style.backgroundColor = color;
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.borderRadius = '50%';
        el.style.border = '2px solid white';
        el.style.cursor = 'pointer';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        el.style.transition = 'all 0.2s ease';

        // Highlight if selected
        const isSelected = Array.isArray(selectedLocationId) && selectedLocationId.includes(location.id);
        if (isSelected) {
          el.style.border = '3px solid hsl(var(--primary))';
          el.style.transform = 'scale(1.3)';
        }

        // Add campaign badge if location is in a campaign
        if (isInCampaign) {
          const badge = document.createElement('div');
          badge.className = 'campaign-badge';
          badge.style.position = 'absolute';
          badge.style.top = '-8px';
          badge.style.right = '-8px';
          badge.style.backgroundColor = 'hsl(var(--primary))';
          badge.style.color = 'white';
          badge.style.borderRadius = '50%';
          badge.style.width = '16px';
          badge.style.height = '16px';
          badge.style.display = 'flex';
          badge.style.alignItems = 'center';
          badge.style.justifyContent = 'center';
          badge.style.fontSize = '10px';
          badge.style.fontWeight = 'bold';
          badge.innerHTML = '✓';
          el.appendChild(badge);
          el.style.position = 'relative';
        }

        const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
          .setHTML(`
            <div class="p-2">
              <div class="font-semibold">${location.name}</div>
              <div class="text-sm text-muted-foreground">${location.type}</div>
              ${location.manual_score ? `<div class="text-sm">Score: ${location.manual_score}/10</div>` : ''}
              ${isInCampaign ? `<div class="text-xs text-primary mt-1">✓ In Campaign</div>` : ''}
            </div>
          `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([Number(location.longitude), Number(location.latitude)])
          .setPopup(popup)
          .addTo(map.current!);

        el.addEventListener('click', () => {
          onLocationClick(location);
        });

        markers.current.push(marker);
      });
    };

    useEffect(() => {
      if (!map.current) return;

      // Initial render
      map.current.on('load', updateMarkers);

      // Initial update if map already loaded
      if (map.current.loaded()) {
        updateMarkers();
      }

      // Fit bounds to show all markers on initial load
      if (locations.length > 0 && map.current.loaded()) {
        const bounds = new mapboxgl.LngLatBounds();
        locations.forEach(loc => {
          bounds.extend([Number(loc.longitude), Number(loc.latitude)]);
        });
        map.current.fitBounds(bounds, { padding: 50, maxZoom: 12 });
      }

      return () => {
        if (map.current) {
          map.current.off('load', updateMarkers);
        }
      };
    }, [locations, onLocationClick, selectedLocationId]);

    return (
      <div className="relative w-full h-full">
        <div ref={mapContainer} className="absolute inset-0" />

        {/* Empty state overlay */}
        {locations.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-none">
            <div className="text-center space-y-2 p-6">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-semibold">No Locations to Display</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                No locations match the current filters. Try adjusting your filter settings.
              </p>
            </div>
          </div>
        )}

        {onMapClick && (
          <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-md p-3 rounded-lg shadow-xl border border-white/10">
            <p className="text-xs text-muted-foreground">
              <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted rounded border">Right-Click</kbd> to add location
            </p>
          </div>
        )}
      </div>
    );
  }
);
