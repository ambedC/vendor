import { getCookie } from "@/lib/cookies";
import { store } from "@/lib/redux/store";
import {
  AppSettings,
  AuthenticationSettings,
  HomeGeneralSettings,
  NotificationSettings,
  OrderStatus,
  PaymentSettings,
  Settings,
  SystemSettings,
  WebSettings,
  AdvertisementSettings,
} from "@/types/ApiResponse";
import { orderStatusPriority } from "@/config/constants";
import { parse } from "cookie";
import { GetServerSidePropsContext } from "next";

export const isStatusBeforeOrAt = (current: string, target: string) => {
  const currentPriority = orderStatusPriority[current] || 0;
  const targetPriority = orderStatusPriority[target] || 0;
  return currentPriority <= targetPriority;
};

export const getFlagEmoji = (countryCode: string): string => {
  const normalizedCode = countryCode.toLowerCase(); // Convert to lowercase as URLs are case-sensitive
  return `https://flagcdn.com/w320/${normalizedCode}.png`;
};

export const isSSR = () => {
  const ssr = process.env.NEXT_PUBLIC_SSR;
  return ssr ? ssr.trim().toLowerCase() === "true" : false;
};

export const getFormattedDate = (
  date: Date | string | number | null | undefined,
  locale: string = "en-IN",
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  },
): string => {
  try {
    let parsedDate: Date;

    // Handle null, undefined, or empty string inputs
    if (!date || (typeof date === "string" && date.trim() === "")) {
      return "Invalid Date";
    }

    // Attempt to parse the date input
    if (typeof date === "string" || typeof date === "number") {
      parsedDate = new Date(date);
    } else if (date instanceof Date) {
      parsedDate = date;
    } else {
      return "Invalid Date";
    }

    // Check if parsedDate is valid
    if (isNaN(parsedDate.getTime())) {
      return "Invalid Date";
    }

    // Format and return the valid date
    return new Intl.DateTimeFormat(locale, options).format(parsedDate);
  } catch (error) {
    console.error("Error parsing date:", error);
    return "Invalid Date";
  }
};

export const getSlugFromContext = (context: GetServerSidePropsContext) => {
  return Array.isArray(context.params?.slug)
    ? context.params.slug.join("/")
    : context.params?.slug || "";
};

export function getFirebaseConfig(settings: Settings) {
  const authSettings = settings.find(
    (item) => item.variable === "authentication",
  )?.value as AuthenticationSettings;

  if (!authSettings || !authSettings.firebase) {
    console.error("Firebase is not enabled or missing configuration.");
    return null;
  }

  return {
    apiKey: authSettings.fireBaseApiKey,
    authDomain: authSettings.fireBaseAuthDomain,
    databaseURL: authSettings.fireBaseDatabaseURL,
    projectId: authSettings.fireBaseProjectId,
    storageBucket: authSettings.fireBaseStorageBucket,
    messagingSenderId: authSettings.fireBaseMessagingSenderId,
    appId: authSettings.fireBaseAppId,
    measurementId: authSettings.fireBaseMeasurementId,
  };
}

export function getWebSettings(
  settings: Settings | undefined | null,
): WebSettings | undefined {
  // Check if settings is an array
  if (!Array.isArray(settings)) {
    return undefined;
  }

  // Safely find the web settings
  const webSetting = settings.find(
    (item) => item && typeof item === "object" && item.variable === "web",
  );

  // Check if webSetting and value exist
  if (!webSetting || typeof webSetting.value !== "object") {
    console.warn("Web settings not found or improperly formatted.");
    return undefined;
  }

  return webSetting.value as WebSettings;
}

export function getSpecificSettings(
  settings: Settings | undefined | null,
  variable:
    | "notification"
    | "web"
    | "authentication"
    | "payment"
    | "system"
    | "app"
    | "home_general_settings"
    | "advertisement",
):
  | WebSettings
  | SystemSettings
  | AuthenticationSettings
  | AppSettings
  | PaymentSettings
  | HomeGeneralSettings
  | NotificationSettings
  | AdvertisementSettings
  | undefined {
  // Check if settings is an array
  if (!Array.isArray(settings)) {
    return undefined;
  }

  // Safely find the web settings
  const setting = settings.find(
    (item) => item && typeof item === "object" && item.variable === variable,
  );

  // Check if webSetting and value exist
  if (!setting || typeof setting.value !== "object") {
    console.warn("settings not found or improperly formatted.");
    return undefined;
  }

  return setting.value;
}

export const getCookieFromContext = <T>(
  context: GetServerSidePropsContext,
  cookieName: string,
): T | null => {
  const cookies = context.req.headers.cookie;
  if (cookies) {
    const parsedCookies = parse(cookies);
    if (cookieName in parsedCookies) {
      const cookieValue =
        parsedCookies[cookieName as keyof typeof parsedCookies];
      const safeValue = cookieValue ?? "";
      try {
        return JSON.parse(decodeURIComponent(safeValue)) as T;
      } catch {
        console.error("Failed to parse cookie");
        return null;
      }
    }
  }
  return null;
};

