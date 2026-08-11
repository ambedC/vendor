import { GetServerSideProps } from "next";
import { getSectionBySlug, getSettings } from "@/routes/api";
import React, { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { isSSR } from "@/helpers/getters";
import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import PageHeader from "@/components/custom/PageHeader";
import ProductCard from "@/components/Cards/ProductCard";
import ProductCardSkeleton from "@/components/Skeletons/ProductCardSkeleton";
import InfiniteScroll from "@/components/Functional/InfiniteScroll";
import { useInfiniteData } from "@/hooks/useInfiniteData";
import { Product, PaginatedResponse } from "@/types/ApiResponse";
import { NextPageWithLayout } from "@/types";
import { getAccessTokenFromContext } from "@/helpers/auth";
import { getUserLocationFromContext } from "@/helpers/functionalHelpers";
import { useRouter } from "next/router";
import InfiniteScrollStatus from "@/components/Functional/InfiniteScrollStatus";
import { loadTranslations } from "../../../../i18n";
import { formatString } from "@/helpers/validator";
import { useTranslation } from "react-i18next";
import PageHead from "@/SEO/PageHead";
import NoProductsFound from "@/components/NoProductsFound";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { Button } from "@heroui/react";
import ProductFilter from "@/components/Products/ProductFilter";
import { SortOption } from "@/components/Products/ProductFilter";

interface FeatureSectionPageProps {
  initialProducts: PaginatedResponse<Product[]> | null;
  error?: string;
  sectionSlug: string;
  sectionTitle?: string;
  initialFilters?: FeatureSectionFilter;
}

type FeatureSectionFilter = {
  categories: string[];
  brands: string[];
  colors: string[];
  attribute_values: string[];
  sort: SortOption;
  search?: string;
};

const PER_PAGE = 24;

// Helper function to parse query parameters into filters
const parseFiltersFromQuery = (query: {
  [key: string]: string | string[] | undefined;
}): FeatureSectionFilter => {
  const parseQueryParam = (param: string | string[] | undefined): string[] => {
    if (!param) return [];
    if (Array.isArray(param)) return param;
    return param.split(",");
  };

  return {
    categories: parseQueryParam(query.categories),
    brands: parseQueryParam(query.brands),
    colors: parseQueryParam(query.colors),
    attribute_values: parseQueryParam(query.attribute_values),
    sort: query.sort ? (query.sort as SortOption) : "relevance",
    search: typeof query.search === "string" ? query.search : "",
  };
};

// Helper function to convert filters to query parameters
const filtersToQueryParams = (
  filters: FeatureSectionFilter,
): Record<string, string> => {
  const params: Record<string, string> = {};

  if (filters.categories.length > 0) {
    params.categories = filters.categories.join(",");
  }
  if (filters.brands.length > 0) {
    params.brands = filters.brands.join(",");
  }
  if (filters.colors.length > 0) {
    params.colors = filters.colors.join(",");
  }
  if (filters.attribute_values.length > 0) {
    params.attribute_values = filters.attribute_values.join(",");
  }
  if (filters.sort) {
    params.sort = filters.sort;
  }
  if (filters.search && filters.search.trim() !== "") {
    params.search = filters.search.trim();
  }

  return params;
};

const FeatureSectionPage: NextPageWithLayout<FeatureSectionPageProps> = ({
  initialProducts,
  sectionSlug,
  initialFilters,
}) => {
  const router = useRouter();
  const { t } = useTranslation();

  const slug = sectionSlug || (router.query.slug as string);

  // Initialize filters from URL query params when SSR is false
  const computedInitialFilters = useMemo(() => {
    if (initialFilters) {
      return initialFilters;
    }
    if (router.isReady) {
      return parseFiltersFromQuery(router.query);
    }
    return {
      categories: [],
      brands: [],
      colors: [],
      attribute_values: [],
      sort: "relevance" as SortOption,
      search: "",
    };
  }, [initialFilters, router.isReady, router.query]);

  const [selectedFilters, setSelectedFilters] = useState<FeatureSectionFilter>(
    computedInitialFilters,
  );
  const isInternalRouteUpdate = useRef(false);

  const {
    data: products,
    isLoading,
    isLoadingMore,
    hasMore,
    total,
    loadMore,
    refetch,
  } = useInfiniteData<Product>({
    fetcher: (params) => getSectionBySlug({ ...params, slug }),
    perPage: PER_PAGE,
    initialData: initialProducts?.data?.data || [],
    initialTotal: initialProducts?.data?.total || 0,
    passLocation: true,
    dataKey: slug,
    extraParams: {
      categories:
        selectedFilters?.categories?.length > 0
          ? selectedFilters.categories.join(",")
          : undefined,
      brands:
        selectedFilters?.brands?.length > 0
          ? selectedFilters.brands.join(",")
          : undefined,
      colors:
        selectedFilters?.colors?.length > 0
          ? selectedFilters.colors.join(",")
          : undefined,
      attribute_values:
        selectedFilters?.attribute_values?.length > 0
          ? selectedFilters.attribute_values.join(",")
          : undefined,
      sort: selectedFilters?.sort ? selectedFilters.sort : undefined,
      search: selectedFilters?.search || "",
    },
  });

  // Update URL when filters change
  const updateURL = useCallback(
    async (filters: FeatureSectionFilter) => {
      const queryParams = filtersToQueryParams(filters);

      const filteredParams = Object.fromEntries(
        Object.entries(queryParams).filter(([, value]) => value),
      );

      const isFilterCleared =
        filters.categories.length === 0 &&
        filters.brands.length === 0 &&
        filters.colors.length === 0 &&
        filters.attribute_values.length === 0 &&
        filters.sort === "relevance" &&
        (!filters.search || filters.search.trim() === "");

      // Preserve any non-filter query parameters
      const preservedQuery = Object.fromEntries(
        Object.entries(router.query || {}).filter(
          ([key]) =>
            ![
              "categories",
              "brands",
              "colors",
              "sort",
              "search",
              "attribute_values",
            ].includes(key),
        ),
      );

      if (slug) {
        preservedQuery.slug = slug;
      }

      await router.push(
        {
          pathname: router.pathname,
          query: isFilterCleared
            ? preservedQuery
            : {
                ...preservedQuery,
                ...filteredParams,
              },
        },
        undefined,
        { shallow: true },
      );
    },
    [router, slug],
  );

  const onApplyFilters = useCallback(
    async (filters: FeatureSectionFilter) => {
      setSelectedFilters(filters);
      isInternalRouteUpdate.current = true;
      try {
        await updateURL(filters);
      } finally {
        isInternalRouteUpdate.current = false;
      }
    },
    [updateURL],
  );

  // Sync filters when they change in URL (for browser back/forward)
  useEffect(() => {
    const handleRouteChange = () => {
      if (isInternalRouteUpdate.current) return;

      const newFilters = parseFiltersFromQuery(router.query);
      setSelectedFilters((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(newFilters)) return prev;
        return newFilters;
      });
    };

    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events, router.query]);

  const title = formatString(slug);

  return (
    <>
      <PageHead
        pageTitle={`${title} - ${t("pages.featureSection.titleSuffix")}`}
      />

      <div className="min-h-screen">
        <MyBreadcrumbs
          breadcrumbs={[
            {
              href: "/feature-sections",
              label: t("pageTitle.feature-sections"),
            },
            { href: `/feature-sections/${sectionSlug}`, label: title },
          ]}
        />

        <button
          id="refetch-section-products"
          className="hidden"
          onClick={() => {
            refetch();
          }}
        />

        <PageHeader
          title={title || t("pages.featureSection.defaultTitle")}
          subtitle={t("pages.featureSection.subtitle")}
          highlightText={
            total ? ` ${total} ${t("pages.featureSection.products")}` : title
          }
        />

        <div className="flex w-full gap-2 flex-col md:flex-row">
          <div className="flex-none h-full">
            <ProductFilter
              selectedFilters={selectedFilters}
              setSelectedFilters={setSelectedFilters}
              onApplyFilters={onApplyFilters}
              totalProducts={total}
              sidebarType="featured_section"
              sidebarValue={slug}
              searchComponent={true}
            />
          </div>

          <div className="flex-1">
            <InfiniteScroll
              hasMore={hasMore}
              isLoading={isLoadingMore}
              onLoadMore={loadMore}
            >
              <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {isLoading
                  ? Array.from({ length: PER_PAGE }).map((_, i) => (
                      <ProductCardSkeleton key={i} />
                    ))
                  : products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
              </div>

              {isLoadingMore && (
                <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 mt-6">
                  {Array.from({ length: PER_PAGE }).map((_, i) => (
                    <ProductCardSkeleton key={`loading-${i}`} />
                  ))}
                </div>
              )}

              {products.length > 0 ? (
                <InfiniteScrollStatus
                  entityType="product"
                  total={total}
                  hasMore={hasMore}
                />
              ) : (
                <NoProductsFound
                  icon={ShoppingCart}
                  title={t("no_products_found")}
                  description={t("no_products_available")}
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
        </div>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps | undefined = isSSR()
  ? async (context) => {
      try {
        const { slug } = context.params || {};
        await loadTranslations(context);
        const access_token = (await getAccessTokenFromContext(context)) || "";
        const { lat = "", lng = "" } =
          (await getUserLocationFromContext(context)) || {};

        if (!slug || Array.isArray(slug)) {
          return { notFound: true };
        }

        // Parse initial filters from query parameters
        const initialFilters = parseFiltersFromQuery(context.query);

        const apiParams: Record<string, any> = {
          page: 1,
          per_page: PER_PAGE,
          slug,
          access_token,
          latitude: lat,
          longitude: lng,
        };

        if (initialFilters.categories.length > 0) {
          apiParams.categories = initialFilters.categories.join(",");
        }
        if (initialFilters.brands.length > 0) {
          apiParams.brands = initialFilters.brands.join(",");
        }
        if (initialFilters.attribute_values.length > 0) {
          apiParams.attribute_values =
            initialFilters.attribute_values.join(",");
        }
        if (initialFilters.sort && initialFilters.sort !== "relevance") {
          apiParams.sort = initialFilters.sort;
        }
        if (initialFilters.search) {
          apiParams.search = initialFilters.search;
        }

        const products = await getSectionBySlug(apiParams);
        const settings = await getSettings();

        return {
          props: {
            initialProducts: products,
            initialSettings: settings.data ?? null,
            sectionSlug: slug,
            initialFilters,
          },
        };
      } catch (err) {
        console.error("Error in getServerSideProps:", err);
        return {
          props: {
            initialProducts: null,
            initialSettings: null,
            sectionSlug: "",
            error:
              err instanceof Error
                ? err.message
                : "An error occurred during SSR",
          },
        };
      }
    }
  : undefined;

export default FeatureSectionPage;
