export type NotificationData = Record<string, unknown> | string | null | undefined;

const parseNotificationData = (data?: NotificationData): Record<string, unknown> | undefined => {
  if (data == null) return undefined;
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return undefined;
    }
  }
  if (typeof data === "object" && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  return undefined;
};

const toStringValue = (value: unknown): string | undefined => {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && !Number.isNaN(value)) return value.toString();
  return undefined;
};

const firstStringValue = (
  data: Record<string, unknown> | undefined,
  keys: readonly string[],
): string | undefined => {
  if (!data) return undefined;
  for (const key of keys) {
    const value = toStringValue(data[key]);
    if (value) return value;
  }
  return undefined;
};

const normalizeType = (type?: string): string => (type ?? "").toString().trim().toLowerCase();

export const getNotificationRedirectUrl = (
  rawData?: NotificationData,
  notificationType?: string,
): string | null => {
  const data = parseNotificationData(rawData);
  const type = normalizeType(notificationType ?? (data?.type as string | undefined));

  const quickLink = firstStringValue(data, [
    "redirect_url",
    "url",
    "link",
    "target_url",
    "target",
  ]);
  if (quickLink) return quickLink;

  switch (type) {
    case "order":
    case "delivery":
    case "order_update":
    case "new_order":
    case "return_order":
    case "return_order_update": {
      const orderSlug = firstStringValue(data, ["order_slug", "order_id", "orderId"]);
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
      const productSlug = firstStringValue(data, ["product_slug", "slug", "productId", "product_id"]);
      return productSlug ? `/products/${productSlug}` : "/products";
    }
    case "brand":
    case "brand_notification": {
      const brandSlug = firstStringValue(data, ["brand_slug", "slug", "brandId", "brand_id"]);
      return brandSlug ? `/brands/${brandSlug}` : "/brands";
    }
    case "category":
    case "category_notification": {
      const categorySlug = firstStringValue(data, ["category_slug", "slug", "categoryId", "category_id"]);
      return categorySlug ? `/categories/${categorySlug}` : "/categories";
    }
    case "store":
    case "store_notification": {
      const storeSlug = firstStringValue(data, ["store_slug", "slug", "storeId", "store_id"]);
      return storeSlug ? `/stores/${storeSlug}` : "/stores";
    }
    case "featured_section": {
      const sectionSlug = firstStringValue(data, ["section_slug", "feature_section_slug", "slug"]);
      return sectionSlug ? `/feature-sections/${sectionSlug}` : "/feature-sections";
    }
    default: {
      const entityType = firstStringValue(data, ["entity_type", "target_type", "object_type"]);
      const entitySlug = firstStringValue(data, ["entity_slug", "target_slug", "object_slug"]);
      if (entityType && entitySlug) {
        if (entityType.includes("product")) return `/products/${entitySlug}`;
        if (entityType.includes("brand")) return `/brands/${entitySlug}`;
        if (entityType.includes("category")) return `/categories/${entitySlug}`;
        if (entityType.includes("store")) return `/stores/${entitySlug}`;
      }
      return null;
    }
  }
};
