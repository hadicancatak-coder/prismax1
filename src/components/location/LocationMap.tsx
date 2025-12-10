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
  onViewDetails?: (location: MediaLocation) => void;
  onEdit?: (location: MediaLocation) => void;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  selectionMode?: 'normal' | 'campaign-select';
  isAdmin?: boolean;
}

export interface LocationMapRef {
  flyToLocation: (location: MediaLocation) => void;
  map?: React.RefObject<mapboxgl.Map>;
}

export const LocationMap = forwardRef<LocationMapRef, LocationMapProps>(
  ({ locations, onLocationClick, onViewDetails, onEdit, onMapClick, selectedLocationId, campaignLocationIds = [], selectionMode = 'normal', isAdmin = false }, ref) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markers = useRef<mapboxgl.Marker[]>([]);
    const highlightMarker = useRef<mapboxgl.Marker | null>(null);
    const selectedLocationIds = selectedLocationId || [];
    const prevLocationsLength = useRef(0);

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
      map: map,
    }));

    useEffect(() => {
      if (!mapContainer.current) return;
      mapboxgl.accessToken = MAPBOX_TOKEN;
      map.current = new mapboxgl.Map({ container: mapContainer.current, style: "mapbox://styles/mapbox/streets-v12", center: [55.2708, 25.2048], zoom: 8 });
      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
      
      // Disable Mapbox's default context menu to allow our custom one
      map.current.boxZoom.disable();
      
      // Inject custom CSS for popup z-index and styling
      const style = document.createElement('style');
      style.textContent = `
        .mapboxgl-popup {
          z-index: 150 !important;
        }
        .mapboxgl-popup-content {
          background: hsl(var(--card)) !important;
          color: hsl(var(--card-foreground)) !important;
          border: 1px solid hsl(var(--border)) !important;
          border-radius: 0.5rem !important;
          padding: 0 !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3) !important;
          max-width: 260px !important;
        }
        .mapboxgl-popup-close-button {
          color: hsl(var(--muted-foreground)) !important;
          font-size: 20px !important;
          padding: 4px 8px !important;
        }
        .mapboxgl-popup-close-button:hover {
          background: hsl(var(--muted)) !important;
          color: hsl(var(--foreground)) !important;
        }
      `;
      if (mapContainer.current) {
        mapContainer.current.appendChild(style);
      }
      
      return () => { 
        map.current?.remove(); 
        style.remove();
      };
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
        // Use CSS variables for consistent theming
        el.innerHTML = `<div style="position:relative;cursor:pointer;font-size:${isSelected?'32px':'24px'};transition:all 0.3s;filter:${isSelected?'drop-shadow(0 0 8px hsl(var(--primary) / 0.8))':isInCampaign?'drop-shadow(0 0 6px hsl(var(--success) / 0.6))':'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'};transform:scale(${isSelected?1.2:1});${isSelectionMode?'animation:pulse 2s infinite':''}">${emoji}${isInCampaign?'<div style="position:absolute;top:-4px;right:-4px;width:12px;height:12px;background:hsl(var(--success));border:2px solid hsl(var(--background));border-radius:50%"></div>':''}${isSelected&&isSelectionMode?'<div style="position:absolute;top:-4px;left:-4px;width:12px;height:12px;background:hsl(var(--primary));border:2px solid hsl(var(--background));border-radius:50%"></div>':''}</div><style>@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.7}}</style>`;
        
        const marker = new mapboxgl.Marker(el).setLngLat([location.longitude, location.latitude]).addTo(map.current);
        
        // Create popup
        const popupHTML = `
          <div class="p-3 min-w-[240px] max-w-[260px]">
            <div class="flex items-start justify-between mb-2">
              <h3 class="font-semibold text-base pr-2">${location.name}</h3>
            </div>
            
            <div class="space-y-1.5 mb-3 text-sm">
              <div class="flex items-center gap-2" style="color: hsl(var(--muted-foreground));">
                <span>📍</span>
                <span>${location.city}</span>
              </div>
              <div class="flex items-center gap-2" style="color: hsl(var(--muted-foreground));">
                <span>🏷️</span>
                <span>${location.type}</span>
              </div>
              ${location.agency ? `
                <div class="flex items-center gap-2" style="color: hsl(var(--muted-foreground));">
                  <span>🏢</span>
                  <span>${location.agency}</span>
                </div>
              ` : ''}
            </div>
            
            <div class="flex gap-2">
              ${isSelectionMode ? `
                <button 
                  class="flex-1 px-3 py-1.5 text-sm rounded transition-colors popup-btn"
                  style="background: hsl(var(--primary)); color: hsl(var(--primary-foreground));"
                  onmouseover="this.style.opacity='0.9'"
                  onmouseout="this.style.opacity='1'"
                >
                  ${isSelected ? 'Remove' : 'Add to Campaign'}
                </button>
              ` : `
                <button 
                  class="flex-1 px-3 py-1.5 text-sm rounded transition-colors popup-btn"
                  style="background: hsl(var(--primary)); color: hsl(var(--primary-foreground));"
                  onmouseover="this.style.opacity='0.9'"
                  onmouseout="this.style.opacity='1'"
                >
                  View Details
                </button>
                ${isAdmin ? `
                  <button 
                    class="px-3 py-1.5 text-sm rounded transition-colors popup-btn-edit"
                    style="background: hsl(var(--secondary)); color: hsl(var(--secondary-foreground));"
                    onmouseover="this.style.opacity='0.9'"
                    onmouseout="this.style.opacity='1'"
                  >
                    Edit
                  </button>
                ` : ''}
              `}
            </div>
          </div>
        `;
        
        const popup = new mapboxgl.Popup({ 
          offset: 25, 
          closeButton: true, 
          closeOnClick: false, 
          maxWidth: '280px' 
        }).setHTML(popupHTML);
        
        popup.on('open', () => {
          const popupEl = popup.getElement();
          if (!popupEl) return;
          
          // Handle "View Details" button
          const viewDetailsBtn = popupEl.querySelector('.popup-btn');
          if (viewDetailsBtn && onViewDetails) {
            viewDetailsBtn.addEventListener('click', () => { 
              onViewDetails(location);
              popup.remove(); 
            });
          }
          
          // Handle selection button in selection mode
          if (isSelectionMode) {
            viewDetailsBtn?.addEventListener('click', () => { 
              onLocationClick(location); 
              popup.remove(); 
            });
          }
          
          // Handle "Edit" button
          const editBtn = popupEl.querySelector('.popup-btn-edit');
          if (editBtn && onEdit) {
            editBtn.addEventListener('click', () => { 
              onEdit(location);
              popup.remove(); 
            });
          }
        });
        marker.setPopup(popup);
        
        // Single consolidated click handler
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          
          if (isSelectionMode) {
            // In selection mode: toggle selection AND show popup
            onLocationClick(location);
            marker.togglePopup();
          } else {
            // Normal mode: just show the popup
            marker.togglePopup();
          }
        });
        
        markers.current.push(marker);
      });

      // Only fit bounds on initial load (not when adding locations one by one)
      const isInitialLoad = prevLocationsLength.current === 0 && locations.length > 0;
      const isAddingSingleLocation = locations.length === prevLocationsLength.current + 1;
      
      if (isInitialLoad && !isAddingSingleLocation) {
        const bounds = new mapboxgl.LngLatBounds();
        locations.forEach(loc => { 
          if (loc.latitude && loc.longitude) {
            bounds.extend([loc.longitude, loc.latitude]); 
          }
        });
        if (!bounds.isEmpty()) {
          map.current.fitBounds(bounds, { padding: 100, maxZoom: 12 });
        }
      }
      
      prevLocationsLength.current = locations.length;
    }, [locations, selectedLocationIds, campaignLocationIds, selectionMode, isAdmin, onLocationClick, onViewDetails, onEdit]);

    return <div className="relative w-full h-full"><div ref={mapContainer} className="absolute inset-0" /></div>;
  }
);

LocationMap.displayName = "LocationMap";
