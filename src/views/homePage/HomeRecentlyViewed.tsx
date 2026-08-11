import { FC, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import ProductCard from "@/components/Cards/ProductCard";
import SectionHeading from "@/components/SectionHeading";
import { Eye } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { isRTL } from "@/helpers/functionalHelpers";
import SwiperNavigation from "@/components/SwiperNavigation";

const HomeRecentlyViewed: FC = () => {
  const { t, i18n } = useTranslation();
  const recentlyViewedProducts = useSelector(
    (state: RootState) => state.recentlyViewed.products
  );

  const prevRef = useRef(null);
  const nextRef = useRef(null);

  const slides = useMemo(
    () =>
      recentlyViewedProducts.map((product) => (
        <SwiperSlide key={product.id}>
          <div className="py-0.5">
            <ProductCard product={product} />
          </div>
        </SwiperSlide>
      )),
    [recentlyViewedProducts]
  );

  // Don't render section if no products
  if (recentlyViewedProducts.length === 0) {
    return null;
  }

  const currentLang = i18n.resolvedLanguage || i18n.language;
  const rtl = isRTL(currentLang);

  return (
    <section id="home-recently-viewed">
      <div className="w-full mb-4">
        <div className="flex justify-between w-full items-center mb-6">
          <SectionHeading
            title={t("home.recently_viewed.title")}
            description={t("home.recently_viewed.description")}
            icon={<Eye size={16} className="text-white" />}
          />
        </div>
        <div className="relative group">
          <SwiperNavigation prevRef={prevRef} nextRef={nextRef} rtl={rtl} />
          {/* Swiper */}
          <Swiper
            key={rtl ? "rtl-rvp" : "ltr-rvp"}
            dir={rtl ? "rtl" : "ltr"}
            slidesPerView={2}
            spaceBetween={1}
            breakpoints={{
              640: { slidesPerView: 3, spaceBetween: 12 },
              1024: { slidesPerView: 4, spaceBetween: 12 },
              1280: { slidesPerView: 5, spaceBetween: 12 },
              1440: { slidesPerView: 7, spaceBetween: 12 },
            }}
            onBeforeInit={(swiper) => {
              const nav = swiper.params.navigation;
              if (nav && typeof nav !== "boolean") {
                nav.prevEl = prevRef.current;
                nav.nextEl = nextRef.current;
              }
            }}
            navigation={true}
            modules={[Navigation]}
            lazyPreloadPrevNext={0}
          >
            {slides}
          </Swiper>
        </div>
      </div>
    </section>
  );
};

export default HomeRecentlyViewed;
