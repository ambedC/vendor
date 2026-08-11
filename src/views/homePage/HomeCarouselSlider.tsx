import { FC } from "react";
import useSWR from "swr";
import { Swiper, SwiperSlide } from "swiper/react";

import { Autoplay } from "swiper/modules";
import { Card, Image, Skeleton } from "@heroui/react";
import { BannerData } from "@/types/ApiResponse";
import { isSSR } from "@/helpers/getters";
import Link from "next/link";
import { useScreenType } from "@/hooks/useScreenType";
import { useTranslation } from "react-i18next";
import { isRTL } from "@/helpers/functionalHelpers";

type HomeCarouselSliderProps = {
  initialBanners?: BannerData;
};

const HomeCarouselSlider: FC<HomeCarouselSliderProps> = ({
  initialBanners = { top: [], carousel: [] },
}) => {
  const screen = useScreenType();

  const { i18n } = useTranslation();

  const currentLang = i18n.resolvedLanguage || i18n.language;
  const rtl = isRTL(currentLang);
  const {
    data: bannerImages,
    isLoading,
    mutate,
    isValidating,
  } = useSWR<BannerData>("/banners", null, {
    fallbackData: isSSR() ? initialBanners : undefined,
    revalidateOnFocus: false,
    revalidateOnMount: false, // HomeTopSlider already mounts it
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
  const shouldHide = bannerImages?.carousel?.length === 0;
  const canLoopCarousel = (bannerImages?.carousel?.length ?? 0) > 2;

  return (
    <section id="home-carousel" className="mt-4">
      <button
        onClick={() => mutate()}
        className="hidden"
        id="home-carousel-refetch"
      />
      {!shouldHide && (
        <div className="w-full mb-4">
          <Swiper
            key={rtl ? "rtl-hcs" : "ltr-hcs"}
            dir={rtl ? "rtl" : "ltr"}
            modules={[Autoplay]}
            autoplay={{ delay: 4000 }}
            loop={canLoopCarousel}
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
            {bannerImages?.carousel &&
              bannerImages.carousel.map((banner) => (
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

export default HomeCarouselSlider;
