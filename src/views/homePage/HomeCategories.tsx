import { FC, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { setSearchLabels } from "@/lib/redux/slices/searchSlice";
import useSWR from "swr";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import { AppWindow } from "lucide-react";
import { getCategories, getSubCategories } from "@/routes/api";
import { getActiveCategory, isSSR } from "@/helpers/getters";
import { Category } from "@/types/ApiResponse";
import CategoryCard from "@/components/Cards/CategoryCard";
import CategoryCardSkeleton from "@/components/Skeletons/CategoryCardSkeleton";
import SectionHeading from "@/components/SectionHeading";
import Link from "next/link";
import { UserLocation } from "@/components/Location/types/LocationAutoComplete.types";
import { getCookie } from "@/lib/cookies";
import { isRTL } from "@/helpers/functionalHelpers";

interface HomeCategoriesProps {
  initialCategories?: Category[];
}

// SWR fetcher
const fetcher = async () => {
  const validSlug = getActiveCategory();

  const location = getCookie("userLocation") as UserLocation | undefined;
  const { lat = "", lng = "" } = location || {};

  if (!lat || !lng) {
    return null;
  }

  const response = validSlug
    ? await getCategories({
        slug: validSlug,
        latitude: lat,
        longitude: lng,
      })
    : await getSubCategories({
        slug: validSlug,
        latitude: lat,
        longitude: lng,
        filter: "top_category",
      });

  if (!response.success || !response.data) {
    console.error(response.message || "Failed to fetch categories");
  }

  return response.data ?? null;
};

const HomeCategories: FC<HomeCategoriesProps> = ({
  initialCategories = [],
}) => {
  const { t, i18n } = useTranslation();

  const currentLang = i18n.resolvedLanguage || i18n.language;
  const rtl = isRTL(currentLang);

  const {
    data: categoriesResponse,
    isLoading,
    isValidating,
    mutate,
  } = useSWR("/categories", fetcher, {
    revalidateOnFocus: false,
    revalidateOnMount: !isSSR(),
  });

  const categories = useMemo(
    () => categoriesResponse?.data ?? initialCategories ?? [],
    [categoriesResponse?.data, initialCategories]
  );
  const dispatch = useDispatch();

  useEffect(() => {
    if (categoriesResponse?.main_category_data?.search_labels) {
      dispatch(
        setSearchLabels(categoriesResponse.main_category_data.search_labels)
      );
    }
  }, [categoriesResponse, dispatch]);

  const slides = useMemo(
    () =>
      categories.map((category) => (
        <SwiperSlide key={category.id}>
          <div className="flex flex-col items-center">
            <CategoryCard category={category} />
          </div>
        </SwiperSlide>
      )),
    [categories],
  );

  const skeletonSlides = useMemo(() => {
    return Array.from({ length: 12 }).map((_, index) => (
      <SwiperSlide key={`skeleton-${index}`}>
        <CategoryCardSkeleton />
      </SwiperSlide>
    ));
  }, []);
  const shouldHide = categories?.length === 0 && !isLoading && !isValidating;
  const validSlug = getActiveCategory();

  return (
    <section id="home-categories">
      <button
        onClick={() => mutate()}
        className="hidden"
        id="home-categories-refetch"
      />
      {!shouldHide && (
        <div className="w-full mb-4">
          <div className="flex justify-between w-full items-center mb-4">
            <SectionHeading
              title={t("home.categories.title")}
              description={t("home.categories.description")}
              icon={<AppWindow size={16} className="text-white" />}
            />
            <Link
              href={validSlug ? `/categories?slug=${validSlug}` : "/categories"}
              className="text-xs sm:text-sm"
              title={t("see_all")}
            >
              {t("see_all")}
            </Link>
          </div>
          <Swiper
            key={rtl ? "rtl-hc" : "ltr-hc"}
            dir={rtl ? "rtl" : "ltr"}
            slidesPerView={3}
            spaceBetween={1}
            breakpoints={{
              315: { slidesPerView: 3, spaceBetween: 2 },
              424: { slidesPerView: 4, spaceBetween: 4 },
              426: { slidesPerView: 5, spaceBetween: 4 },
              640: { slidesPerView: 6, spaceBetween: 6 },
              1024: { slidesPerView: 8, spaceBetween: 8 },
              1280: { slidesPerView: 9, spaceBetween: 8 },
              1440: { slidesPerView: 10, spaceBetween: 10 },
            }}
            lazyPreloadPrevNext={0}
            modules={[Navigation, Autoplay]}
            loop={false}
            autoplay={{
              delay: 3200,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
          >
            {isLoading ? skeletonSlides : slides}
          </Swiper>
        </div>
      )}
    </section>
  );
};

export default HomeCategories;
