import { getProductBySlug, getProducts, getSettings } from "@/routes/api";
import { Product, Settings } from "@/types/ApiResponse";

/**
 * Input parameters for fetching product detail page data
 */
export interface ProductDetailPageParams {
  slug: string;
  access_token: string;
  lat?: string;
  lng?: string;
  PER_PAGE?: number | string;
}

/**
 * Output of fetchProductDetailPageData function
 */
export interface ProductDetailPageData {
  initialProduct: Product | null; // replace `any` with your Product type
  initialSimilarProducts: Product[]; // replace `any` with your Product type
  initialSettings: Settings | null; // replace `any` with your Settings type
  errors: {
    productDetail: string | null;
    similarProducts: string | null;
    settings: string | null;
  };
}

/**
 * Fetches product detail page data concurrently:
 * - Product detail
 * - Similar products
 * - App settings
 *
 * Uses Promise.allSettled to ensure failure of one API does not block others.
 *
 * @param {ProductDetailPageParams} params - Input parameters including slug, access_token, lat, lng
 * @returns {Promise<ProductDetailPageData>} - The fetched data and any errors
 */
export async function fetchProductDetailPageData(
  params: ProductDetailPageParams
): Promise<ProductDetailPageData> {
  const { slug, access_token, lat = "", lng = "", PER_PAGE = 20 } = params;

  console.log("========== PRODUCT DETAIL FETCH ==========");
  console.log("Slug:", slug);

  // Concurrent API calls
  const [productDetailResult, similarProductsResult, settingsResult] =
    await Promise.allSettled([
      getProductBySlug({
        slug,
        access_token,
        latitude: lat,
        longitude: lng,
      }),
      getProducts({
        exclude_product: slug,
        per_page: PER_PAGE,
        access_token,
        latitude: lat,
        longitude: lng,
        include_child_categories: 0,
      }),
      getSettings(),
    ]);

  console.log(
    "Product Detail Status:",
    productDetailResult.status
  );

  if (productDetailResult.status === "fulfilled") {
    console.log(
      "Fetched Product:",
      productDetailResult.value?.data
    );

    console.log(
      "Fetched Product Slug:",
      productDetailResult.value?.data?.slug
    );

   console.log(
  "Fetched Product Full:",
  JSON.stringify(productDetailResult.value?.data, null, 2)
);
  } else {
    console.error(
      "Product Fetch Failed:",
      productDetailResult.reason
    );
  }

  return {
    initialProduct:
      productDetailResult.status === "fulfilled"
        ? (productDetailResult.value.data ?? null)
        : null,

    initialSimilarProducts:
      similarProductsResult.status === "fulfilled"
        ? (similarProductsResult.value.data?.data ?? [])
        : [],

    initialSettings:
      settingsResult.status === "fulfilled"
        ? (settingsResult.value.data ?? null)
        : null,

    errors: {
      productDetail:
        productDetailResult.status === "rejected"
          ? productDetailResult.reason?.message ||
            "Failed to fetch product detail"
          : null,
      similarProducts:
        similarProductsResult.status === "rejected"
          ? similarProductsResult.reason?.message ||
            "Failed to fetch similar products"
          : null,
      settings:
        settingsResult.status === "rejected"
          ? settingsResult.reason?.message ||
            "Failed to fetch settings"
          : null,
    },
  };
}
