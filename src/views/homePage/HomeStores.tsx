import { FC, useMemo } from "react";
import { useTranslation } from "react-i18next";
import useSWR from "swr";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";

import Link from "next/link";
import { isSSR } from "@/helpers/getters";
import { Store } from "@/types/ApiResponse";
import SectionHeading from "@/components/SectionHeading";
import { Store as StoreIcon } from "lucide-react";
import { getStores } from "@/routes/api";
import StoreCard from "@/components/Cards/StoreCard";
import StoreCardSkeleton from "@/components/Skeletons/StoreCardSkeleton";
import { getCookie } from "@/lib/cookies";
import { UserLocation } from "@/components/Location/types/LocationAutoComplete.types";
import { isRTL } from "@/helpers/functionalHelpers";
import { useSettings } from "@/contexts/SettingsContext";

interface HomeStoreProps {
  initialStores?: Store[];
}

// SWR fetcher
const fetcher = async () => {
  const { lat = "", lng = "" } = getCookie("userLocation") as UserLocation;
  if (lat == "" && lng == "") {
    return [];
  }
  const response = await getStores({ latitude: lat, longitude: lng });
  if (!response.success || !response.data) {
    console.error(response.message || "Failed to fetch Stores");
    return [];
  }
  // Return the actual stores array, not the pagination wrapper
  return response.data.data;
};

const HomeStores: FC<HomeStoreProps> = ({ initialStores = [] }) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.resolvedLanguage || i18n.language;
  const rtl = isRTL(currentLang);
  const {
    data: stores = [],
    isLoading,
    mutate,
  } = useSWR("/stores", fetcher, {
    fallbackData: isSSR() ? initialStores : undefined,
    revalidateOnFocus: false,
    revalidateOnMount: !isSSR(),
  });

  const slides = useMemo(
    () =>
      stores.map((store) => (
        <>
          <SwiperSlide key={store.id}>
            <div className="py-0.5">
              <StoreCard store={store} />
            </div>
          </SwiperSlide>
        </>
      )),
    [stores],
  );

  const skeletonSlides = useMemo(() => {
    return Array.from({ length: 7 }).map((_, index) => (
      <SwiperSlide key={`skeleton-${index}`}>
        <div className="py-0.5">
          <StoreCardSkeleton />
        </div>
      </SwiperSlide>
    ));
  }, []);

  const { isSingleVendor } = useSettings();
  const shouldHide = (stores?.length === 0 && !isLoading) || isSingleVendor;

  return (
    <section id="home-stores">
      <button
        onClick={() => mutate()}
        className="hidden"
        id="home-stores-refetch"
      />
      {!shouldHide && (
        <div className="w-full mb-4">
          <div className="flex justify-between w-full items-center mb-6">
            <SectionHeading
              title={t("home.stores.title")}
              description={t("home.stores.description")}
              icon={<StoreIcon size={16} className="text-white" />}
            />
            <Link
              href="/stores"
              className="text-xs sm:text-sm"
              title={t("see_all")}
            >
              {t("see_all")}
            </Link>
          </div>
          <Swiper
            key={rtl ? "rtl-hs" : "ltr-hs"}
            dir={rtl ? "rtl" : "ltr"}
            slidesPerView={2}
            spaceBetween={4}
            breakpoints={{
              640: { slidesPerView: 3, spaceBetween: 12 },
              1024: { slidesPerView: 4, spaceBetween: 12 },
              1280: { slidesPerView: 5, spaceBetween: 12 },
              1440: { slidesPerView: 7, spaceBetween: 12 },
            }}
            lazyPreloadPrevNext={0}
            modules={[Navigation, Autoplay]}
            loop={false}
            autoplay={{
              delay: 3500,
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

export default HomeStores;
