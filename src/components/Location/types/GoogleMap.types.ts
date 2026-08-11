import { Store, DeliveryZone } from "@/types/ApiResponse";

export type LatLng = {
  lat: number;
  lng: number;
};

export interface GoogleMapProps {
  latLng: LatLng | null;
  onLocationUpdate?: (location: LatLng) => void;
  onBoundsChange?: (bounds: { ne: LatLng; sw: LatLng }) => void;
  onZoomChange?: (zoom: number) => void;
  height?: number;
  stores?: Store[];
  zones?: DeliveryZone[];
  onMapLoad?: () => void;
  disableRedirect?: boolean;
  disableLocationChange?: boolean;
}