export const getPageFromUrl = (): number => {
  if (typeof window === "undefined") return 1; // SSR safety
  const params = new URLSearchParams(window.location.search);
  const pageParam = params.get("page");
  const page = Number(pageParam);
  return !isNaN(page) && page > 0 ? page : 1;
};

export const getQueryParamFromUrl = (key: string): string | null => {
  if (typeof window === "undefined") return null; // SSR safety
  const params = new URLSearchParams(window.location.search);
  return params.get(key) || "";
};

export const getOrderStatusBtnConfig = (status: OrderStatus) => {
  switch (status) {
    case "partially_accepted":
    case "awaiting_store_response":
    case "preparing":
      return {
        trackOrder: false,
        cancelOrder: true,
        review: false,
        returnOrder: false,
        deliveryTime: true,
        reorder: true,
      };

    case "ready_for_pickup":
      return {
        trackOrder: true,
        cancelOrder: false,
        review: false,
        returnOrder: false,
        deliveryTime: true,
        reorder: true,
      };

    case "assigned":
    case "out_for_delivery":
      return {
        trackOrder: true,
        cancelOrder: false,
        review: false,
        returnOrder: false,
        deliveryTime: true,
        reorder: true,
      };

    case "delivered":
      return {
        trackOrder: false,
        cancelOrder: false,
        review: true,
        returnOrder: true,
        deliveryTime: false,
        reorder: true,
      };

    case "pending":
      return {
        trackOrder: false,
        cancelOrder: true,
        review: false,
        returnOrder: false,
        deliveryTime: false,
        reorder: true,
      };

    case "cancelled":
      return {
        trackOrder: false,
        cancelOrder: false,
        review: false,
        returnOrder: false,
        deliveryTime: false,
        reorder: true,
      };
    default:
      return {
        trackOrder: false,
        cancelOrder: false,
        review: false,
        returnOrder: false,
        deliveryTime: true,
        reorder: true,
      };
  }
};
export function getActiveCategory(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const queryCategory = urlParams.get("category");

  if (queryCategory) {
    if (queryCategory !== "all" && queryCategory.trim() !== "") {
      return queryCategory;
    }
    return undefined;
  }

  const cookieCategory = getCookie("homeCategory");

  if (
    typeof cookieCategory === "string" &&
    cookieCategory !== "all" &&
    cookieCategory.trim() !== ""
  ) {
    return cookieCategory;
  }
}

export const getUserDataFromRedux = () => {
  const data = store.getState().auth.user;
  if (data) {
    return data;
  } else {
    return null;
  }
};

export const getCartDataFromRedux = () => {
  const data = store.getState().cart.cartData;
  if (data) {
    return data;
  } else {
    return null;
  }
};

export const getUserCountryCode = async (): Promise<string> => {
  const DEFAULT_COUNTRY = "US";
  const res = await fetch("https://api.country.is/");
  if (res.ok) {
    const data: { country?: string } = await res.json();
    if (data?.country) {
      return data.country.toUpperCase();
    }
  }

  // Step 2: Try navigator.language

  // Extend Navigator interface to include userLanguage
  interface NavigatorWithUserLanguage extends Navigator {
    userLanguage?: string;
  }

  const lang =
    navigator.language || (navigator as NavigatorWithUserLanguage).userLanguage;
  if (lang && lang.includes("-")) {
    return lang.split("-")[1].toUpperCase();
  }

  // Step 3: Static fallback
  return DEFAULT_COUNTRY;
};

export const getFileType = (
  fileIdentifier: string,
): "image" | "video" | "pdf" | "document" | "other" => {
  // Handle both URLs and MIME types
  let extension = "";

  // Check if it's a MIME type
  if (fileIdentifier.includes("/") && !fileIdentifier.includes("://")) {
    const mimeType = fileIdentifier.toLowerCase();
    const mimeToExtension: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
      "image/webp": "webp",
      "image/svg+xml": "svg",
      "video/mp4": "mp4",
      "video/webm": "webm",
      "video/ogg": "ogg",
      "video/quicktime": "mov",
      "application/pdf": "pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "docx",
      "application/msword": "doc",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        "xlsx",
      "application/vnd.ms-excel": "xls",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        "pptx",
      "application/vnd.ms-powerpoint": "ppt",
    };
    extension = mimeToExtension[mimeType] || "";
  } else {
    // Extract extension from file URL or filename
    // Remove query parameters and fragments first
    const cleanIdentifier = fileIdentifier.split("?")[0].split("#")[0];
    // Get the last part after splitting by "/"
    const fileName = cleanIdentifier.split("/").pop() || "";
    // Get extension by finding the last dot
    const lastDotIndex = fileName.lastIndexOf(".");
    if (lastDotIndex > 0 && lastDotIndex < fileName.length - 1) {
      extension = fileName
        .substring(lastDotIndex + 1)
        .toLowerCase()
        .trim();
    }
  }

  // Categorize by extension
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension)) {
    return "image";
  }
  if (["mp4", "webm", "ogg", "mov"].includes(extension)) {
    return "video";
  }
  if (extension === "pdf") {
    return "pdf";
  }
  if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(extension)) {
    return "document";
  }
  return "other";
};
