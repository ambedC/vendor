import { FC, memo } from "react";
import {
  Card,
  CardBody,
  CardFooter,
  Chip,
  Button,
  Image,
  useDisclosure,
  addToast,
  Tooltip,
} from "@heroui/react";
import { Clock, Bookmark, Star, Eye } from "lucide-react";
import RatingStars from "../RatingStars";
import { Product } from "@/types/ApiResponse";
import dynamic from "next/dynamic";
import { useSettings } from "@/contexts/SettingsContext";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import ProductIndicator from "../Functional/ProductIndicator";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { useScreenType } from "@/hooks/useScreenType";
import { useAdTracking } from "@/hooks/useAdTracking";

const WishlistModal = dynamic(
  () => import("@/components/Modals/WishlistModal"),
  { ssr: false },
);

const ProductModal = dynamic(() => import("@/components/Modals/ProductModal"), {
  ssr: false,
});

const HTMLRenderer = dynamic(
  () => import("@/components/Functional/HTMLRenderer"),
  { ssr: false },
);

const ProductCardAddButton = dynamic(
  () => import("@/components/Cards/ProductCardAddButton"),
  { ssr: false },
);

interface ProductCardProps {
  product: Product;
  hideStoreName?: boolean;
}

const ProductCard: FC<ProductCardProps> = ({
  product,
  hideStoreName = false,
}) => {
  const { currencySymbol, systemSettings, isSingleVendor } = useSettings();
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const { variants = [], indicator = null } = product;
  const router = useRouter();
  const { t } = useTranslation();
  const screen = useScreenType();
  const { elementRef, handleAdClick } = useAdTracking(product);

  const {
    isOpen: isCartOpen,
    onOpen: onCartOpen,
    onClose: onCartClose,
  } = useDisclosure();
  const {
    isOpen: isWishlistOpen,
    onOpen: onWishlistOpen,
    onClose: onWishlistClose,
  } = useDisclosure();

  const defaultVariant = variants?.find((v) => v.is_default) || variants?.[0];

  const variantCombinations = (() => {
    if (!variants || variants.length <= 1) return [];

    return variants
      .slice(0, 5)
      .map((variant) => {
        const combinations: string[] = [];

        if (variant.attributes && typeof variant.attributes === "object") {
          Object.entries(variant.attributes).forEach(([key, value]) => {
            if (value) {
              combinations.push(`${key}: ${value}`);
            }
          });
        }

        if (combinations.length === 0 && variant.title) {
          return variant.title;
        }

        return combinations.join(", ");
      })
      .filter(Boolean);
  })();

  const tooltipContent = (() => {
    if (variantCombinations.length === 0) return "";

    const displayCombinations = variantCombinations.slice(0, 4);
    const hasMore = variants.length > 4;

    return (
      <div className="max-w-xs space-y-1">
        <p className="font-semibold text-xs mb-2">{t("available_options")}</p>
        {displayCombinations.map((combo, index) => (
          <p key={index} className="text-xs">
            • {combo}
          </p>
        ))}
        {hasMore && (
          <p className="text-xs italic mt-2">
            {t("more_options", { count: variants.length - 4 })}
          </p>
        )}
      </div>
    );
  })();

  if (!defaultVariant) return null;

  const handleWishlistOpen = () => {
    if (isLoggedIn) {
      onWishlistOpen();
    } else {
      const btn = document.getElementById("login-btn");
      btn?.click();
      addToast({
        title: t("please_login"),
        color: "warning",
      });
    }
  };

  const price = Number(defaultVariant?.price) || 0;
  const specialPrice = Number(defaultVariant?.special_price) || 0;
  const hasDiscount = specialPrice > 0 && specialPrice < price;
  const discountPercentage = hasDiscount
    ? Math.round(((price - specialPrice) / price) * 100)
    : 0;

  const lowStockLimitRaw = Number(systemSettings?.lowStockLimit);
  const lowStockLimit =
    Number.isNaN(lowStockLimitRaw) || lowStockLimitRaw <= 0
      ? null
      : lowStockLimitRaw;

  const isLowStock =
    lowStockLimit !== null &&
    defaultVariant.stock > 0 &&
    defaultVariant.stock <= lowStockLimit;

  // Check if product is featured
  const isFeatured = product.featured === "1";
  const productBadge = product.badge;
  return (
    <>
      <Card
        key={product.id}
        ref={elementRef}
        as={"div"}
        className="w-full h-full border-2 border-gray-100 dark:border-default-100 hover:shadow-md transition-shadow duration-200"
        disableRipple
        isPressable={
          screen !== "mobile"
            ? !product.store_status.is_open || defaultVariant.stock !== 0
            : false
        }
        shadow="none"
        isDisabled={defaultVariant.stock === 0 && product.store_status.is_open}
        onPress={() => {
          handleAdClick();
          router.push(`/products/${product.slug}`);
        }}
      >
        <CardBody className="p-0 px-0">
          <div className="relative mb-2 flex justify-center cursor-pointer overflow-hidden">
            {product.main_image ? (
              <Link
                href={`/products/${product.slug}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAdClick();
                }}
                title={product.title}
                className="block w-full"
              >
                <Image
                  alt={product.title ?? t("product_image_alt")}
                  className={`w-full h-28 md:h-32 lg:h-36 hover:scale-105 transition-transform ${
                    product.image_fit === "cover"
                      ? "object-cover object-top"
                      : "object-contain"
                  }`}
                  src={product.main_image}
                  loading="eager"
                  removeWrapper
                  radius="none"
                />
              </Link>
            ) : (
              <div className="w-full h-28 md:h-32 lg:h-36 bg-gray-200 rounded-lg" />
            )}

            {/* Simple Ad Badge - Bottom Left */}
            {product.is_sponsored && (
              <div className="absolute bottom-2 left-2 z-30">
                <div className="bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md shadow-sm flex items-center justify-center">
                  <span className="text-[9px] font-bold text-white tracking-wider leading-none">
                    Ad
                  </span>
                </div>
              </div>
            )}

            {/* Featured Badge - Bottom Right */}
            {isFeatured && (
              <div className="absolute bottom-1 right-1 z-30">
                <Chip
                  className="text-xxs bg-linear-to-r from-secondary-300 to-secondary-400 capitalize text-white font-semibold shadow-sm tracking-wide"
                  classNames={{ base: "p-0.5 h-4", content: "p-1 text-xxs" }}
                  radius="sm"
                  startContent={<Star size={10} className="fill-current" />}
                  title={t("featured")}
                >
                  {t("featured")}
                </Chip>
              </div>
            )}



            {/* Discount + Dynamic Badge - stacked on the left */}
            <div className="absolute -top-1 -left-1 z-20 flex flex-col items-start">
              {discountPercentage > 0 && (
                <div className="inline-flex items-center bg-green-500 text-white text-xs font-medium rounded-br-lg px-3.5 py-1 mt-0.5">
                  {t("discount", { percent: discountPercentage })}
                </div>
              )}
              {productBadge && (
                <div
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold tracking-wide shadow-sm mt-1"
                  style={{
                    backgroundColor: productBadge.bg_color,
                    color: productBadge.text_color,
                    borderColor: productBadge.border_color,
                    borderWidth: productBadge.border_color ? 1 : 0,
                    borderStyle: "solid",
                    borderRadius: "0 6px 6px 0",
                  }}
                  title={productBadge.label}
                >
                  <Star size={9} className="fill-current flex-shrink-0" />
                  {productBadge.label}
                </div>
              )}
            </div>

            {/*Buttons - Top Right */}
            <div className="absolute top-1 right-1 z-20">
              <div className="flex flex-col gap-1 rounded-bl-2xl">
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  radius="full"
                  onPress={handleWishlistOpen}
                  className="bg-white dark:bg-content1 p-1.5 min-w-0 w-7 h-7"
                  title={t("pageTitle.wishlists")}
                >
                  <Bookmark
                    className={
                      Array.isArray(product.favorite) &&
                      product.favorite.length > 0
                        ? "fill-primary text-primary w-6 h-6"
                        : "text-foreground/60 w-6 h-6"
                    }
                  />
                </Button>
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  radius="full"
                  onPress={onCartOpen}
                  className="bg-white dark:bg-content1 hover:bg-white dark:hover:bg-content1 p-1.5 min-w-0 w-7 h-7"
                  title={t("quickView")}
                >
                  <Eye className="text-foreground/60 hover:text-primary w-6 h-6" />
                </Button>
              </div>
            </div>


          </div>

          <div className="w-full px-2">
            <div className="flex w-full justify-between mb-1">
              <Button
                title={`${product.estimated_delivery_time} ${t("mins")}`}
                as={"div"}
                color="primary"
                variant="flat"
                radius="sm"
                className="min-w-0 w-14 text-start  text-[9px] text-primary-500 h-4 px-1 py-0.5 gap-1"
                startContent={
                  <Clock className="text-primary-500 w-2.5 h-2.5 p-0" />
                }
              >
                {`${product.estimated_delivery_time} ${t("mins")}`}
              </Button>
              {product.variants.length > 1 && (
                <Tooltip
                  content={tooltipContent}
                  placement="top"
                  delay={300}
                  closeDelay={0}
                  classNames={{
                    content:
                      "bg-content1 border border-default-200 shadow-lg py-2 px-3",
                  }}
                >
                  <div className="bg-warning-100 text-warning-600 py-0.5 px-1 rounded-md text-[9px] flex items-center gap-1">
                    <span>
                      {t("choices", { count: product.variants.length })}
                    </span>
                  </div>
                </Tooltip>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-col">
                <div className="flex items-start gap-0">
                  <ProductIndicator indicator={indicator} size={12} />
                  <Link
                    href={`/products/${product.slug}`}
                    className={`text-xs font-semibold ${isLowStock ? "line-clamp-1 min-h-4" : "line-clamp-2 min-h-8"} `}
                    title={product.title}
                    onClick={handleAdClick}
                  >
                    {product.title ?? t("untitled_product")}
                  </Link>
                </div>
                {isLowStock && (
                  <span className="text-xxs text-orange-500 font-semibold whitespace-nowrap max-h-4">
                    {t("product_modal.low_stock_alert", {
                      stock: defaultVariant.stock,
                    })}
                  </span>
                )}
              </div>

              <HTMLRenderer
                html={product.description ?? ""}
                className="text-xxs text-foreground/50 line-clamp-2 min-h-6 hidden"
              />
            </div>

            {(product.ratings !== undefined ||
              product.variants?.[0]?.store_name) && (
              <div className="flex items-center justify-between gap-2">
                {product.ratings !== undefined && (
                  <div className="flex items-center gap-1">
                    {/* Desktop / Tablet – Full stars */}
                    <div className="hidden sm:flex gap-0.5">
                      <RatingStars rating={Number(product.ratings)} size={12} />
                    </div>

                    {/* Mobile – Single star + rating */}
                    <div className="flex sm:hidden items-center gap-1">
                      <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
                      <span className="text-xxs font-medium">
                        {Number(product.ratings).toFixed(1)}
                      </span>
                    </div>

                    {/* Rating count – keep for all */}
                    <span className="text-xxs text-gray-500">
                      ({product.rating_count ?? 0})
                    </span>
                  </div>
                )}

                {product.variants?.[0]?.store_name &&
                  !hideStoreName &&
                  !isSingleVendor && (
                    <Link
                      href={`/stores/${product.variants?.[0]?.store_slug}`}
                      className="text-xxs text-foreground/60 font-medium truncate "
                      onClick={(e) => e.stopPropagation()}
                      title={product.variants[0].store_name}
                    >
                      {product.variants[0].store_name}
                    </Link>
                  )}
              </div>
            )}
          </div>
        </CardBody>
        <CardFooter className="flex items-center justify-between w-full pt-2">
          <div className="flex items-center gap-2">
            {hasDiscount ? (
              <div className="flex flex-col">
                <span className="text-xs md:text-sm font-semibold">
                  {currencySymbol}
                  {specialPrice.toFixed(2)}
                </span>
                <span className="text-xxs md:text-xs opacity-50 line-through relative top-0.5">
                  {currencySymbol}
                  {price.toFixed(2)}
                </span>
              </div>
            ) : (
              <div className="flex flex-col">
                <span className="text-xs md:text-sm font-semibold">
                  {currencySymbol}
                  {price.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Store Closed + Out of Stock + Normal Add-to-Cart */}
          {!product.store_status?.is_open ? (
            <div className="flex flex-col items-end">
              <span className="text-orange-500 font-medium text-xs sm:text-sm">
                {t("store_closed")}
              </span>
              {product.store_status?.next_opening_time && (
                <span className="text-xxs text-foreground/60">
                  {t("opens_at", {
                    time: product.store_status.next_opening_time,
                  })}
                </span>
              )}
            </div>
          ) : !defaultVariant.availability || defaultVariant.stock === 0 ? (
            <span className="text-red-500 font-medium text-xxs sm:text-sm w-full text-end">
              {t("out_of_stock")}
            </span>
          ) : (
            <ProductCardAddButton
              product={product}
              defaultVariant={defaultVariant}
              onOpenModal={onCartOpen}
            />
          )}
        </CardFooter>
      </Card>

      {isCartOpen && (
        <ProductModal
          isOpen={isCartOpen}
          onClose={onCartClose}
          product={product}
        />
      )}

      {isWishlistOpen && (
        <WishlistModal
          isOpen={isWishlistOpen}
          onClose={onWishlistClose}
          productId={product.id}
          productVariantId={defaultVariant.id}
          storeId={defaultVariant.store_id}
          favorite={product.favorite}
        />
      )}
    </>
  );
};

export default memo(ProductCard);
