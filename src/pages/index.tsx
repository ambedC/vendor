import { getCookieFromContext, isSSR } from "@/helpers/getters";
import HomeCategories from "@/views/homePage/HomeCategories";
import HomeTopSlider from "@/views/homePage/HomeTopSlider";
import { GetServerSideProps } from "next";
import { getHomePageData } from "@/services/homePageService";

import DeliveryBanner from "@/views/homePage/DeliveryBanner";
import {
  BannerData,
  Brand,
  Category,
  FeaturedSection,
  Product,
  Settings,
  Store,
} from "@/types/ApiResponse";
import HomeBrands from "@/views/homePage/HomeBrands";
import { NextPageWithLayout } from "@/types";
import { getUserLocationFromContext } from "@/helpers/functionalHelpers";
import HomeFeaturedSections from "@/views/homePage/HomeFeaturedSections";
import { getAccessTokenFromContext } from "@/helpers/auth";
import HomeCarouselSlider from "@/views/homePage/HomeCarouselSlider";
import { loadTranslations } from "../../i18n";
import { useTranslation } from "react-i18next";
import DynamicSEO from "@/SEO/DynamicSEO";
import {
  generateOrganizationSchema,
  generateWebsiteSchema,
} from "@/helpers/seo";
import { useSettings } from "@/contexts/SettingsContext";
import { siteConfig } from "@/config/site";
import AppDownloadSection from "@/views/homePage/AppDownloadSection";
import HomeServiceHighlights from "@/views/homePage/HomeServiceHighlights";

// const HomeRecentlyViewed = dynamic(
//   () => import("@/views/homePage/HomeRecentlyViewed"),
//   { ssr: false }
// );

type HomePageProps = {
  initialSettings?: Settings | null;
  initialCategories?: Category[];
  initialBanners?: BannerData;
  initialProducts?: Product[];
  initialBrands?: Brand[];
  initialStores?: Store[];
  initialSections?: FeaturedSection[];
  error?: string;
};

const HomePage: NextPageWithLayout<HomePageProps> = ({
  initialCategories,
  initialBanners,
  initialBrands,
  initialSections,
}) => {
  const { t } = useTranslation();
  const { webSettings } = useSettings();

  // Generate SEO schemas
  const siteName = webSettings?.siteName || siteConfig.name;
  const siteDescription =
    webSettings?.metaDescription || siteConfig.metaDescription;
  const siteLogo = webSettings?.siteHeaderLogo || "/logo.png";

  const organizationSchema = generateOrganizationSchema(
    siteName,
    siteDescription,
    siteLogo,
  );

  const websiteSchema = generateWebsiteSchema(siteName);

  return (
    <>
      <DynamicSEO
        title={t("pageTitle.home")}
        description={siteDescription}
        keywords={siteConfig.metaKeywords}
        canonical="/"
        ogType="website"
        ogTitle={siteName}
        ogDescription={siteDescription}
        ogImage={siteLogo}
        jsonLd={[organizationSchema, websiteSchema]}
      />

      <div className="flex flex-col gap-0">
        <HomeTopSlider initialBanners={initialBanners} />

        <HomeBrands initialBrands={initialBrands} />

        <HomeCategories initialCategories={initialCategories} />

        {/* <HomeStores initialStores={initialStores} /> */}

        <HomeCarouselSlider initialBanners={initialBanners} />

        <HomeFeaturedSections initialSections={initialSections} />

        {/* <HomeRecentlyViewed /> */}

        <HomeServiceHighlights />

        <DeliveryBanner />

        <AppDownloadSection />
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<HomePageProps> | undefined =
  isSSR()
    ? async (context) => {
        try {
          await loadTranslations(context);

          const access_token = (await getAccessTokenFromContext(context)) || "";

          const { lat = "", lng = "" } =
            (await getUserLocationFromContext(context)) || {};

          // 1️⃣ take category from query if available, else fallback to cookie
          const queryCategory = context.query.category as string | undefined;
          const cookieCategory =
            (getCookieFromContext(context, "homeCategory") as string) || "";

          const homeCategory = queryCategory || cookieCategory;

          const {
            settings,
            categories,
            banners,
            products,
            brands,
            stores,
            sections,
          } = await getHomePageData({ lat, lng, access_token, homeCategory });

          return {
            props: {
              initialSettings: settings,
              initialCategories: categories,
              initialBanners: banners,
              initialProducts: products,
              initialBrands: brands,
              initialStores: stores,
              initialSections: sections,
            },
          };
        } catch (err) {
          console.error("Error in getServerSideProps:", err);
          return {
            props: {
              initialSettings: null,
              initialCategories: [],
              initialBanners: undefined,
              initialProducts: [],
              initialBrands: [],
              initialStores: [],
              initialSections: [],
              error:
                err instanceof Error
                  ? err.message
                  : "An error occurred during SSR",
            },
          };
        }
      }
    : undefined;

export default HomePage;
