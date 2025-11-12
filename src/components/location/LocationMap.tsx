import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MediaLocation, getLocationCategory, LOCATION_CATEGORIES } from "@/hooks/useMediaLocations";
import { MapPin } from "lucide-react";

const MAPBOX_TOKEN = "pk.eyJ1IjoiaGFkaWNhbiIsImEiOiJjbWh1YjY5bWkwNDI2MmpzYmQ0MmkwaXBnIn0.ScDl8LTtKyGxmLBFC8R4rw";

interface LocationMapProps {
  locations: MediaLocation[];
  onLocationClick: (location: MediaLocation) => void;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
}

export function LocationMap({ locations, onLocationClick, onMapClick }: LocationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

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

    // Add click handler for adding new locations
    if (onMapClick) {
      map.current.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        onMapClick({ lat, lng });
        
        // Show temporary marker
        const tempMarker = new mapboxgl.Marker({ color: '#22c55e' })
          .setLngLat([lng, lat])
          .addTo(map.current!);
        
        // Remove after 3 seconds
        setTimeout(() => tempMarker.remove(), 3000);
      });
    }

    return () => {
      map.current?.remove();
    };
  }, [onMapClick]);

  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add markers for locations
    locations.forEach(location => {
      const el = document.createElement('div');
      el.className = 'location-marker';
      
      // Use category-based colors
      const category = getLocationCategory(location.type);
      const color = category ? LOCATION_CATEGORIES[category].color : '#6b7280';
      
      el.style.backgroundColor = color;
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
        .setHTML(`
          <div class="p-2">
            <div class="font-semibold">${location.name}</div>
            <div class="text-sm text-muted-foreground">${location.type}</div>
            ${location.manual_score ? `<div class="text-sm">Score: ${location.manual_score}/10</div>` : ''}
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

    // Fit bounds to show all markers
    if (locations.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      locations.forEach(loc => {
        bounds.extend([Number(loc.longitude), Number(loc.latitude)]);
      });
      map.current?.fitBounds(bounds, { padding: 50, maxZoom: 12 });
    }
  }, [locations, onLocationClick]);

  return (
    <div className="relative">
      <div ref={mapContainer} className="h-[600px] rounded-lg border" />
      
      {/* Empty state overlay */}
      {locations.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg pointer-events-none">
          <div className="text-center space-y-2 p-6">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-semibold">No Locations to Display</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              No locations match the current filters. Try adjusting your filter settings.
            </p>
          </div>
        </div>
      )}
      
      <div className="absolute top-4 left-4 bg-background/95 backdrop-blur p-3 rounded-lg shadow-lg border max-w-xs">
        <div className="text-xs font-semibold mb-2">Location Categories</div>
        <div className="space-y-1">
          {Object.entries(LOCATION_CATEGORIES).map(([category, config]) => (
            <div key={category} className="flex items-center gap-2 text-xs">
              <div 
                className="w-3 h-3 rounded-full border border-white flex-shrink-0" 
                style={{ backgroundColor: config.color }}
              />
              <span className="truncate">{config.emoji} {category}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
