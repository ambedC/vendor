import React, {
  useRef,
  memo,
  useCallback,
  useEffect,
  useState,
  useMemo,
} from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Input,
  Button,
  Spinner,
  ModalFooter,
  ScrollShadow,
} from "@heroui/react";
import { Search, X, MapPin, AlertCircle } from "lucide-react";
import { Product } from "@/types/ApiResponse";
import { useTranslation } from "react-i18next";
import { getCookie } from "@/lib/cookies";
import { UserLocation } from "../Location/types/LocationAutoComplete.types";
import { useSettings } from "@/contexts/SettingsContext";
import KeywordItem from "./KeywordItem";
import SearchProductCard from "./SearchProductCard";
import RecentSearchItem from "./RecentSearchItem";
import Link from "next/link";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import Image from "next/image";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  searchResults: Product[];
  keywords?: string[];
  isLoading: boolean;
  isTyping: boolean;
  hasError: boolean;
  recentSearches: string[];
  handleClearSearch: (e?: React.MouseEvent) => void;
  handleInputChange: (val: string) => void;
  handleSearchSubmit: (query?: string) => void;
  handleProductClick: (product: Product) => void;
  handleChipClick: (searchTerm: string) => void;
  formatDeliveryTime: (time: number | null) => string;
  handleRemoveSearch?: (searchTerm: string, e: React.MouseEvent) => void;
  handleClearAllSearches?: () => void;
}

// Small components have been extracted to separate files for readability

