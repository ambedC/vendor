import { FC, useEffect, useRef } from "react";
import { DeliveryZone } from "@/types/ApiResponse";
import { useTheme } from "next-themes";
import { useSettings } from "@/contexts/SettingsContext";

interface GoogleMapForZoneProps {
  zone: DeliveryZone;
  className?: string;
}

const GoogleMapForZone: FC<GoogleMapForZoneProps> = ({
  zone,
  className = "",
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const centerMarkerRef =
    useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  const theme = useTheme();

  const { currencySymbol } = useSettings();

  useEffect(() => {
    if (!mapRef.current || !zone) return;

    async function initMap() {
      try {
        // Load Maps and Marker libraries
        const { Map } = (await window.google.maps.importLibrary(
          "maps"
        )) as google.maps.MapsLibrary;
        const { AdvancedMarkerElement } =
          (await window.google.maps.importLibrary(
            "marker"
          )) as google.maps.MarkerLibrary;
        const { ColorScheme } = (await window.google.maps.importLibrary(
          "core"
        )) as google.maps.CoreLibrary;

        // Parse center coordinates
        const center = {
          lat: parseFloat(zone.center_latitude),
          lng: parseFloat(zone.center_longitude),
        };

        // Initialize the map if not already initialized
        if (!mapInstance.current) {
          mapInstance.current = new Map(mapRef.current!, {
            center,
            zoom: 13,
            mapId: "delivery-zone-map",
            streetViewControl: false,
            colorScheme:
              theme.theme === "light" ? ColorScheme.LIGHT : ColorScheme.DARK,
          });
        } else {
          // Update center if map already exists
          mapInstance.current.setCenter(center);
        }

        // Clear existing polygon if any
        if (polygonRef.current) {
          polygonRef.current.setMap(null);
        }

        // Clear existing center marker if any
        if (centerMarkerRef.current) {
          centerMarkerRef.current.map = null;
        }

        // Create center marker
        centerMarkerRef.current = new AdvancedMarkerElement({
          map: mapInstance.current,
          position: center,
          title: zone.name,
        });

        // Create polygon from boundary points if available
        if (zone.boundary_json && zone.boundary_json.length > 0) {
          const paths = zone.boundary_json.map((point) => ({
            lat: point.lat,
            lng: point.lng,
          }));

          polygonRef.current = new google.maps.Polygon({
            paths,
            strokeColor: "#4F46E5",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: "#4F46E5",
            fillOpacity: 0.35,
          });

          polygonRef.current.setMap(mapInstance.current);

          // Fit bounds to show the entire polygon
          const bounds = new google.maps.LatLngBounds();
          paths.forEach((path) => bounds.extend(path));
          mapInstance.current.fitBounds(bounds);
        } else if (zone.radius_km) {
          // If no polygon but radius is available, draw a circle
          const circle = new google.maps.Circle({
            strokeColor: "#4F46E5",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: "#4F46E5",
            fillOpacity: 0.35,
            map: mapInstance.current,
            center,
            radius: zone.radius_km * 1000, // Convert km to meters
          });

          // Fit bounds to show the entire circle
          mapInstance.current.fitBounds(circle.getBounds()!);
        }

        // Add info window for the zone
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div class="p-3 min-w-[200px]">
              <div class="font-semibold text-gray-800 mb-2">${zone.name}</div>
              <div class="text-sm text-gray-600">
                <p>Delivery Charges: ${currencySymbol} ${zone.regular_delivery_charges}</p>
                ${zone.rush_delivery_enabled ? `<p>Rush Delivery: ${currencySymbol} ${zone.rush_delivery_charges}</p>` : ""}
                ${zone.free_delivery_amount ? `<p>Free Delivery Above: ${currencySymbol} ${zone.free_delivery_amount}</p>` : ""}
              </div>
            </div>
          `,
        });

        centerMarkerRef.current.addListener("click", () => {
          infoWindow.open(mapInstance.current, centerMarkerRef.current);
        });

        // Open info window by default
        infoWindow.open(mapInstance.current, centerMarkerRef.current);
      } catch (error) {
        console.error("Error initializing Google Maps:", error);
      }
    }

    initMap();
  }, [zone, theme, currencySymbol]);

  return (
    <div
      ref={mapRef}
      className={`bg-gray-100 rounded-lg w-full h-[400px] ${className}`}
    />
  );
};

export default GoogleMapForZone;
