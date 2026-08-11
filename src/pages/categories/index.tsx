import { GetServerSideProps } from "next";
import { getCategories, getSettings } from "@/routes/api";
import React from "react";
import { isSSR } from "@/helpers/getters";
import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import PageHeader from "@/components/custom/PageHeader";
import CategoryCard from "@/components/Cards/CategoryCard";
import CategoryCardSkeleton from "@/components/Skeletons/CategoryCardSkeleton";
import InfiniteScroll from "@/components/Functional/InfiniteScroll";
import InfiniteScrollStatus from "@/components/Functional/InfiniteScrollStatus";
import { useInfiniteData } from "@/hooks/useInfiniteData";
import { Category, PaginatedResponse } from "@/types/ApiResponse";
import { NextPageWithLayout } from "@/types";
import { ArrowRight, FolderOpen } from "lucide-react";
import NoProductsFound from "@/components/NoProductsFound";
import { loadTranslations } from "../../../i18n";
import { useTranslation } from "react-i18next";
import DynamicSEO from "@/SEO/DynamicSEO";
import {
  generateCollectionSchema,
  generateBreadcrumbSchema,
} from "@/helpers/seo";
import { Button } from "@heroui/react";
import { useRouter } from "next/router";
import { getUserLocationFromContext } from "@/helpers/functionalHelpers";

interface CategoriesPageProps {
  initialCategories: PaginatedResponse<Category[]> | null;
  error?: string;
}

const PER_PAGE = 24;

const CategoriesPage: NextPageWithLayout<CategoriesPageProps> = ({
  initialCategories,
}) => {
  const { t } = useTranslation();
  const router = useRouter();

  const {
    data: categories,
    isLoading,
    isLoadingMore,
    hasMore,
    total,
    loadMore,
    refetch,
  } = useInfiniteData<Category>({
    fetcher: getCategories,
    perPage: PER_PAGE,
    initialData: initialCategories?.data?.data || [],
    initialTotal: initialCategories?.data?.total || 0,
    passLocation: true,
    dataKey: "categories-page",
    extraParams: {
      slug: router.query.slug as string,
    },
  });

  // Generate SEO schemas
  const collectionSchema = generateCollectionSchema(
    t("pageTitle.categories"),
    t("pages.categories.subtitle"),
    "/categories"
  );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: t("pageTitle.categories"), url: "/categories" },
  ]);

  return (
    <>
      <DynamicSEO
        title={t("pageTitle.categories")}
        description={t("pages.categories.subtitle")}
        keywords="categories, product categories, shop by category, browse categories"
        canonical="/categories"
        ogType="website"
        ogTitle={t("pageTitle.categories")}
        ogDescription={t("pages.categories.subtitle")}
        jsonLd={[collectionSchema, breadcrumbSchema]}
      />

      <div className="min-h-screen">
        {/* Breadcrumb */}
        <MyBreadcrumbs
          breadcrumbs={[
            { href: "/categories", label: t("pageTitle.categories") },
          ]}
        />

        <button
          id="refetch-categories-page"
          className="hidden"
          onClick={() => refetch()}
        />

        {/* Page Header */}
        <PageHeader
          title={t("pages.categories.title")}
          subtitle={t("pages.categories.subtitle")}
          highlightText={
            total ? `${total} ${t("pages.categories.highlight")}` : ""
          }
        />

        {/* Categories Grid */}
        <InfiniteScroll
          hasMore={hasMore}
          isLoading={isLoadingMore}
          onLoadMore={loadMore}
        >
          <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-9 2xl:grid-cols-10 gap-2 sm:gap-3">
            {isLoading && categories.length === 0
              ? Array.from({ length: 10 }).map((_, index) => (
                  <CategoryCardSkeleton key={index} />
                ))
              : categories.map((category) => (
                  <CategoryCard category={category} key={category.id} />
                ))}
          </div>

          {isLoadingMore && (
            <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 xl:grid-cols-9 2xl:grid-cols-10 gap-2 sm:gap-3 mt-6">
              {Array.from({ length: 10 }).map((_, index) => (
                <CategoryCardSkeleton key={`loading-${index}`} />
              ))}
            </div>
          )}

          {categories.length > 0 ? (
            <InfiniteScrollStatus
              entityType={t("pages.categories.infiniteScroll")}
              total={total}
              hasMore={hasMore}
            />
          ) : (
            <NoProductsFound
              icon={FolderOpen}
              title={t("pages.categories.noCategories.title")}
              description={t("pages.categories.noCategories.description")}
              customActions={
                <div className="flex w-full justify-center items-center">
                  <Button
                    color="primary"
                    className="h-8"
                    variant="solid"
                    onPress={() => {
                      router.push("/");
                    }}
                    endContent={<ArrowRight size={16} />}
                  >
                    {t("home_title")}
                  </Button>
                </div>
              }
            />
          )}
        </InfiniteScroll>
      </div>
    </>
  );
};

// SSR
export const getServerSideProps: GetServerSideProps | undefined = isSSR()
  ? async (context) => {
      try {
        const { lat = "", lng = "" } =
          (await getUserLocationFromContext(context)) || {};
        let categories = null;

        const slug = context.query.slug as string | undefined;

        if (lat && lng) {
          categories = await getCategories({
            page: 1,
            per_page: PER_PAGE,
            latitude: lat,
            longitude: lng,
            slug: slug,
          });
        }
        const settings = await getSettings();
        await loadTranslations(context);

        return {
          props: {
            initialCategories: categories,
            initialSettings: settings.data,
          },
        };
      } catch (err) {
        console.error("Error in getServerSideProps:", err);
        return {
          props: {
            initialCategories: null,
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

export default CategoriesPage;
