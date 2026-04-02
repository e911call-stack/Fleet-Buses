import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

interface Bus {
  id: string;
  plate_number: string;
  latitude?: number;
  longitude?: number;
  [key: string]: any;
}

interface MapLibreMapProps {
  buses: Bus[];
  branding: any;
}

export default function MapLibreMap({ buses, branding }: MapLibreMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<Map<string, maplibregl.Marker>>(new Map());

  useEffect(() => {
    if (!mapContainer.current || !buses.length) return;

    // Initialize map
    if (!map.current) {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: process.env.NEXT_PUBLIC_MAPLIBRE_STYLE_URL || 'https://demotiles.maplibre.org/style.json',
        center: [35.9375, 31.9454], // Center on Jordan
        zoom: 10,
      });
    }

    // Update markers for buses
    buses.forEach((bus) => {
      if (!bus.latitude || !bus.longitude) return;

      if (markers.current.has(bus.id)) {
        // Update existing marker
        const marker = markers.current.get(bus.id)!;
        marker.setLngLat([bus.longitude, bus.latitude]);
      } else {
        // Create new marker
        const el = document.createElement('div');
        el.className = 'bus-marker';
        el.style.width = '32px';
        el.style.height = '32px';
        el.style.borderRadius = '4px';
        el.style.backgroundColor = branding?.primary_color || '#007BFF';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.color = 'white';
        el.style.fontSize = '12px';
        el.style.fontWeight = 'bold';
        el.style.cursor = 'pointer';
        el.textContent = '🚌';

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([bus.longitude, bus.latitude])
          .addTo(map.current!);

        markers.current.set(bus.id, marker);
      }
    });

    // Fit bounds to all buses
    if (buses.length > 0 && map.current) {
      const bounds = new maplibregl.LngLatBounds();
      buses.forEach((bus) => {
        if (bus.latitude && bus.longitude) {
          bounds.extend([bus.longitude, bus.latitude]);
        }
      });
      map.current.fitBounds(bounds, { padding: 80 });
    }

    return () => {
      // Cleanup
    };
  }, [buses, branding?.primary_color]);

  return <div ref={mapContainer} className="w-full h-full" />;
}
