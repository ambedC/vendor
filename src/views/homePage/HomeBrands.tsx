import { FC, useMemo } from "react";
import { useTranslation } from "react-i18next";
import useSWR from "swr";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { Sparkles } from "lucide-react";
import { getActiveCategory, isSSR } from "@/helpers/getters";
import { Brand } from "@/types/ApiResponse";
import BrandCard from "@/components/Cards/BrandCard";
import BrandCardSkeleton from "@/components/Skeletons/BrandCardSkeleton";
import { getBrands } from "@/routes/api";
import SectionHeading from "@/components/SectionHeading";
import Link from "next/link";
import { UserLocation } from "@/components/Location/types/LocationAutoComplete.types";
import { getCookie } from "@/lib/cookies";
import { isRTL } from "@/helpers/functionalHelpers";

interface HomeBrandsProps {
  initialBrands?: Brand[];
}

// SWR fetcher with homeCategory cookie
const fetcher = async () => {
  const validSlug = getActiveCategory();

  const location = getCookie("userLocation") as UserLocation | undefined;
  const { lat = "", lng = "" } = location || {};

  if (!lat || !lng) {
    return [];
  }

  const response = await getBrands({
    scope_category_slug: validSlug,
    latitude: lat,
    longitude: lng,
  });

  if (!response.success || !response.data) {
    console.error(response.message || "Failed to fetch brands");
  }

  return response.data?.data ?? [];
};

const HomeBrands: FC<HomeBrandsProps> = ({ initialBrands = [] }) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.resolvedLanguage || i18n.language;
  const rtl = isRTL(currentLang);
  const {
    data: brands = [],
    isLoading,
    isValidating,
    mutate,
  } = useSWR("/brands", fetcher, {
    fallbackData: isSSR() ? initialBrands : undefined,
    revalidateOnFocus: false,
    revalidateOnMount: !isSSR(),
  });

  const slides = useMemo(
    () =>
      brands.map((brand) => (
        <SwiperSlide key={brand.id}>
          <div className="flex flex-col items-center pt-1 aspect-square">
            <BrandCard brand={brand} />
          </div>
        </SwiperSlide>
      )),
    [brands]
  );

  const skeletonSlides = useMemo(() => {
    const maxSlides = 8;
    return Array.from({ length: maxSlides }).map((_, index) => (
      <SwiperSlide key={`skeleton-${index}`}>
        <BrandCardSkeleton />
      </SwiperSlide>
    ));
  }, []);

  const shouldHide = brands?.length === 0 && !isLoading && !isValidating;
  const validSlug = getActiveCategory();

  return (
    <section id="home-brands">
      <button
        onClick={() => mutate()}
        className="hidden"
        id="home-brands-refetch"
      />
      {!shouldHide && (
        <div className="w-full rounded-2xl mb-4">
          <div className="flex justify-between w-full items-center mb-4">
            <SectionHeading
              title={t("home.brands.title")}
              description={t("home.brands.description")}
              icon={<Sparkles className="text-white w-4 h-4" />}
            />
            <Link
              href={
                validSlug ? `/brands?slug=${validSlug}` : "/brands"
              }
              className="text-xs sm:text-sm"
              title={t("see_all")}
            >
              {t("see_all")}
            </Link>
          </div>

          <Swiper
            key={rtl ? "rtl-hb" : "ltr-hb"}
            dir={rtl ? "rtl" : "ltr"}
            slidesPerView={2}
            spaceBetween={1}
            breakpoints={{
              315: { slidesPerView: 3, spaceBetween: 4 },
              424: { slidesPerView: 4, spaceBetween: 4 },
              426: { slidesPerView: 5, spaceBetween: 4 },
              640: { slidesPerView: 7, spaceBetween: 12 },
              1024: { slidesPerView: 9, spaceBetween: 12 },
              1280: { slidesPerView: 10, spaceBetween: 12 },
              1440: { slidesPerView: 12, spaceBetween: 12 },
            }}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            loop={false}
            modules={[Navigation, Autoplay]}
          >
            {isLoading ? skeletonSlides : <>{slides}</>}
          </Swiper>
        </div>
      )}
    </section>
  );
};

export default HomeBrands;