const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  searchQuery,
  searchResults,
  keywords = [],
  isLoading,
  isTyping,
  hasError,
  recentSearches,
  handleClearSearch,
  handleInputChange,
  handleSearchSubmit,
  handleProductClick,
  handleChipClick,
  formatDeliveryTime,
  handleRemoveSearch,
  handleClearAllSearches,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const selectedLocation = getCookie("userLocation") as UserLocation;
  const recentlyViewedProducts = useSelector(
    (state: RootState) => state.recentlyViewed.products,
  );

  // keyboard navigation state for suggestions
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const itemsRef = useRef<Array<HTMLDivElement | null>>([]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const kc = keywords ? keywords.length : 0;
      const rc = searchResults ? searchResults.length : 0;
      const total = searchQuery ? kc + rc : 0;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (total === 0) return;
        setActiveIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (total === 0) return;
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
        return;
      }

      if (e.key === "Enter") {
        if (activeIndex >= 0 && total > 0) {
          if (activeIndex < kc) {
            const kw = keywords[activeIndex];
            if (kw) {
              handleInputChange(kw);
              handleSearchSubmit(kw);
            }
          } else {
            const prod = searchResults[activeIndex - kc];
            if (prod) {
              handleProductClick(prod);
            }
          }
          onClose();
          return;
        }
        handleSearchSubmit();
      }
    },
    [
      activeIndex,
      keywords,
      searchResults,
      searchQuery,
      handleProductClick,
      handleSearchSubmit,
      handleInputChange,
      onClose,
    ],
  );

  const { homeGeneralSettings } = useSettings();
  const placeholders = useMemo<string[]>(() => {
    const SearchPlaceHolders = homeGeneralSettings?.searchLabels || [];
    if (Array.isArray(SearchPlaceHolders) && SearchPlaceHolders.length > 0) {
      return SearchPlaceHolders;
    }
    return [t("search_placeholder")];
  }, [homeGeneralSettings?.searchLabels, t]);

  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [animationState, setAnimationState] = useState<
    "enter" | "stay" | "exit"
  >("enter");

  useEffect(() => {
    if (!placeholders || placeholders.length <= 1) {
      setTimeout(() => {
        setAnimationState("stay");
      }, 0);
      return;
    }

    const enterDuration = 500;
    const stayDuration = 2000;
    const exitDuration = 500;

    setTimeout(() => {
      setAnimationState("enter");
    }, 0);

    const stayTimer = setTimeout(
      () => setAnimationState("stay"),
      enterDuration,
    );
    const exitTimer = setTimeout(
      () => setAnimationState("exit"),
      enterDuration + stayDuration,
    );
    const nextTimer = setTimeout(
      () => {
        setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        setAnimationState("enter");
      },
      enterDuration + stayDuration + exitDuration,
    );

    return () => {
      clearTimeout(stayTimer);
      clearTimeout(exitTimer);
      clearTimeout(nextTimer);
    };
  }, [placeholderIndex, placeholders]);

  // reset active index when lists change and clear refs
  useEffect(() => {
    // clear refs immediately
    itemsRef.current = [];

    // schedule active index reset after render to avoid cascading renders
    const timer = setTimeout(() => {
      setActiveIndex(-1);
    }, 0);

    return () => clearTimeout(timer);
  }, [searchQuery, keywords, searchResults]);

  // scroll highlighted item into view
  useEffect(() => {
    if (activeIndex >= 0) {
      const el = itemsRef.current[activeIndex];
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    }
  }, [activeIndex]);

  const getOpacity = () => (animationState === "stay" ? 1 : 0);

  // Handle keyword click to populate search
  const handleKeywordClick = useCallback(
    (keyword: string) => {
      handleInputChange(keyword);
      handleSearchSubmit(keyword);
      onClose();
    },
    [handleInputChange, handleSearchSubmit, onClose],
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Spinner size="lg" color="primary" />
            <p className="text-foreground/50 text-sm">
              {t("searching_products")}
            </p>
          </div>
        </div>
      );
    }

    if (hasError) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-danger" />
          <h4 className="text-lg font-medium mb-2">
            {t("something_went_wrong")}
          </h4>
          <p className="text-foreground/70 text-sm mb-4">
            {t("search_error_message")}
          </p>
          <Button
            color="primary"
            variant="flat"
            size="sm"
            onPress={() => handleClearSearch()}
          >
            {t("try_again")}
          </Button>
        </div>
      );
    }

    // Show search results with keywords as suggestions at top
    if (searchQuery) {
      // Show keywords as suggestions when typing or when there are results
      if ((keywords && keywords.length > 0) || searchResults.length > 0) {
        return (
          <div className="flex flex-col h-full">
            {/* Keywords Section */}
            {keywords && keywords.length > 0 && (
              <div className="border-b border-divider">
                <div className="px-4 py-2 bg-default-50 text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                  {t("search_keywords")} ({keywords.length})
                </div>
                <div className="max-h-[200px] overflow-y-auto">
                  {keywords.map((kw, idx) => (
                    <div
                      key={kw + idx}
                      ref={(el) => {
                        itemsRef.current[idx] = el;
                      }}
                    >
                      <KeywordItem
                        keyword={kw}
                        onClick={handleKeywordClick}
                        isActive={activeIndex === idx}
                        onMouseEnter={() => setActiveIndex(idx)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Products Section */}
            {searchResults.length > 0 && (
              <div className="flex-1 overflow-hidden">
                <div className="px-4 py-2 bg-default-50 text-xs font-semibold text-foreground/60 uppercase tracking-wide flex items-center justify-between">
                  <span>{t("search_results")}</span>
                  <Link
                    href={`/products/search?q=${searchQuery}`}
                    onClick={onClose}
                  >
                    {t("see_all")}
                  </Link>
                </div>
                <ScrollShadow className="h-full max-h-[50vh] overflow-y-auto">
                  {searchResults.map((product, pIdx) => {
                    const idx = (keywords ? keywords.length : 0) + pIdx;
                    return (
                      <div
                        key={product.id}
                        ref={(el) => {
                          itemsRef.current[idx] = el;
                        }}
                      >
                        <SearchProductCard
                          product={product}
                          onProductClick={handleProductClick}
                          formatDeliveryTime={formatDeliveryTime}
                          searchQuery={searchQuery}
                          isActive={activeIndex === idx}
                          onMouseEnter={() => setActiveIndex(idx)}
                          onClose={onClose}
                        />
                      </div>
                    );
                  })}
                </ScrollShadow>
              </div>
            )}

            {/* No results state */}
            {searchResults.length === 0 &&
              keywords.length === 0 &&
              !isTyping && (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 mx-auto mb-4 text-foreground/30" />
                  <h4 className="text-lg font-medium mb-2">
                    {t("no_products_found")}
                  </h4>
                  <p className="text-foreground/70 text-sm mb-4">
                    {t("no_products_found_message", { query: searchQuery })}
                  </p>
                  <Button
                    color="primary"
                    variant="flat"
                    size="sm"
                    onPress={() => handleClearSearch()}
                    startContent={<X className="w-4 h-4" />}
                  >
                    {t("clear_search")}
                  </Button>
                </div>
              )}
          </div>
        );
      }

      if (isTyping || searchQuery.length < 2) {
        return (
          <div className="text-center py-12">
            <Search className="w-16 h-16 mx-auto mb-4 text-foreground/30" />
            <h4 className="text-lg font-medium mb-2">
              {isTyping ? t("keep_typing") : t("type_at_least_2_chars")}
            </h4>
            <p className="text-foreground/70 text-sm">
              {isTyping ? t("typing_message") : t("enter_min_2_chars")}
            </p>
          </div>
        );
      }
    }

    // Show recent searches and recently viewed when no query
    if (recentSearches.length > 0 || recentlyViewedProducts.length > 0) {
      return (
        <ScrollShadow className="h-full max-h-[60vh]">
          {recentSearches.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-default-50 text-xs font-semibold text-foreground/60 uppercase tracking-wide flex items-center justify-between">
                <span>{t("recent_searches")}</span>
                {handleClearAllSearches && (
                  <Button
                    size="sm"
                    variant="light"
                    onPress={handleClearAllSearches}
                    className="text-xs h-6 min-w-0 px-2"
                  >
                    {t("clear_all")}
                  </Button>
                )}
              </div>
              <div className="mb-2">
                {recentSearches.map((searchTerm, index) => (
                  <RecentSearchItem
                    key={`${searchTerm}-${index}`}
                    searchTerm={searchTerm}
                    onChipClick={handleChipClick}
                    onRemoveSearch={handleRemoveSearch}
                  />
                ))}
              </div>
            </div>
          )}

          {recentlyViewedProducts.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-default-50 text-xs font-semibold text-foreground/60 uppercase tracking-wide">
                {t("home.recently_viewed.title")}
              </div>
              <ScrollShadow className="max-h-[180px]">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 px-4 py-2">
                  {recentlyViewedProducts.map((product: Product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-2 p-2 rounded-lg cursor-pointer group hover:bg-default-100 transition-colors border border-transparent hover:border-divider"
                      onClick={() => {
                        handleProductClick(product);
                        onClose();
                      }}
                    >
                      <div className="w-10 h-10 shrink-0 relative overflow-hidden rounded-md bg-default-100 border border-divider">
                        <Image
                          src={product.main_image}
                          alt={product.title}
                          height={40}
                          width={40}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-xs font-medium text-foreground/80 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                        {product.title}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollShadow>
            </div>
          )}
        </ScrollShadow>
      );
    }

    // Empty state
    return (
      <div className="text-center py-12">
        <Search className="w-16 h-16 mx-auto mb-4 text-foreground/30" />
        <h4 className="text-lg font-medium mb-2">{t("search_products")}</h4>
        <p className="text-foreground/70 text-sm">
          {t("start_typing_to_search")}
        </p>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      placement="top-center"
      size="2xl"
      scrollBehavior="inside"
      classNames={{
        base: "min-h-[100vh] sm:min-h-[20vh] md:max-h-[80vh]",
        header: "border-b border-divider pb-4",
        body: "p-0",
        footer: "border-t border-divider",
      }}
      motionProps={{
        variants: {
          enter: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.3, ease: "easeOut" },
          },
          exit: {
            y: -20,
            opacity: 0,
            transition: { duration: 0.2, ease: "easeIn" },
          },
        },
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-3 px-6">
              <h3 className="text-lg font-semibold">{t("search_products")}</h3>
              <div className="relative">
                <Input
                  ref={inputRef}
                  value={searchQuery}
                  onValueChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  size="md"
                  startContent={
                    <Search className="w-5 h-5 text-foreground/40" />
                  }
                  endContent={
                    searchQuery && (
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleClearSearch()}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )
                  }
                  classNames={{
                    inputWrapper: "",
                    input: "text-base",
                  }}
                />

                {/* Animated Placeholder */}
                {!searchQuery && (
                  <span
                    aria-hidden
                    key={placeholderIndex}
                    className="absolute left-12 top-8 -translate-y-1/2 text-foreground/40 truncate max-w-[calc(100%-120px)] text-sm pointer-events-none transition-all duration-500 ease-in-out"
                    style={{
                      transform: `translateY(calc(-50% + ${
                        animationState === "enter"
                          ? "10px"
                          : animationState === "exit"
                            ? "-10px"
                            : "0px"
                      }))`,
                      opacity: getOpacity(),
                    }}
                  >
                    {String(placeholders?.[placeholderIndex] ?? "")
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase()) || "Search"}
                  </span>
                )}
              </div>
            </ModalHeader>

            <ModalBody className="overflow-hidden">{renderContent()}</ModalBody>

            <ModalFooter className="flex items-center justify-start w-full border-t border-gray-100 dark:border-default-100">
              {selectedLocation ? (
                <div className="flex items-center text-sm text-foreground/50">
                  <MapPin className="w-4 h-4 mr-1" />
                  {selectedLocation?.placeName ? (
                    <div className="flex justify-start gap-2 items-center">
                      <span className="whitespace-nowrap block">
                        {t("delivering_to")}
                      </span>
                      <span className="text-primary-500 max-w-[150px] sm:max-w-md md:max-w-lg overflow-hidden text-ellipsis whitespace-nowrap block">
                        {selectedLocation.lat && selectedLocation.lng ? (
                          <a
                            href={`https://www.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {selectedLocation.placeName}
                            {selectedLocation?.placeDescription
                              ? `, ${selectedLocation.placeDescription}`
                              : ""}
                          </a>
                        ) : (
                          <>
                            {selectedLocation.placeName}
                            {selectedLocation?.placeDescription
                              ? `, ${selectedLocation.placeDescription}`
                              : ""}
                          </>
                        )}
                      </span>
                    </div>
                  ) : (
                    t("delivering_to_your_location")
                  )}
                </div>
              ) : (
                <div className="flex items-center text-sm text-foreground/50">
                  <MapPin className="w-4 h-4 mr-1" />
                  {t("delivering_to_your_location")}
                </div>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default memo(SearchModal);
