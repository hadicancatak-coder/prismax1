import { useEffect, useRef, useImperativeHandle, forwardRef, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Supercluster from "supercluster";
import { MediaLocation, getLocationCategory, LOCATION_CATEGORIES } from "@/hooks/useMediaLocations";
import { MapPin } from "lucide-react";

const MAPBOX_TOKEN = "pk.eyJ1IjoiaGFkaWNhbiIsImEiOiJjbWh1YjY5bWkwNDI2MmpzYmQ0MmkwaXBnIn0.ScDl8LTtKyGxmLBFC8R4rw";

interface LocationMapProps {
  locations: MediaLocation[];
  onLocationClick: (location: MediaLocation) => void;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  selectedLocationId?: string | null;
}

export interface LocationMapRef {
  flyToLocation: (location: MediaLocation) => void;
}

export const LocationMap = forwardRef<LocationMapRef, LocationMapProps>(
  ({ locations, onLocationClick, onMapClick, selectedLocationId }, ref) => {
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

    // Create supercluster instance
    const cluster = useMemo(() => {
      const supercluster = new Supercluster({
        radius: 60,
        maxZoom: 16,
        minZoom: 0,
      });

      // Convert locations to GeoJSON features
      const points = locations.map(loc => ({
        type: 'Feature' as const,
        properties: {
          cluster: false,
          locationId: loc.id,
          location: loc,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [Number(loc.longitude), Number(loc.latitude)],
        },
      }));

      supercluster.load(points);
      return supercluster;
    }, [locations]);

    // Update markers when map moves or zooms
    const updateMarkers = () => {
      if (!map.current) return;

      // Clear existing markers
      markers.current.forEach(marker => marker.remove());
      markers.current = [];

      const bounds = map.current.getBounds();
      const zoom = Math.floor(map.current.getZoom());

      // Get clusters for current viewport
      const clusters = cluster.getClusters(
        [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
        zoom
      );

      // Render markers/clusters
      clusters.forEach((feature) => {
        const [lng, lat] = feature.geometry.coordinates;
        const isCluster = feature.properties?.cluster;

        if (isCluster) {
          // Cluster marker
          const count = feature.properties.point_count;
          const size = count < 10 ? 30 : count < 100 ? 40 : 50;

          const el = document.createElement('div');
          el.className = 'cluster-marker';
          el.style.width = `${size}px`;
          el.style.height = `${size}px`;
          el.innerHTML = `<span>${count}</span>`;

          // Click to expand cluster
          el.addEventListener('click', () => {
            const expansionZoom = cluster.getClusterExpansionZoom(feature.properties.cluster_id);
            map.current?.flyTo({
              center: [lng, lat],
              zoom: expansionZoom,
              duration: 1000,
            });
          });

          const marker = new mapboxgl.Marker(el)
            .setLngLat([lng, lat])
            .addTo(map.current!);

          markers.current.push(marker);
        } else {
          // Individual location marker
          const location = feature.properties.location as MediaLocation;
          const category = getLocationCategory(location.type);
          const color = category ? LOCATION_CATEGORIES[category].color : '#6b7280';

          const el = document.createElement('div');
          el.className = 'location-marker';
          el.style.backgroundColor = color;
          el.style.width = '24px';
          el.style.height = '24px';
          el.style.borderRadius = '50%';
          el.style.border = '2px solid white';
          el.style.cursor = 'pointer';
          el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';

          // Highlight if selected
          if (selectedLocationId === location.id) {
            el.style.border = '3px solid hsl(var(--primary))';
            el.style.transform = 'scale(1.3)';
          }

          const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
            .setHTML(`
              <div class="p-2">
                <div class="font-semibold">${location.name}</div>
                <div class="text-sm text-muted-foreground">${location.type}</div>
                ${location.manual_score ? `<div class="text-sm">Score: ${location.manual_score}/10</div>` : ''}
              </div>
            `);

          const marker = new mapboxgl.Marker(el)
            .setLngLat([lng, lat])
            .setPopup(popup)
            .addTo(map.current!);

          el.addEventListener('click', () => {
            onLocationClick(location);
          });

          markers.current.push(marker);
        }
      });
    };

    useEffect(() => {
      if (!map.current) return;

      // Initial render
      map.current.on('load', updateMarkers);
      
      // Update on map move/zoom
      map.current.on('moveend', updateMarkers);
      map.current.on('zoomend', updateMarkers);

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
          map.current.off('moveend', updateMarkers);
          map.current.off('zoomend', updateMarkers);
        }
      };
    }, [locations, onLocationClick, selectedLocationId]);

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
);
