import { logEvent, setUserProperties, setUserId } from "firebase/analytics";
import type { FirebaseInstance } from "./firebase";
import { OrderItem } from "@/types/ApiResponse";

// Analytics event types for type safety
export interface AnalyticsEvent {
  name: string;
  params?: Record<string, string | number | boolean>;
}

// Internal cache for Firebase instance
let cachedFirebaseInstance: FirebaseInstance | null = null;

// Function to set the Firebase instance (call this once during app initialization)
export function setFirebaseInstance(instance: FirebaseInstance | null): void {
  cachedFirebaseInstance = instance;
}

// Internal function to get Firebase instance
function getFirebaseInstance(): FirebaseInstance | null {
  // Skip analytics in development
  if (process.env.NODE_ENV === "development") {
    return null;
  }

  return cachedFirebaseInstance;
}

// Helper function to log events safely
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
): void {
  const firebaseInstance = getFirebaseInstance();

  if (!firebaseInstance?.analytics) {
    return; // Silently fail if analytics not initialized
  }
  try {
    logEvent(firebaseInstance.analytics, eventName, params);
    if (eventName != "page_view") {
      console.log(`Analytics event tracked: ${eventName}`, params);
    }
  } catch (error) {
    console.error("Error tracking analytics event:", error);
  }
}

// Track page views
export function trackPageView(pagePath: string, pageTitle: string): void {
  trackEvent("page_view", {
    page_path: pagePath,
    page_title: pageTitle,
  });
}

// Track product views
export function trackProductView(
  productId: string,
  productName: string,
  category?: string,
  price?: number
): void {
  trackEvent("view_item", {
    item_id: productId,
    item_name: productName,
    item_category: category || "",
    price: price || 0,
  });
}

// Track add to cart
export function trackAddToCart(
  productId: string,
  productName: string,
  price: number,
  quantity: number
): void {
  trackEvent("add_to_cart", {
    item_id: productId,
    item_name: productName,
    price: price,
    quantity: quantity,
  });
}

// Track remove from cart
export function trackRemoveFromCart(
  productId: string,
  productName: string
): void {
  trackEvent("remove_from_cart", {
    item_id: productId,
    item_name: productName,
  });
}

// Track purchase
export function trackPurchase(
  orderId: string,
  total: number,
  currency: string = "USD",
  promocode: string = "",
  delivery_charge: number | string = "0",
  orderItems: OrderItem[]
): void {
  // Skip analytics in development
  if (process.env.NODE_ENV === "development") {
    return;
  }

  const firebaseInstance = getFirebaseInstance();

  if (!firebaseInstance?.analytics) {
    return; // Silently fail if analytics not initialized
  }

  const items = orderItems.map((item, index) => ({
    item_id: item.sku || item.product_id.toString(),
    item_name: item.title,
    affiliation: item.store?.name || item.seller_name || "Online Store",
    coupon: item.promo_discount ? "applied" : undefined,
    discount:
      parseFloat(item.discount || "0") + parseFloat(item.promo_discount || "0"),
    index: index,
    item_brand: item.seller_name,
    item_category: undefined,
    item_list_id: item?.product_variant_id || undefined,
    item_list_name: item.product.name,
    item_variant: item.variant_title || undefined,
    location_id: item.store_id?.toString(),
    price: parseFloat(item.price),
    quantity: item.quantity,
  }));

  try {
    logEvent(firebaseInstance.analytics, "purchase" as any, {
      transaction_id: orderId,
      value: total,
      currency: currency,
      tax: orderItems.reduce(
        (sum, item) => sum + parseFloat(item.tax_amount || "0"),
        0
      ),
      coupon: promocode,
      shipping: delivery_charge,
      items: items,
    });
    // console.log(`Analytics event tracked: purchase`, { transaction_id: orderId, value: total });
  } catch (error) {
    console.error("Error tracking analytics event:", error);
  }
}

// Track search
export function trackSearch(searchTerm: string): void {
  trackEvent("search", {
    search_term: searchTerm,
  });
}

// Track login
export function trackLogin(method: string): void {
  trackEvent("login", {
    method: method,
  });
}

// Track sign up
export function trackSignUp(method: string): void {
  trackEvent("sign_up", {
    method: method,
  });
}

// Track category view
export function trackCategoryView(
  categoryId: string,
  categoryName: string
): void {
  trackEvent("view_item_list", {
    item_list_id: categoryId,
    item_list_name: categoryName,
  });
}

// Track store view
export function trackStoreView(storeId: string, storeName: string): void {
  trackEvent("view_store", {
    store_id: storeId,
    store_name: storeName,
  });
}

// Set user properties
export function setAnalyticsUserProperties(
  properties: Record<string, string>
): void {
  // Skip analytics in development
  if (process.env.NODE_ENV === "development") {
    return;
  }

  const firebaseInstance = getFirebaseInstance();

  if (!firebaseInstance?.analytics) {
    return; // Silently fail if analytics not initialized
  }

  try {
    setUserProperties(firebaseInstance.analytics, properties);
    console.log("User properties set:", properties);
  } catch (error) {
    console.error("Error setting user properties:", error);
  }
}

// Set user ID
export function setAnalyticsUserId(userId: string): void {
  // Skip analytics in development
  if (process.env.NODE_ENV === "development") {
    return;
  }

  const firebaseInstance = getFirebaseInstance();

  if (!firebaseInstance?.analytics) {
    return; // Silently fail if analytics not initialized
  }

  try {
    setUserId(firebaseInstance.analytics, userId);
    console.log("User ID set:", userId);
  } catch (error) {
    console.error("Error setting user ID:", error);
  }
}
