import { FC, useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Image,
  Chip,
  addToast,
  ScrollShadow,
  Divider,
  Checkbox,
  RadioGroup,
  Radio,
} from "@heroui/react";
import { ShoppingCart, Plus, Minus, Star, Users } from "lucide-react";
import RatingStars from "../RatingStars";
import { motion, AnimatePresence } from "framer-motion";
import { Product, ProductVariant, AddonGroup } from "@/types/ApiResponse";
import { useSettings } from "@/contexts/SettingsContext";
import {
  handleAddToCart,
  handleOfflineAddToCart,
  handleUpdateCartItem,
  handleUpdateOfflineCartItem,
} from "@/helpers/functionalHelpers";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { addRecentlyViewed } from "@/lib/redux/slices/recentlyViewedSlice";
import { trackProductView } from "@/lib/analytics";

const Lightbox = dynamic(() => import("yet-another-react-lightbox"), {
  ssr: false,
});

interface ProductVariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  selectedVariant?: ProductVariant | null;
  initialStep?: "variant" | "addons";
  initialSelectedAddons?: Record<number, number[]>;
  editingCartItemId?: number | string | null;
  editingQuantity?: number;
}

const ProductVariantModal: FC<ProductVariantModalProps> = ({
  isOpen,
  onClose,
  product,
  selectedVariant: propSelectedVariant,
  initialStep = "variant",
  initialSelectedAddons = {},
  editingCartItemId = null,
  editingQuantity,
}) => {
  const { currencySymbol, systemSettings } = useSettings();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [isLightboxOpen, setLightboxOpen] = useState(false);
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);

  const cartCount = Number(product.item_count_in_cart) || 0;
  const minQuantity = product.minimum_order_quantity || 1;
  const stepSize = product.quantity_step_size || 1;

  // ── Flow Decision ───────────────────────────────────────────────────
  const hasAddonGroups = product.variants.some(
    (v) => v.addon_groups && v.addon_groups.length > 0,
  );

  // ── Two-step State ──────────────────────────────────────────────────
  const [step, setStep] = useState<"variant" | "addons">("variant");
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null,
  );
  const [selectedAddons, setSelectedAddons] = useState<
    Record<number, number[]>
  >({});
  const [quantity, setQuantity] = useState(
    stepSize > 1 ? stepSize : minQuantity,
  );
  const [loading, setLoading] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());

  // ── No-addon (Legacy) State ─────────────────────────────────────────
  const [loadingVariantId, setLoadingVariantId] = useState<number | null>(null);
  const [variantQuantities, setVariantQuantities] = useState<
    Record<number, number>
  >({});

  // ── Reset ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    if (propSelectedVariant) {
      setSelectedVariant(propSelectedVariant);
      setStep("addons");
    } else {
      setStep(initialStep);
      setSelectedVariant(null);
    }

    setSelectedAddons(initialSelectedAddons);
    const defaultQty = stepSize > 1 ? stepSize : minQuantity;
    setQuantity(editingQuantity ?? defaultQty);
    setLightboxOpen(false);

    const initialQtys: Record<number, number> = {};
    product.variants.forEach((v) => {
      initialQtys[v.id] = defaultQty;
    });
    setVariantQuantities(initialQtys);

    dispatch(addRecentlyViewed(product));
    trackProductView(
      product.id.toString(),
      product.title,
      product.category_name,
      product.variants?.[0]?.price,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, product.id]);

  // ── Helpers ──────────────────────────────────────────────────────────
  const getFinalPrice = (v: ProductVariant) => {
    const price = Number(v.price) || 0;
    const sp = Number(v.special_price) || 0;
    return sp > 0 && sp < price ? sp : price;
  };
  const getOriginalPrice = (v: ProductVariant) => Number(v.price) || 0;
  const variantHasDiscount = (v: ProductVariant) => {
    const p = getOriginalPrice(v);
    const sp = Number(v.special_price) || 0;
    return sp > 0 && sp < p;
  };
  const getDiscountPct = (v: ProductVariant) => {
    if (!variantHasDiscount(v)) return 0;
    const p = getOriginalPrice(v);
    const sp = Number(v.special_price) || 0;
    return Math.round(((p - sp) / p) * 100);
  };

  const lowStockLimitRaw = Number(systemSettings?.lowStockLimit);
  const lowStockLimit =
    Number.isNaN(lowStockLimitRaw) || lowStockLimitRaw <= 0
      ? null
      : lowStockLimitRaw;
  const isLowStock = (stock: number) =>
    lowStockLimit !== null && stock > 0 && stock <= lowStockLimit;

  // ── Two-step Addon Change ───────────────────────────────────────────
  const handleAddonChange = (
    group: AddonGroup,
    itemId: number,
    checked: boolean,
  ) => {
    setSelectedAddons((prev) => {
      const current = prev[group.id] || [];
      if (group.selection_type === "single") {
        return { ...prev, [group.id]: checked ? [itemId] : [] };
      }
      return {
        ...prev,
        [group.id]: checked
          ? [...current, itemId]
          : current.filter((id) => id !== itemId),
      };
    });
  };

  // ── Two-step Total ──────────────────────────────────────────────────
  const addonTotal = (selectedVariant?.addon_groups || []).reduce(
    (sum, group) => {
      const ids = selectedAddons[group.id] || [];
      return (
        sum +
        group.items
          .filter((i) => ids.includes(i.id))
          .reduce((s, i) => s + i.price, 0)
      );
    },
    0,
  );
  const totalPrice =
    (selectedVariant ? getFinalPrice(selectedVariant) : 0) * quantity +
    addonTotal;

  // ── Add to Cart (Unified but used differently) ─────────────────────
  const handleAddToCartFn = async (
    v: ProductVariant,
    qty: number,
    addons: Record<number, number[]> = {},
  ) => {
    // Validation for addons
    const addonGroups = v.addon_groups || [];
    const missingRequired = addonGroups.filter(
      (g) => g.is_required && !(addons[g.id]?.length > 0),
    );
    if (missingRequired.length > 0) {
      addToast({
        title: "Selection Required",
        description:
          missingRequired.map((g) => g.title).join(", ") + " is required.",
        color: "danger",
      });
      return;
    }

    setLoading(true);
    setLoadingVariantId(v.id);
    const addonsForApi = Object.entries(addons).flatMap(
      ([groupId, itemIds]) => {
        const group = (v?.addon_groups || []).find(
          (g) => g.id === Number(groupId),
        );
        return itemIds.map((itemId) => {
          const item = (group?.items || []).find((i) => i.id === itemId);
          return {
            addon_group_id: Number(groupId),
            addon_item_id: Number(itemId),
            title: item?.title || "",
            price: item?.price || 0,
            addon_group_name: group?.title || "",
          };
        });
      },
    );

    try {
      if (editingCartItemId) {
        if (isLoggedIn) {
          await handleUpdateCartItem({
            cartItemId: editingCartItemId,
            quantity: qty,
            addons: addonsForApi,
            onClose,
            renderToast: true,
          });
        } else {
          handleUpdateOfflineCartItem({
            product,
            variant: v,
            quantity: qty,
            oldId: String(editingCartItemId),
            onClose,
            addons: addonsForApi,
          });
        }
      } else if (isLoggedIn) {
        await handleAddToCart({
          product_variant_id: v.id,
          store_id: v.store_id,
          quantity: qty,
          onClose,
          renderToast: true,
          addons: addonsForApi,
        });
      } else {
        handleOfflineAddToCart({
          product,
          variant: v,
          quantity: qty,
          onClose,
          addons: addonsForApi,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setLoadingVariantId(null);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        placement="bottom-center"
        backdrop="blur"
        scrollBehavior="inside"
        classNames={{ backdrop: "bg-black/60 backdrop-blur-sm" }}
      >
        <ModalContent className="max-w-md mx-auto">
          <ModalHeader>
            <h2>{t("product_modal.add_to_cart_title")}</h2>
          </ModalHeader>

          <ModalBody className="space-y-4">
            {/* ── SHARED HEADER ── */}
            <div className="grid grid-cols-[35%_65%] gap-4">
              <div className="flex items-center flex-col bg-gray-100 dark:bg-inherit rounded-lg relative overflow-hidden">
                {product.main_image ? (
                  <Image
                    src={product.main_image}
                    alt={product.title ?? ""}
                    classNames={{
                      wrapper:
                        "w-full h-32 p-0.5 flex justify-center cursor-pointer",
                      img: "w-full h-full object-contain",
                    }}
                    onClick={() => setLightboxOpen(true)}
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-300 rounded-md" />
                )}
              </div>
              <div className="flex items-start flex-col">
                <div className="space-y-1 flex flex-col">
                  <div className="flex w-full items-center gap-4">
                    {product.category_name && (
                      <Link
                        href={`/categories/${product.category}`}
                        className="text-xxs text-foreground/80 uppercase tracking-wider font-medium"
                      >
                        {product.category_name}
                      </Link>
                    )}
                    {product.featured == "1" && (
                      <Chip
                        className="text-xxs bg-linear-to-r from-secondary-300 to-secondary-400 capitalize text-white font-semibold shadow-sm tracking-wide"
                        classNames={{
                          base: "p-0.5 h-4",
                          content: "p-1 text-xxs",
                        }}
                        radius="sm"
                        startContent={
                          <Star size={10} className="fill-current" />
                        }
                      >
                        {t("featured")}
                      </Chip>
                    )}
                  </div>
                  <Link
                    href={`/products/${product?.slug ?? ""}`}
                    className="text-lg font-bold leading-tight"
                  >
                    {product.title ?? t("product_modal.untitled")}
                  </Link>
                  {cartCount > 0 && (
                    <div className="flex items-center gap-1.5 py-1">
                      <Chip
                        className="text-xxs bg-linear-to-r from-orange-500 to-red-500 text-white font-semibold"
                        classNames={{
                          base: "h-5 px-2",
                          content: "px-1 text-xxs flex items-center gap-1",
                        }}
                        radius="sm"
                        startContent={<Users size={11} className="shrink-0" />}
                      >
                        {cartCount > 99 ? "99+" : cartCount}{" "}
                        {t("product_modal.in_cart")}
                      </Chip>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between py-2 gap-4">
                  <div className="flex items-center gap-1">
                    <RatingStars
                      rating={Number(product.ratings || 0)}
                      size={14}
                    />
                    <span className="text-xs text-foreground/50 ml-1">
                      ({product.ratings || 0})
                    </span>
                  </div>
                  {product.brand_name && (
                    <Link
                      href={`/brands/${product.brand}`}
                      className="text-primary text-xs font-semibold"
                    >
                      {product.brand_name}
                    </Link>
                  )}
                </div>
                {product?.short_description && (
                  <ScrollShadow className="text-xs text-foreground/50 max-h-16">
                    {product.short_description}
                  </ScrollShadow>
                )}
              </div>
            </div>

            {/* ── FLOW CONTENT ── */}
            {hasAddonGroups && step === "addons" ? (
              /* ══ STEP 2: Customise Addons ══ */
              <div className="space-y-4">
                <div className="flex items-center gap-3 px-3 py-2.5 border border-default-200 rounded-xl bg-default-50 dark:bg-default-100">
                  <span className="w-2.5 h-2.5 rounded-full bg-default-400 shrink-0" />
                  <span className="flex-1 text-sm font-medium truncate">
                    {selectedVariant?.title}
                  </span>
                  {!editingCartItemId && (
                    <button
                      type="button"
                      onClick={() => setStep("variant")}
                      className="text-xs font-semibold text-primary hover:text-primary-600 transition-colors shrink-0"
                    >
                      {t("change")}
                    </button>
                  )}
                </div>

                {(selectedVariant?.addon_groups || []).map((group) => {
                  const selectedIds = selectedAddons[group.id] || [];
                  const availableItems = group.items.filter(
                    (i) => i.is_available,
                  );
                  const allSelected =
                    availableItems.length > 0 &&
                    availableItems.every((i) => selectedIds.includes(i.id));

                  const handleSelectAll = () => {
                    setSelectedAddons((prev) => {
                      const current = prev[group.id] || [];
                      if (allSelected) {
                        return {
                          ...prev,
                          [group.id]: current.filter(
                            (id) => !availableItems.some((i) => i.id === id),
                          ),
                        };
                      }
                      const kept = current.filter(
                        (id) => !availableItems.some((i) => i.id === id),
                      );
                      return {
                        ...prev,
                        [group.id]: [
                          ...kept,
                          ...availableItems.map((i) => i.id),
                        ],
                      };
                    });
                  };

                  return (
                    <div
                      key={group.id}
                      className="border border-default-200 rounded-xl overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-3 py-2 bg-default-100 dark:bg-default-50">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            {group.title}
                          </span>
                          {group.is_required && (
                            <span className="text-xxs font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">
                              {t("product_modal.required")}
                            </span>
                          )}
                        </div>
                        {group.selection_type === "multiple" &&
                          availableItems.length > 0 && (
                            <button
                              type="button"
                              onClick={handleSelectAll}
                              className="text-xs font-semibold text-primary hover:text-primary-600"
                            >
                              {allSelected
                                ? t("deselect_all")
                                : t("select_all")}
                            </button>
                          )}
                        {group.selection_type === "single" &&
                          selectedIds.length > 0 &&
                          !group.is_required && (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedAddons((prev) => ({
                                  ...prev,
                                  [group.id]: [],
                                }))
                              }
                              className="text-xs font-semibold text-danger hover:text-danger-600 transition-colors"
                            >
                              Clear
                            </button>
                          )}
                      </div>
                      <div className="divide-y divide-default-100">
                        {group.selection_type === "single" ? (
                          <RadioGroup
                            value={
                              selectedIds.length > 0
                                ? selectedIds[0].toString()
                                : ""
                            }
                            onValueChange={(val) =>
                              handleAddonChange(group, Number(val), true)
                            }
                            classNames={{
                              wrapper: "gap-0 divide-y divide-default-100",
                            }}
                          >
                            {group.items.slice(0, 5).map((item) => {
                              const isChecked = selectedIds.includes(item.id);
                              const isDisabled = !item.is_available;
                              return (
                                <Radio
                                  key={item.uuid}
                                  value={item.id.toString()}
                                  isDisabled={isDisabled}
                                  onClick={() => {
                                    if (isDisabled) return;
                                    // Stop propagation to prevent group re-triggering if necessary,
                                    // but mostly to handle the click directly
                                    handleAddonChange(
                                      group,
                                      item.id,
                                      !isChecked,
                                    );
                                  }}
                                  classNames={{
                                    base: `max-w-full m-0 flex-row-reverse w-full px-3 py-2.5 items-center justify-between gap-3 transition-colors ${
                                      isDisabled
                                        ? "opacity-50 cursor-not-allowed bg-default-50"
                                        : isChecked
                                          ? "bg-primary-50 dark:bg-primary-900/20"
                                          : "hover:bg-default-50"
                                    }`,
                                    label: "flex-1 m-0 w-full",
                                  }}
                                >
                                  <div className="flex items-center gap-3">
                                    {item.indicator ? (
                                      <span
                                        className={`shrink-0 w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center ${
                                          item.indicator === "veg"
                                            ? "border-green-600"
                                            : "border-red-600"
                                        }`}
                                      >
                                        <span
                                          className={`w-2 h-2 rounded-full ${
                                            item.indicator === "veg"
                                              ? "bg-green-600"
                                              : "bg-red-600"
                                          }`}
                                        />
                                      </span>
                                    ) : (
                                      <span className="shrink-0 w-3.5 h-3.5" />
                                    )}
                                    <span className="flex-1 text-sm text-foreground">
                                      {item.title}
                                    </span>
                                    {item.price > 0 && (
                                      <span className="text-xs font-semibold text-foreground">
                                        +{currencySymbol}
                                        {item.price.toFixed(2)}
                                      </span>
                                    )}
                                  </div>
                                </Radio>
                              );
                            })}
                          </RadioGroup>
                        ) : (
                          group.items.slice(0, 5).map((item) => {
                            const isChecked = selectedIds.includes(item.id);
                            const isDisabled = !item.is_available;
                            return (
                              <Checkbox
                                key={item.uuid}
                                isSelected={isChecked}
                                onValueChange={(checked) =>
                                  handleAddonChange(group, item.id, checked)
                                }
                                isDisabled={isDisabled}
                                classNames={{
                                  base: `max-w-full m-0 flex-row-reverse w-full px-3 py-2.5 items-center justify-between gap-3 transition-colors ${
                                    isDisabled
                                      ? "opacity-50 cursor-not-allowed bg-default-50"
                                      : isChecked
                                        ? "bg-primary-50 dark:bg-primary-900/20"
                                        : "hover:bg-default-50"
                                  }`,
                                  label: "flex-1 m-0 w-full",
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  {item.indicator ? (
                                    <span
                                      className={`shrink-0 w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center ${
                                        item.indicator === "veg"
                                          ? "border-green-600"
                                          : "border-red-600"
                                      }`}
                                    >
                                      <span
                                        className={`w-2 h-2 rounded-full ${
                                          item.indicator === "veg"
                                            ? "bg-green-600"
                                            : "bg-red-600"
                                        }`}
                                      />
                                    </span>
                                  ) : (
                                    <span className="shrink-0 w-3.5 h-3.5" />
                                  )}
                                  <span className="flex-1 text-sm text-foreground">
                                    {item.title}
                                  </span>
                                  {item.price > 0 && (
                                    <span className="text-xs font-semibold text-foreground">
                                      +{currencySymbol}
                                      {item.price.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              </Checkbox>
                            );
                          })
                        )}
                        <AnimatePresence>
                          {expandedGroups.has(group.id) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                              className="overflow-hidden divide-y divide-default-100 border-t border-default-100"
                            >
                              {group.selection_type === "single" ? (
                                <RadioGroup
                                  value={
                                    selectedIds.length > 0
                                      ? selectedIds[0].toString()
                                      : ""
                                  }
                                  onValueChange={(val) =>
                                    handleAddonChange(group, Number(val), true)
                                  }
                                  classNames={{
                                    wrapper:
                                      "gap-0 divide-y divide-default-100",
                                  }}
                                >
                                  {group.items.slice(5).map((item) => {
                                    const isChecked = selectedIds.includes(
                                      item.id,
                                    );
                                    const isDisabled = !item.is_available;
                                    return (
                                      <Radio
                                        key={item.uuid}
                                        value={item.id.toString()}
                                        isDisabled={isDisabled}
                                        onClick={() => {
                                          if (isDisabled) return;
                                          handleAddonChange(
                                            group,
                                            item.id,
                                            !isChecked,
                                          );
                                        }}
                                        classNames={{
                                          base: `max-w-full m-0 flex-row-reverse w-full px-3 py-2.5 items-center justify-between gap-3 transition-colors ${
                                            isDisabled
                                              ? "opacity-50 cursor-not-allowed bg-default-50"
                                              : isChecked
                                                ? "bg-primary-50 dark:bg-primary-900/20"
                                                : "hover:bg-default-50"
                                          }`,
                                          label: "flex-1 m-0 w-full",
                                        }}
                                      >
                                        <div className="flex items-center gap-3">
                                          {item.indicator ? (
                                            <span
                                              className={`shrink-0 w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center ${
                                                item.indicator === "veg"
                                                  ? "border-green-600"
                                                  : "border-red-600"
                                              }`}
                                            >
                                              <span
                                                className={`w-2 h-2 rounded-full ${
                                                  item.indicator === "veg"
                                                    ? "bg-green-600"
                                                    : "bg-red-600"
                                                }`}
                                              />
                                            </span>
                                          ) : (
                                            <span className="shrink-0 w-3.5 h-3.5" />
                                          )}
                                          <span className="flex-1 text-sm text-foreground">
                                            {item.title}
                                          </span>
                                          {item.price > 0 && (
                                            <span className="text-xs font-semibold text-foreground">
                                              +{currencySymbol}
                                              {item.price.toFixed(2)}
                                            </span>
                                          )}
                                        </div>
                                      </Radio>
                                    );
                                  })}
                                </RadioGroup>
                              ) : (
                                group.items.slice(5).map((item) => {
                                  const isChecked = selectedIds.includes(
                                    item.id,
                                  );
                                  const isDisabled = !item.is_available;
                                  return (
                                    <Checkbox
                                      key={item.uuid}
                                      isSelected={isChecked}
                                      onValueChange={(checked) =>
                                        handleAddonChange(
                                          group,
                                          item.id,
                                          checked,
                                        )
                                      }
                                      isDisabled={isDisabled}
                                      classNames={{
                                        base: `max-w-full m-0 flex-row-reverse w-full px-3 py-2.5 items-center justify-between gap-3 transition-colors ${
                                          isDisabled
                                            ? "opacity-50 cursor-not-allowed bg-default-50"
                                            : isChecked
                                              ? "bg-primary-50 dark:bg-primary-900/20"
                                              : "hover:bg-default-50"
                                        }`,
                                        label: "flex-1 m-0 w-full",
                                      }}
                                    >
                                      <div className="flex items-center gap-3">
                                        {item.indicator ? (
                                          <span
                                            className={`shrink-0 w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center ${
                                              item.indicator === "veg"
                                                ? "border-green-600"
                                                : "border-red-600"
                                            }`}
                                          >
                                            <span
                                              className={`w-2 h-2 rounded-full ${
                                                item.indicator === "veg"
                                                  ? "bg-green-600"
                                                  : "bg-red-600"
                                              }`}
                                            />
                                          </span>
                                        ) : (
                                          <span className="shrink-0 w-3.5 h-3.5" />
                                        )}
                                        <span className="flex-1 text-sm text-foreground">
                                          {item.title}
                                        </span>
                                        {item.price > 0 && (
                                          <span className="text-xs font-semibold text-foreground">
                                            +{currencySymbol}
                                            {item.price.toFixed(2)}
                                          </span>
                                        )}
                                      </div>
                                    </Checkbox>
                                  );
                                })
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      {group.items.length > 5 &&
                        !expandedGroups.has(group.id) && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedGroups((prev) =>
                                new Set(prev).add(group.id),
                              )
                            }
                            className="w-full text-center py-2.5 text-xs font-bold text-primary hover:bg-primary-50 transition-colors border-t border-default-100"
                          >
                            + {group.items.length - 5} more
                          </button>
                        )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ══ STEP 1 or LEGACY: Variant List ══ */
              <div className="space-y-3">
                <div className="flex w-full justify-between">
                  <h3 className="text-sm font-semibold text-foreground/50">
                    {t("product_modal.select_options")}
                  </h3>
                  <h3 className="text-sm font-semibold text-foreground/50">
                    {t("choices", { count: product.variants.length })}
                  </h3>
                </div>
                <RadioGroup
                  value={selectedVariant?.id.toString() || ""}
                  onValueChange={(val) => {
                    const v = product.variants.find(
                      (v) => v.id.toString() === val,
                    );
                    if (v && !(!v.availability || v.stock === 0)) {
                      setSelectedVariant(v);
                    }
                  }}
                  className="space-y-3"
                >
                  <ScrollShadow className="space-y-3 h-[40vh] pr-2 pb-2">
                    {product.variants.map((v) => {
                      const price = getFinalPrice(v);
                      const original = getOriginalPrice(v);
                      const hasDisc = variantHasDiscount(v);
                      const discPct = getDiscountPct(v);
                      const qty = variantQuantities[v.id] || minQuantity;
                      const isSelected = selectedVariant?.id === v.id;
                      const isUnavailable = !v.availability || v.stock === 0;

                      return (
                        <div
                          key={v.id}
                          onClick={() =>
                            hasAddonGroups &&
                            !isUnavailable &&
                            setSelectedVariant(isSelected ? null : v)
                          }
                          className={`border rounded-lg p-3 space-y-3 transition-all ${
                            hasAddonGroups
                              ? isSelected
                                ? "border-primary bg-primary-50 dark:bg-primary-900/20 cursor-pointer"
                                : "border-gray-200 dark:border-gray-700 hover:border-primary/40 cursor-pointer"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Image
                              src={v.image || product.main_image || ""}
                              alt={v.title}
                              className="w-16 h-16 object-contain rounded-md shrink-0"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-semibold">
                                  {v.title}
                                </h4>
                                {hasDisc && (
                                  <Chip
                                    className="font-medium"
                                    classNames={{
                                      content: "text-xxs",
                                      base: "h-4 px-1",
                                    }}
                                    color="primary"
                                    size="sm"
                                    radius="sm"
                                  >
                                    {discPct}% off
                                  </Chip>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm font-bold">
                                  {currencySymbol}
                                  {price.toFixed(2)}
                                </span>
                                {hasDisc && (
                                  <span className="text-xxs text-foreground/50 line-through">
                                    {currencySymbol}
                                    {original.toFixed(2)}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-col gap-1 mt-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs text-foreground/50">
                                    {t("product_modal.stock", {
                                      stock: v.stock,
                                    })}
                                  </p>
                                  <Divider orientation="vertical" />
                                  <p className="text-xs text-foreground/50">
                                    {t("product_modal.sku", { sku: v.sku })}
                                  </p>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    {stepSize > 1 ? (
                                      <span className="text-xxs text-foreground/50 font-medium">
                                        {t("quantityStepSize") || "Step Size"}: {stepSize}
                                      </span>
                                    ) : (
                                      minQuantity > 1 && (
                                        <span className="text-xxs text-foreground/50 font-medium">
                                          {t("minOrder")}: {minQuantity}
                                        </span>
                                      )
                                    )}
                                    {isLowStock(v.stock) && (
                                      <span className="text-xxs text-orange-500 font-semibold">
                                        {t("product_modal.low_stock_alert", {
                                          stock: v.stock,
                                        })}
                                      </span>
                                    )}
                                </div>
                              </div>
                            </div>
                            {hasAddonGroups && (
                              <Radio
                                value={v.id.toString()}
                                isDisabled={isUnavailable}
                                onClick={(e) => {
                                  // Stop propagation avoids clicking the card again
                                  // which handles its own toggle logic for addons
                                  e.stopPropagation();
                                  if (isUnavailable) return;
                                  setSelectedVariant((prev) =>
                                    prev?.id === v.id ? null : v,
                                  );
                                }}
                                classNames={{
                                  base: "m-0",
                                }}
                              />
                            )}
                          </div>

                          {!hasAddonGroups ? (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-foreground/50 hidden sm:block">
                                  {t("product_modal.qty")}:
                                </span>
                                <div className="flex items-center gap-1">
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="flat"
                                    onPress={() =>
                                      setVariantQuantities((p) => ({
                                        ...p,
                                        [v.id]: Math.max(
                                          stepSize > 1 ? stepSize : minQuantity,
                                          qty - stepSize,
                                        ),
                                      }))
                                    }
                                    className="w-7 h-7 min-w-7"
                                  >
                                    <Minus size={12} />
                                  </Button>
                                  <span className="w-8 text-center text-sm font-medium">
                                    {qty}
                                  </span>
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="flat"
                                    onPress={() =>
                                      setVariantQuantities((p) => ({
                                        ...p,
                                        [v.id]: Math.min(
                                          v.stock,
                                          qty + stepSize,
                                        ),
                                      }))
                                    }
                                    className="w-7 h-7 min-w-7"
                                  >
                                    <Plus size={12} />
                                  </Button>
                                </div>
                              </div>
                              {product.store_status.is_open ? (
                                <Button
                                  color="primary"
                                  size="sm"
                                  onPress={() => handleAddToCartFn(v, qty)}
                                  isDisabled={v.stock === 0}
                                  isLoading={loadingVariantId === v.id}
                                  className="text-xs px-2 sm:px-4"
                                >
                                  {v.stock === 0
                                    ? t("product_modal.out_of_stock")
                                    : `${t("product_modal.add_to_cart_title")} • ${
                                        currencySymbol +
                                        (price * qty).toFixed(2)
                                      }`}
                                </Button>
                              ) : (
                                <span className="text-orange-500 font-medium text-xs">
                                  {t("store_closed")}
                                </span>
                              )}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </ScrollShadow>
                </RadioGroup>
              </div>
            )}
          </ModalBody>

          {/* ── FOOTER ── */}
          {hasAddonGroups && (
            <ModalFooter className="border-t border-default-100">
              {step === "variant" ? (
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm font-medium text-foreground/50">
                    {t("product_modal.step_of", { current: 1, total: 2 })}
                  </span>
                  <Button
                    color="primary"
                    isDisabled={!selectedVariant}
                    onPress={() => setStep("addons")}
                    className="px-8 font-semibold"
                  >
                    {t("product_modal.continue")}
                  </Button>
                </div>
              ) : (
                <div className="w-full space-y-3">
                  <div className="flex items-end justify-between">
                    <div className="flex flex-col">
                      <span className="text-lg font-bold">
                        {currencySymbol}
                        {totalPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        onPress={() =>
                          setQuantity((q) =>
                            Math.max(
                              stepSize > 1 ? stepSize : minQuantity,
                              q - stepSize,
                            ),
                          )
                        }
                        className="w-8 h-8 min-w-8"
                      >
                        <Minus size={14} />
                      </Button>
                      <span className="w-8 text-center text-sm font-semibold">
                        {quantity}
                      </span>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="flat"
                        onPress={() =>
                          setQuantity((q) =>
                            Math.min(
                              selectedVariant?.stock || 999,
                              q + stepSize,
                            ),
                          )
                        }
                        className="w-8 h-8 min-w-8"
                      >
                        <Plus size={14} />
                      </Button>
                    </div>
                  </div>
                  <Button
                    color="primary"
                    onPress={() =>
                      selectedVariant &&
                      handleAddToCartFn(
                        selectedVariant,
                        quantity,
                        selectedAddons,
                      )
                    }
                    isLoading={loading}
                    className="w-full font-semibold"
                    startContent={<ShoppingCart size={16} />}
                  >
                    {editingCartItemId
                      ? t("product_modal.update_cart_item")
                      : t("product_modal.add_to_cart_title")}
                  </Button>
                </div>
              )}
            </ModalFooter>
          )}
        </ModalContent>
      </Modal>

      {isLightboxOpen && (
        <Lightbox
          open={isLightboxOpen}
          close={() => setLightboxOpen(false)}
          slides={[{ src: product.main_image }]}
        />
      )}
    </>
  );
};

export default ProductVariantModal;
