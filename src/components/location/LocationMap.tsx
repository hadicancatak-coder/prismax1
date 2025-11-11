import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MediaLocation } from "@/hooks/useMediaLocations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface LocationMapProps {
  locations: MediaLocation[];
  selectedCity: string | null;
  onLocationClick: (location: MediaLocation) => void;
  mapboxToken: string | null;
  onTokenSubmit: (token: string) => void;
}

export function LocationMap({ locations, selectedCity, onLocationClick, mapboxToken, onTokenSubmit }: LocationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [tokenInput, setTokenInput] = useState("");

  const filteredLocations = selectedCity
    ? locations.filter(loc => loc.city === selectedCity)
    : locations;

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    const center: [number, number] = filteredLocations.length > 0
      ? [Number(filteredLocations[0].longitude), Number(filteredLocations[0].latitude)]
      : [0, 0];

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: center,
      zoom: 10,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add markers for filtered locations
    filteredLocations.forEach(location => {
      const el = document.createElement('div');
      el.className = 'location-marker';
      
      // Different colors based on type
      const colorMap: Record<string, string> = {
        'Billboard': '#ef4444',
        'LED Screen': '#3b82f6',
        'Bus Shelter': '#10b981',
        'Street Furniture': '#f59e0b',
        'Transit': '#8b5cf6',
        'Other': '#6b7280',
      };
      
      el.style.backgroundColor = colorMap[location.type] || '#6b7280';
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
    if (filteredLocations.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      filteredLocations.forEach(loc => {
        bounds.extend([Number(loc.longitude), Number(loc.latitude)]);
      });
      map.current?.fitBounds(bounds, { padding: 50, maxZoom: 12 });
    }
  }, [filteredLocations, onLocationClick]);

  if (!mapboxToken) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Mapbox Token Required</h3>
            <p className="text-sm text-muted-foreground mb-4">
              To display the map, please enter your Mapbox public token. Get one at{" "}
              <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                mapbox.com
              </a>
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mapbox-token">Mapbox Public Token</Label>
            <div className="flex gap-2">
              <Input
                id="mapbox-token"
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="pk.eyJ1..."
              />
              <Button onClick={() => onTokenSubmit(tokenInput)}>Submit</Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="relative">
      <div ref={mapContainer} className="h-[600px] rounded-lg border" />
      <div className="absolute top-4 left-4 bg-background/95 backdrop-blur p-3 rounded-lg shadow-lg border">
        <div className="text-xs font-semibold mb-2">Location Types</div>
        <div className="space-y-1">
          {Object.entries({
            'Billboard': '#ef4444',
            'LED Screen': '#3b82f6',
            'Bus Shelter': '#10b981',
            'Street Furniture': '#f59e0b',
            'Transit': '#8b5cf6',
            'Other': '#6b7280',
          }).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2 text-xs">
              <div 
                className="w-3 h-3 rounded-full border border-white" 
                style={{ backgroundColor: color }}
              />
              <span>{type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
