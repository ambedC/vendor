import { GetServerSideProps } from "next";
import { getBrands, getSettings } from "@/routes/api";
import React from "react";
import { isSSR } from "@/helpers/getters";
import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import PageHeader from "@/components/custom/PageHeader";
import { Brand, PaginatedResponse } from "@/types/ApiResponse";
import BrandCard from "@/components/Cards/BrandCard";
import BrandCardSkeleton from "@/components/Skeletons/BrandCardSkeleton";
import InfiniteScroll from "@/components/Functional/InfiniteScroll";
import { useInfiniteData } from "@/hooks/useInfiniteData";
import { NextPageWithLayout } from "@/types";
import InfiniteScrollStatus from "@/components/Functional/InfiniteScrollStatus";
import { loadTranslations } from "../../../i18n";
import { useTranslation } from "react-i18next";
import DynamicSEO from "@/SEO/DynamicSEO";
import {
  generateCollectionSchema,
  generateBreadcrumbSchema,
} from "@/helpers/seo";
import { getUserLocationFromContext } from "@/helpers/functionalHelpers";
import { useRouter } from "next/router";

interface BrandsPageProps {
  initialBrands: PaginatedResponse<Brand[]> | null;
  error?: string;
}

const PER_PAGE = 24;

const BrandsPage: NextPageWithLayout<BrandsPageProps> = ({ initialBrands }) => {
  const router = useRouter();
  const {
    data: brands,
    isLoading,
    isLoadingMore,
    hasMore,
    total,
    loadMore,
    refetch,
  } = useInfiniteData<Brand>({
    fetcher: getBrands,
    perPage: PER_PAGE,
    initialData: initialBrands?.data?.data || [],
    initialTotal: initialBrands?.data?.total || 0,
    passLocation: true,
    dataKey: "brands-page",
    extraParams: {
      scope_category_slug: router.query.slug as string,
    },
  });

  const { t } = useTranslation();

  // Generate SEO schemas
  const collectionSchema = generateCollectionSchema(
    t("pageTitle.brands"),
    t("pages.brands.subtitle"),
    "/brands"
  );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: t("pageTitle.brands"), url: "/brands" },
  ]);

  return (
    <>
      {/* Enhanced SEO */}
      <DynamicSEO
        title={t("pageTitle.brands")}
        description={t("pages.brands.subtitle")}
        keywords="brands, top brands, popular brands, shop by brand"
        canonical="/brands"
        ogType="website"
        ogTitle={t("pageTitle.brands")}
        ogDescription={t("pages.brands.subtitle")}
        jsonLd={[collectionSchema, breadcrumbSchema]}
      />

      {/* Breadcrumbs */}
      <MyBreadcrumbs
        breadcrumbs={[
          { href: "/brands", label: t("pages.brands.breadcrumb.brands") },
        ]}
      />

      {/* Page Header */}
      <PageHeader
        title={t("pages.brands.title")}
        subtitle={t("pages.brands.subtitle")}
        highlightText={
          total ? `${t("pages.brands.highlight", { count: total })}` : ""
        }
      />
      <button
        id="refetch-brands-page"
        className="hidden"
        onClick={() => refetch()}
      />

      {/* Infinite Scroll */}
      <InfiniteScroll
        hasMore={hasMore}
        isLoading={isLoadingMore}
        onLoadMore={loadMore}
      >
        <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-2 sm:gap-6">
          {isLoading && brands.length === 0
            ? Array.from({ length: PER_PAGE }).map((_, i) => (
                <BrandCardSkeleton key={i} />
              ))
            : brands.map((brand) => <BrandCard key={brand.id} brand={brand} />)}
        </div>

        {isLoadingMore && (
          <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-6 md:grid-cols-10 lg:grid-cols-12 gap-2 sm:gap-6 mt-6">
            {Array.from({ length: PER_PAGE }).map((_, i) => (
              <BrandCardSkeleton key={`loading-${i}`} />
            ))}
          </div>
        )}

        {brands.length > 0 && (
          <InfiniteScrollStatus
            entityType={t("pages.brands.infiniteScroll")}
            total={total}
            hasMore={hasMore}
          />
        )}
      </InfiniteScroll>
    </>
  );
};

export const getServerSideProps: GetServerSideProps | undefined = isSSR()
  ? async (context) => {
      try {
        const { lat = "", lng = "" } =
          (await getUserLocationFromContext(context)) || {};
        let brands = null;

        const slug = context.query.slug as string | undefined;

        if (lat && lng) {
          brands = await getBrands({
            page: 1,
            per_page: PER_PAGE,
            latitude: lat,
            longitude: lng,
            scope_category_slug: slug,
          });
        }
        const settings = await getSettings();
        await loadTranslations(context);

        return {
          props: {
            initialBrands: brands,
            initialSettings: settings.data,
          },
        };
      } catch (err) {
        console.error("Error in getServerSideProps:", err);
        return {
          props: {
            initialBrands: null,
            initialSettings: null,
            error:
              err instanceof Error
                ? err.message
                : "An error occurred during SSR",
          },
        };
      }
    }
  : undefined;

export default BrandsPage;
