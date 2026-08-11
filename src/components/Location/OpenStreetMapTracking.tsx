"use client";
import { FC, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DeliveryLocationResponse } from "@/types/ApiResponse";
import { TILE_LAYERS } from "@/config/constants";

interface OpenStreetMapTrackingProps {
  data: DeliveryLocationResponse | null;
  isLoading?: boolean;
  useTransportLayer: boolean;
}

const key = "64acfb2cb7254afd95277f9865cd835e";

// Decode polyline from OSRM
const decodePolyline = (encoded: string): [number, number][] => {
  const points: [number, number][] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat / 100000, lng / 100000]);
  }

  return points;
};

// Get route from OSRM supporting multiple waypoints
const getRoadRoute = async (
  points: [number, number][],
): Promise<[number, number][]> => {
  if (points.length < 2) return [];
  try {
    const coords = points.map(p => `${p[1]},${p[0]}`).join(";");
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=polyline`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0].geometry;
        return decodePolyline(route);
      }
    }
  } catch (error) {
    console.error("Error fetching route:", error);
  }
  return [];
};

// Calculate heading (bearing) between two points
const getHeading = (p1: [number, number], p2: [number, number]) => {
  const lat1 = (p1[0] * Math.PI) / 180;
  const lat2 = (p2[0] * Math.PI) / 180;
  const lng1 = (p1[1] * Math.PI) / 180;
  const lng2 = (p2[1] * Math.PI) / 180;

  const y = Math.sin(lng2 - lng1) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1);
  const theta = Math.atan2(y, x);
  const brng = ((theta * 180) / Math.PI + 360) % 360;
  return brng;
};

const createCustomIcon = (
  color: string,
  iconText: string,
  iconType: "rider" | "store" | "customer" = "store",
  rotation: number = 0,
) => {
  const size = iconType === "rider" ? 56 : iconType === "customer" ? 35 : 32;

  if (iconType === "rider") {
    const iconHtml = `
      <div class="rider-wrapper" style="width: ${size}px; height: ${size}px; position: relative; display: flex; align-items: center; justify-content: center;">
        <img src="/images/delivery-boy-top-view.png" 
             class="rider-icon-inner" 
             style="
               width: 100%; 
               height: 100%; 
               object-fit: contain;
               transform: rotate(${rotation}deg);
               transition: transform 0.2s ease-out;
               z-index: 2;
               filter: drop-shadow(0 4px 10px rgba(0,0,0,0.45));
             " 
             alt="rider" />
      </div>
    `;

    return L.divIcon({
      html: iconHtml,
      className: "",
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
    });
  }

  const iconHtml = `
    <div style="
      background-color: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        transform: rotate(45deg);
        color: white;
        font-weight: bold;
        font-size: ${iconType === "customer" ? "20px" : "14px"};
        text-align: center;
      ">${iconText}</div>
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: "custom-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

const OpenStreetMapTracking: FC<OpenStreetMapTrackingProps> = ({
  data,
  useTransportLayer = false,
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylinesRef = useRef<L.Polyline[]>([]);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const riderMarkerRef = useRef<L.Marker | null>(null);
  const riderPositionRef = useRef<[number, number] | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  // const staticSegmentsRef = useRef<[number, number][][]>([]); // Cache for Stop-to-Stop paths
  const storeMarkersMapRef = useRef<Map<number, L.Marker>>(new Map());
  const customerMarkerRef = useRef<L.Marker | null>(null);
  const lastCollectionsStatusRef = useRef<string>("");
  const lastOrderIdRef = useRef<number | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  
  const deliveryBoyData = data?.delivery_boy?.data;
  const isDeliveryBoyAssigned = !!deliveryBoyData;

  const collectionsStatus = JSON.stringify(
    data?.route.route_details.map((s) => ({
      id: s.store_id,
      collected: s.is_collected,
    })),
  );

  useEffect(() => {
    if (!mapContainerRef.current || !data) return;

    let isCancelled = false;

    const initializeMap = async () => {
      // Only show loading splash if it's the very first time
      if (!mapRef.current) {
        setIsMapLoading(true);
      }

      try {
        const customerLat = parseFloat(data.order.shipping_latitude);
        const customerLng = parseFloat(data.order.shipping_longitude);

        // Check if order ID changed to do a full reset
        const isNewOrder = lastOrderIdRef.current !== data.order.id;
        if (isNewOrder && mapRef.current) {
          // Clear everything for the new order
          markersRef.current.forEach(m => m.remove());
          markersRef.current = [];
          polylinesRef.current.forEach(p => p.remove());
          polylinesRef.current = [];
          storeMarkersMapRef.current.clear();
          riderMarkerRef.current = null;
          customerMarkerRef.current = null;
          riderPositionRef.current = null;
        }
        lastOrderIdRef.current = data.order.id;

        // Initialize map instance
        if (!mapRef.current) {
          mapRef.current = L.map(mapContainerRef.current!, {
            center: [customerLat, customerLng],
            zoom: 13,
            zoomControl: true,
          });
        }

        const map = mapRef.current;
        if (!map) return;

        // Update tile layer
        if (useTransportLayer) {
          if (tileLayerRef.current) tileLayerRef.current.remove();
          tileLayerRef.current = L.tileLayer(
            `https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=${key}`,
            {
              attribution: 'Maps &copy; <a href="https://www.thunderforest.com">Thunderforest</a>, Data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              maxZoom: 22,
            },
          ).addTo(map);
        } else if (!tileLayerRef.current) {
          tileLayerRef.current = L.tileLayer(TILE_LAYERS[2], {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          }).addTo(map);
        }

        // Prepare locations
        const lat = parseFloat(deliveryBoyData!.latitude);
        const lng = parseFloat(deliveryBoyData!.longitude);
        const routeDetails = data.route.route_details;
        const stores = routeDetails.filter((store) => store.store_id !== null);
        const uncollectedStores = stores.filter((store) => !store.is_collected);
        const customerLocation = routeDetails.find((loc) => loc.store_id === null);

        // Build route waypoints
        const waypoints: [number, number][] = [];
        waypoints.push([lat, lng]); // Start from rider
        uncollectedStores.forEach((store) => waypoints.push([store.latitude, store.longitude]));
        
        if (customerLocation) {
          waypoints.push([customerLocation.latitude, customerLocation.longitude]);
        } else {
          waypoints.push([customerLat, customerLng]);
        }

        // Fetch full route to uncollected stops and customer
        const allSegments = await getRoadRoute(waypoints);

        if (isCancelled) return;

        // Draw the initial polyline
        if (polylinesRef.current.length === 0) {
          if (allSegments.length > 0) {
            const poly = L.polyline(allSegments, { color: "#3B82F6", weight: 4, opacity: 0.8, smoothFactor: 1 }).addTo(map);
            polylinesRef.current.push(poly);
          } else {
            // Fallback to straight lines if OSRM fails
            const poly = L.polyline(waypoints, { color: "#3B82F6", weight: 4, opacity: 0.8, dashArray: "5, 10" }).addTo(map);
            polylinesRef.current.push(poly);
          }
        }

        // Manage Rider Marker (Persistent)
        if (!riderMarkerRef.current) {
          let heading = 0;
          if (allSegments?.length >= 2) {
            heading = getHeading(allSegments[0], allSegments[1]);
          }
          riderMarkerRef.current = L.marker([lat, lng], {
            icon: createCustomIcon("#10B981", "🏍️", "rider", heading),
            zIndexOffset: 1000,
          }).addTo(map);
          
          riderMarkerRef.current.bindPopup(`
            <div style="min-width: 200px; padding: 8px;">
              <strong style="color: #1f2937;">Delivery Partner</strong>
              <p style="margin: 4px 0 0 0; font-weight: 500;">${deliveryBoyData!.delivery_boy.full_name}</p>
            </div>
          `);
          markersRef.current.push(riderMarkerRef.current);
          riderPositionRef.current = [lat, lng];
        }

        // Manage Store Markers (Persistent via Map)
        const activeStoreIds = new Set(stores.map(s => s.store_id!));
        storeMarkersMapRef.current.forEach((m, id) => {
          if (!activeStoreIds.has(id)) {
            m.remove();
            storeMarkersMapRef.current.delete(id);
            markersRef.current = markersRef.current.filter(x => x !== m);
          }
        });

        stores.forEach((store, idx) => {
          const isCollected = store.is_collected;
          let m = storeMarkersMapRef.current.get(store.store_id!);
          if (!m) {
            m = L.marker([store.latitude, store.longitude]).addTo(map);
            storeMarkersMapRef.current.set(store.store_id!, m);
            markersRef.current.push(m);
          }
          m.setLatLng([store.latitude, store.longitude]);
          m.setIcon(createCustomIcon(isCollected ? "#9CA3AF" : "#3B82F6", isCollected ? "✓" : `${idx + 1}`, "store"));
          m.setOpacity(isCollected ? 0.7 : 1);
          m.bindPopup(`<div style="padding: 8px;"><strong>Store ${idx + 1} ${isCollected ? "(Collected)" : ""}</strong><p>${store.store_name}</p></div>`);
        });

        // Manage Customer Marker (Persistent)
        const cPos: [number, number] = customerLocation 
          ? [customerLocation.latitude, customerLocation.longitude] 
          : [customerLat, customerLng];
        if (!customerMarkerRef.current) {
          customerMarkerRef.current = L.marker(cPos, { icon: createCustomIcon("#DC2626", "🏠", "customer") }).addTo(map);
          markersRef.current.push(customerMarkerRef.current);
          customerMarkerRef.current.bindPopup(`<div style="padding: 8px;"><strong>Delivery Location</strong><p>${data.order.shipping_address_1}</p></div>`);
        } else {
          customerMarkerRef.current.setLatLng(cPos);
        }

        // Initial view fit
        if (isNewOrder || isMapLoading) {
          const bounds = L.latLngBounds(waypoints);
          map.fitBounds(bounds, { padding: [50, 50] });
        }

        setIsMapLoading(false);
      } catch (e) {
        console.error("Map init error:", e);
        setIsMapLoading(false);
      }
    };

    initializeMap();

    return () => { isCancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.order.id, useTransportLayer, collectionsStatus]);

  useEffect(() => {
    if (!isDeliveryBoyAssigned || !mapRef.current || !riderMarkerRef.current) return;

    const lat = parseFloat(deliveryBoyData!.latitude);
    const lng = parseFloat(deliveryBoyData!.longitude);
    const newPos: [number, number] = [lat, lng];
    const prevPos = riderPositionRef.current || newPos;
    const statusChanged = lastCollectionsStatusRef.current !== "" && lastCollectionsStatusRef.current !== collectionsStatus;

    // Detect if we should animate to a specifically collected store
    let effectiveTarget = newPos;
    if (statusChanged) {
      const oldS = lastCollectionsStatusRef.current ? JSON.parse(lastCollectionsStatusRef.current) : [];
      const newS = JSON.parse(collectionsStatus);
      newS.forEach((s: any) => {
        const os = oldS.find((x: any) => x.id === s.id);
        if (s.collected && (!os || !os.collected)) {
          const store = data.route.route_details.find(rd => rd.store_id === s.id);
          if (store) effectiveTarget = [store.latitude, store.longitude];
        }
      });
    }
    lastCollectionsStatusRef.current = collectionsStatus;

    if (Math.abs(prevPos[0] - effectiveTarget[0]) < 0.00001 && Math.abs(prevPos[1] - effectiveTarget[1]) < 0.00001) {
      return;
    }

    const updateTracking = async () => {
      try {
        const animationPath = await getRoadRoute([prevPos, effectiveTarget]);
        if (animationPath.length === 0) return;

        const routeDetails = data.route.route_details;
        const uncollectedStores = routeDetails.filter(s => s.store_id !== null && !s.is_collected);
        const customerLoc = routeDetails.find(l => l.store_id === null);
        
        // Build remaining waypoints starting from effectiveTarget
        const remainingWaypoints: [number, number][] = [effectiveTarget];
        uncollectedStores.forEach(s => remainingWaypoints.push([s.latitude, s.longitude]));
        if (customerLoc) {
          remainingWaypoints.push([customerLoc.latitude, customerLoc.longitude]);
        } else {
          remainingWaypoints.push([parseFloat(data.order.shipping_latitude), parseFloat(data.order.shipping_longitude)]);
        }

        const fullRemainingRoute = await getRoadRoute(remainingWaypoints);
        const displayRoute = animationPath.length > 0 
          ? [...animationPath, ...(fullRemainingRoute.length > 0 ? fullRemainingRoute.slice(1) : [])] 
          : fullRemainingRoute;
        
        if (polylinesRef.current.length > 0) polylinesRef.current.forEach(p => p.remove());
        const poly = L.polyline(displayRoute, { color: "#3B82F6", weight: 5, opacity: 0.8, smoothFactor: 1, lineJoin: "round" }).addTo(mapRef.current!);
        polylinesRef.current = [poly];

        const segDists: number[] = [];
        let totalD = 0;
        for (let i = 0; i < animationPath.length - 1; i++) {
          const d = L.latLng(animationPath[i]).distanceTo(L.latLng(animationPath[i+1]));
          segDists.push(d);
          totalD += d;
        }

        const start = performance.now();
        const duration = 2800;

        const animate = (time: number) => {
          const progress = Math.min((time - start) / duration, 1);
          const targetD = progress * totalD;
          let currentD = 0;
          let currPos = animationPath[animationPath.length - 1];
          let currHeading = 0;

          for (let i = 0; i < segDists.length; i++) {
            if (currentD + segDists[i] >= targetD) {
              const t = (targetD - currentD) / segDists[i];
              const p1 = animationPath[i];
              const p2 = animationPath[i+1];
              currPos = [p1[0] + (p2[0]-p1[0])*t, p1[1] + (p2[1]-p1[1])*t];
              currHeading = getHeading(p1, p2);
              break;
            }
            currentD += segDists[i];
          }

          if (riderMarkerRef.current) {
            riderMarkerRef.current.setLatLng(currPos);
            riderPositionRef.current = currPos;
            const el = riderMarkerRef.current.getElement();
            const icon = el?.querySelector(".rider-icon-inner") as HTMLElement;
            if (icon) icon.style.transform = `rotate(${currHeading}deg)`;

            const poly = polylinesRef.current[0];
            if (poly) {
              let idx = 0;
              let acc = 0;
              for (let i = 0; i < segDists.length; i++) {
                if (acc + segDists[i] >= targetD) { idx = i; break; }
                acc += segDists[i];
              }
              poly.setLatLngs([L.latLng(currPos), ...displayRoute.slice(idx + 1).map(p => L.latLng(p))]);
            }
          }

          if (progress < 1) animationFrameRef.current = requestAnimationFrame(animate);
          else riderPositionRef.current = effectiveTarget;
        };

        animationFrameRef.current = requestAnimationFrame(animate);
        mapRef.current?.panTo(effectiveTarget, { animate: true, duration: 2.8 });
      } catch (err) { console.error("Tracking error:", err); }
    };

    updateTracking();
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryBoyData?.latitude, deliveryBoyData?.longitude, collectionsStatus, data?.order.id]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapContainerRef}
        className="w-full h-full rounded-lg z-0"
        style={{ minHeight: "500px" }}
      />

      {/* Map initialization loading */}
      {isMapLoading && isDeliveryBoyAssigned && (
        <div className="absolute inset-0 bg-white dark:bg-gray-900 flex items-center justify-center rounded-lg z-20">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Loading Map
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Calculating route and markers...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Delivery boy not assigned message */}
      {!isDeliveryBoyAssigned && !isMapLoading && (
        <div className="absolute inset-0 bg-white/95 dark:bg-gray-900/95 flex items-center justify-center rounded-lg z-30 backdrop-blur-sm">
          <div className="text-center p-8 max-w-sm">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <svg
                className="w-10 h-10 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Delivery Boy Not Assigned
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
              We are currently searching for a delivery partner. Live tracking
              will start once a driver is assigned.
            </p>
            <div className="mt-8">
              <div className="flex items-center justify-center gap-2">
                <span className="flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Waiting for assignment...
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      <style jsx global>{``}</style>
    </div>
  );
};

export default OpenStreetMapTracking;
