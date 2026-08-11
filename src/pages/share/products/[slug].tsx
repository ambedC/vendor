import { GetServerSideProps } from "next";
import { getSlugFromContext, isSSR } from "@/helpers/getters";
import { getAccessTokenFromContext } from "@/helpers/auth";
import { getSettings } from "@/routes/api";
import { getUserLocationFromContext } from "@/helpers/functionalHelpers";
import { fetchProductDetailPageData } from "@/services/ProductDetailPageService";
import ProductPage from "@/pages/products/[slug]/index";

export const getServerSideProps: GetServerSideProps = isSSR()
  ? async (context) => {
      try {
        const access_token = (await getAccessTokenFromContext(context)) || "";
        const slug = getSlugFromContext(context);
        
        // Priority 1: query parameters (from the share link)
        let lat = typeof context.query.lat === "string" ? context.query.lat : "";
        let lng = typeof context.query.lng === "string" ? context.query.lng : "";

        // Priority 2: user location from context cookies (if no query params present)
        if (!lat || !lng) {
          const cookieLocation = await getUserLocationFromContext(context);
          if (cookieLocation) {
            lat = cookieLocation.lat || "";
            lng = cookieLocation.lng || "";
          }
        }
        
        // We do NOT fall back to default settings' latitude/longitude.
        // It's better to send empty strings if absolutely no location is known.
        
        const settingsRes = await getSettings();
        const settings = settingsRes.data || null;

        // Fetch all product page data using (potentially default) location
        const data = await fetchProductDetailPageData({
          slug,
          access_token,
          lat,
          lng,
          PER_PAGE: 20,
        });

        return {
          props: {
            ...data,
            initialSettings: settings,
            slug,
          },
        };
      } catch (err) {
        console.error("Error in share page getServerSideProps:", err);
        return {
          props: {
            error: err instanceof Error ? err.message : "An unexpected error occurred",
          },
        };
      }
    }
  : undefined as any;

export default ProductPage;
