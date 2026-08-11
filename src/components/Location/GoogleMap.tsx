import { useEffect, useRef, useState } from "react";
import type { GoogleMapProps } from "./types/GoogleMap.types";
import { useTheme } from "next-themes";
import StoreMarkerPopup from "./StoreMarkerPopup";
import { Store } from "@/types/ApiResponse";
import { useRouter } from "next/router";

// Threshold in degrees (~5m) – if store and current location are this close, treat as same
const SAME_LOCATION_THRESHOLD = 0.00005;
// Offset in degrees (~15m) – move store marker slightly so both markers are visible
const STORE_MARKER_OFFSET = 0.00015;

function isSameLocation(
  storeLat: number,
  storeLng: number,
  current: { lat: number; lng: number },
): boolean {
  return (
    Math.abs(storeLat - current.lat) <= SAME_LOCATION_THRESHOLD &&
    Math.abs(storeLng - current.lng) <= SAME_LOCATION_THRESHOLD
  );
}

function getStoreMarkerPosition(
  storeLat: number,
  storeLng: number,
  currentLatLng: { lat: number; lng: number } | null,
): { lat: number; lng: number } {
  if (currentLatLng && isSameLocation(storeLat, storeLng, currentLatLng)) {
    return {
      lat: storeLat + STORE_MARKER_OFFSET,
      lng: storeLng + STORE_MARKER_OFFSET,
    };
  }
  return { lat: storeLat, lng: storeLng };
}

