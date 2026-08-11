import { FC, useState, useMemo } from "react";
import { CartItem, Product, ProductVariant } from "@/types/ApiResponse";
import {
  addToast,
  Button,
  Chip,
  Divider,
  Image,
  ScrollShadow,
  useDisclosure,
} from "@heroui/react";
import Link from "next/link";
import { CheckCircle, Trash2, XCircle, Bookmark } from "lucide-react";
import CartQuantityControl from "@/components/CartQuantityControl";
import {
  removeItemFromCart,
  saveCartItemToSaveForLater,
  getProductBySlug,
} from "@/routes/api";
import dynamic from "next/dynamic";
import { ChevronRight } from "lucide-react";

const ProductModal = dynamic(() => import("@/components/Modals/ProductModal"), {
  ssr: false,
});
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import { updateCartData } from "@/helpers/updators";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { useTranslation } from "react-i18next";
import Lightbox from "yet-another-react-lightbox";
import { mutate } from "swr";
import { useSettings } from "@/contexts/SettingsContext";
import AttachmentUploader from "@/components/Cart/AttachmentUploader";
import type { AttachmentFile } from "@/components/Cart/AttachmentUploader";
import { getCookie } from "@/lib/cookies";
import { UserLocation } from "@/components/Location/types/LocationAutoComplete.types";

interface CartItemsProps {
  items: CartItem[];
  currencySymbol: string;
}

