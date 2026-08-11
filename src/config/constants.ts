import { OrderStatus } from "@/types/ApiResponse";

export const fallbackPaginateRes = {
  success: true,
  message: "Mocked response.",
  data: {
    current_page: 0,
    data: [],
    per_page: 0,
    total: 0,
  },
};
export const fallbackPaginateResOfProductReviews = {
  success: true,
  message: "Mocked response.",
  data: {
    current_page: 0,
    data: {
      total_reviews: 0,
      average_rating: "0",
      ratings_breakdown: {
        "1_star": "0",
        "2_star": "0",
        "3_star": "0",
        "4_star": "0",
        "5_star": "0",
      },
      reviews: [],
    },
    per_page: 0,
    total: 0,
  },
};

export const fallbackApiRes = {
  success: true,
  message: "Mocked response.",
  data: [] as any,
};

export const fallbackBannerRes = {
  success: true,
  message: "Mocked response.",
  data: {
    current_page: 0,
    data: { top: [], carousel: [], sidebar: [] },
    per_page: 0,
    total: 0,
  },
};

export const orderStatusColorMap = (
  status: OrderStatus | undefined
): "default" | "primary" | "secondary" | "success" | "warning" | "danger" => {
  switch (status) {
    case "awaiting_store_response":
      return "warning";
    case "ready_for_pickup":
      return "secondary";
    case "assigned":
      return "primary";
    case "out_for_delivery":
      return "warning";
    case "delivered":
      return "success";
    case "cancelled":
      return "danger";
    default:
      return "default";
  }
};
export const orderStatusPriority: Record<string, number> = {
  pending: 1,
  awaiting_store_response: 2,
  partially_accepted: 3,
  accepted: 3,
  rejected_by_seller: 3.5,
  preparing: 4,
  ready_for_pickup: 5,
  assigned: 6,
  out_for_delivery: 7,
  delivered: 8,
  cancelled: 9,
  returned: 10,
};

export const staticProfileImage =
  "https://i.pravatar.cc/150?u=a042581f4e29026704d";

export const TILE_LAYERS = [
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
  "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
  "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}.png",
  "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png",
  "https://tiles.stadiamaps.com/tiles/terrain/{z}/{x}/{y}.png",
];

export const staticLat = 23.242;
export const staticLng = 69.6669;

export const demoEmail = "user@gmail.com";
export const demoPassword = "12345678";
export const demoNumber = "9000000000";
