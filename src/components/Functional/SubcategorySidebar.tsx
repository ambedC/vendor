import React from "react";
import { getCategories } from "@/routes/api";
import { useInfiniteData } from "@/hooks/useInfiniteData";
import { Category } from "@/types/ApiResponse";
import { Button, Image, ScrollShadow } from "@heroui/react";
import { Grid3X3 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
  parentSlug: string;
  selectedSubcategory?: string;
  onSelect?: (slug: string) => void;
  onClear?: () => void;
  className?: string;
}

const PER_PAGE = 12;

const SubcategorySidebar: React.FC<Props> = ({
  parentSlug,
  selectedSubcategory = "",
  onSelect,
  onClear,
  className = "",
}) => {
  const { t } = useTranslation();

  const {
    data: subcategories = [],
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
  } = useInfiniteData<Category>({
    fetcher: getCategories,
    perPage: PER_PAGE,
    extraParams: { slug: parentSlug, scope_category_slug: parentSlug },
    passLocation: true,
    dataKey: `subcategories-${parentSlug}`,
    forceFetchOnMount: true,
  });

  const handleClick = (slug: string) => {
    onSelect?.(slug);
  };

  const handleClear = () => {
    onClear?.();
  };
  return (
    <aside
      className={`hidden md:block w-72 sticky top-24 h-[75vh] overflow-hidden ${className}`}
      aria-label={t("subcategories")}
    >
      <div className="rounded-lg shadow-sm border border-gray-100 dark:border-default-100 flex flex-col h-full">
        {/* Content */}
        <ScrollShadow className="flex-1 h-[95%] p-4">
          {/* All Products Option */}
          <Button
            variant={!selectedSubcategory ? "solid" : "ghost"}
            className={`w-full  border-1 border-gray-100 dark:border-default-100 mb-3 justify-start text-left py-3 px-4 rounded-lg transition-all duration-200 ${
              !selectedSubcategory ? "bg-primary-600 text-white shadow-md" : ""
            }`}
            onPress={handleClear}
          >
            <div className="flex items-center gap-3 py-4 w-full">
              <div className="text-sm font-semibold">{t("all_products")}</div>
            </div>
          </Button>

          {/* Subcategories List */}
          <div className="space-y-2">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="w-full animate-pulse">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-100 dark:dark:bg-content1">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-black rounded-lg shrink-0" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:dark:bg-black rounded mb-1" />
                        <div className="h-3 bg-gray-200 dark:bg-black rounded w-3/4" />
                      </div>
                    </div>
                  </div>
                ))
              : subcategories.map((cat) => (
                  <div
                    key={cat.id}
                    className={`w-full p-2 rounded-lg cursor-pointer transition-all duration-200  border-1 border-gray-100 dark:border-default-100 ${
                      selectedSubcategory === cat.slug
                        ? "bg-primary-500 text-white shadow-md"
                        : ""
                    }`}
                    onClick={() => handleClick(cat.slug)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      {cat.image ? (
                        <div className="relative shrink-0 rounded-lg overflow-hidden">
                          <Image
                            src={cat.image}
                            alt={cat.title}
                            className="object-contain"
                            radius="none"
                            classNames={{
                              wrapper: "w-12 h-12",
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-linear-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center shrink-0">
                          <Grid3X3 size={16} className="text-gray-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">
                          {cat.title}
                        </div>
                        <div
                          className={`text-xs truncate mt-0.5 ${
                            selectedSubcategory === cat.slug
                              ? "text-white/80"
                              : "text-foreground/50"
                          }`}
                        >
                          {cat.product_count
                            ? t("products_count", { count: cat.product_count })
                            : t("browse_category")}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </ScrollShadow>

        {/* Load More Button */}
        {hasMore && (
          <div className="p-4 border-t border-gray-100 dark:border-default-100">
            <Button
              size="sm"
              variant="ghost"
              className="w-full text-xs"
              isLoading={isLoadingMore}
              onPress={loadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? t("loading") : t("load_more")}
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default SubcategorySidebar;
