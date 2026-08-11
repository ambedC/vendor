import { GetServerSideProps } from "next";
import { getProducts, getSettings } from "@/routes/api";
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/router";
import { isSSR } from "@/helpers/getters";
import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import PageHeader from "@/components/custom/PageHeader";
import ProductCard from "@/components/Cards/ProductCard";
import ProductCardSkeleton from "@/components/Skeletons/ProductCardSkeleton";
import ProductFilter from "@/components/Products/ProductFilter";
import InfiniteScroll from "@/components/Functional/InfiniteScroll";
import { useInfiniteData } from "@/hooks/useInfiniteData";
import { Product, PaginatedResponse } from "@/types/ApiResponse";
import { NextPageWithLayout } from "@/types";
import { getUserLocationFromContext } from "@/helpers/functionalHelpers";
import { getAccessTokenFromContext } from "@/helpers/auth";
import InfiniteScrollStatus from "@/components/Functional/InfiniteScrollStatus";
import NoProductsFound from "@/components/NoProductsFound";
import { ArrowRight, ShoppingCart, Search } from "lucide-react";
import PageHead from "@/SEO/PageHead";
import { useTranslation } from "react-i18next";
import { Button } from "@heroui/react";
import { loadTranslations } from "../../../../i18n";
import {
  SelectedFilters,
  SortOption,
} from "@/components/Products/ProductFilter";

interface ProductsPageProps {
  initialProducts: PaginatedResponse<Product[]> | null;
  initialFilters: SelectedFilters;
  query: string;
}

const PER_PAGE = 18;

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

  const parsedSearch = parseSingleParam(query.search);
  const parsedQ = parseSingleParam(query.q);

  return {
    categories: parseQueryParam(query.categories),
    brands: parseQueryParam(query.brands),
    colors: parseQueryParam(query.colors),
    attribute_values: parseQueryParam(query.attribute_values),
    sort: query.sort ? (query.sort as SortOption) : "relevance",
    search: parsedSearch || parsedQ,
  };
};

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
  if (filters.search && filters.search.trim() !== "") {
    params.search = filters.search.trim();
  }

  return params;
};

const SearchResultsPage: NextPageWithLayout<ProductsPageProps> = ({
  initialProducts,
  initialFilters,
  query,
}) => {
  const router = useRouter();
  const { t } = useTranslation();

  // Initialize filters from URL query params when SSR is false
  const computedInitialFilters = useMemo(() => {
    if (initialFilters) {
      return initialFilters;
    }
    // When SSR is false, parse filters from router query
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

  const { q } = router.query;
  const safeQuery = query || (typeof q === "string" ? q : "");

  // Determine the effective search term:
  // - If filters specify a non-empty search, use that
  // - Otherwise, fall back to the base query coming from the route (`safeQuery`)
  const effectiveSearch = useMemo(() => {
    const filterSearch = selectedFilters?.search;
    const hasExplicitSearch =
      typeof filterSearch === "string" && filterSearch.trim() !== "";

    if (hasExplicitSearch) {
      return filterSearch.trim();
    }

    return (safeQuery || "").trim();
  }, [selectedFilters?.search, safeQuery]);

  const {
    data: products,
    isLoading,
    isLoadingMore,
    hasMore,
    total,
    loadMore,
  } = useInfiniteData<Product>({
    fetcher: getProducts,
    dataKey: `/productsSearch:${safeQuery}`,
    perPage: PER_PAGE,
    initialData: initialProducts?.data?.data || [],
    initialTotal: initialProducts?.data?.total || 0,
    passLocation: true,
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
      search: effectiveSearch || undefined,
      include_child_categories: 0,
    },
  });

  const updateURL = useCallback(
    async (filters: SelectedFilters) => {
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

      // Preserve the search query 'q' from the route but filter out other filter params
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
    [router],
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

  // Sync filters when URL changes (including back/forward)
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      // Ignore URL sync for internal shallow pushes; local state is already current.
      if (isInternalRouteUpdate.current) return;

      const [, queryString = ""] = url.split("?");
      const params = new URLSearchParams(queryString);

      const parseParam = (key: string): string[] => {
        const value = params.get(key);
        return value ? value.split(",").filter(Boolean) : [];
      };

      const newFilters: SelectedFilters = {
        categories: parseParam("categories"),
        brands: parseParam("brands"),
        colors: parseParam("colors"),
        attribute_values: parseParam("attribute_values"),
        sort: (params.get("sort") as SortOption) || "relevance",
        search: params.get("search") || params.get("q") || "",
      };

      setSelectedFilters((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(newFilters)) return prev;
        return newFilters;
      });
    };

    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);

  return (
    <>
      <PageHead pageTitle={t("pageTitle.search")} />

      <div className="min-h-screen">
        <MyBreadcrumbs
          breadcrumbs={[
            {
              href: `/products/search?q=${encodeURIComponent(safeQuery)}`,
              label: `${t("search_results")} (${safeQuery})`,
            },
          ]}
        />

        <PageHeader
          title={`${t("search_results")} : "${safeQuery}"`}
          subtitle={t("search_placeholder")}
          highlightText={total ? ` ${total} Products` : ""}
        />

        <div className="flex w-full gap-2 flex-col md:flex-row">
          <div className="flex-none h-full">
            <ProductFilter
              selectedFilters={selectedFilters}
              setSelectedFilters={setSelectedFilters}
              onApplyFilters={onApplyFilters}
              totalProducts={total}
              sidebarType="search"
              sidebarValue={safeQuery}
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
                {isLoading && products.length === 0
                  ? Array.from({ length: PER_PAGE }).map((_, i) => (
                      <ProductCardSkeleton key={i} />
                    ))
                  : products.map((product, index) => (
                      <ProductCard
                        key={`${product.id}-${index}`}
                        product={product}
                      />
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
                !isLoading && (
                  <NoProductsFound
                    icon={safeQuery.trim().length === 1 ? Search : ShoppingCart}
                    title={
                      safeQuery.trim().length === 1
                        ? t("type_at_least_2_chars")
                        : t("no_products_found")
                    }
                    description={
                      safeQuery.trim().length === 1
                        ? t("enter_min_2_chars")
                        : t("no_products_found_message", { safeQuery })
                    }
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
                )
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
        const { lat = "", lng = "" } =
          (await getUserLocationFromContext(context)) || {};
        const access_token = (await getAccessTokenFromContext(context)) || "";
        await loadTranslations(context);

        const q = Array.isArray(context.query.q)
          ? context.query.q[0]
          : (context.query.q as string) || "";

        const initialFilters = parseFiltersFromQuery(context.query);

        const apiParams: Record<string, any> = {
          page: 1,
          per_page: PER_PAGE,
          latitude: lat,
          longitude: lng,
          access_token,
          search: q,
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

        const products = await getProducts(apiParams);
        const settings = await getSettings();

        return {
          props: {
            initialProducts: products,
            initialFilters,
            initialSettings: settings.data,
            query: q,
          },
        };
      } catch (err) {
        console.error("Error in getServerSideProps (search):", err);
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
            error:
              err instanceof Error
                ? err.message
                : "An error occurred during SSR",
            query: Array.isArray(context.query.q)
              ? context.query.q[0]
              : (context.query.q as string) || "",
          },
        };
      }
    }
  : undefined;

export default SearchResultsPage;
