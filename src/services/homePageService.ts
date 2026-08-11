import {
  getBannerImages,
  getBrands,
  getCategories,
  getProducts,
  getSections,
  getSettings,
  getStores,
  getSubCategories,
} from "@/routes/api";
import {
  BannerData,
  Brand,
  Category,
  FeaturedSection,
  Product,
  Settings,
  Store,
} from "@/types/ApiResponse";

export type HomePageData = {
  settings: Settings;
  categories: Category[];
  banners: BannerData;
  products: Product[];
  brands: Brand[];
  stores: Store[];
  sections: FeaturedSection[];
};

type HomePageParams = {
  lat?: string;
  lng?: string;
  access_token?: string;
  homeCategory?: string;
};

/**
 * Centralized function to fetch all homepage data
 * Each API call is handled independently - if one fails, others continue
 * @param params - Optional parameters including lat/lng
 * @returns Promise<HomePageData> - Object containing all homepage data
 */
export const getHomePageData = async (
  params: HomePageParams = {}
): Promise<HomePageData> => {
  const { lat = "", lng = "", access_token = "", homeCategory = "" } = params;

  // Initialize with default values
  let settings: Settings = {} as Settings;
  let categories: Category[] = [];
  let banners: BannerData = {
    top: [],
    carousel: [],
  };
  let products: Product[] = [];
  let brands: Brand[] = [];
  let stores: Store[] = [];
  let sections: FeaturedSection[] = [];

  // Fetch settings (still needed for site config)
  try {
    const settingsResponse = await getSettings();
    if (settingsResponse.success && settingsResponse.data) {
      settings = settingsResponse.data;
    } else {
      console.error(
        settingsResponse.message || "Invalid settings response data"
      );
    }
  } catch (error) {
    console.error("Failed to fetch settings:", error);
  }

  // Only fetch location-dependent data if both lat and lng are provided
  if (lat && lng) {
    // Fetch categories
    try {
      const isAllCategory = homeCategory === "all";

      const slug = isAllCategory || !homeCategory ? undefined : homeCategory;

      const categoriesResponse = await (isAllCategory
        ? getSubCategories({
            slug,
            latitude: lat,
            longitude: lng,
            filter: "top_category",
          })
        : getCategories({
            slug,
            latitude: lat,
            longitude: lng,
          }));

      if (categoriesResponse.success && categoriesResponse.data) {
        categories = categoriesResponse.data.data || [];
      } else {
        console.error(
          categoriesResponse.message || "Invalid categories response data"
        );
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }

    // Fetch banners (top + bottom + …)
    try {
      const bannersResponse = await getBannerImages({
        scope_category_slug: homeCategory ? homeCategory : undefined,
        per_page: 50,
        latitude: lat,
        longitude: lng,
      });
      if (bannersResponse.success && bannersResponse.data) {
        const allBanners = bannersResponse.data.data || {};
        banners = {
          top: allBanners.top || [],
          carousel: allBanners.carousel || [],
        };
      } else {
        console.error(
          bannersResponse.message || "Invalid banners response data"
        );
      }
    } catch (error) {
      console.error("Failed to fetch banners:", error);
    }

    // Fetch brands
    try {
      const brandsResponse = await getBrands({
        scope_category_slug: homeCategory ? homeCategory : undefined,
        latitude: lat,
        longitude: lng,
      });
      if (brandsResponse.success && brandsResponse.data) {
        brands = brandsResponse.data.data || [];
      } else {
        console.error(brandsResponse.message || "Invalid brands response data");
      }
    } catch (error) {
      console.error("Failed to fetch brands:", error);
    }

    // Fetch products
    try {
      const productsResponse = await getProducts({
        latitude: lat,
        longitude: lng,
        access_token,
        include_child_categories: 0,
        categories: homeCategory
          ? homeCategory == "all"
            ? undefined
            : homeCategory
          : undefined,
      });
      if (productsResponse.success && productsResponse.data) {
        products = productsResponse.data.data || [];
      } else {
        console.error(
          productsResponse.message || "Invalid products response data"
        );
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }

    // Fetch stores
    try {
      const storesResponse = await getStores({ latitude: lat, longitude: lng });
      if (storesResponse.success && storesResponse.data) {
        stores = storesResponse.data.data || [];
      } else {
        console.error(storesResponse.message || "Invalid stores response data");
      }
    } catch (error) {
      console.error("Failed to fetch stores:", error);
    }

    // Fetch sections
    try {
      const sectionsResponse = await getSections({
        latitude: lat,
        longitude: lng,
        access_token,
        scope_category_slug: homeCategory ? homeCategory : undefined,
      });
      if (sectionsResponse.success && sectionsResponse.data) {
        sections = sectionsResponse.data.data || [];
      } else {
        console.error(
          sectionsResponse.message || "Invalid sections response data"
        );
      }
    } catch (error) {
      console.error("Failed to fetch sections:", error);
    }
  }

  return {
    settings,
    categories,
    banners,
    products,
    brands,
    stores,
    sections,
  };
};
