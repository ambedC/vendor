"use client";

import { FC, useState } from "react";
import { addToast, Button, Image } from "@heroui/react";
import Link from "next/link";
import { Trash2, ShoppingCart } from "lucide-react";
import { getSaveForLaterItems, removeItemFromCart } from "@/routes/api";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import { updateCartData } from "@/helpers/updators";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { useTranslation } from "react-i18next";
import useSWR from "swr";
import { useSettings } from "@/contexts/SettingsContext";
import { Swiper, SwiperSlide } from "swiper/react";
import { Scrollbar } from "swiper/modules";
import { handleAddToCart, isRTL } from "@/helpers/functionalHelpers";
import { CartItem } from "@/types/ApiResponse";
import Lightbox from "yet-another-react-lightbox";

const SaveForLaterItems: FC<{ moreProductsInline: boolean }> = ({
  moreProductsInline = false ,
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.resolvedLanguage || i18n.language;
  const rtl = isRTL(currentLang);
  const { currencySymbol } = useSettings();
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const isLoading = useSelector((state: RootState) => state?.cart?.isLoading);
  const [moveLoading, setMoveLoading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<{ src: string }[]>([]);

  const isLoggedIn = useSelector((state: RootState) => state?.auth?.isLoggedIn);

  const swrKey = isLoggedIn ? "/save-for-later" : null;

  const {
    data: itemsData,
    isLoading: isLoadingItems,
    mutate,
  } = useSWR(swrKey, () => getSaveForLaterItems(), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const items = itemsData?.data?.items || [];

  const handleRemoveItem = async () => {
    if (!selectedItemId) return;
    try {
      const response = await removeItemFromCart(selectedItemId);
      if (response.success) {
        mutate();
        addToast({
          title: t("cartItems.itemRemoved.title"),
          description: t("cartItems.itemRemoved.description"),
          color: "success",
        });
      } else {
        addToast({
          title: t("cartItems.removeFailed.title"),
          description:
            response.message || t("cartItems.removeFailed.description"),
          color: "danger",
        });
      }
    } catch (error) {
      console.error(error);
      addToast({
        title: t("cartItems.networkError.title"),
        description: t("cartItems.networkError.description"),
        color: "danger",
      });
    } finally {
      setSelectedItemId(null);
      updateCartData(true, false);
    }
  };

  // 🟩 Placeholder: Move item to cart logic
  const handleMoveToCart = async (item: CartItem) => {
    setMoveLoading(true);
    try {
      const res = await handleAddToCart({
        product_variant_id: item.product_variant_id,
        onClose: () => {},
        quantity: item.quantity,
        store_id: item.store_id,
        renderToast: false,
        replace_quantity: true,
      });

      if (res && typeof res !== "string" && "success" in res && "data" in res) {
        addToast({
          title: t("saveForLater.moveSuccess.title"),
          description: t("saveForLater.moveSuccess.description"),
          color: "success",
        });

        mutate();
        updateCartData(true, false);
      } else {
        addToast({
          title: t("saveForLater.moveFailed.title"),
          description: t("saveForLater.moveFailed.description"),
          color: "danger",
        });
      }
    } catch (error) {
      console.error(error);
      addToast({
        title: t("saveForLater.moveFailed.title"),
        description: t("saveForLater.moveFailed.description"),
        color: "danger",
      });
    } finally {
      setMoveLoading(false);
    }
  };

  if (!isLoggedIn || isLoadingItems || items.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-default-50 rounded-xl p-4 border border-default-200">
      <h2 className="text-lg font-semibold mb-3">
        {t("saveForLater.title") || "Saved for Later"}
      </h2>

      <Swiper
        key={rtl ? "rtl-sfl" : "ltr-sfl"}
        dir={rtl ? "rtl" : "ltr"}
        modules={[Scrollbar]}
        scrollbar={{ draggable: true }}
        spaceBetween={16}
        slidesPerView={2}
        breakpoints={{
          640: { slidesPerView: moreProductsInline ? 4 : 3 },
          768: { slidesPerView: moreProductsInline ? 5 : 4 },
          1024: { slidesPerView: moreProductsInline ? 6 : 5 },
          1440: { slidesPerView: moreProductsInline ? 7 : 6 },
        }}
        className="pb-4"
      >
        {items.map((item) => (
          <SwiperSlide key={item.id}>
            <div className="flex flex-col bg-white dark:bg-default-100 border border-default-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-3">
              <div className="relative w-full flex justify-center">
                <Image
                  loading="lazy"
                  src={item.product.image}
                  alt={item.variant.title || ""}
                  className="w-24 h-24 object-contain rounded-lg cursor-pointer"
                  onClick={() => {
                    setLightboxImages([{ src: item.product.image }]);
                    setLightboxOpen(true);
                  }}
                />

                <Button
                  title={t("remove_item")}
                  className="absolute z-50 top-0 right-0 bg-transparent rounded-full"
                  size="sm"
                  isDisabled={isLoading}
                  isIconOnly
                  startContent={
                    <Trash2 size={16} className="text-danger-500" />
                  }
                  onPress={() => setSelectedItemId(item.id)}
                />
              </div>

              <div className="mt-2 text-center">
                <h3 className="text-xs font-medium line-clamp-1">
                  <Link
                    href={`/products/${item.product.slug}`}
                    title={item.variant.title || ""}
                  >
                    {item.variant.title}
                  </Link>
                </h3>

                {item.addons && item.addons.length > 0 && (
                  <div className="text-[10px] text-foreground/40 leading-tight mt-0.5 break-words line-clamp-1 flex flex-wrap gap-x-1 justify-center">
                    {item.addons.map((addon: any, i: number) => {
                      const addonPrice = Number(
                        addon.price || addon.item?.price || 0,
                      );
                      return (
                        <span key={i} className="flex items-center">
                          {addon.title || addon.item?.title}
                          {addonPrice > 0 && (
                            <span className="ml-0.5 opacity-80 font-medium">
                              ({currencySymbol}
                              {addonPrice.toFixed(2)})
                            </span>
                          )}
                          {i < item.addons!.length - 1 && ","}
                        </span>
                      );
                    })}
                  </div>
                )}


                <p className="text-xs text-foreground/60 mt-1">
                  {item.total_item_special_price &&
                  item.total_item_special_price !== item.total_item_price ? (
                    <>
                      <span className="text-foreground font-medium">
                        {currencySymbol} {item.total_item_special_price}
                      </span>
                      <span className="text-foreground/40 line-through ml-2">
                        {currencySymbol} {item.total_item_price}
                      </span>
                    </>
                  ) : (
                    <span className="text-foreground font-medium">
                      {currencySymbol} {item.total_item_price || item.variant.price}
                    </span>
                  )}
                </p>

                {/* 🛒 Move to Cart Button */}
                <Button
                  size="sm"
                  isDisabled={moveLoading}
                  variant="flat"
                  color="primary"
                  className="mt-2 w-full text-xs"
                  startContent={<ShoppingCart size={14} />}
                  onPress={() => handleMoveToCart(item)}
                >
                  {t("saveForLater.moveToCart")}
                </Button>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <ConfirmationModal
        isOpen={!!selectedItemId}
        onClose={() => setSelectedItemId(null)}
        onConfirm={handleRemoveItem}
        title={t("cartItems.removeItemModal.title")}
        icon={<Trash2 className="w-4 h-4" />}
        description={t("cartItems.removeItemModal.description")}
        confirmText={t("cartItems.removeItemModal.confirmText")}
        cancelText={t("cartItems.removeItemModal.cancelText")}
        variant="danger"
        alertTitle={t("cartItems.removeItemModal.alertTitle")}
        alertDescription={t("cartItems.removeItemModal.alertDescription")}
      />
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={lightboxImages}
        render={{ buttonPrev: () => null, buttonNext: () => null }}
      />
    </div>
  );
};

export default SaveForLaterItems;
