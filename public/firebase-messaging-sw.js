importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js",
);

let messaging = null;

// Initialize Firebase dynamically when config is received
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "INIT_FIREBASE" && !messaging) {
    try {
      firebase.initializeApp(event.data.config);
      messaging = firebase.messaging();
      console.log("Service Worker: Firebase initialized successfully");
    } catch (error) {
      console.error("Firebase initialization failed:", error);
    }
  }
});

// Handle push events
self.addEventListener("push", (event) => {
  if (!event.data) {
    console.error("No data in push event");
    return;
  }

  const payload = event.data.json();
  const { title, body, icon, image } = payload.notification || {};
  const notificationOptions = {
    body: body || "You have a new message",
    icon: icon || "/favicon.ico",
    image: image || "",
    data: payload.data || {},
    sound: "/sounds/notification.mp3",
  };
  event.waitUntil(
    self.registration.showNotification(
      title || "New Notification",
      notificationOptions,
    ),
  );

  // Send data to React frontend
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of allClients) {
        client.postMessage({
          type: "PUSH_EVENT",
          payload,
        });
      }
    })(),
  );
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = getNotificationUrl(event?.notification?.data);
  if (!url) return;
  event.waitUntil(
    (async () => {
      try {
        const allClients = await clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        });
        const focused = allClients.find((client) => client.url === url);
        if (focused && "focus" in focused) {
          await focused.focus();
        } else {
          await clients.openWindow(url);
        }
      } catch (err) {
        console.error("Failed to open window:", err);
      }
    })(),
  );
});

function parseNotificationData(data) {
  if (data == null) return undefined;
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return undefined;
    }
  }
  if (typeof data === "object" && !Array.isArray(data)) {
    return data;
  }
  return undefined;
}

const toStringValue = (value) => {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && !Number.isNaN(value)) return value.toString();
  return undefined;
};

const firstStringValue = (data, keys) => {
  if (!data) return undefined;
  for (const key of keys) {
    const value = toStringValue(data[key]);
    if (value) return value;
  }
  return undefined;
};

const normalizeType = (type) => (type ?? "").toString().trim().toLowerCase();

function getNotificationUrl(data) {
  const parsed = parseNotificationData(data);
  const quickLink = firstStringValue(parsed, [
    "redirect_url",
    "url",
    "link",
    "target_url",
    "target",
  ]);
  if (quickLink) return quickLink;

  const type = normalizeType(parsed?.type);

  switch (type) {
    case "order":
    case "delivery":
    case "order_update":
    case "new_order":
    case "return_order":
    case "return_order_update": {
      const orderSlug = firstStringValue(parsed, ["order_slug", "order_id", "orderId"]);
      return orderSlug ? `/my-account/orders/${orderSlug}` : "/my-account/orders";
    }
    case "wallet":
    case "wallet_transaction":
    case "withdrawal":
    case "withdrawal_request":
    case "withdrawal_process":
      return "/my-account/wallet";
    case "product":
    case "product_update":
    case "product_launch":
    case "product_notification": {
      const productSlug = firstStringValue(parsed, ["product_slug", "slug", "productId", "product_id"]);
      return productSlug ? `/products/${productSlug}` : "/products";
    }
    case "brand":
    case "brand_notification": {
      const brandSlug = firstStringValue(parsed, ["brand_slug", "slug", "brandId", "brand_id"]);
      return brandSlug ? `/brands/${brandSlug}` : "/brands";
    }
    case "category":
    case "category_notification": {
      const categorySlug = firstStringValue(parsed, ["category_slug", "slug", "categoryId", "category_id"]);
      return categorySlug ? `/categories/${categorySlug}` : "/categories";
    }
    case "store":
    case "store_notification": {
      const storeSlug = firstStringValue(parsed, ["store_slug", "slug", "storeId", "store_id"]);
      return storeSlug ? `/stores/${storeSlug}` : "/stores";
    }
    case "feature_section":
    case "feature-section":
    case "featuresection":
    case "featured_section":
    case "featured-section":
    case "featuredsection": {
      const sectionSlug = firstStringValue(parsed, ["section_slug", "feature_section_slug", "slug"]);
      return sectionSlug ? `/feature-sections/${sectionSlug}` : "/feature-sections";
    }
    default: {
      const entityType = firstStringValue(parsed, ["entity_type", "target_type", "object_type"]);
      const entitySlug = firstStringValue(parsed, ["entity_slug", "target_slug", "object_slug", "slug"]);
      if (entityType && entitySlug) {
        if (entityType.includes("product")) return `/products/${entitySlug}`;
        if (entityType.includes("brand")) return `/brands/${entitySlug}`;
        if (entityType.includes("category")) return `/categories/${entitySlug}`;
        if (entityType.includes("store")) return `/stores/${entitySlug}`;
      }
      return null;
    }
  }
}

