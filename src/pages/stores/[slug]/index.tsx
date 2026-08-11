import { GetServerSideProps } from "next";
import { getProducts, getSettings, getSpecificStore } from "@/routes/api";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { isSSR } from "@/helpers/getters";
import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import PageHeader from "@/components/custom/PageHeader";
import ProductCard from "@/components/Cards/ProductCard";
import ProductCardSkeleton from "@/components/Skeletons/ProductCardSkeleton";
import StoreProfileSkeleton from "@/components/Skeletons/StoreProfileSkeleton";
import InfiniteScroll from "@/components/Functional/InfiniteScroll";
import { useInfiniteData } from "@/hooks/useInfiniteData";
import ProductFilter from "@/components/Products/ProductFilter";
import { Product, PaginatedResponse, Store } from "@/types/ApiResponse";
import { NextPageWithLayout } from "@/types";
import { getAccessTokenFromContext } from "@/helpers/auth";
import InfiniteScrollStatus from "@/components/Functional/InfiniteScrollStatus";
import { useRouter } from "next/router";
import { formatString } from "@/helpers/validator";
import NoProductsFound from "@/components/NoProductsFound";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { loadTranslations } from "../../../../i18n";
import DynamicSEO from "@/SEO/DynamicSEO";
import {
  generateStoreSchema,
  generateBreadcrumbSchema,
  generateStoreMeta,
} from "@/helpers/seo";
import { useTranslation } from "react-i18next";
import { Button } from "@heroui/react";
import { getUserLocationFromContext } from "@/helpers/functionalHelpers";
import StoreProfile from "@/components/StoreProfile";
import useSWR from "swr";
import { trackStoreView } from "@/lib/analytics";
import {
  SelectedFilters,
  SortOption,
} from "@/components/Products/ProductFilter";
import { useSettings } from "@/contexts/SettingsContext";

interface StoreProductsPageProps {
  initialProducts: PaginatedResponse<Product[]> | null;
  initialFilters?: SelectedFilters;
  error?: string;
  storeSlug: string;
  initialStore: Store | null;
}

const PER_PAGE = 24;

// Helper function to parse query parameters into filters
const parseFiltersFromQuery = (query: {
  [key: string]: string | string[] | undefined;
}): SelectedFilters => {
  const parseQueryParam = (param: string | string[] | undefined): string[] => {
    if (!param) return [];
    if (Array.isArray(param)) return param;
    return param.split(",");
  };

  const parseSingleParam = (param: string | string[] | undefined): string => {
    if (!param) return "";
    if (Array.isArray(param)) return param[0] || "";
    return param;
  };

  return {
    categories: parseQueryParam(query.categories),
    brands: parseQueryParam(query.brands),
    colors: parseQueryParam(query.colors),
    attribute_values: parseQueryParam(query.attribute_values),
    sort: query.sort ? (query.sort as SortOption) : "relevance",
    search: parseSingleParam(query.search),
  };
};

// Helper function to convert filters to query parameters
const filtersToQueryParams = (
  filters: SelectedFilters,
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
  // Include search as a query param (single string)
  if (filters.search && filters.search.trim() !== "") {
    params.search = filters.search.trim();
  }

  return params;
};

