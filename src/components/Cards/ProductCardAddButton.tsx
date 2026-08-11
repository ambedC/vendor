import { FC, useState, useEffect, useCallback, useMemo } from "react";
import { Button, addToast } from "@heroui/react";
import { ShoppingCart, Plus, Minus } from "lucide-react";
import { Product, ProductVariant } from "@/types/ApiResponse";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { useTranslation } from "react-i18next";
import {
  addToCart,
  updateCartItem,
  removeItemFromCart,
} from "@/routes/api";
import { updateCartData } from "@/helpers/updators";
import { handleOfflineAddToCart } from "@/helpers/functionalHelpers";
import {
  updateOfflineCartItemQuantity,
  removeOfflineCartItem,
} from "@/lib/redux/slices/offlineCartSlice";
import { debounce } from "lodash";

interface ProductCardAddButtonProps {
  product: Product;
  defaultVariant: ProductVariant;
  onOpenModal: () => void;
}

const ProductCardAddButton: FC<ProductCardAddButtonProps> = ({
  product,
  defaultVariant,
  onOpenModal,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const cartData = useSelector((state: RootState) => state.cart.cartData);
  const offlineCartItems = useSelector(
    (state: RootState) => state.offlineCart.items
  );
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);

  // Find if this variant is already in cart (online or offline)
  const cartItem = useMemo(() => {
    if (isLoggedIn) {
      return cartData?.items?.find(
        (item) => item.product_variant_id === defaultVariant.id
      );
    } else {
      return offlineCartItems?.find(
        (item) => item.product_variant_id === defaultVariant.id
      );
    }
  }, [cartData, offlineCartItems, defaultVariant.id, isLoggedIn]);

  const [localQuantity, setLocalQuantity] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync with cart
  useEffect(() => {
    setLocalQuantity(cartItem?.quantity || 0);
  }, [cartItem]);

  // Check if product is simple (single variant) or variant (multiple variants)
  const isSimpleProduct =
    product.type === "simple" || product.variants.length === 1;

  // Debounced add to cart function
  const debouncedAddToCart = useMemo(
    () =>
      debounce(async (quantity: number) => {
        if (!isLoggedIn) {
          // Handle offline cart
          const offlineItemId = `${defaultVariant.id}`;

          if (quantity === 0) {
            // Remove from offline cart
            dispatch(removeOfflineCartItem(offlineItemId));
            addToast({
              title: t("cart_updated_title"),
              description: t("cartItems.itemRemoved.description"),
              color: "success",
            });
          } else if (cartItem) {
            // Update existing offline cart item
            dispatch(
              updateOfflineCartItemQuantity({
                id: offlineItemId,
                quantity: quantity,
                stepSize: product.quantity_step_size,
                minQuantity: product.minimum_order_quantity,
                maxQuantity: product.total_allowed_quantity,
                stock: defaultVariant.stock,
              })
            );
            addToast({
              title: t("cart_updated_title"),
              description: t("cart_updated_description"),
              color: "success",
            });
          } else {
            // Add new item to offline cart using helper function
            handleOfflineAddToCart({
              product: product,
              variant: defaultVariant,
              quantity: quantity,
              renderToast: true,
            });
          }
          return;
        }

        setIsUpdating(true);
        try {
          let response;

          if (cartItem) {
            // Item already exists in cart
            if (quantity === 0) {
              // Remove item from cart when quantity is 0
              response = await removeItemFromCart(cartItem.id);
            } else {
              // Update existing cart item quantity
              response = await updateCartItem({
                cartItemId: cartItem.id,
                quantity: quantity,
              });
            }
          } else {
            // Add new item to cart
            response = await addToCart({
              product_variant_id: defaultVariant.id,
              store_id: defaultVariant.store_id,
              quantity: quantity,
            });
          }

          if (response.success) {
            addToast({
              title: t("cart_updated_title"),
              description: t("cart_updated_description"),
              color: "success",
            });
            await updateCartData(true, true, 0, true, false);
          } else {
            addToast({
              title: t("update_failed_title"),
              description: response.message || t("update_failed_description"),
              color: "danger",
            });
            setLocalQuantity(cartItem?.quantity || 0);
          }
        } catch (error) {
          console.error(error);
          addToast({
            title: t("network_error_title"),
            description: t("network_error_description"),
            color: "danger",
          });
          setLocalQuantity(cartItem?.quantity || 0);
        } finally {
          setIsUpdating(false);
        }
      }, 500),
    [defaultVariant, isLoggedIn, cartItem, product, dispatch, t]
  );

  const handleQuantityChange = useCallback(
    (newQuantity: number) => {
      const minQuantity = product.minimum_order_quantity || 1;
      const maxQuantity = product.total_allowed_quantity || 999;
      const stock = defaultVariant.stock;

      if (newQuantity < 0) {
        return;
      }

      if (newQuantity > 0 && newQuantity < minQuantity) {
        addToast({
          title: t("min_quantity_error_title"),
          description: t("min_quantity_error_description", {
            min: minQuantity,
          }),
          color: "danger",
        });
        return;
      }

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

      if (newQuantity > stock) {
        addToast({
          title: t("stock_limit_error_title"),
          description: t("stock_limit_error_description", { stock }),
          color: "danger",
        });
        return;
      }

      setLocalQuantity(newQuantity);
      debouncedAddToCart(newQuantity);
    },
    [product, defaultVariant, debouncedAddToCart, t]
  );

  const handleIncrement = useCallback(() => {
    const step = product.quantity_step_size || 1;
    handleQuantityChange(localQuantity + step);
  }, [localQuantity, product.quantity_step_size, handleQuantityChange]);

  const handleDecrement = useCallback(() => {
    const step = product.quantity_step_size || 1;
    handleQuantityChange(localQuantity - step);
  }, [localQuantity, product.quantity_step_size, handleQuantityChange]);

  const hasAddonGroups =
    defaultVariant.addon_groups && defaultVariant.addon_groups.length > 0;

  const handleInitialAdd = () => {
    if (isSimpleProduct && !hasAddonGroups) {
      // For simple products without addons, directly add to cart
      const initialQty =
        product.quantity_step_size > 1
          ? product.quantity_step_size
          : product.minimum_order_quantity || 1;
      handleQuantityChange(initialQty);
    } else {
      // For variant products OR simple products with addons, open modal
      onOpenModal();
    }
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => debouncedAddToCart.cancel();
  }, [debouncedAddToCart]);

  if (isSimpleProduct && localQuantity > 0) {
    return (
      <div
        className="flex items-center gap-0.5 sm:gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          isIconOnly
          size="sm"
          variant="flat"
          color="primary"
          className="min-w-5 w-5 h-5 md:min-w-7 md:w-7 md:h-7"
          onPress={handleDecrement}
          isDisabled={isUpdating}
        >
          <Minus size={14} className="" />
        </Button>
        <span
          className={`text-xs md:text-sm font-semibold min-w-5  sm:min-w-6.5 text-center  ${isUpdating ? "opacity-60" : ""}`}
        >
          {localQuantity}
          {isUpdating && (
            <span className="ml-1 -mt-4 inline-block animate-spin text-xs">
              ⏳
            </span>
          )}
        </span>
        <Button
          isIconOnly
          size="sm"
          variant="flat"
          color="primary"
          className="min-w-5 w-5 h-5 md:min-w-7 md:w-7 md:h-7"
          onPress={handleIncrement}
          isDisabled={isUpdating}
        >
          <Plus size={14} className="" />
        </Button>
      </div>
    );
  }

  // Initial "Add" button
  return (
    <>
      <Button
        className="text-xs px-0 w-4 h-8 md:flex hidden"
        color="primary"
        onPress={handleInitialAdd}
        radius="lg"
        startContent={<ShoppingCart className="w-4 h-4" />}
        isDisabled={isUpdating}
        title={t("add")}
      >
        {t("add")}
      </Button>
      <Button
        className="rounded-full md:hidden"
        color="primary"
        isIconOnly
        onPress={handleInitialAdd}
        size="sm"
        isDisabled={isUpdating}
      >
        <ShoppingCart size={18} />
      </Button>
    </>
  );
};

export default ProductCardAddButton;