const CartItems: FC<CartItemsProps> = ({ items = [], currencySymbol = "" }) => {
  const { t } = useTranslation();
  const { systemSettings, isSingleVendor } = useSettings();
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const isLoading = useSelector((state: RootState) => state.cart.isLoading);
  // Local state for attachments: Record<productId, AttachmentFile[]>
  const [attachments, setAttachments] = useState<
    Record<number, AttachmentFile[]>
  >({});
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<{ src: string }[]>([]);
  const {
    isOpen: isModalOpen,
    onOpen: onModalOpen,
    onClose: onModalClose,
  } = useDisclosure();
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(
    null,
  );
  const [customizingVariant, setCustomizingVariant] =
    useState<ProductVariant | null>(null);
  const [initialAddons, setInitialAddons] = useState<Record<number, number[]>>(
    {},
  );
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [editingCartItemId, setEditingCartItemId] = useState<
    number | string | null
  >(null);
  const [editingQuantity, setEditingQuantity] = useState<number>(1);

  // Store attachments in parent component or context
  // Export this for checkout validation
  if (typeof window !== "undefined") {
    (window as any).__cartAttachments = attachments;
  }

  const lowStockLimit = Number(systemSettings?.lowStockLimit || 0) || null;

  // Group items by store
  const groupedItems = useMemo(() => {
    const grouped = items.reduce(
      (acc, item) => {
        const storeId = item.store.id;
        if (!acc[storeId]) {
          acc[storeId] = {
            store: item.store,
            items: [],
          };
        }
        acc[storeId].items.push(item);
        return acc;
      },
      {} as Record<number, { store: CartItem["store"]; items: CartItem[] }>,
    );

    return Object.values(grouped);
  }, [items]);

  const handleRemoveItem = async () => {
    if (!selectedItemId) return;

    try {
      const response = await removeItemFromCart(selectedItemId);
      if (response.success) {
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
      await updateCartData(true, true);
      document.getElementById("refetch-similar-products")?.click();
    }
  };

  // Placeholder for "Save for Later"
  const handleSaveForLater = async (itemId: number, quantity: number) => {
    try {
      const res = await saveCartItemToSaveForLater(itemId, quantity);
      if (res.success) {
        mutate("/save-for-later");
        updateCartData(true, false);
        addToast({
          title: t("saveForLater.movedMessage"),
          color: "success",
        });
      } else {
        addToast({
          title: t("saveForLater.errorMessage"),
          color: "success",
        });
      }
    } catch (error) {
      console.error(error);
      addToast({
        title: t("cartItems.networkError.title"),
        description: t("cartItems.networkError.description"),
        color: "danger",
      });
    }
  };

  // Handle attachment change for a single product
  const handleAttachmentChange = (
    productId: number,
    attachmentFiles: AttachmentFile[],
  ) => {
    setAttachments((prev) => ({
      ...prev,
      [productId]: attachmentFiles,
    }));
  };

  const handleCustomize = async (item: CartItem) => {
    setIsCustomizing(true);
    const userLocation = getCookie("userLocation") as UserLocation;
    try {
      const res = await getProductBySlug({
        slug: item.product.slug,
        latitude: userLocation?.lat,
        longitude: userLocation?.lng,
      });
      if (res.success && res.data) {
        setCustomizingProduct(res.data);
        const variant = res.data.variants.find(
          (v) => v.id === item.product_variant_id,
        );
        setCustomizingVariant(variant || null);

        // Convert cart addons back to modal format
        const addonsMap =
          item.addons?.reduce(
            (acc, addon) => {
              if (!acc[addon.addon_group_id]) acc[addon.addon_group_id] = [];
              acc[addon.addon_group_id].push(addon.addon_item_id);
              return acc;
            },
            {} as Record<number, number[]>,
          ) || {};

        setInitialAddons(addonsMap);
        setEditingCartItemId(item.id);
        setEditingQuantity(item.quantity);
        onModalOpen();
      }
    } catch (error) {
      console.error(error);
      addToast({
        title: t("general.error.title"),
        description: t("general.error.somethingWentWrong"),
        color: "danger",
      });
    } finally {
      setIsCustomizing(false);
    }
  };

  return (
    <ScrollShadow className="w-full max-h-[50vh] py-1 flex flex-col gap-6">
      {groupedItems.length > 0 &&
        groupedItems.map((group) => (
          <div
            key={group.store.id}
            className="bg-default-50 rounded-lg p-4 border border-default-200"
          >
            {/* Store Header */}
            {!isSingleVendor && (
              <div className="mb-4 pb-3 border-b border-default-200 flex gap-1 w-full justify-between flex-wrap sm:flex-nowrap">
                <div className="flex gap-1 flex-wrap sm:flex-nowrap">
                  <span className="text-sm text-foreground inline-flex items-center gap-1">
                    {t("cartItems.from")}:
                  </span>
                  <Link
                    href={`/stores/${group.store.slug}`}
                    className="text-xs sm:text-sm font-semibold text-foreground inline-flex items-center gap-1"
                    title={group.store.name}
                  >
                    {group.store.name}
                  </Link>
                </div>

                <Chip
                  variant="flat"
                  color={group.store.status.is_open ? "success" : "danger"}
                  radius="full"
                  size="sm"
                  startContent={
                    group.store.status.is_open ? (
                      <CheckCircle size={12} />
                    ) : (
                      <XCircle size={12} />
                    )
                  }
                  className="font-medium text-xs px-2"
                >
                  {group.store.status.is_open
                    ? t("soldBySection.open")
                    : t("soldBySection.closed")}
                </Chip>
              </div>
            )}

            {/* Items in this store */}
            <div className="flex flex-col gap-3">
              {group.items.map((item, itemIndex) => {
                const isLowStock =
                  lowStockLimit !== null &&
                  item.variant.stock > 0 &&
                  item.variant.stock <= lowStockLimit;

                return (
                  <div key={item.id}>
                    {/* Main Item Row */}
                    <div className="flex items-start space-x-2 sm:space-x-3 py-2">
                      {/* Product Image - Smaller on mobile */}
                      <div className="w-16 sm:w-[25%] shrink-0 flex justify-center">
                        <Image
                          loading="eager"
                          src={item.product.image}
                          alt={item.variant.title || ""}
                          className="w-16 h-16 sm:w-full sm:h-16 object-cover rounded-md cursor-pointer"
                          onClick={() => {
                            setLightboxImages([{ src: item.product.image }]);
                            setLightboxOpen(true);
                          }}
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 flex flex-col gap-1 min-w-0">
                        <h3 className="font-medium text-sm">
                          <Link
                            title={item.product.name || ""}
                            href={`/products/${item.product.slug}`}
                            className="text-xs block truncate overflow-hidden text-ellipsis"
                          >
                            {item.product.name}
                          </Link>

                          {/* VARIANT NAME & LOW STOCK INDICATOR */}
                          {item.variant?.title && (
                            <div className="text-xs text-foreground/50 flex flex-wrap gap-2 items-center mt-1">
                              <span className="max-w-24 sm:max-w-32 truncate block">
                                {item.variant.title}
                              </span>
                              {isLowStock && (
                                <span className="text-orange-500 font-semibold text-xxs bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded whitespace-nowrap">
                                  {t("product_modal.low_stock_alert", {
                                    stock: item.variant.stock,
                                  })}
                                </span>
                              )}
                            </div>
                          )}

                          {item.addons && item.addons.length > 0 && (
                            <div className="text-[10px] text-foreground/40 leading-tight mt-0.5 break-words flex flex-wrap gap-x-1">
                              {item.addons.map((addon: any, i: number) => {
                                const addonPrice = Number(
                                  addon.price || addon.item?.price || 0,
                                );
                                return (
                                  <span key={i} className="flex items-center">
                                    {addon.group?.title || addon.addon_group_name
                                      ? `${addon.group?.title || addon.addon_group_name}: `
                                      : ""}
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

                          {/* CUSTOMIZE BUTTON - Show if the item supports addons (item.variant.is_addons is present) */}
                          {item.variant.is_addons && (
                            <button
                              onClick={() => handleCustomize(item)}
                              disabled={isCustomizing}
                              className="text-[10px] md:text-xs font-semibold mt-1 flex items-center gap-0.5 hover:opacity-80 transition-opacity"
                            >
                              <span className="text-black dark:text-white cursor-pointer">
                                {isCustomizing &&
                                customizingProduct?.slug === item.product.slug
                                  ? t("loading")
                                  : t("cartItems.customize")}
                              </span>
                              <ChevronRight
                                size={14}
                                className="mt-0.5 text-primary"
                              />
                            </button>
                          )}
                        </h3>

                        {/* Price and Quantity - Stack on mobile */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mt-1">
                          <span className="font-medium text-xs text-foreground/60 whitespace-nowrap">
                            {currencySymbol}{" "}
                            {item.total_item_special_price &&
                            item.total_item_special_price !==
                              item.total_item_price ? (
                              <>
                                <span className="line-through opacity-60">
                                  {item.total_item_price}
                                </span>{" "}
                                {item.total_item_special_price}
                              </>
                            ) : (
                              item.total_item_price || item.variant.price
                            )}{" "}
                            × {item.quantity}
                          </span>

                          <CartQuantityControl
                            item={item}
                            maxQuantity={item.product.total_allowed_quantity}
                            minQuantity={item.product.minimum_order_quantity}
                            quantityStep={item.product.quantity_step_size}
                            stock={item.variant.stock}
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row items-center gap-0 sm:gap-1 -mt-2">
                        <Button
                          title={t("saveForLater.title")}
                          className="p-0 bg-transparent min-w-0"
                          size="sm"
                          isDisabled={isLoading}
                          isIconOnly
                          startContent={
                            <Bookmark
                              size={14}
                              className="text-primary-500 sm:w-4 sm:h-4"
                            />
                          }
                          onPress={() =>
                            handleSaveForLater(item.id, item.quantity)
                          }
                        />
                        <Button
                          title={t("remove_item")}
                          className="p-0 bg-transparent min-w-0"
                          size="sm"
                          isDisabled={isLoading}
                          isIconOnly
                          startContent={
                            <Trash2
                              size={14}
                              className="text-danger-500 sm:w-4 sm:h-4"
                            />
                          }
                          onPress={() => setSelectedItemId(item.id)}
                        />
                      </div>
                    </div>

                    {/* Attachment Section - Full Width Below Item */}
                    {item.product.is_attachment_required && (
                      <div className="w-full mt-3 mb-2 space-y-3 rounded-lg border border-default-200 p-3 bg-default-50">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <p className="text-xxs font-semibold text-foreground">
                            {item.product.attachment_mode === "required"
                              ? t("cart.attachments.requiredLabel", {
                                  defaultValue: "Attachment required",
                                })
                              : t("cart.attachments.optionalLabel", {
                                  defaultValue: "Attachment optional",
                                })}
                          </p>
                          <p className="text-xxs text-foreground/60">
                            {t("cart.attachments.helperModeText", {
                              defaultValue:
                                item.product.attachment_mode === "required"
                                  ? "Upload at least one file."
                                  : "Upload files if you want.",
                            })}
                          </p>
                        </div>

                        <AttachmentUploader
                          attachment={attachments[item.product.id] || []}
                          onAttachmentChange={(attachmentFiles) =>
                            handleAttachmentChange(
                              item.product.id,
                              attachmentFiles,
                            )
                          }
                        />
                      </div>
                    )}

                    {itemIndex < group.items.length - 1 && (
                      <Divider className="my-2" orientation="horizontal" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

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

      {isModalOpen && customizingProduct && (
        <ProductModal
          isOpen={isModalOpen}
          onClose={onModalClose}
          product={customizingProduct}
          selectedVariant={customizingVariant}
          initialSelectedAddons={initialAddons}
          initialStep="addons"
          editingCartItemId={editingCartItemId}
          editingQuantity={editingQuantity}
        />
      )}
    </ScrollShadow>
  );
};

export default CartItems;
