import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Minus, Plus } from "lucide-react";
import { debounce } from "lodash";
import { CartItem } from "@/types/ApiResponse";
import { updateCartItem } from "@/routes/api";
import { updateCartData } from "@/helpers/updators";
import { addToast } from "@heroui/react";
import { useDispatch, useSelector } from "react-redux";
import { setCartLoading } from "@/lib/redux/slices/cartSlice";
import { RootState } from "@/lib/redux/store";
import { useTranslation } from "react-i18next";

interface CartQuantityControlProps {
  item: CartItem;
  debounceDelay?: number;
  minQuantity?: number;
  maxQuantity?: number;
  quantityStep?: number;
  stock?: number;
}

const CartQuantityControl: React.FC<CartQuantityControlProps> = ({
  item,
  debounceDelay = 500,
  minQuantity = 1,
  maxQuantity = 999,
  quantityStep = 1,
  stock = 9999,
}) => {
  const { t } = useTranslation();
  const [localQuantity, setLocalQuantity] = useState<number>(item.quantity);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const dispatch = useDispatch();
  const isLoading = useSelector((state: RootState) => state.cart.isLoading);

  const debouncedUpdateQuantity = useMemo(
    () =>
      debounce(async (itemId: string | number, quantity: number) => {
        setIsUpdating(true);
        dispatch(setCartLoading(true));
        try {
          const response = await updateCartItem({
            cartItemId: itemId,
            quantity: quantity,
          });

          if (response.success) {
            addToast({
              title: t("cart_updated_title"),
              description: t("cart_updated_description"),
              color: "success",
            });
          } else {
            addToast({
              title: t("update_failed_title"),
              description: response.message || t("update_failed_description"),
              color: "danger",
            });
            setLocalQuantity(item.quantity);
            console.error(response.message || "Failed to update quantity");
          }
        } catch (error) {
          console.error(error);
          setLocalQuantity(item.quantity);
          addToast({
            title: t("network_error_title"),
            description: t("network_error_description"),
            color: "danger",
          });
        } finally {
          setIsUpdating(false);
          updateCartData(true, true);
        }
      }, debounceDelay),
    [item, debounceDelay, dispatch, t]
  );

  const handleQuantityChange = useCallback(
    (newQuantity: number) => {
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

      if ((newQuantity - minQuantity) % quantityStep !== 0) {
        addToast({
          title: t("step_error_title"),
          description: t("step_error_description", { step: quantityStep }),
          color: "danger",
        });
        return;
      }

      setLocalQuantity(newQuantity);
      debouncedUpdateQuantity(item.id, newQuantity);
    },
    [
      item.id,
      minQuantity,
      maxQuantity,
      stock,
      quantityStep,
      debouncedUpdateQuantity,
      t,
    ]
  );

  const handleIncrement = useCallback(
    () => handleQuantityChange(localQuantity + quantityStep),
    [localQuantity, quantityStep, handleQuantityChange]
  );
  const handleDecrement = useCallback(
    () => handleQuantityChange(localQuantity - quantityStep),
    [localQuantity, quantityStep, handleQuantityChange]
  );

  useEffect(() => {
    setLocalQuantity(item.quantity);
  }, [item.quantity]);

  useEffect(() => {
    return () => debouncedUpdateQuantity.cancel();
  }, [debouncedUpdateQuantity]);

  return (
    <div className="flex items-center gap-2 md:gap-4">
      <button
        className={`p-0.5 bg-slate-100 dark:bg-gray-700 rounded-full transition ${
          isUpdating
            ? "opacity-50 cursor-not-allowed"
            : "active:bg-slate-300 hover:bg-slate-200 dark:hover:bg-gray-600"
        }`}
        onClick={handleDecrement}
        disabled={isUpdating || isLoading}
        aria-label={t("decrease_quantity")}
      >
        <Minus size={14} />
      </button>

      <div
        className={`text-xs min-w-5 text-center ${isUpdating ? "opacity-60" : ""}`}
      >
        {localQuantity}
        {isUpdating && (
          <span className="ml-1 inline-block animate-spin">⏳</span>
        )}
      </div>

      <button
        className={`p-0.5 bg-slate-100 dark:bg-gray-700 rounded-full transition ${
          isUpdating
            ? "opacity-50 cursor-not-allowed"
            : "active:bg-slate-300 hover:bg-slate-200 dark:hover:bg-gray-600"
        }`}
        onClick={handleIncrement}
        disabled={isUpdating || isLoading}
        aria-label={t("increase_quantity")}
      >
        <Plus size={14} />
      </button>
    </div>
  );
};

export default CartQuantityControl;
