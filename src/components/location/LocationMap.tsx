import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MediaLocation, getLocationCategory, LOCATION_CATEGORIES } from "@/hooks/useMediaLocations";

const MAPBOX_TOKEN = "pk.eyJ1IjoiaGFkaWNhbiIsImEiOiJjbWh1YjY5bWkwNDI2MmpzYmQ0MmkwaXBnIn0.ScDl8LTtKyGxmLBFC8R4rw";

interface LocationMapProps {
  locations: MediaLocation[];
  selectedLocationId?: string[] | null;
  campaignLocationIds?: string[];
  onLocationClick: (location: MediaLocation) => void;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  selectionMode?: 'normal' | 'campaign-select';
  isAdmin?: boolean;
}

export interface LocationMapRef {
  flyToLocation: (location: MediaLocation) => void;
}

export const LocationMap = forwardRef<LocationMapRef, LocationMapProps>(
  ({ locations, onLocationClick, onMapClick, selectedLocationId, campaignLocationIds = [], selectionMode = 'normal', isAdmin = false }, ref) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markers = useRef<mapboxgl.Marker[]>([]);
    const highlightMarker = useRef<mapboxgl.Marker | null>(null);
    const selectedLocationIds = selectedLocationId || [];

    useImperativeHandle(ref, () => ({
      flyToLocation: (location: MediaLocation) => {
        if (!map.current) return;
        map.current.flyTo({ center: [Number(location.longitude), Number(location.latitude)], zoom: 15, duration: 1500 });
        if (highlightMarker.current) highlightMarker.current.remove();
        const el = document.createElement('div');
        el.style.cssText = 'width:40px;height:40px;border-radius:50%;border:4px solid hsl(var(--primary));background:hsl(var(--primary)/0.3);animation:pulse 2s ease-in-out infinite';
        highlightMarker.current = new mapboxgl.Marker(el).setLngLat([Number(location.longitude), Number(location.latitude)]).addTo(map.current);
        setTimeout(() => { highlightMarker.current?.remove(); highlightMarker.current = null; }, 3000);
      },
    }));

    useEffect(() => {
      if (!mapContainer.current) return;
      mapboxgl.accessToken = MAPBOX_TOKEN;
      map.current = new mapboxgl.Map({ container: mapContainer.current, style: "mapbox://styles/mapbox/streets-v12", center: [55.2708, 25.2048], zoom: 8 });
      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
      return () => { map.current?.remove(); };
    }, []);

    useEffect(() => {
      if (!map.current || locations.length === 0) return;
      markers.current.forEach(m => m.remove());
      markers.current = [];
      const isSelectionMode = selectionMode === 'campaign-select';

      locations.forEach((location) => {
        if (!map.current || !location.latitude || !location.longitude) return;
        const isSelected = selectedLocationIds.includes(location.id);
        const isInCampaign = campaignLocationIds.includes(location.id);
        const category = getLocationCategory(location.type);
        const emoji = category ? LOCATION_CATEGORIES[category].emoji : '📍';

        const el = document.createElement('div');
        el.innerHTML = `<div style="position:relative;cursor:pointer;font-size:${isSelected?'32px':'24px'};transition:all 0.3s;filter:${isSelected?'drop-shadow(0 0 8px rgba(59,130,246,0.8))':isInCampaign?'drop-shadow(0 0 6px rgba(34,197,94,0.6))':'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'};transform:scale(${isSelected?1.2:1});${isSelectionMode?'animation:pulse 2s infinite':''}">${emoji}${isInCampaign?'<div style="position:absolute;top:-4px;right:-4px;width:12px;height:12px;background:#22c55e;border:2px solid white;border-radius:50%"></div>':''}${isSelected&&isSelectionMode?'<div style="position:absolute;top:-4px;left:-4px;width:12px;height:12px;background:#3b82f6;border:2px solid white;border-radius:50%"></div>':''}</div><style>@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.7}}</style>`;
        el.addEventListener('click', () => onLocationClick(location));

        const marker = new mapboxgl.Marker(el).setLngLat([location.longitude, location.latitude]).addTo(map.current);
        const popup = new mapboxgl.Popup({ offset: 25, maxWidth: '280px' }).setHTML(`<div style="padding:12px;min-width:240px"><div style="display:flex;justify-content:space-between;margin-bottom:8px"><h3 style="font-weight:600;font-size:1rem">${location.name}</h3>${location.manual_score?`<span style="font-size:0.75rem;padding:2px 8px;border-radius:4px;background:rgba(139,92,246,0.1);color:#8B5CF6">${location.manual_score}/10</span>`:''}</div><div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px"><div style="font-size:0.875rem">📍 ${location.city}</div><div style="font-size:0.875rem">🏷️ ${location.type}</div>${location.agency?`<div style="font-size:0.875rem">🏢 ${location.agency}</div>`:''}${location.price_per_month?`<div style="font-size:0.875rem">💰 AED ${location.price_per_month.toLocaleString()}/mo</div>`:''}</div><div style="display:flex;gap:8px">${isSelectionMode?`<button class="popup-btn" style="flex:1;padding:6px 12px;font-size:0.875rem;background:#8B5CF6;color:white;border:none;border-radius:6px;cursor:pointer">${isSelected?'Remove':'Add to Campaign'}</button>`:`<button class="popup-btn" style="flex:1;padding:6px 12px;font-size:0.875rem;border:1px solid #e5e7eb;background:white;border-radius:6px;cursor:pointer">View Details</button>${isAdmin?'<button class="popup-btn-edit" style="padding:6px 12px;font-size:0.875rem;border:1px solid #e5e7eb;background:white;border-radius:6px;cursor:pointer">Edit</button>':''}`}</div></div>`);
        popup.on('open', () => { popup.getElement()?.querySelectorAll('.popup-btn,.popup-btn-edit').forEach(btn => btn.addEventListener('click', () => { onLocationClick(location); popup.remove(); })); });
        marker.setPopup(popup);
        markers.current.push(marker);
      });

      if (locations.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        locations.forEach(loc => { if (loc.latitude && loc.longitude) bounds.extend([loc.longitude, loc.latitude]); });
        if (!bounds.isEmpty()) map.current.fitBounds(bounds, { padding: 100, maxZoom: 12 });
      }
    }, [locations, selectedLocationIds, campaignLocationIds, selectionMode, isAdmin]);

    return <div className="relative w-full h-full"><div ref={mapContainer} className="absolute inset-0" /></div>;
  }
);

LocationMap.displayName = "LocationMap";
