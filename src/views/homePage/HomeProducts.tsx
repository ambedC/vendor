import { FC, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import useSWR from "swr";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import ProductCard from "@/components/Cards/ProductCard";
import ProductCardSkeleton from "@/components/Skeletons/ProductCardSkeleton";
import Link from "next/link";
import { getProducts } from "@/routes/api";
import { getActiveCategory, isSSR } from "@/helpers/getters";
import { Product } from "@/types/ApiResponse";
import SectionHeading from "@/components/SectionHeading";
import { Boxes } from "lucide-react";
import { getCookie } from "@/lib/cookies";
import { UserLocation } from "@/components/Location/types/LocationAutoComplete.types";
import { isRTL } from "@/helpers/functionalHelpers";
import SwiperNavigation from "@/components/SwiperNavigation";

interface HomeProductProps {
  initialProducts?: Product[];
}

// SWR fetcher
const fetcher = async () => {
  // ✅ Get location from cookie
  const location = getCookie("userLocation") as UserLocation | undefined;
  const { lat = "", lng = "" } = location || {};

  if (!lat || !lng) {
    return [];
  }

  // ✅ Get category with query > cookie > undefined
  const validSlug = getActiveCategory();

  // ✅ API call
  const response = await getProducts({
    latitude: lat,
    longitude: lng,
    categories: validSlug,
    include_child_categories: 0,
  });

  if (!response.success || !response.data) {
    console.error(response.message || "Failed to fetch products");
  }

  return response.data?.data ?? [];
};

const HomeProducts: FC<HomeProductProps> = ({ initialProducts = [] }) => {
  const { t, i18n } = useTranslation();
  const {
    data: products = [],
    isLoading,
    mutate,
  } = useSWR("/products", fetcher, {
    fallbackData: isSSR() ? initialProducts : undefined,
    revalidateOnFocus: false,
    revalidateOnMount: !isSSR(),
  });

  const slides = useMemo(
    () =>
      products.map((product) => (
        <SwiperSlide key={product.id}>
          <div className="py-0.5">
            <ProductCard product={product} />
          </div>
        </SwiperSlide>
      )),
    [products],
  );

  const skeletonSlides = useMemo(() => {
    return Array.from({ length: 7 }).map((_, index) => (
      <SwiperSlide key={`skeleton-${index}`}>
        <div className="py-0.5">
          <ProductCardSkeleton />
        </div>
      </SwiperSlide>
    ));
  }, []);

  const shouldHide = products?.length === 0;

  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const currentLang = i18n.resolvedLanguage || i18n.language;
  const rtl = isRTL(currentLang);

  return (
    <section id="home-products">
      <button
        onClick={() => mutate()}
        className="hidden"
        id="home-products-refetch"
      />

      {/* only hide the section */}
      {!shouldHide && (
        <div className="w-full mb-4">
          <div className="flex justify-between w-full items-center mb-6">
            <SectionHeading
              title={t("home.products.title")}
              description={t("home.products.description")}
              icon={<Boxes size={16} className="text-white" />}
            />
            <Link
              href="/products"
              className="text-xs sm:text-sm"
              title={t("see_all")}
            >
              {t("see_all")}
            </Link>
          </div>
          <div className="relative group">
            <SwiperNavigation prevRef={prevRef} nextRef={nextRef} rtl={rtl} />

            {/* Swiper */}
            <Swiper
              key={rtl ? "rtl-hp" : "ltr-hp"}
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
              {isLoading ? skeletonSlides : slides}
            </Swiper>
          </div>
        </div>
      )}
    </section>
  );
};

export default HomeProducts;
