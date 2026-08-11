import ProductCard from "@/components/Cards/ProductCard";
import { Product } from "@/types/ApiResponse";
import { FC, useMemo } from "react";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import ProductCardSkeleton from "@/components/Skeletons/ProductCardSkeleton";
import { useTranslation } from "react-i18next";
import { isRTL } from "@/helpers/functionalHelpers";

interface SimilarProductProps {
  initialSimilarProducts: Product[];
  isLoading: boolean;
  title?: string;
  page?: "productDetail" | "cart";
}

const SimilarProductsSection: FC<SimilarProductProps> = ({
  initialSimilarProducts = [],
  isLoading,
  title,
  page = "productDetail",
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.resolvedLanguage || i18n.language;
  const rtl = isRTL(currentLang);
  const cartPage = page === "cart";
  // Memoize the product slides
  const slides = useMemo(() => {
    return initialSimilarProducts.map((product) => (
      <SwiperSlide key={product.id}>
        <div className="py-0.5">
          <ProductCard product={product} />
        </div>
      </SwiperSlide>
    ));
  }, [initialSimilarProducts]);

  const skeletonSlides = useMemo(() => {
    return Array.from({ length: 7 }).map((_, index) => (
      <SwiperSlide key={index}>
        <div className="py-0.5">
          <ProductCardSkeleton />
        </div>
      </SwiperSlide>
    ));
  }, []);

  if (initialSimilarProducts.length == 0) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="flex justify-between w-full items-center mb-4">
        <h1 className="text-lg font-semibold">
          {title ?? t("similarProducts")}
        </h1>
      </div>
      <Swiper
        key={rtl ? "rtl-sp" : "ltr-sp"}
        dir={rtl ? "rtl" : "ltr"}
        slidesPerView={2}
        spaceBetween={16}
        breakpoints={{
          640: { slidesPerView: cartPage ? 4 : 3 },
          1024: { slidesPerView: cartPage ? 3 : 4 },
          1280: { slidesPerView: cartPage ? 3 : 5 },
          1440: { slidesPerView: cartPage ? 5 : 7 },
        }}
        lazyPreloadPrevNext={0}
        modules={[Navigation]}
      >
        {isLoading ? skeletonSlides : slides}
      </Swiper>
    </div>
  );
};

export default SimilarProductsSection;
