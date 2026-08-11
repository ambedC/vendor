import React, { useEffect, useState, useRef } from "react";
import { useInfiniteData } from "@/hooks/useInfiniteData";
import { getCategories } from "@/routes/api";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import TabButton from "../custom/TabButton";
import SkeletonTabButton from "../custom/SkeletonTabButton";
import { getCookie, setCookie } from "@/lib/cookies";
import { onHomeCategoryChange } from "@/helpers/events";
import { useSettings } from "@/contexts/SettingsContext";
import { useRouter } from "next/router";
import { Mousewheel } from "swiper/modules";
import { useTranslation } from "react-i18next";
import { isRTL } from "@/helpers/functionalHelpers";
import { useDispatch } from "react-redux";
import { setSearchLabels } from "@/lib/redux/slices/searchSlice";

interface Category {
  id: number;
  title: string;
  slug: string;
  image: string;
  icon: string;
  active_icon: string;
  description: string | null;
  status: string;
}

interface CategoryTabsProps {
  defaultCategory?: string;
  className?: string;
}

const PER_PAGE = 15;

const CategoryTabs: React.FC<CategoryTabsProps> = ({
  defaultCategory = "all",
  className = "",
}) => {
  // Initialize with a function to read from cookie on client-side only
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    if (typeof window === "undefined") { 
      return defaultCategory;
    }
    const cookieCategory = getCookie("homeCategory") as string;
    return cookieCategory || defaultCategory;
  });

  const [isHydrated, setIsHydrated] = useState(false);
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);
  const swiperRef = useRef<SwiperType | null>(null);

  const { homeGeneralSettings } = useSettings();
  const router = useRouter();
  const { i18n } = useTranslation();
  const currentLang = i18n.resolvedLanguage || i18n.language;
  const rtl = isRTL(currentLang);

  // Sync with URL query on mount
  useEffect(() => {
    const cookieCategory = getCookie("homeCategory") as string;

    const category = cookieCategory || defaultCategory;

    // Update selected category
    setTimeout(() => {
      setSelectedCategory(category);
    }, 0);

    setTimeout(() => {
      setIsHydrated(true);
    }, 0);
  }, [defaultCategory]);

  const {
    data: categories,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    error,
    refetch,
    rawResponse,
  } = useInfiniteData<Category>({
    fetcher: getCategories,
    perPage: PER_PAGE,
    dataKey: "categories-tab",
    forceFetchOnMount: true,
    passLocation: true,
    extraParams: {home: true},
  });

  const updateShadows = (swiper: SwiperType) => {
    // Check if slides actually overflow container
    const hasOverflow =
      swiper.width <
      swiper.slides.reduce((sum, slide) => sum + slide.offsetWidth, 0);

    if (!hasOverflow) {
      // No overflow → no shadows at all
      setShowLeftShadow(false);
      setShowRightShadow(false);
      return;
    }

    setShowLeftShadow(!swiper.isBeginning);
    setShowRightShadow(!swiper.isEnd);
  };

  const handleCategorySelect = async (categorySlug: string) => {
    setSelectedCategory(categorySlug);
    setCookie("homeCategory", categorySlug);

    if (!categorySlug || categorySlug === "all") {
      await router.replace(
        { pathname: router.pathname, query: {} },
        undefined,
        { shallow: true }
      );
    } else {
      await router.replace(
        { pathname: router.pathname, query: { category: categorySlug } },
        undefined,
        { shallow: true }
      );
    }

    onHomeCategoryChange();
  };

  const dispatch = useDispatch();

  useEffect(() => {
    if (rawResponse?.main_category_data?.search_labels) {
      dispatch(setSearchLabels(rawResponse.main_category_data.search_labels));
    } else if (selectedCategory === "all") {
      dispatch(setSearchLabels(null));
    }
  }, [rawResponse, dispatch, selectedCategory]);

  // Check if selected category exists and reset to "all" if it doesn't
  useEffect(() => {
    if (!isHydrated || isLoading || selectedCategory === "all") return;

    const exists = categories?.some((c) => c.slug === selectedCategory);
    if (!exists) {
      // Directly set state instead of calling handleCategorySelect
      setTimeout(() => {
        setSelectedCategory("all");
      }, 0);
      setCookie("homeCategory", "all");

      // Handle URL and event separately
      router
        .replace({ pathname: router.pathname, query: {} }, undefined, {
          shallow: true,
        })
        .then(() => {
          onHomeCategoryChange();
        });
    }
  }, [categories, isLoading, isHydrated, selectedCategory, router]);

  const handleSeeMore = () => {
    if (hasMore && !isLoadingMore) {
      loadMore();
    }
  };

  if (error) {
    console.error(error);
  }

  // Don't render until hydrated to prevent SSR/client mismatch
  if (!isHydrated) {
    return (
      <div className={`w-full relative ${className}`}>
        <Swiper
          key={rtl ? "rtl-ct" : "ltr-ct"}
          dir={rtl ? "rtl" : "ltr"}
          spaceBetween={8}
          grabCursor={true}
          slidesPerView="auto"
          slidesOffsetAfter={8}
          modules={[Mousewheel]}
          mousewheel
        >
          <SwiperSlide style={{ width: "auto" }}>
            <SkeletonTabButton />
          </SwiperSlide>
          {Array.from({ length: 5 }).map((_, i) => (
            <SwiperSlide key={i} style={{ width: "auto" }}>
              <SkeletonTabButton />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    );
  }

  return (
    <div className={`w-full relative ${className}`}>
      <button
        className="hidden"
        id="home-category-tabs"
        onClick={() => refetch()}
      />
      <div className="flex gap-0.5">
        <TabButton
          slug="all"
          title={homeGeneralSettings?.title || "All"}
          isSelected={selectedCategory === "all"}
          category={{
            active_icon: homeGeneralSettings?.activeIcon || "",
            description: "",
            icon: homeGeneralSettings?.icon || "",
            id: 0,
            image: "",
            slug: "",
            status: "",
            title: homeGeneralSettings?.title || "all",
          }}
          onClick={() => {
            handleCategorySelect("all");
          }}
        />

        <div className={`w-full relative overflow-x-hidden ${className}`}>
          {/* Left Shadow */}
          <div
            className={`absolute left-0 top-0 bottom-0 w-6
            bg-linear-to-r
            from-gray-400/20 via-gray-400/10 to-transparent
            dark:from-gray-500/30 dark:via-gray-400/20
            z-10 pointer-events-none
            transition-opacity duration-300 ease-in-out
            ${showLeftShadow ? "opacity-100" : "opacity-0"}`}
          />

          {/* Right Shadow */}
          <div
            className={`absolute right-0 top-0 bottom-0 w-6
              bg-linear-to-l
            from-gray-400/20 via-gray-400/10 to-transparent
            dark:from-gray-500/30 dark:via-gray-400/20
              z-10 pointer-events-none
              transition-opacity duration-300 ease-in-out
              ${showRightShadow ? "opacity-100" : "opacity-0"}`}
          />

          <Swiper
            grabCursor
            slidesPerView="auto"
            slidesOffsetAfter={8}
            modules={[Mousewheel]}
            mousewheel
            spaceBetween={8} // default (desktop)
            breakpoints={{
              0: {
                spaceBetween: 2, // mobile
              },
              640: {
                spaceBetween: 8, // tablet & above
              },
            }}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
              updateShadows(swiper);
            }}
            onSlideChange={updateShadows}
            onResize={updateShadows}
            onProgress={updateShadows}
          >
            {/* Category tabs */}
            {isLoading
              ? Array.from({ length: PER_PAGE }).map((_, i) => (
                  <SwiperSlide key={i} style={{ width: "auto" }}>
                    <SkeletonTabButton />
                  </SwiperSlide>
                ))
              : categories.map((category) => (
                  <SwiperSlide key={category.slug} style={{ width: "auto" }}>
                    <TabButton
                      slug={category.slug}
                      title={category.title}
                      category={category}
                      isSelected={selectedCategory === category.slug}
                      onClick={() => {
                        handleCategorySelect(category.slug);
                      }}
                    />
                  </SwiperSlide>
                ))}

            {/* See More */}
            {hasMore && (
              <SwiperSlide style={{ width: "auto" }}>
                <TabButton
                  slug="see-more"
                  title={isLoadingMore ? "Loading..." : "See More"}
                  isSelected={false}
                  isLoading={isLoadingMore}
                  onClick={handleSeeMore}
                />
              </SwiperSlide>
            )}
          </Swiper>
        </div>
      </div>
    </div>
  );
};

export default CategoryTabs;
