import {
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Divider,
  Input,
  addToast,
} from "@heroui/react";
import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import PageHeader from "@/components/custom/PageHeader";
import { useTranslation } from "react-i18next";
import PageHead from "@/SEO/PageHead";
import { NextPageWithLayout } from "@/types";
import { getProductsByKeyword, getSettings } from "@/routes/api";
import { KeywordSearch } from "@/types/ApiResponse";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import ProductCard from "@/components/Cards/ProductCard";
import ProductCardSkeleton from "@/components/Skeletons/ProductCardSkeleton";
import {
  ListChecks,
  AlertCircle,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
} from "lucide-react";
import useSWR from "swr";
import { getCookie } from "@/lib/cookies";
import { UserLocation } from "@/components/Location/types/LocationAutoComplete.types";
import { isSSR } from "@/helpers/getters";
import { GetServerSideProps } from "next";
import { loadTranslations } from "../../../i18n";
import dynamic from "next/dynamic";
import Link from "next/link";
import { isRTL } from "@/helpers/functionalHelpers";

const PRODUCTS_PER_KEYWORD = 20;
const KEYWORDS_STORAGE_KEY = "shoppingListKeywords";
const ACTIVE_KEYWORD_STORAGE_KEY = "shoppingListActiveKeywordString";

const fetchProductsByKeywords = async (keywordString: string) => {
  if (!keywordString) {
    return [] as KeywordSearch[];
  }
  const location = getCookie<UserLocation>("userLocation");
  const { lat = "", lng = "" } = location || {};

  const response = await getProductsByKeyword({
    keywords: keywordString,
    latitude: lat,
    longitude: lng,
    per_page: PRODUCTS_PER_KEYWORD,
  });

  if (!response.success) {
    throw new Error(response.message || "Failed to fetch products");
  }

  const payload = response.data as KeywordSearch | KeywordSearch[] | undefined;
  if (!payload) return [];
  return Array.isArray(payload) ? payload : [payload];
};

