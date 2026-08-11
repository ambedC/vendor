import React, { useRef, useState, useEffect } from "react";
import { getCategories } from "@/routes/api";
import { useInfiniteData } from "@/hooks/useInfiniteData";
import TabButton from "@/components/custom/TabButton";
import SkeletonTabButton from "@/components/custom/SkeletonTabButton";
import { Category } from "@/types/ApiResponse";
import { useTranslation } from "react-i18next";

interface Props {
  parentSlug: string;
  selectedSubcategory?: string;
  onSelect?: (slug: string) => void;
  onClear?: () => void;
  className?: string;
}

const PER_PAGE = 12;

const SubcategoryTabsMobile: React.FC<Props> = ({
  parentSlug,
  selectedSubcategory = "",
  onSelect,
  onClear,
  className = "",
}) => {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);

  const {
    data: subcategories,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
  } = useInfiniteData<Category>({
    fetcher: getCategories,
    perPage: PER_PAGE,
    extraParams: { slug: parentSlug, scope_category_slug: parentSlug },
    passLocation: true,
    dataKey: `subcategories-mobile-${parentSlug}`,
    forceFetchOnMount: true,
  });

  const handleClick = (slug: string) => {
    if (slug === "all") {
      onClear?.();
    } else {
      onSelect?.(slug);
    }
  };

  const handleSeeMore = () => {
    if (hasMore && !isLoadingMore) loadMore();
  };

  // Shadow logic
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      setShowLeftShadow(el.scrollLeft > 0);
      setShowRightShadow(el.scrollWidth > el.clientWidth + el.scrollLeft);
    };

    handleScroll(); // initialize
    el.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);

    return () => {
      el.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return (
    <div
      className={`relative lg:hidden w-full ${className}`}
      aria-label={t("subcategories")}
    >
      {/* Left shadow */}
      {showLeftShadow && (
        <div
          className="absolute left-0 top-0 bottom-0 w-6 
          bg-linear-to-r from-gray-300/40 to-transparent 
          dark:from-gray-800/60 pointer-events-none z-10"
        />
      )}

      {/* Right shadow */}
      {showRightShadow && (
        <div
          className="absolute right-0 top-0 bottom-0 w-6 
          bg-linear-to-l from-gray-300/40 to-transparent 
          dark:from-gray-800/60 pointer-events-none z-10"
        />
      )}

      <div
        ref={scrollRef}
        className="overflow-x-auto no-scrollbar scrollbar-hide"
      >
        <div className="flex gap-2 px-2">
          {/* All */}
          <div className="shrink-0 w-[88px] xs:w-[94px]">
            <TabButton
              slug="all"
              title={t("all_products")}
              isSelected={!selectedSubcategory}
              onClick={() => handleClick("all")}
            />
          </div>

          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="shrink-0 w-[88px] xs:w-[94px]">
                  <SkeletonTabButton />
                </div>
              ))
            : subcategories.map((cat) => (
                <div key={cat.id} className="shrink-0 w-[88px] xs:w-[94px]">
                  <TabButton
                    slug={cat.slug}
                    title={cat.title}
                    isSelected={selectedSubcategory === cat.slug}
                    category={cat}
                    onClick={() => handleClick(cat.slug)}
                  />
                </div>
              ))}

          {hasMore && (
            <div className="shrink-0 w-[88px] xs:w-[94px]">
              <TabButton
                slug="see-more"
                title={isLoadingMore ? t("loading") : t("see_more")}
                isSelected={false}
                isLoading={isLoadingMore}
                onClick={handleSeeMore}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubcategoryTabsMobile;
