import { FC, useEffect, useRef, useCallback } from "react";

// Updated interface to match the delivery boy structure from API
interface DeliveryBoyInfo {
  id: number;
  user_id: number;
  delivery_zone_id: number;
  status: string;
  full_name: string;
  address: string;
  driver_license: string[];
  driver_license_number: string;
  vehicle_type: string;
  vehicle_registration: string[];
  verification_status: string;
  verification_remark: string | null;
  created_at: string;
}

interface StoreLocation {
  id: number;
  name: string;
  lat: number;
  lng: number;
  address: string;
  city?: string;
  state?: string;
}

interface GoogleMapForTrackingProps {
  customerLocation: { lat: number; lng: number };
  riderLocation: { lat: number; lng: number } | null;
  storeLocations?: StoreLocation[];
  customerAddress: string;
  riderInfo?: DeliveryBoyInfo;
  isLoading: boolean;
}

const GoogleMapForTracking: FC<GoogleMapForTrackingProps> = ({
  customerLocation,
  riderLocation,
  storeLocations = [],
  customerAddress,
  riderInfo,
  isLoading,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const customerMarkerRef =
    useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const riderMarkerRef =
    useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const storeMarkersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>(
    []
  );
  const pathPolylinesRef = useRef<google.maps.Polyline[]>([]);

  // Function to create smooth curved path between two points
  const createSmoothPath = useCallback(
    (
      start: { lat: number; lng: number },
      end: { lat: number; lng: number }
    ): google.maps.LatLng[] => {
      const points: google.maps.LatLng[] = [];
      const numPoints = 50;

      const latDiff = Math.abs(end.lat - start.lat);
      const lngDiff = Math.abs(end.lng - start.lng);
      const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

      // Adjust curve based on distance
      const curveHeight = distance * 0.25;

      for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        const lat = start.lat + (end.lat - start.lat) * t;
        const lng = start.lng + (end.lng - start.lng) * t;

        // Parabolic curve for smooth path
        const parabolaFactor = 4 * t * (1 - t);
        const offsetLat = curveHeight * parabolaFactor;

        points.push(new google.maps.LatLng(lat + offsetLat, lng));
      }

      return points;
    },
    []
  );

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || googleMapRef.current) return;

    const initMap = async () => {
      try {
        const { Map } = (await google.maps.importLibrary(
          "maps"
        )) as google.maps.MapsLibrary;
        const { AdvancedMarkerElement, PinElement } =
          (await google.maps.importLibrary(
            "marker"
          )) as google.maps.MarkerLibrary;

        const map = new Map(mapRef.current!, {
          zoom: 13,
          center: customerLocation,
          mapId: "DEMO_MAP_ID",
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          gestureHandling: "greedy",
        });

        googleMapRef.current = map;

        // Create customer marker (red)
        const customerPin = new PinElement({
          background: "#DC2626",
          borderColor: "#FFFFFF",
          glyphColor: "#FFFFFF",
          glyph: "🏠",
          scale: 1.2,
        });

        customerMarkerRef.current = new AdvancedMarkerElement({
          map,
          position: customerLocation,
          content: customerPin.element,
          title: "Delivery Location",
        });

        const customerInfoWindow = new google.maps.InfoWindow({
          content: `
            <div class="p-3 min-w-[220px]">
              <div class="flex items-center gap-2 mb-2">
                <div class="w-3 h-3 bg-red-500 rounded-full"></div>
                <span class="font-semibold text-gray-800">Delivery Location</span>
              </div>
              <p class="text-sm text-gray-600">${customerAddress}</p>
            </div>
          `,
        });

        customerMarkerRef.current.addListener("click", () => {
          customerInfoWindow.open(map, customerMarkerRef.current!);
        });
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    };

    if (typeof google !== "undefined" && google.maps) {
      initMap();
    } else {
      console.error(
        "Google Maps not loaded. Make sure to include the Google Maps script."
      );
    }
  }, [customerLocation, customerAddress]);

  // Update store markers
  useEffect(() => {
    if (!googleMapRef.current || storeLocations.length === 0) return;

    const updateStoreMarkers = async () => {
      try {
        const { AdvancedMarkerElement, PinElement } =
          (await google.maps.importLibrary(
            "marker"
          )) as google.maps.MarkerLibrary;

        // Clear existing store markers
        storeMarkersRef.current.forEach((marker) => {
          marker.map = null;
        });
        storeMarkersRef.current = [];

        // Create marker for each store
        storeLocations.forEach((store, index) => {
          const storePin = new PinElement({
            background: "#3B82F6",
            borderColor: "#FFFFFF",
            glyphColor: "#FFFFFF",
            glyph: `${index + 1}`,
            scale: 1.1,
          });

          const storeMarker = new AdvancedMarkerElement({
            map: googleMapRef.current!,
            position: { lat: store.lat, lng: store.lng },
            content: storePin.element,
            title: store.name,
          });

          const storeInfoWindow = new google.maps.InfoWindow({
            content: `
              <div class="p-3 min-w-[220px]">
                <div class="flex items-center gap-2 mb-2">
                  <div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    ${index + 1}
                  </div>
                  <span class="font-semibold text-gray-800">Store ${index + 1}</span>
                </div>
                <p class="text-sm font-medium text-gray-900 mb-1">${store.name}</p>
                <p class="text-xs text-gray-600">${store.address}</p>
                ${store.city ? `<p class="text-xs text-gray-500 mt-1">${store.city}, ${store.state || ""}</p>` : ""}
              </div>
            `,
          });

          storeMarker.addListener("click", () => {
            storeInfoWindow.open(googleMapRef.current!, storeMarker);
          });

          storeMarkersRef.current.push(storeMarker);
        });
      } catch (error) {
        console.error("Error updating store markers:", error);
      }
    };

    updateStoreMarkers();
  }, [storeLocations]);

  // Update rider marker and paths
  useEffect(() => {
    if (!googleMapRef.current || !riderLocation) return;

    const updateRiderAndPaths = async () => {
      try {
        const { AdvancedMarkerElement, PinElement } =
          (await google.maps.importLibrary(
            "marker"
          )) as google.maps.MarkerLibrary;

        // Remove existing rider marker
        if (riderMarkerRef.current) {
          riderMarkerRef.current.map = null;
        }

        // Remove existing paths
        pathPolylinesRef.current.forEach((polyline) => {
          polyline.setMap(null);
        });
        pathPolylinesRef.current = [];

        // Create rider marker (green)
        const riderPin = new PinElement({
          background: "#10B981",
          borderColor: "#FFFFFF",
          glyphColor: "#FFFFFF",
          glyph: "🏍️",
          scale: 1.3,
        });

        riderMarkerRef.current = new AdvancedMarkerElement({
          map: googleMapRef.current,
          position: riderLocation,
          content: riderPin.element,
          title: riderInfo?.full_name || "Delivery Partner",
        });

        const riderInfoWindow = new google.maps.InfoWindow({
          content: `
            <div class="p-3 min-w-[220px]">
              <div class="flex items-center gap-3 mb-2">
                <div class="w-10 h-10 bg-linear-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  ${riderInfo?.full_name?.charAt(0)?.toUpperCase() || "D"}
                </div>
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span class="font-semibold text-gray-800">Delivery Partner</span>
                  </div>
                  <p class="text-sm font-medium">${riderInfo?.full_name || "On the way"}</p>
                  ${riderInfo?.vehicle_type ? `<p class="text-xs text-gray-600 capitalize mt-0.5">${riderInfo.vehicle_type}</p>` : ""}
                </div>
              </div>
            </div>
          `,
        });

        riderMarkerRef.current.addListener("click", () => {
          riderInfoWindow.open(googleMapRef.current!, riderMarkerRef.current!);
        });

        // Create paths based on multi-store route
        if (storeLocations.length > 0) {
          // Path 1: From first store to rider (completed or in-progress)
          const firstStore = storeLocations[0];
          const pathToRider = createSmoothPath(
            { lat: firstStore.lat, lng: firstStore.lng },
            riderLocation
          );

          const polylineToRider = new google.maps.Polyline({
            path: pathToRider,
            geodesic: false,
            strokeColor: "#10B981",
            strokeOpacity: 0.7,
            strokeWeight: 4,
            icons: [
              {
                icon: {
                  path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                  scale: 2.5,
                  strokeColor: "#10B981",
                  fillColor: "#10B981",
                  fillOpacity: 1,
                },
                offset: "50%",
              },
            ],
          });
          polylineToRider.setMap(googleMapRef.current);
          pathPolylinesRef.current.push(polylineToRider);

          // Path 2: From rider to customer (pending)
          const pathToCustomer = createSmoothPath(
            riderLocation,
            customerLocation
          );

          const polylineToCustomer = new google.maps.Polyline({
            path: pathToCustomer,
            geodesic: false,
            strokeColor: "#6366F1",
            strokeOpacity: 0.6,
            strokeWeight: 3,
            icons: [
              {
                icon: {
                  path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                  scale: 2,
                  strokeColor: "#6366F1",
                  fillColor: "#6366F1",
                  fillOpacity: 0.7,
                },
                offset: "50%",
              },
            ],
          });
          polylineToCustomer.setMap(googleMapRef.current);
          pathPolylinesRef.current.push(polylineToCustomer);

          // If multiple stores, create paths between them
          if (storeLocations.length > 1) {
            for (let i = 0; i < storeLocations.length - 1; i++) {
              const pathBetweenStores = createSmoothPath(
                { lat: storeLocations[i].lat, lng: storeLocations[i].lng },
                {
                  lat: storeLocations[i + 1].lat,
                  lng: storeLocations[i + 1].lng,
                }
              );

              const polylineBetweenStores = new google.maps.Polyline({
                path: pathBetweenStores,
                geodesic: false,
                strokeColor: "#3B82F6",
                strokeOpacity: 0.5,
                strokeWeight: 2,
              });
              polylineBetweenStores.setMap(googleMapRef.current);
              pathPolylinesRef.current.push(polylineBetweenStores);
            }
          }
        } else {
          // Simple path from rider to customer if no stores
          const pathPoints = createSmoothPath(riderLocation, customerLocation);
          const polyline = new google.maps.Polyline({
            path: pathPoints,
            geodesic: false,
            strokeColor: "#6366F1",
            strokeOpacity: 0.8,
            strokeWeight: 4,
            icons: [
              {
                icon: {
                  path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                  scale: 3,
                  strokeColor: "#6366F1",
                  fillColor: "#6366F1",
                  fillOpacity: 1,
                },
                offset: "30%",
                repeat: "40px",
              },
            ],
          });
          polyline.setMap(googleMapRef.current);
          pathPolylinesRef.current.push(polyline);
        }

        // Adjust map bounds to show all markers
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(customerLocation);
        bounds.extend(riderLocation);

        storeLocations.forEach((store) => {
          bounds.extend({ lat: store.lat, lng: store.lng });
        });

        // Add padding to bounds
        const latDiff =
          bounds.getNorthEast().lat() - bounds.getSouthWest().lat();
        const lngDiff =
          bounds.getNorthEast().lng() - bounds.getSouthWest().lng();
        const padding = Math.max(latDiff, lngDiff) * 0.2;

        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        bounds.extend({ lat: ne.lat() + padding, lng: ne.lng() + padding });
        bounds.extend({ lat: sw.lat() - padding, lng: sw.lng() - padding });

        if (googleMapRef.current) {
          googleMapRef.current.fitBounds(bounds, 50);
        }
      } catch (error) {
        console.error("Error updating rider and paths:", error);
      }
    };

    updateRiderAndPaths();
  }, [
    riderLocation,
    customerLocation,
    riderInfo,
    storeLocations,
    createSmoothPath,
  ]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center rounded-lg">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg flex items-center gap-3">
            <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Updating location...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleMapForTracking;
