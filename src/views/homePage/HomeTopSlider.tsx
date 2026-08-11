import { FC } from "react";
import useSWR from "swr";
import { Swiper, SwiperSlide } from "swiper/react";

import { Autoplay } from "swiper/modules";
import { Card, Image, Skeleton } from "@heroui/react";
import { getBannerImages } from "@/routes/api";
import { getActiveCategory, isSSR } from "@/helpers/getters";
import { BannerData } from "@/types/ApiResponse";
import Link from "next/link";
import { getCookie } from "@/lib/cookies";
import { UserLocation } from "@/components/Location/types/LocationAutoComplete.types";
import { useScreenType } from "@/hooks/useScreenType";
import { useTranslation } from "react-i18next";
import { isRTL } from "@/helpers/functionalHelpers";

type HomeTopSliderProps = {
  initialBanners?: BannerData;
};

// Fetcher function for SWR
const fetcher = async () => {
  const scopeCategorySlug = getActiveCategory();

  const location = getCookie("userLocation") as UserLocation | undefined;
  const { lat = "", lng = "" } = location || {};

  if (!lat || !lng) {
    return { top: [], carousel: [] };
  }

  const response = await getBannerImages({
    scope_category_slug: scopeCategorySlug,
    per_page: 50,
    latitude: lat,
    longitude: lng,
  });

  if (!response.success || !response.data) {
    console.error(response.message || "Failed to fetch banner images");
  }

  return response.data?.data ?? { top: [], carousel: [] };
};

const HomeTopSlider: FC<HomeTopSliderProps> = ({
  initialBanners = { top: [], carousel: [] },
}) => {
  const screen = useScreenType();
  const { i18n } = useTranslation();
  const currentLang = i18n.resolvedLanguage || i18n.language;
  const rtl = isRTL(currentLang);

  const {
    data: bannerImages,
    isLoading,
    isValidating,
    mutate,
  } = useSWR("/banners", fetcher, {
    fallbackData: isSSR() ? initialBanners : undefined,
    revalidateOnFocus: false,
    revalidateOnMount: !isSSR(),
  });

  if (isLoading || !bannerImages || isValidating) {
    return (
      <div className="w-full my-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          {/* Mobile – 1 skeleton */}
          <Skeleton className="w-full aspect-409/240 rounded-lg animate-pulse block sm:hidden" />

          {/* Tablet (sm) – 2 skeletons */}
          {[...Array(2)].map((_, index) => (
            <Skeleton
              key={`sm-${index}`}
              className="w-full aspect-409/240 rounded-lg animate-pulse hidden sm:block lg:hidden"
            />
          ))}

          {/* Desktop (lg) – 3 skeletons */}
          {[...Array(2)].map((_, index) => (
            <Skeleton
              key={`lg-${index}`}
              className="w-full aspect-409/240 rounded-lg animate-pulse hidden lg:block"
            />
          ))}
        </div>
      </div>
    );
  }

  const shouldHide = bannerImages?.top?.length === 0;
  const canLoopTop = (bannerImages?.top?.length ?? 0) > 2;

  return (
    <section id="home-slider" className="mt-4">
      <button
        onClick={() => mutate()}
        className="hidden"
        id="home-banners-refetch"
      />
      {!shouldHide && (
        <div className="w-full mb-4">
          <Swiper
            key={rtl ? "rtl-hs" : "ltr-hs"}
            dir={rtl ? "rtl" : "ltr"}
            modules={[Autoplay]}
            autoplay={{ delay: 4000 }}
            loop={canLoopTop}
            spaceBetween={12}
            slidesPerView={1}
            breakpoints={{
              315: {
                slidesPerView: 1,
              },
              640: {
                slidesPerView: 2,
              },
              1024: {
                slidesPerView: 2,
              },
            }}
            className="rounded-lg shadow-none"
          >
            {bannerImages?.top &&
              bannerImages.top.map((banner) => (
                <SwiperSlide key={banner.id}>
                  <Card
                    className="border-none"
                    radius="lg"
                    isPressable={screen !== "mobile"}
                    as={Link}
                    shadow="none"
                    href={
                      banner.type === "brand"
                        ? `/brands/${banner.brand_slug}`
                        : banner.type === "category"
                          ? `/categories/${banner.category_slug}`
                          : banner.type === "product"
                            ? `/products/${banner.product_slug}`
                            : banner.type === "custom" && banner.custom_url
                              ? banner.custom_url
                              : "#"
                    }
                  >
                    <Image
                      src={banner.banner_image}
                      alt={banner.title}
                      loading="eager"
                      radius="lg"
                      className="w-full h-full aspect-409/240 object-cover"
                    />
                  </Card>
                </SwiperSlide>
              ))}
          </Swiper>
        </div>
      )}
    </section>
  );
};

export default HomeTopSlider;