const StoreProductsPage: NextPageWithLayout<StoreProductsPageProps> = ({
  initialProducts,
  initialFilters,
  storeSlug,
  initialStore,
}) => {
  const router = useRouter();
  const { t } = useTranslation();
  const { isSingleVendor } = useSettings();
  const slug = storeSlug || (router.query.slug as string);

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

  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>(
    computedInitialFilters,
  );
  const isInternalRouteUpdate = useRef(false);

  // Use SWR for client-side store fetching when SSR is false
  const { data: storeData, isLoading: isStoreLoading } = useSWR<
    Store | undefined
  >(
    `/stores/${slug}`,
    async () => {
      if (!slug) {
        console.error("Slug is required");
        return undefined;
      }
      const res = await getSpecificStore(slug);
      if (!res.data) {
        console.error("Store data not found");
        return undefined;
      }
      return res.data; // return only the store
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateOnMount: !isSSR(),
    },
  );

  // Determine which store data to use
  const store = initialStore || storeData;

  // Track store view analytics
  useEffect(() => {
    if (store) {
      trackStoreView(store.slug, store.name);
    }
  }, [store]);

  const {
    data: products,
    isLoading,
    isLoadingMore,
    hasMore,
    total,
    loadMore,
    refetch,
  } = useInfiniteData<Product>({
    fetcher: (params) => getProducts({ ...params, store: slug }),
    perPage: PER_PAGE,
    initialData: initialProducts?.data?.data || [],
    initialTotal: initialProducts?.data?.total || 0,
    passLocation: true,
    dataKey: `/stores/${slug}`,
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
      search:
        typeof selectedFilters?.search === "string" &&
        selectedFilters.search.trim() !== ""
          ? selectedFilters.search.trim()
          : undefined,
      include_child_categories: 0,
    },
  });

  // Update URL when filters change
  const updateURL = useCallback(
    async (filters: SelectedFilters) => {
      const queryParams = filtersToQueryParams(filters);

      const filteredParams = Object.fromEntries(
        Object.entries(queryParams).filter(([, value]) => value),
      );

      // Check if all filters are empty (clear all case)
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
    async (filters: SelectedFilters) => {
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

  // Listen for browser back/forward navigation
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

  useEffect(() => {
    if (isSingleVendor) {
      router.replace("/");
    }
  }, [isSingleVendor, router]);

  // Don't render any content if single vendor – avoids flash before redirect
  if (isSingleVendor) return null;

  // Generate SEO data for store
  const storeMeta = store ? generateStoreMeta(store, initialProducts?.data?.keywords) : null;
  const storeSchema = store ? generateStoreSchema(store) : null;
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t("home_title"), url: "/" },
    { name: t("pages.storeProductsPage.breadcrumbs.stores"), url: "/stores" },
    { name: storeMeta?.title || store?.name || formatString(slug), url: `/stores/${slug}` },
  ]);

  return (
    <>
      {store ? (
        <DynamicSEO
          title={storeMeta?.title || store.name}
          description={storeMeta?.description}
          keywords={storeMeta?.keywords}
          canonical={`/stores/${slug}`}
          ogType="website"
          ogTitle={storeMeta?.title || store.name}
          ogDescription={storeMeta?.description}
          ogImage={store.logo}
          ogImageAlt={store.name}
          jsonLd={[storeSchema, breadcrumbSchema].filter(Boolean)}
        />
      ) : (
        <DynamicSEO
          title={t("pageTitle.store-products")}
          description={t("pages.storeProductsPage.subtitle")}
          canonical={`/stores/${slug}`}
        />
      )}

      <div className="min-h-screen">
        <MyBreadcrumbs
          breadcrumbs={[
            {
              href: "/stores",
              label: t("pages.storeProductsPage.breadcrumbs.stores"),
            },
            { href: `/stores/${slug}`, label: formatString(slug) },
          ]}
        />

        <button
          id="refetch-store-products"
          className="hidden"
          onClick={() => {
            refetch();
          }}
        />

        <PageHeader
          title={t("pages.storeProductsPage.title")}
          subtitle={t("pages.storeProductsPage.subtitle")}
          highlightText={
            total
              ? t("pages.storeProductsPage.highlight", { count: total })
              : ""
          }
        />
        <div className="flex flex-col justify-center items-center gap-8">
          {/* Show skeleton while loading store on client-side */}
          {isStoreLoading && !store ? (
            <StoreProfileSkeleton />
          ) : store ? (
            <StoreProfile store={store} />
          ) : null}

          <div className="flex w-full gap-2 flex-col md:flex-row">
            <div className="flex-none h-full">
              <ProductFilter
                selectedFilters={selectedFilters}
                setSelectedFilters={setSelectedFilters}
                onApplyFilters={onApplyFilters}
                totalProducts={total}
                searchComponent={true}
                sidebarType="store"
                sidebarValue={slug}
              />
            </div>

            <div className="flex-1">
              <InfiniteScroll
                hasMore={hasMore}
                isLoading={isLoadingMore}
                onLoadMore={loadMore}
              >
                <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                  {isLoading && products.length === 0
                    ? Array.from({ length: PER_PAGE }).map((_, i) => (
                        <ProductCardSkeleton key={i} />
                      ))
                    : products.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          hideStoreName={true}
                        />
                      ))}
                </div>

                {isLoadingMore && (
                  <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 mt-6">
                    {Array.from({ length: PER_PAGE }).map((_, i) => (
                      <ProductCardSkeleton key={`loading-${i}`} />
                    ))}
                  </div>
                )}

                {products.length > 0 && !isLoading ? (
                  <InfiniteScrollStatus
                    entityType="product"
                    total={total}
                    hasMore={hasMore}
                  />
                ) : (
                  <NoProductsFound
                    icon={ShoppingCart}
                    title={t("pages.storeProductsPage.noProducts.title")}
                    description={t(
                      "pages.storeProductsPage.noProducts.description",
                    )}
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
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps | undefined = isSSR()
  ? async (context) => {
      try {
        const { slug } = context.params || {};
        const access_token = (await getAccessTokenFromContext(context)) || "";
        const { lat = "", lng = "" } =
          (await getUserLocationFromContext(context)) || {};
        await loadTranslations(context);

        if (!slug || Array.isArray(slug)) {
          return {
            notFound: true,
          };
        }

        // Parse initial filters from query parameters
        const initialFilters = parseFiltersFromQuery(context.query);

        // Build API parameters with filters
        const apiParams: any = {
          page: 1,
          per_page: PER_PAGE,
          store: slug,
          latitude: lat,
          longitude: lng,
          access_token,
          include_child_categories: 0,
        };

        if (initialFilters.categories.length > 0) {
          apiParams.categories = initialFilters.categories.join(",");
        }
        if (initialFilters.brands.length > 0) {
          apiParams.brands = initialFilters.brands.join(",");
        }
        if (initialFilters.colors.length > 0) {
          apiParams.colors = initialFilters.colors.join(",");
        }
        if (initialFilters.attribute_values.length > 0) {
          apiParams.attribute_values =
            initialFilters.attribute_values.join(",");
        }
        if (initialFilters.sort) {
          apiParams.sort = initialFilters.sort;
        }
        if (initialFilters.search) {
          apiParams.search = initialFilters.search;
        }

        const products = await getProducts(apiParams);
        const settings = await getSettings();
        const store = await getSpecificStore(slug);

        // Server-side redirect for single vendor mode
        const systemSettings = settings?.data?.find(
          (s: { variable: string }) => s.variable === "system",
        )?.value as { systemVendorType?: string } | undefined;
        if (systemSettings?.systemVendorType === "single") {
          return { redirect: { destination: "/", permanent: false } };
        }

        return {
          props: {
            initialProducts: products,
            initialFilters,
            initialSettings: settings.data,
            storeSlug: slug,
            initialStore: store.data,
          },
        };
      } catch (err) {
        console.error("Error in getServerSideProps:", err);
        return {
          props: {
            initialProducts: null,
            initialFilters: {
              categories: [],
              brands: [],
              colors: [],
              attribute_values: [],
              sort: "relevance",
            },
            initialSettings: null,
            initialStore: null,
            storeSlug: "",
            error:
              err instanceof Error
                ? err.message
                : "An error occurred during SSR",
          },
        };
      }
    }
  : undefined;

export default StoreProductsPage;