function GoogleMap(props: GoogleMapProps) {
  const {
    latLng,
    onLocationUpdate,
    onBoundsChange,
    onZoomChange,
    height = 400,
    stores = [],
    zones = [],
    onMapLoad,
    disableRedirect,
    disableLocationChange,
  } = props;
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);
  const storeMarkersRef = useRef<any[]>([]);
  const zoneShapesRef = useRef<any[]>([]);
  const boundsListener = useRef<any>(null);
  const isDragging = useRef<boolean>(false);
  const markerLibraryRef = useRef<any>(null);
  const storesIdsRef = useRef<Set<number>>(new Set());
  const prevLatLngKeyRef = useRef<string>("");
  const storeDataMapRef = useRef<Map<number, Store>>(new Map());
  const callbacksRef = useRef({ onBoundsChange, onZoomChange, onLocationUpdate, onMapLoad });

  useEffect(() => {
    callbacksRef.current = { onBoundsChange, onZoomChange, onLocationUpdate, onMapLoad };
  }, [onBoundsChange, onZoomChange, onLocationUpdate, onMapLoad]);
  const isMarkerClickRef = useRef<boolean>(false);
  const isPopupOpenRef = useRef<boolean>(false);
  const prevLatLngPropRef = useRef<{lat: number; lng: number} | null>(null);
  const disableLocationChangeRef = useRef(disableLocationChange);

  const [hoveredStore, _setHoveredStore] = useState<Store | null>(null);
  const [map, setMap] = useState<any>(null);

  // Helper to keep ref in sync with state
  const setHoveredStore = (store: Store | null) => {
    isPopupOpenRef.current = !!store;
    _setHoveredStore(store);
  };
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const theme = useTheme();
  const router = useRouter();

  useEffect(() => {
    // if (!mapRef.current) return;

    // async function initMap() {
    //   try {
    //     // Load Maps and Marker libraries
    //     const { Map } = (await window.google.maps.importLibrary(
    //       "maps",
    //     )) as google.maps.MapsLibrary;
    //     const markerLib = (await window.google.maps.importLibrary(
    //       "marker",
    //     )) as google.maps.MarkerLibrary;
    //     markerLibraryRef.current = markerLib;

    //     const { AdvancedMarkerElement } = markerLib;

    //     const { ColorScheme } = (await window.google.maps.importLibrary(
    //       "core",
    //     )) as google.maps.CoreLibrary;

    //     // Initialize the map
    //     if (!mapInstance.current) {
    //       const newMap = new Map(mapRef.current!, {
    //         center: latLng || { lat: 0, lng: 0 },
    //         zoom: 16,
    //         mapId: "123456",
    //         streetViewControl: false,
    //         gestureHandling: "greedy",
    //         colorScheme:
    //           theme.theme == "light" ? ColorScheme.LIGHT : ColorScheme.DARK,
    //       });
    //       mapInstance.current = newMap;
    //       setMap(newMap);
    //       if (callbacksRef.current.onMapLoad) callbacksRef.current.onMapLoad();

    //       // Add click listener to the map
    //       mapInstance.current.addListener(
    //         "click",
    //         (e: google.maps.MapMouseEvent) => {
    //           // Priority 1: If we clicked on a store marker, don't move the red marker
    //           // and don't close the popup (the marker's own click listener handles opening)
    //           if (isMarkerClickRef.current) {
    //             isMarkerClickRef.current = false;
    //             return;
    //           }

    //           // Priority 2: If the popup is already open, just close it and don't move the red marker
    //           // This addresses the requirement: "when close then if i click somewhere on map then red marker... should not call"
    //           if (isPopupOpenRef.current) {
    //             setHoveredStore(null);
    //             return;
    //           }

    //           // Priority 3: Otherwise, move the red marker to the clicked location
    //           if (disableLocationChangeRef.current) return;

    //           if (e.latLng && !isDragging.current) {
    //             const newPosition = {
    //               lat: e.latLng.lat(),
    //               lng: e.latLng.lng(),
    //             };

    //             // Update marker position
    //             if (markerInstance.current) {
    //               markerInstance.current.position = newPosition;
    //             } else {
    //               // Create marker if it doesn't exist
    //               markerInstance.current = new AdvancedMarkerElement({
    //                 map: mapInstance.current,
    //                 position: newPosition,
    //                 gmpDraggable: !disableLocationChangeRef.current,
    //                 title: "Selected Location",
    //               });

    //               // Add drag listeners to the marker
    //               setupMarkerDragListeners(markerInstance.current);
    //             }

    //             // Notify parent component about the location change
    //             if (callbacksRef.current.onLocationUpdate) {
    //               callbacksRef.current.onLocationUpdate(newPosition);
    //             }
    //           }
    //         },
    //       );

    //       // Close popup when map is moved or zoomed
    //       mapInstance.current.addListener("dragstart", () => {
    //         setHoveredStore(null);
    //       });

    //       mapInstance.current.addListener("zoom_changed", () => {
    //         setHoveredStore(null);
    //       });
    //     }

    //     // Add or update the marker
    //     if (latLng) {
    //       // Check if latLng actually changed (beyond tiny float differences) to prevent unwanted snap-backs
    //       const latLngChanged = 
    //         !prevLatLngPropRef.current ||
    //         Math.abs(prevLatLngPropRef.current.lat - latLng.lat) > 0.00001 ||
    //         Math.abs(prevLatLngPropRef.current.lng - latLng.lng) > 0.00001;

    //       if (!markerInstance.current) {
    //         markerInstance.current = new AdvancedMarkerElement({
    //           map: mapInstance.current,
    //           position: latLng,
    //           gmpDraggable: !disableLocationChangeRef.current,
    //           title: "Selected Location",
    //         });

    //         // Add drag listeners to the marker
    //         setupMarkerDragListeners(markerInstance.current);
            
    //         // Pan to newly created marker
    //         mapInstance.current?.panTo(latLng);
    //       } else {
    //         // Only update marker position if not currently dragging
    //         if (!isDragging.current && latLngChanged) {
    //           markerInstance.current.position = latLng;
    //         }
    //         markerInstance.current.gmpDraggable = !disableLocationChangeRef.current;
    //       }

    //       // Only pan if the user updated the latLng value explicitly!
    //       if (latLngChanged && mapInstance.current && !isDragging.current) {
    //         const currentCenter = mapInstance.current.getCenter();
    //         if (currentCenter) {
    //           const currentLat = currentCenter.lat();
    //           const currentLng = currentCenter.lng();

    //           // Use a small threshold to avoid panning if we are already close enough
    //           const distanceToCenter =
    //             Math.abs(currentLat - latLng.lat) > 0.0001 ||
    //             Math.abs(currentLng - latLng.lng) > 0.0001;

    //           if (distanceToCenter) {
    //             mapInstance.current.panTo(latLng);
    //           }
    //         }
    //       }
          
    //       prevLatLngPropRef.current = latLng;
    //     }

    //     // Setup bounds change listener
    //     if (mapInstance.current) {
    //       if (boundsListener.current) {
    //         boundsListener.current.remove();
    //       }

    //       boundsListener.current = mapInstance.current.addListener(
    //         "idle",
    //         () => {
    //           // Handle Bounds
    //           if (callbacksRef.current.onBoundsChange) {
    //             const bounds = mapInstance.current?.getBounds();
    //             if (bounds) {
    //               const ne = bounds.getNorthEast();
    //               const sw = bounds.getSouthWest();

    //               const boundsData = {
    //                 ne: { lat: ne.lat(), lng: ne.lng() },
    //                 sw: { lat: sw.lat(), lng: sw.lng() },
    //               };
    //               callbacksRef.current.onBoundsChange(boundsData);
    //             }
    //           }

    //           // Handle Zoom
    //           if (callbacksRef.current.onZoomChange) {
    //             const zoom = mapInstance.current?.getZoom();
    //             if (zoom !== undefined) {
    //               callbacksRef.current.onZoomChange(zoom);
    //             }
    //           }
    //         },
    //       );
    //     }
    //   } catch (error) {
    //     console.error("Error initializing Google Maps:", error);
    //   }
    // }

    // // Helper function to setup drag listeners on marker
    // function setupMarkerDragListeners(
    //   marker: google.maps.marker.AdvancedMarkerElement,
    // ) {
    //   // Wait for marker to be fully initialized
    //   setTimeout(() => {
    //     if (marker.element) {
    //       // Drag start listener
    //       marker.addListener("dragstart", () => {
    //         isDragging.current = true;
    //         setHoveredStore(null);
    //       });

    //       // Drag end listener
    //       marker.addListener(
    //         "dragend",
    //         (e: { latLng: { lat: () => number; lng: () => number } }) => {
    //           if (e.latLng) {
    //             const newPosition = {
    //               lat: e.latLng.lat(),
    //               lng: e.latLng.lng(),
    //             };

    //             // Set dragging to false after a small delay to prevent
    //             // immediate position updates from parent
    //             setTimeout(() => {
    //               isDragging.current = false;
    //             }, 100);

    //             // Notify parent component about the location change
    //             if (callbacksRef.current.onLocationUpdate) {
    //               callbacksRef.current.onLocationUpdate(newPosition);
    //             }
    //           }
    //         },
    //       );
    //     }
    //   }, 100);
    // }

    // initMap();
  }, [latLng, theme]);

  useEffect(() => {
    if (!mapInstance.current || !stores || !markerLibraryRef.current) return;

    const { AdvancedMarkerElement } = markerLibraryRef.current;

    // Filter valid stores and get their IDs
    const validStores = stores.filter(
      (s: Store) => s.id && (s.lat || s.latitude),
    );
    const newStoreIds = new Set(validStores.map((s: Store) => s.id));

    // Check if the store IDs or latLng have actually changed to avoid redundant operations
    const currentIds = Array.from(storesIdsRef.current).sort().join(",");
    const incomingIds = Array.from(newStoreIds).sort().join(",");
    const latLngKey = latLng
      ? `${latLng.lat.toFixed(6)},${latLng.lng.toFixed(6)}`
      : "";

    if (currentIds === incomingIds && latLngKey === prevLatLngKeyRef.current) {
      return;
    }
    prevLatLngKeyRef.current = latLngKey;

    // Clear existing store markers
    storeMarkersRef.current.forEach((marker) => {
      marker.map = null;
    });

    // Update store data map for reference
    storeDataMapRef.current.clear();
    validStores.forEach((store: Store) => {
      storeDataMapRef.current.set(store.id, store);
    });

    // Create new markers (offset store position when it overlaps current location)
    const newMarkers = validStores
      .map((store: any) => {
        const lat = Number(store.lat || store.latitude);
        const lng = Number(store.lng || store.longitude);

        if (isNaN(lat) || isNaN(lng)) return null;

        const position = getStoreMarkerPosition(lat, lng, latLng);

        // Create custom store icon container
        const iconContainer = document.createElement("div");
        iconContainer.style.cssText = `
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s ease;
        `;

        // Create img element for custom store icon
        const img = document.createElement("img");
        img.src = "/logos/store-icon.png";
        img.style.cssText = `
          width: 100%;
          height: 100%;
          object-fit: contain;
        `;

        iconContainer.appendChild(img);

        const marker = new AdvancedMarkerElement({
          map: mapInstance.current,
          position,
          title: store.name || "Store",
          content: iconContainer,
        });

        // Add hover listeners
        if (marker.element) {
          marker.element.style.cursor = "pointer";
          marker.element.style.transition = "transform 0.2s ease";

          marker.element.addEventListener("mouseenter", () => {
            // Scale up on hover for visual feedback
            iconContainer.style.transform = "scale(1.15)";
          });

          marker.element.addEventListener("mouseleave", () => {
            // Scale back to normal
            iconContainer.style.transform = "scale(1)";
          });

          // Add click listener for mobile/touch devices to show popup
          marker.element.addEventListener("click", (e: MouseEvent) => {
            e.stopPropagation(); // Prevent the click from bubbling to the map
            isMarkerClickRef.current = true;
            const storeData = storeDataMapRef.current.get(store.id);
            if (storeData) {
              const rect = (
                e.currentTarget as HTMLElement
              ).getBoundingClientRect();
              const mapRect = mapRef.current?.getBoundingClientRect();
              if (mapRect) {
                // Position popup centered on the marker
                setPopupPosition({
                  x: rect.left - mapRect.left + rect.width / 2,
                  y: rect.top - mapRect.top + rect.height / 2,
                });
                setHoveredStore(storeData);
              }
            }
            // Reset the flag after a short delay to ensure it doesn't interfere with next clicks
            setTimeout(() => {
              isMarkerClickRef.current = false;
            }, 300);
          });
        }

        return marker;
      })
      .filter((m): m is google.maps.marker.AdvancedMarkerElement => m !== null);

    storeMarkersRef.current = newMarkers;
    storesIdsRef.current = new Set<number>(newStoreIds as Set<number>);
  }, [stores, latLng, router, map]);

  useEffect(() => {
    disableLocationChangeRef.current = disableLocationChange;
    if (markerInstance.current) {
      markerInstance.current.gmpDraggable = !disableLocationChange;
    }
  }, [disableLocationChange]);

  useEffect(() => {
    if (!map || !zones) return;

    // Clear existing zone shapes
    zoneShapesRef.current.forEach((shape) => shape.setMap(null));
    zoneShapesRef.current = [];

    zones.forEach((zone: any) => {
      const center = {
        lat: parseFloat(zone.center_latitude),
        lng: parseFloat(zone.center_longitude),
      };

      if (zone.boundary_json && zone.boundary_json.length > 0) {
        // Ensure paths is an array of literals
        const paths = (
          Array.isArray(zone.boundary_json)
            ? zone.boundary_json
            : JSON.parse(zone.boundary_json)
        ).map((point: any) => ({
          lat: Number(point.lat),
          lng: Number(point.lng),
        }));

        const polygon = new google.maps.Polygon({
          paths,
          strokeColor: "#4F46E5",
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: "#4F46E5",
          fillOpacity: 0.35,
          clickable: false,
        });
        polygon.setMap(map);
        zoneShapesRef.current.push(polygon);
      } else if (zone.radius_km) {
        const circle = new google.maps.Circle({
          strokeColor: "#4F46E5",
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: "#4F46E5",
          fillOpacity: 0.35,
          center,
          radius: Number(zone.radius_km) * 1000,
          clickable: false,
        });
        circle.setMap(map);
        zoneShapesRef.current.push(circle);
      }
    });
  }, [zones, map]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg"
      style={{ height: `${height}px` }}
    >
      <div ref={mapRef} className="bg-gray-100 w-full h-full" />
      {hoveredStore && (
        <StoreMarkerPopup
          store={hoveredStore}
          position={popupPosition}
          mapHeight={height}
          disableRedirect={disableRedirect}
        />
      )}
    </div>
  );
}

export default GoogleMap;
