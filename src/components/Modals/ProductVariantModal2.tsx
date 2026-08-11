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
} from "@heroui/react";
import { ShoppingCart, Plus, Minus, Star } from "lucide-react";
import RatingStars from "../RatingStars";
import { Product, ProductVariant } from "@/types/ApiResponse";
import { useSettings } from "@/contexts/SettingsContext";
import { handleAddToCart } from "@/helpers/functionalHelpers";
import { useTranslation } from "react-i18next";
import Link from "next/link";

interface ProductVariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

const ProductVariantModal: FC<ProductVariantModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const { currencySymbol, systemSettings } = useSettings();
  const { t } = useTranslation();

  const [quantity, setQuantity] = useState(
    product?.quantity_step_size > 1
      ? product.quantity_step_size
      : product?.minimum_order_quantity || 1,
  );
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  // Initialize selected variant when product changes
  useEffect(() => {
    if (product.variants && product.variants.length > 0) {
      const defaultVariant =
        product.variants.find((v) => v.is_default) || product.variants[0];

      if (defaultVariant) {
        setSelectedVariant(defaultVariant);
        setQuantity(
          product?.quantity_step_size > 1
            ? product.quantity_step_size
            : product?.minimum_order_quantity || 1,
        );
      }
    }
  }, [product, isOpen]);

  if (!selectedVariant) return null;

  // Enhanced quantity handling with min, max, step, and toast notifications
  const lowStockLimitRaw = Number(systemSettings?.lowStockLimit);
  const lowStockLimit =
    Number.isNaN(lowStockLimitRaw) || lowStockLimitRaw <= 0
      ? null
      : lowStockLimitRaw;
  const isLowStock = (stock: number) =>
    lowStockLimit !== null && stock > 0 && stock <= lowStockLimit;

  const minQuantity = product.minimum_order_quantity || 1;
  const maxQuantity = Math.min(
    product.total_allowed_quantity || 9999,
    selectedVariant.stock
  );
  const stepSize = product.quantity_step_size || 1;

  const handleQuantityDecrease = () => {
    const newQuantity = quantity - stepSize;

    if (newQuantity < minQuantity) {
      addToast({
        title: t("min_quantity_error_title"),
        description: t("min_quantity_error_description", {
          min: minQuantity,
        }),
        color: "danger",
      });
      return;
    }

    if ((newQuantity - minQuantity) % stepSize !== 0) {
      addToast({
        title: t("step_error_title"),
        description: t("step_error_description", { step: stepSize }),
        color: "danger",
      });
      return;
    }

    setQuantity(Math.max(newQuantity, minQuantity));
  };

  const handleQuantityIncrease = () => {
    const newQuantity = quantity + stepSize;

    if (newQuantity > maxQuantity) {
      addToast({
        title: t("max_quantity_error_title"),
        description: t("max_quantity_error_description", {
          max: maxQuantity,
        }),
        color: "danger",
      });
      return;
    }

    if (newQuantity > selectedVariant.stock) {
      addToast({
        title: t("stock_limit_error_title"),
        description: t("stock_limit_error_description", {
          stock: selectedVariant.stock,
        }),
        color: "danger",
      });
      return;
    }

    if ((newQuantity - minQuantity) % stepSize !== 0) {
      addToast({
        title: t("step_error_title"),
        description: t("step_error_description", { step: stepSize }),
        color: "danger",
      });
      return;
    }

    setQuantity(Math.min(newQuantity, maxQuantity, selectedVariant.stock));
  };

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    // Reset quantity if it exceeds new variant's stock
    setQuantity((prev) => Math.min(prev, variant.stock, maxQuantity));
  };

  const AddToCart = async () => {
    setLoading(true);
    try {
      await handleAddToCart({
        product_variant_id: selectedVariant.id,
        store_id: selectedVariant.store_id,
        quantity: quantity,
        onClose: onClose,
        renderToast: true,
      });
    } catch (error) {
      console.error("Add to cart failed:", error);
      // Optional: Show toast or UI error message here
    } finally {
      setLoading(false);
      onClose();
    }
  };

  const getVariantPrice = (variant: ProductVariant) => {
    const price = Number(variant?.price) || 0;
    const specialPrice = Number(variant?.special_price) || 0;
    return specialPrice > 0 && specialPrice < price ? specialPrice : price;
  };

  const getDiscountPercentage = (variant: ProductVariant) => {
    const price = Number(variant?.price) || 0;
    const specialPrice = Number(variant?.special_price) || 0;
    const hasDiscount = specialPrice > 0 && specialPrice < price;
    return hasDiscount ? Math.round(((price - specialPrice) / price) * 100) : 0;
  };

  // Calculate price for selected variant
  const price = Number(selectedVariant?.price) || 0;
  const specialPrice = Number(selectedVariant?.special_price) || 0;
  const hasDiscount = specialPrice > 0 && specialPrice < price;
  const finalPrice = hasDiscount ? specialPrice : price;
  const totalPrice = finalPrice * quantity;
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      placement="center"
      backdrop="blur"
      classNames={{
        backdrop: "bg-black/60 backdrop-blur-sm",
      }}
      scrollBehavior="inside"
    >
      <ModalContent className="max-w-md mx-auto">
        <ModalHeader>
          <h2>{t("product_modal.add_to_cart_title")}</h2>
        </ModalHeader>

        <ModalBody className="space-y-4">
          <div className="grid grid-cols-[35%_65%] gap-4">
            <div className="flex items-center flex-col bg-gray-100 dark:bg-inherit rounded-lg relative">
              {selectedVariant.image || product.main_image ? (
                <Image
                  src={selectedVariant.image || product.main_image}
                  alt={product.title ?? "Product"}
                  classNames={{
                    wrapper: "w-full h-32 p-0.5 flex justify-center",
                    img: "w-full h-full object-contain",
                  }}
                />
              ) : (
                <div className="w-full h-32 bg-gray-300 rounded-md" />
              )}
            </div>
            <div className="flex items-start flex-col">
              <div className="space-y-1">
                <div className="flex w-full items-center gap-4">
                  {product.category_name && (
                    <Link
                      href={`/categories/${product.category}`}
                      className="text-xxs text-foreground/80 uppercase tracking-wider font-medium"
                      title={product.category_name}
                    >
                      {product.category_name}
                    </Link>
                  )}
                  {product.featured == "1" && (
                    <Chip
                      className="text-xxs bg-linear-to-r from-secondary-300 to-secondary-400 capitalize text-white font-semibold shadow-sm tracking-wide mb-1"
                      classNames={{
                        base: "p-0.5 h-4",
                        content: "p-1 text-xxs",
                      }}
                      radius="sm"
                      startContent={<Star size={10} className="fill-current" />}
                      title={t("featured")}
                    >
                      {t("featured")}
                    </Chip>
                  )}
                </div>
                <h2 className="text-lg font-bold leading-tight">
                  {product.title ?? "Untitled Product"}
                </h2>
              </div>
              <div className="flex items-center justify-between py-2 gap-4">
                {product.ratings !== undefined && (
                  <div className="flex items-center gap-1">
                    <RatingStars rating={Number(product.ratings)} size={14} />
                    <span className="text-xs text-foreground/50 ml-1">
                      ({product.ratings})
                    </span>
                  </div>
                )}
                {product.brand_name && (
                  <Link
                    href={`/brands/${product.brand}`}
                    className="text-primary text-xs  font-semibold"
                    title={product.brand_name}
                  >
                    {product.brand_name}
                  </Link>
                )}
              </div>
              {product.short_description && (
                <p
                  className="text-xs text-foreground/50 leading-relaxed"
                  title={product.short_description}
                >
                  {product.short_description}
                </p>
              )}
            </div>
          </div>

          {/* Variant Selection Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground/50">
              {t("product_modal.select_options")}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {product.variants.map((variant) => {
                const isSelected = selectedVariant.id === variant.id;
                const variantPrice = getVariantPrice(variant);
                const discountPercentage = getDiscountPercentage(variant);
                const showLowStock = isLowStock(variant.stock);

                return (
                  <div
                    key={variant.id}
                    onClick={() => handleVariantSelect(variant)}
                    className={`border rounded-lg p-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-primary-300"
                    } ${variant.stock === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      {variant.image ? (
                        <Image
                          src={variant.image}
                          alt={variant.title}
                          className="w-10 h-10 object-cover rounded-md"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-md" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {variant.title}
                        </p>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold">
                            {currencySymbol}
                            {variantPrice.toFixed(2)}
                          </span>
                          {discountPercentage > 0 && (
                            <Chip
                              className="text-[10px] font-medium"
                              classNames={{
                                content: "text-[10px]",
                                base: "h-4 px-1",
                              }}
                              color="primary"
                              size="sm"
                              radius="sm"
                            >
                              {t("product_modal.discount_percent", {
                                percent: discountPercentage,
                              })}
                            </Chip>
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          {variant.stock === 0 && (
                            <span className="text-[10px] text-red-500">
                              {t("product_modal.out_of_stock")}
                            </span>
                          )}
                          {showLowStock && variant.stock > 0 && (
                            <span className="text-[10px] text-orange-500 font-semibold">
                              {t("product_modal.low_stock_alert", {
                                stock: variant.stock,
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stock Status & Quantity Controls */}
          <div className="bg-linear-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {currencySymbol}
                  {finalPrice.toFixed(2)}
                </div>
                {hasDiscount && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground/50 line-through">
                      {currencySymbol}
                      {price.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Quantity Controls */}
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    isDisabled={
                      quantity <= minQuantity ||
                      loading ||
                      selectedVariant.stock === 0
                    }
                    onPress={handleQuantityDecrease}
                    className="w-8 h-8 min-w-8"
                  >
                    <Minus size={14} />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium">
                    {quantity}
                  </span>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    isDisabled={
                      quantity >= maxQuantity ||
                      quantity >= selectedVariant.stock ||
                      loading ||
                      selectedVariant.stock === 0
                    }
                    onPress={handleQuantityIncrease}
                    className="w-8 h-8 min-w-8"
                  >
                    <Plus size={14} />
                  </Button>
                </div>
                <span className="text-xs text-center text-foreground/50">
                  {t("product_modal.stock", {
                    stock: selectedVariant.stock,
                  })}
                </span>
                {isLowStock(selectedVariant.stock) && (
                  <span className="text-xs text-orange-500 font-semibold">
                    {t("product_modal.low_stock_alert", {
                      stock: selectedVariant.stock,
                    })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <div className="flex gap-2 w-full">
            <Button
              variant="bordered"
              onPress={onClose}
              className="flex-1 text-sm"
              size="sm"
              isDisabled={loading}
            >
              {t("product_modal.cancel")}
            </Button>
            <Button
              color="primary"
              onPress={AddToCart}
              isDisabled={selectedVariant.stock === 0}
              className="flex-1 text-sm"
              size="sm"
              startContent={<ShoppingCart size={16} />}
              isLoading={loading}
            >
              {selectedVariant.stock === 0
                ? t("product_modal.out_of_stock")
                : `${currencySymbol} ${totalPrice.toFixed(2)}`}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ProductVariantModal;