const ShoppingListPageComponent: NextPageWithLayout = () => {
  const { t } = useTranslation();
  const [keywordInput, setKeywordInput] = useState("");
  const [keywords, setKeywords] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const storedKeywords = window.localStorage.getItem(KEYWORDS_STORAGE_KEY);
      if (!storedKeywords) return [];
      const parsedKeywords = JSON.parse(storedKeywords);
      return Array.isArray(parsedKeywords) ? parsedKeywords : [];
    } catch (error) {
      console.error("Failed to parse stored shopping list keywords:", error);
      return [];
    }
  });
  const [activeKeywordString, setActiveKeywordString] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(ACTIVE_KEYWORD_STORAGE_KEY) || "";
  });
  const [hasLocation, setHasLocation] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedLocation = getCookie<UserLocation>("userLocation");
    setTimeout(() => {
      setHasLocation(Boolean(storedLocation?.lat && storedLocation?.lng));
    }, 0);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (keywords.length) {
      window.localStorage.setItem(
        KEYWORDS_STORAGE_KEY,
        JSON.stringify(keywords)
      );
      return;
    }
    window.localStorage.removeItem(KEYWORDS_STORAGE_KEY);
  }, [keywords]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (activeKeywordString) {
      window.localStorage.setItem(
        ACTIVE_KEYWORD_STORAGE_KEY,
        activeKeywordString
      );
      return;
    }
    window.localStorage.removeItem(ACTIVE_KEYWORD_STORAGE_KEY);
  }, [activeKeywordString]);

  const handleKeywordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addKeywordsFromInput();
  };

  const addKeywordsFromInput = () => {
    const values = keywordInput
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!values.length) {
      addToast({
        title: t("pages.shoppingList.emptyKeywordsTitle"),
        description: t("pages.shoppingList.keywordHelper"),
        color: "warning",
      });
      return;
    }

    setKeywords((prev) => {
      const existing = new Set(prev.map((value) => value.toLowerCase()));
      const unique = values.filter(
        (value) => !existing.has(value.toLowerCase())
      );
      if (!unique.length) {
        addToast({
          title: t("pages.shoppingList.emptyKeywordsTitle"),
          description: t("pages.shoppingList.keywordHelper"),
          color: "warning",
        });
        return prev;
      }
      return [...prev, ...unique];
    });
    setKeywordInput("");
  };

  const removeKeyword = (target: string) => {
    setKeywords((prev) => prev.filter((keyword) => keyword !== target));
  };

  const clearKeywords = () => {
    setKeywords([]);
    setActiveKeywordString("");
  };

  const keywordString = useMemo(
    () =>
      keywords
        .map((keyword) => keyword.trim())
        .filter(Boolean)
        .join(","),
    [keywords]
  );

  const handleFetchProducts = () => {
    if (!keywordString) {
      addToast({
        title: t("pages.shoppingList.emptyKeywordsTitle"),
        description: t("pages.shoppingList.emptyKeywordsDescription"),
        color: "warning",
      });
      return;
    }
    setActiveKeywordString(keywordString);
  };

  const {
    data: keywordGroups = [],
    error,
    isLoading,
    mutate,
  } = useSWR<KeywordSearch[]>(
    activeKeywordString ? ["shopping-list", activeKeywordString] : null,
    ([, keywordsParam]) => fetchProductsByKeywords(keywordsParam as string),
    {
      revalidateOnFocus: false,
    }
  );

  const sectionsWithProducts = keywordGroups.filter(
    (group) => group.products && group.products.length > 0
  );

  const renderStatusCard = ({
    icon,
    title,
    description,
    tone = "default",
  }: {
    icon: ReactNode;
    title: string;
    description: string;
    tone?: "default" | "danger";
  }) => {
    const toneClasses =
      tone === "danger"
        ? "border-danger-200 bg-danger-50/50 text-danger-600"
        : "border-default-200 bg-default-50/50 text-default-600";
    return (
      <Card className={`border border-dashed ${toneClasses}`} shadow="none">
        <CardBody className="flex flex-col items-center gap-2 text-center py-8">
          <div className="p-3 rounded-full bg-background/80 text-current shadow-sm">
            {icon}
          </div>
          <h3 className="text-base font-semibold text-current">{title}</h3>
          <p className="text-xs text-current/70 max-w-md leading-relaxed">
            {description}
          </p>
        </CardBody>
      </Card>
    );
  };

  const renderResults = () => {
    if (!activeKeywordString) {
      return renderStatusCard({
        icon: <ListChecks size={24} />,
        title: t("pages.shoppingList.emptyKeywordsTitle"),
        description: t("pages.shoppingList.emptyKeywordsDescription"),
      });
    }

    if (error) {
      return renderStatusCard({
        icon: <AlertCircle size={24} />,
        title: t("pages.shoppingList.errorTitle"),
        description: t("pages.shoppingList.errorDescription"),
        tone: "danger",
      });
    }

    if (isLoading) {
      return <LoadingCarousel />;
    }

    if (!sectionsWithProducts.length) {
      return renderStatusCard({
        icon: <AlertCircle size={24} />,
        title: t("pages.shoppingList.emptyResultsTitle"),
        description: t("pages.shoppingList.emptyResultsDescription"),
      });
    }

    return sectionsWithProducts.map((section) => (
      <KeywordCarousel
        key={`${section.keyword}-${activeKeywordString}`}
        section={section}
        title={t("pages.shoppingList.sectionTitle", {
          keyword: section.keyword,
        })}
        countLabel={t("pages.shoppingList.productsCount", {
          count: section.total_products || section.products.length,
        })}
      />
    ));
  };

  return (
    <>
      <MyBreadcrumbs
        breadcrumbs={[
          {
            href: "/my-account/shopping-list",
            label: t("pageTitle.shopping-list"),
          },
        ]}
      />
      <PageHead pageTitle={t("pageTitle.shopping-list")} />
      <button
        onClick={() => mutate()}
        className="hidden"
        id="shopping-list-refetch"
      />

      <div className="w-full max-w-full overflow-hidden space-y-6">
        <PageHeader
          title={t("pages.shoppingList.headerTitle")}
          subtitle={t("pages.shoppingList.headerSubtitle")}
        />

        <Card shadow="sm" className="border border-default-200">
          <CardBody className="space-y-3 p-4">
            <form onSubmit={handleKeywordSubmit} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <Input
                    size="sm"
                    label={t("pages.shoppingList.keywordInputLabel")}
                    placeholder={t(
                      "pages.shoppingList.keywordInputPlaceholder"
                    )}
                    labelPlacement="outside"
                    value={keywordInput}
                    onChange={(event) => setKeywordInput(event.target.value)}
                    classNames={{
                      label: "text-sm font-medium mb-1",
                      input: "text-sm",
                      description: "text-xs",
                    }}
                    description={t("pages.shoppingList.keywordHelper")}
                  />
                </div>
                <Button
                  type="submit"
                  color="primary"
                  size="sm"
                  className="sm:mt-6 font-medium text-xs"
                  isDisabled={!keywordInput.trim()}
                  startContent={<Plus size={16} />}
                >
                  {t("pages.shoppingList.addKeyword")}
                </Button>
              </div>
            </form>

            {keywords.length > 0 && (
              <>
                <Divider className="my-1" />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-default-600">
                      {t("pages.shoppingList.keywordsCount", {
                        count: keywords.length,
                      })}
                    </span>
                    <Button
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={clearKeywords}
                      startContent={<X size={12} />}
                      className="h-7 text-xs"
                    >
                      {t("pages.shoppingList.clearAll")}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {keywords.map((keyword) => (
                      <Chip
                        key={keyword}
                        onClose={() => removeKeyword(keyword)}
                        variant="flat"
                        color="primary"
                        size="sm"
                        classNames={{
                          base: "px-2 py-0.5",
                          content: "text-xs font-medium capitalize",
                        }}
                      >
                        {keyword}
                      </Chip>
                    ))}
                  </div>
                </div>
                <Divider className="my-1" />
              </>
            )}

            {keywords.length === 0 && (
              <div className="rounded-lg border-2 border-dashed border-default-200 bg-default-50/50 p-6 text-center">
                <ListChecks
                  className="mx-auto mb-2 text-default-400"
                  size={28}
                />
                <p className="text-sm font-semibold text-default-700 mb-0.5">
                  {t("pages.shoppingList.emptyKeywordsTitle")}
                </p>
                <p className="text-xs text-default-500">
                  {t("pages.shoppingList.emptyKeywordsDescription")}
                </p>
              </div>
            )}

            {keywords.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  color="primary"
                  size="sm"
                  onPress={handleFetchProducts}
                  isDisabled={!keywordString}
                  className="font-medium text-xs"
                >
                  {t("pages.shoppingList.fetchProducts")}
                </Button>
                {activeKeywordString && (
                  <Button
                    variant="flat"
                    color="secondary"
                    size="sm"
                    onPress={() => mutate()}
                    isDisabled={isLoading}
                    className="font-medium text-xs"
                  >
                    {t("pages.shoppingList.refreshResults")}
                  </Button>
                )}
              </div>
            )}
          </CardBody>
        </Card>

        {!hasLocation && (
          <Card
            className="border border-warning-200 bg-warning-50/50"
            shadow="none"
          >
            <CardBody className="flex flex-row items-center gap-3 py-4">
              <MapPin size={20} className="text-warning-600 shrink-0" />
              <p className="text-sm font-medium text-warning-700">
                {t("pages.shoppingList.locationMissing")}
              </p>
            </CardBody>
          </Card>
        )}

        <div className="space-y-6">{renderResults()}</div>
      </div>
    </>
  );
};

