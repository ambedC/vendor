import { GetServerSideProps } from "next";
import { getProducts, getSettings, getCategories } from "@/routes/api";
import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
} from "react";
import { isSSR } from "@/helpers/getters";
import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import PageHeader from "@/components/custom/PageHeader";
import ProductCard from "@/components/Cards/ProductCard";
import ProductCardSkeleton from "@/components/Skeletons/ProductCardSkeleton";
import InfiniteScroll from "@/components/Functional/InfiniteScroll";
import SubcategoryTabs from "@/components/Functional/SubcategoryTabs";
import { useInfiniteData } from "@/hooks/useInfiniteData";
import { Product, PaginatedResponse } from "@/types/ApiResponse";
import { NextPageWithLayout } from "@/types";
import { getAccessTokenFromContext } from "@/helpers/auth";
import InfiniteScrollStatus from "@/components/Functional/InfiniteScrollStatus";
import { useRouter } from "next/router";
import { getUserLocationFromContext } from "@/helpers/functionalHelpers";
import NoProductsFound from "@/components/NoProductsFound";
import { ArrowRight, Package } from "lucide-react";
import { loadTranslations } from "../../../../i18n";
import { formatString } from "@/helpers/validator";
import { useTranslation } from "react-i18next";
import { Button } from "@heroui/react";
import ProductFilter, {
  SelectedFilters,
  SortOption,
} from "@/components/Products/ProductFilter";
import DynamicSEO from "@/SEO/DynamicSEO";
import {
  generateCollectionMeta,
  generateCollectionSchema,
  generateBreadcrumbSchema,
} from "@/helpers/seo";
import { Category } from "@/types/ApiResponse";

interface CategoryProductsPageProps {
  initialProducts: PaginatedResponse<Product[]> | null;
  initialFilters?: SelectedFilters;
  error?: string;
  categorySlug: string;
  initialCategory: Category | null;
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
  if (filters.search && filters.search.trim() !== "") {
    params.search = filters.search.trim();
  }

  return params;
};

