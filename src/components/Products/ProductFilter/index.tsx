import {
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  Select,
  SelectItem,
  Divider,
  useDisclosure,
  Input,
  ScrollShadow,
} from "@heroui/react";
import React, { FC, useCallback, useEffect, useRef, useState } from "react";
import BrandSection from "./BrandSection";
import CategorySection from "./CategorySection";
import {
  ListFilter,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Star,
  Search,
  ThumbsUp,
  Flame,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

import { getSidebarFilters } from "@/routes/api";
import { SidebarFilters } from "@/types/ApiResponse";
import { getCookie } from "@/lib/cookies";
import { UserLocation } from "@/components/Location/types/LocationAutoComplete.types";
import AttributeSection from "./AttributeSection";

export interface SelectedFilters {
  categories: string[];
  brands: string[];
  colors: string[];
  attribute_values: string[];
  sort: SortOption;
  search?: string;
}

export type SortOption =
  | "relevance"
  | "price_asc"
  | "price_desc"
  | "avg_rated"
  | "best_seller"
  | "featured";

interface ProductFilterProps {
  selectedFilters: SelectedFilters;
  setSelectedFilters: React.Dispatch<React.SetStateAction<SelectedFilters>>;
  onApplyFilters: (filters: SelectedFilters) => void;
  totalProducts?: number;
  searchComponent?: boolean;
  sidebarType?: string;
  sidebarValue?: string;
  hideBrandFilter?: boolean;
  hideCategoryFilter?: boolean;
}

const ProductFilter: FC<ProductFilterProps> = ({
  selectedFilters,
  onApplyFilters,
  totalProducts = 0,
  searchComponent = false,
  sidebarType,
  sidebarValue,
  hideBrandFilter = false,
  hideCategoryFilter = false,
}) => {
  const [searchInput, setSearchInput] = useState(selectedFilters?.search || "");
  const [pendingFilters, setPendingFilters] =
    useState<SelectedFilters>(selectedFilters);
  const debouncedSearch = useDebouncedValue(searchInput, 500);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { t } = useTranslation();

  const [sidebarData, setSidebarData] = useState<SidebarFilters | null>(null);
  const [isSidebarLoading, setIsSidebarLoading] = useState(false);

  const selectedFiltersRef = useRef(selectedFilters);
  const onApplyFiltersRef = useRef(onApplyFilters);
  const isFirstRender = useRef(true);
  const lastAppliedSearch = useRef(selectedFilters?.search || "");

  // Keep refs updated
  useEffect(() => {
    selectedFiltersRef.current = selectedFilters;
    onApplyFiltersRef.current = onApplyFilters;
  }, [selectedFilters, onApplyFilters]);

  // Sync pending filters when selectedFilters changes externally (e.g., route change, browser back)
  useEffect(() => {
    setPendingFilters(selectedFilters);
  }, [selectedFilters]);

  // Ref to track the last fetched key for sidebar filters
  const lastFetchedRef = useRef("");

  const fetchSidebarFilters = useCallback(
    async (filters: SelectedFilters) => {
      // Include sidebarValue so switching subcategory always triggers a fresh fetch
      const currentKey = `${sidebarValue || ""}-${filters.categories.join(",")}-${filters.brands.join(",")}-${filters.attribute_values.join(",")}`;
      if (lastFetchedRef.current === currentKey) return;
      lastFetchedRef.current = currentKey;

      setIsSidebarLoading(true);
      try {
        const { lat = "", lng = "" } =
          (getCookie("userLocation") as UserLocation) || {};
        const res = await getSidebarFilters({
          latitude: lat,
          longitude: lng,
          categories: filters.categories.join(","),
          brands: filters.brands.join(","),
          attribute_values: filters.attribute_values.join(","),
          ...(sidebarType ? { type: sidebarType } : {}),
          ...(sidebarValue ? { value: sidebarValue } : {}),
        });

        if (res.success && res.data) {
          setSidebarData(res.data);
        }
      } catch (error) {
        console.error("Error fetching sidebar filters:", error);
      } finally {
        setIsSidebarLoading(false);
      }
    },
    [sidebarType, sidebarValue],
  );

  // Fetch sidebar data when filters change
  useEffect(() => {
    fetchSidebarFilters(pendingFilters);
  }, [pendingFilters, fetchSidebarFilters]);

  // Prune pending filters if they become disabled in the new sidebar data
  useEffect(() => {
    if (!sidebarData) return;

    const newCategories = pendingFilters.categories.filter((slug) => {
      const cat = sidebarData.categories.find((c) => c.slug === slug);
      if (cat && cat.enabled === false) return false;
      return true;
    });

    const newBrands = pendingFilters.brands.filter((slug) => {
      const br = sidebarData.brands.find((b) => b.slug === slug);
      if (br && br.enabled === false) return false;
      return true;
    });

    const newAttrValues = pendingFilters.attribute_values.filter((id) => {
      const valId = Number(id);
      const attributeValue = sidebarData.attributes
        .flatMap((attr) => attr.values)
        .find((v) => v.id === valId);
      if (attributeValue && attributeValue.enabled === false) return false;
      return true;
    });

    const isChanged =
      newCategories.length !== pendingFilters.categories.length ||
      newBrands.length !== pendingFilters.brands.length ||
      newAttrValues.length !== pendingFilters.attribute_values.length;

    if (isChanged) {
      const prunedKey = `${newCategories.join(",")}-${newBrands.join(",")}-${newAttrValues.join(",")}`;
      lastFetchedRef.current = prunedKey;

      setPendingFilters((prev) => {
        // Double-check to avoid unnecessary state updates
        if (
          prev.categories.length === newCategories.length &&
          prev.brands.length === newBrands.length &&
          prev.attribute_values.length === newAttrValues.length
        ) {
          return prev;
        }
        return {
          ...prev,
          categories: newCategories,
          brands: newBrands,
          attribute_values: newAttrValues,
        };
      });
    }
  }, [
    sidebarData,
    pendingFilters.categories,
    pendingFilters.brands,
    pendingFilters.attribute_values,
  ]);

  const handleSearch = useCallback((value: string) => {
    const updatedFilters = { ...selectedFiltersRef.current, search: value };
    lastAppliedSearch.current = value;
    onApplyFiltersRef.current(updatedFilters);
  }, []);

  // Handle debounced search changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const trimmedSearch = debouncedSearch.trim();

    // Only trigger if the debounced search is different from what was last applied
    if (trimmedSearch !== lastAppliedSearch.current) {
      handleSearch(trimmedSearch);
    }
  }, [debouncedSearch, handleSearch]);

  // Sync searchInput when selectedFilters.search changes externally (e.g., browser back/forward)
  useEffect(() => {
    const externalSearch = selectedFilters?.search || "";

    // Only update if it's different from current input AND different from what we last applied
    // This prevents the circular update issue
    if (
      externalSearch !== searchInput &&
      externalSearch === lastAppliedSearch.current
    ) {
      setTimeout(() => {
        setSearchInput(externalSearch);
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilters?.search]);

  const sortOptions = [
    {
      key: "relevance",
      label: t("productFilter.sort.relevance"),
      icon: Star,
    },
    {
      key: "price_asc",
      label: t("productFilter.sort.priceLowToHigh"),
      icon: TrendingUp,
    },
    {
      key: "price_desc",
      label: t("productFilter.sort.priceHighToLow"),
      icon: TrendingDown,
    },
    {
      key: "avg_rated",
      label: t("productFilter.sort.highestRated"),
      icon: ThumbsUp,
    },
    {
      key: "best_seller",
      label: t("productFilter.sort.bestSeller"),
      icon: Flame,
    },
    {
      key: "featured",
      label: t("productFilter.sort.featured"),
      icon: Sparkles,
    },
  ];

  const getActiveFiltersCount = () => {
    const categoriesCount = pendingFilters?.categories?.length || 0;
    const brandsCount = pendingFilters?.brands?.length || 0;
    const colorsCount = pendingFilters?.colors?.length || 0;
    const attributesCount = pendingFilters?.attribute_values?.length || 0;

    return categoriesCount + brandsCount + colorsCount + attributesCount;
  };

  const clearAllFilters = () => {
    const newFilters: SelectedFilters = {
      categories: [],
      brands: [],
      colors: [],
      attribute_values: [],
      sort: "relevance",
      search: "",
    };
    setSearchInput("");
    lastAppliedSearch.current = "";
    setPendingFilters(newFilters);
    onApplyFilters(newFilters);
  };

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="md:hidden flex items-start w-full justify-between gap-2 mb-4">
        <Badge
          color="primary"
          content={getActiveFiltersCount() || undefined}
          classNames={{ badge: "text-xs min-w-4 h-4" }}
        >
          <Button
            size="sm"
            variant="bordered"
            color="default"
            startContent={<ListFilter className="w-4 h-4" />}
            className="text-xs"
            onPress={onOpen}
          >
            {t("productFilter.filters")}
          </Button>
        </Badge>

        <div className="flex-1 flex flex-col justify-center">
          <Input
            size="sm"
            placeholder={t("search") || "Search products..."}
            value={searchInput}
            onValueChange={setSearchInput}
            startContent={<Search className="w-4 h-4 text-default-400" />}
            classNames={{
              input: "text-sm",
              inputWrapper: "h-9",
            }}
          />
        </div>

        {/* Mobile Sort Dropdown */}
        <Select
          aria-label="select-sort-mobile"
          size="sm"
          placeholder={t("productFilter.sortBy")}
          selectedKeys={[selectedFilters.sort]}
          onSelectionChange={(keys) => {
            const newSort = Array.from(keys)[0] as SortOption;
            if (newSort) {
              const updatedFilters = { ...selectedFiltersRef.current, sort: newSort };
              onApplyFilters(updatedFilters);
            }
          }}
          className="max-w-44"
          startContent={<ArrowUpDown className="w-4 h-4" />}
          classNames={{
            trigger: "h-8 min-h-unit-8",
            value: "text-xs",
          }}
        >
          {sortOptions.map((option) => (
            <SelectItem
              key={option.key}
              startContent={<option.icon className="w-4 h-4" />}
              textValue={option.label}
            >
              {option.label}
            </SelectItem>
          ))}
        </Select>
      </div>

      {/* Mobile Drawer */}
      <Drawer placement="left" isOpen={isOpen} onClose={onClose}>
        <DrawerContent className="w-80">
          <DrawerHeader className="border-b p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <h3 className="text-lg font-semibold">
                {t("productFilter.filtersAndSort")}
              </h3>
              <p className="text-xs text-default-500">
                {t("productFilter.productsCount", { count: totalProducts })}
              </p>
            </div>
          </DrawerHeader>

          <DrawerBody className="p-4 flex flex-col gap-4">
            {/* Filter Sections */}
            <div className="flex flex-col gap-4">
              {!hideCategoryFilter && (
                <section id="product-filter-category-section">
                  <CategorySection
                    categories={sidebarData?.categories || []}
                    isLoading={isSidebarLoading}
                    selectedFilters={pendingFilters}
                    setSelectedFilters={setPendingFilters}
                  />
                </section>
              )}

              {!hideBrandFilter && (
                <section id="product-filter-brand-section">
                  <BrandSection
                    brands={sidebarData?.brands || []}
                    isLoading={isSidebarLoading}
                    selectedFilters={pendingFilters}
                    setSelectedFilters={setPendingFilters}
                  />
                </section>
              )}

              <section id="product-filter-attribute-section">
                <AttributeSection
                  attributes={sidebarData?.attributes || []}
                  selectedFilters={pendingFilters}
                  setSelectedFilters={setPendingFilters}
                />
              </section>
            </div>
          </DrawerBody>

          <DrawerFooter className="border-t p-4 flex gap-2">
            <Button
              className="flex-1 text-xs"
              color="secondary"
              variant="bordered"
              onPress={() => {
                clearAllFilters();
                onClose();
              }}
            >
              {t("productFilter.clearAll")}
            </Button>
            <Button
              className="flex-1 text-xs"
              color="primary"
              onPress={() => {
                onApplyFilters(pendingFilters);
                onClose();
              }}
            >
              {t("productFilter.applyFilters")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Desktop Filter Panel */}
      <div className="w-64 min-w-64 hidden md:block">
        <Card shadow="sm" classNames={{ body: "px-3 py-2" }}>
          <CardHeader className="pb-2">
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListFilter className="w-4 h-4" />
                <h3 className="text-base font-semibold">
                  {t("productFilter.filters")}
                </h3>
              </div>
            </div>
          </CardHeader>

          <CardBody className="flex flex-col gap-4 border-t-2 border-gray-100 dark:border-default-100  pt-4">
            {/* Sort Section */}
            <div className="space-y-2">
              {searchComponent && (
                <Input
                  size="sm"
                  placeholder={t("search") || "Search products..."}
                  value={searchInput}
                  onValueChange={setSearchInput}
                  startContent={<Search className="w-4 h-4 text-default-400" />}
                  classNames={{
                    input: "text-sm",
                    inputWrapper: "h-9",
                  }}
                  className="mb-3"
                />
              )}

              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4" />
                <h4 className="text-sm font-medium">
                  {t("productFilter.sortBy")}
                </h4>
              </div>

              <Select
                aria-label="select-sort"
                size="sm"
                selectedKeys={[selectedFilters.sort]}
                onSelectionChange={(keys) => {
                  const newSort = Array.from(keys)[0] as SortOption;
                  if (newSort) {
                    const updatedFilters = { ...selectedFiltersRef.current, sort: newSort };
                    onApplyFilters(updatedFilters);
                  }
                }}
                className="w-full"
                classNames={{ trigger: "h-8 min-h-unit-8" }}
              >
                {sortOptions.map((option) => (
                  <SelectItem
                    key={option.key}
                    startContent={<option.icon className="w-4 h-4" />}
                    textValue={option.label}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <Divider />

            {/* Filter Sections */}
            <ScrollShadow className="flex flex-col gap-4 overflow-y-auto max-h-96">
              {!hideCategoryFilter && (
                <section id="product-filter-category-section">
                  <CategorySection
                    categories={sidebarData?.categories || []}
                    isLoading={isSidebarLoading}
                    selectedFilters={pendingFilters}
                    setSelectedFilters={setPendingFilters}
                  />
                </section>
              )}

              {!hideBrandFilter && (
                <section id="product-filter-brand-section">
                  <BrandSection
                    brands={sidebarData?.brands || []}
                    isLoading={isSidebarLoading}
                    selectedFilters={pendingFilters}
                    setSelectedFilters={setPendingFilters}
                  />
                </section>
              )}

              <section id="product-filter-attribute-section">
                <AttributeSection
                  attributes={sidebarData?.attributes || []}
                  selectedFilters={pendingFilters}
                  setSelectedFilters={setPendingFilters}
                />
              </section>
            </ScrollShadow>
          </CardBody>

          <CardFooter className="flex gap-2 pt-2">
            <Button
              className="flex-1 text-xs"
              color="secondary"
              variant="bordered"
              size="sm"
              onPress={clearAllFilters}
              isDisabled={getActiveFiltersCount() === 0}
            >
              {t("productFilter.clearAll")}
            </Button>
            <Button
              className="flex-1 text-xs"
              color="primary"
              size="sm"
              onPress={() => onApplyFilters(pendingFilters)}
            >
              {t("productFilter.applyFilters")}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  );
};

export default ProductFilter;