const LoadingCarousel = () => {
  return (
    <Card shadow="sm" className="border border-default-200">
      <CardBody className="p-4">
        {/* Top title skeleton */}
        <div className="flex flex-col gap-2 mb-4">
          <div className="h-5 w-32 rounded-lg bg-default-200 animate-pulse" />
          <div className="h-3 w-24 rounded-lg bg-default-100 animate-pulse" />
        </div>

        {/* Slider with proper constraints */}
        <div className="w-full overflow-hidden">
          <Swiper
            modules={[Navigation]}
            navigation={true}
            spaceBetween={10}
            slidesPerView={2}
            breakpoints={{
              576: { slidesPerView: 3 },
              768: { slidesPerView: 4 },
              1024: { slidesPerView: 5 },
              1280: { slidesPerView: 6 },
              1536: { slidesPerView: 7 },
            }}
          >
            {Array.from({ length: 7 }).map((_, index) => (
              <SwiperSlide key={`loading-${index}`}>
                <ProductCardSkeleton />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </CardBody>
    </Card>
  );
};

const KeywordCarousel = ({
  section,
  title,
  countLabel,
}: {
  section: KeywordSearch;
  title: string;
  countLabel: string;
}) => {
  const { t, i18n } = useTranslation();
  const prevRef = useRef<HTMLButtonElement | null>(null);
  const nextRef = useRef<HTMLButtonElement | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const currentLang = i18n.resolvedLanguage || i18n.language;
  const rtl = isRTL(currentLang);

  return (
    <Card shadow="sm" className="border border-default-200 w-full max-w-full">
      <CardBody className="p-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="space-y-0.5">
            <h3 className="text-base font-semibold text-default-900">
              {title}
            </h3>
            <p className="text-xs text-default-500">{countLabel}</p>
          </div>
          <Link
            href={`/products/search?q=${section.keyword}`}
            className="text-xs sm:text-sm"
            title={t("see_all")}
          >
            {t("see_all")}
          </Link>
        </div>

        <div className="relative group w-full">
          <Button
            isIconOnly
            ref={prevRef}
            size="sm"
            className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-20 bg-background border border-default-300 shadow-lg transition-all duration-200 hidden sm:flex ${
              isBeginning
                ? "opacity-0 pointer-events-none"
                : "opacity-0 group-hover:opacity-100 hover:scale-110"
            }`}
            aria-label="Previous"
            radius="lg"
          >
            <ChevronLeft size={20} className="text-default-700" />
          </Button>

          <Button
            isIconOnly
            ref={nextRef}
            size="sm"
            className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-20 bg-background border border-default-300 shadow-lg transition-all duration-200 hidden sm:flex ${
              isEnd
                ? "opacity-0 pointer-events-none"
                : "opacity-0 group-hover:opacity-100 hover:scale-110"
            }`}
            aria-label="Next"
            radius="lg"
          >
            <ChevronRight size={20} className="text-default-700" />
          </Button>

          <div className="w-full overflow-hidden">
            <Swiper
              key={rtl ? "rtl-sl" : "ltr-sl"}
              dir={rtl ? "rtl" : "ltr"}
              slidesPerView={2}
              spaceBetween={12}
              breakpoints={{
                640: { slidesPerView: 3, spaceBetween: 12 },
                1024: { slidesPerView: 4, spaceBetween: 12 },
                1280: { slidesPerView: 5, spaceBetween: 12 },
                1440: { slidesPerView: 6, spaceBetween: 12 },
                1600: { slidesPerView: 7, spaceBetween: 12 },
              }}
              modules={[Navigation]}
              onBeforeInit={(swiper) => {
                swiper.params.navigation = {
                  ...(swiper.params.navigation as Object),
                  prevEl: prevRef.current,
                  nextEl: nextRef.current,
                };
              }}
              navigation={true}
              onSwiper={(swiper) => {
                swiper.navigation.init();
                swiper.navigation.update();
                setIsBeginning(swiper.isBeginning);
                setIsEnd(swiper.isEnd);
              }}
              onSlideChange={(swiper) => {
                setIsBeginning(swiper.isBeginning);
                setIsEnd(swiper.isEnd);
              }}
            >
              {section.products?.map((product) => (
                <SwiperSlide key={product.id}>
                  <ProductCard product={product} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export const getServerSideProps: GetServerSideProps | undefined = isSSR()
  ? async (context) => {
      try {
        await loadTranslations(context);

        const settings = await getSettings();

        return {
          props: {
            initialSettings: settings?.data ?? null,
          },
        };
      } catch (error) {
        console.error("Error loading shopping list page:", error);
        return {
          props: {
            initialSettings: null,
          },
        };
      }
    }
  : undefined;

const ShoppingListPage = dynamic(
  () => Promise.resolve(ShoppingListPageComponent),
  {
    ssr: false,
  }
);

export default ShoppingListPage;