const CategoryProductsPage: NextPageWithLayout<CategoryProductsPageProps> = ({
  initialProducts,
  initialFilters,
  categorySlug,
  initialCategory,
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const slug = categorySlug || (router.query.slug as string);
  const selectedSubcategory = (router.query.subcategory as string) || "";

  // Initialize filters from initial props or router
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

  const {
    data: products,
    isLoading,
    isLoadingMore,
    hasMore,
    total,
    loadMore,
    refetch,
  } = useInfiniteData<Product>({
    fetcher: (params) =>
      getProducts({
        ...params,
        categories: selectedSubcategory || slug,
        include_child_categories: 1,
      }),
    perPage: PER_PAGE,
    initialData: initialProducts?.data?.data || [],
    initialTotal: initialProducts?.data?.total || 0,
    passLocation: true,
    dataKey: `/categories/${slug}${selectedSubcategory ? `/${selectedSubcategory}` : ""}`,
    extraParams: {
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
    },
  });

  const updateURL = useCallback(
    async (filters: SelectedFilters) => {
      const queryParams = filtersToQueryParams(filters);

      const filteredParams = Object.fromEntries(
        Object.entries(queryParams).filter(
          ([key, value]) => value && key !== "categories", // Categories are handled by subcategory param/tabs
        ),
      );

      const isFilterCleared =
        filters.brands.length === 0 &&
        filters.colors.length === 0 &&
        filters.attribute_values.length === 0 &&
        filters.sort === "relevance" &&
        (!filters.search || filters.search.trim() === "");

      // Preserve dynamic route params and subcategory
      const preservedQuery = { ...router.query };
      // Remove all filter keys before adding new ones
      [
        "brands",
        "colors",
        "sort",
        "search",
        "attribute_values",
        "categories",
      ].forEach((key) => delete preservedQuery[key]);

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

  const clearedFilters: SelectedFilters = {
    categories: [],
    brands: [],
    colors: [],
    attribute_values: [],
    sort: "relevance",
    search: "",
  };

  const handleSubcategorySelect = async (subSlug: string) => {
    // Reset all filters when switching subcategory
    setSelectedFilters(clearedFilters);
    // Only keep the slug dynamic param, drop all filter query params
    const nextQuery: Record<string, string> = {
      slug: router.query.slug as string,
      subcategory: subSlug,
    };
    await router.push(
      {
        pathname: router.pathname,
        query: nextQuery,
      },
      undefined,
      {
        shallow: true,
        scroll: false,
      },
    );
  };

  const handleClearSubcategory = async () => {
    // Reset all filters when going back to "All Products"
    setSelectedFilters(clearedFilters);
    const nextQuery: Record<string, string> = {
      slug: router.query.slug as string,
    };
    await router.push(
      {
        pathname: router.pathname,
        query: nextQuery,
      },
      undefined,
      {
        shallow: true,
        scroll: false,
      },
    );
  };

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

  const seoMeta = generateCollectionMeta(
    initialCategory?.title || formatString(slug || ""),
    initialCategory?.description || t("pages.categoryProducts.subtitle", { category: formatString(slug) }),
    initialCategory?.image,
    initialCategory?.metadata,
    initialProducts?.data?.keywords
  );

  const collectionSchema = generateCollectionSchema(
    seoMeta.title,
    seoMeta.description,
    `/categories/${slug}`
  );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t("home_title"), url: "/" },
    { name: t("pageTitle.categories"), url: "/categories" },
    { name: seoMeta.title, url: `/categories/${slug}` },
  ]);

  return (
    <>
      <DynamicSEO
        title={seoMeta.title}
        description={seoMeta.description}
        keywords={seoMeta.keywords}
        canonical={`/categories/${slug}`}
        ogImage={seoMeta.image}
        jsonLd={[collectionSchema, breadcrumbSchema]}
      />

      <div className="min-h-screen">
        <MyBreadcrumbs
          breadcrumbs={[
            { href: "/categories", label: t("pageTitle.categories") },
            {
              href: `/categories/${slug}`,
              label: formatString(slug),
            },
          ]}
        />

        <PageHeader
          title={t("pages.categoryProducts.title", {
            category: formatString(
              selectedSubcategory || slug || t("home.categories.title"),
            ),
          })}
          subtitle={t("pages.categoryProducts.subtitle", {
            category: formatString(selectedSubcategory || slug),
          })}
          highlightText={
            total ? `${total} ${t("pages.categoryProducts.highlight")}` : ""
          }
        />

        <button
          id="category-products-refetch"
          onClick={refetch}
          className="hidden"
        />

        {/* Subcategory Tabs at the top */}
        <SubcategoryTabs
          parentSlug={slug}
          selectedSubcategory={selectedSubcategory}
          onSelect={handleSubcategorySelect}
          onClear={handleClearSubcategory}
          className="mb-4"
        />

        <div className="w-full mt-4">
          <div className="flex gap-2 flex-col md:flex-row">
            <div className="flex-none h-full">
              <ProductFilter
                key={selectedSubcategory || "all"}
                selectedFilters={selectedFilters}
                setSelectedFilters={setSelectedFilters}
                onApplyFilters={onApplyFilters}
                totalProducts={total}
                sidebarType="category"
                sidebarValue={selectedSubcategory || slug}
                searchComponent={true}
                hideCategoryFilter={true} // Hidden because subcategories are in tabs at the top
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
                        <ProductCard key={product.id} product={product} />
                      ))}
                </div>

                {isLoadingMore && (
                  <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 mt-6">
                    {Array.from({ length: PER_PAGE }).map((_, i) => (
                      <ProductCardSkeleton key={`loading-${i}`} />
                    ))}
                  </div>
                )}

                {products.length > 0 ? (
                  <InfiniteScrollStatus
                    entityType={t("pages.categoryProducts.infiniteScroll")}
                    total={total}
                    hasMore={hasMore}
                  />
                ) : (
                  <NoProductsFound
                    icon={Package}
                    title={t("pages.categoryProducts.noProducts.title")}
                    description={t(
                      "pages.categoryProducts.noProducts.description",
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
        await loadTranslations(context);
        const access_token = (await getAccessTokenFromContext(context)) || "";
        const { lat = "", lng = "" } =
          (await getUserLocationFromContext(context)) || {};

        if (!slug || Array.isArray(slug)) {
          return {
            notFound: true,
          };
        }

        const initialFilters = parseFiltersFromQuery(context.query);
        const rawSub = (context.query && context.query.subcategory) || "";
        const subcategory = Array.isArray(rawSub) ? rawSub[0] : rawSub;

        const apiParams: any = {
          page: 1,
          per_page: PER_PAGE,
          categories: subcategory || slug,
          access_token,
          latitude: lat,
          longitude: lng,
          include_child_categories: 1,
        };

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

        // Fetch category details for SEO
        const categoryRes = await getCategories({ slug });
        const initialCategory = categoryRes?.data?.data?.find(c => c.slug === slug) || null;

        return {
          props: {
            initialProducts: products,
            initialFilters,
            initialSettings: settings.data,
            categorySlug: slug,
            initialCategory,
          },
        };
      } catch (err) {
        console.error("Error in getServerSideProps:", err);
        return {
          props: {
            initialProducts: null,
            initialSettings: null,
            categorySlug: "",
            error:
              err instanceof Error
                ? err.message
                : "An error occurred during SSR",
          },
        };
      }
    }
  : undefined;

export default CategoryProductsPage;
