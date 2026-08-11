import { FC, useEffect, useState, useMemo } from "react";
import { CartResponse } from "@/types/ApiResponse";
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Button,
  Switch,
  useDisclosure,
  addToast,
  Divider,
  Alert,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@heroui/react";
import PaymentModal from "@/components/Modals/PaymentModal";
import CartItems from "./CartItems";
import { useSettings } from "@/contexts/SettingsContext";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { updateCartData } from "@/helpers/updators";
import { setPromoCode, setUseWallet } from "@/lib/redux/slices/checkoutSlice";
import { clearCart } from "@/routes/api";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import { Trash2, Tag, Wallet, Info } from "lucide-react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { formatAmount, handleCheckout } from "@/helpers/functionalHelpers";

interface CheckoutSectionProps {
  cart: CartResponse;
}

const CheckoutSection: FC<CheckoutSectionProps> = ({ cart }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const { paymentSettings } = useSettings();
  const isWalletEnabled = paymentSettings?.wallet || false;

  const [showClearCartModal, setShowClearCartModal] = useState(false);
  const router = useRouter();
  const { currencySymbol, systemSettings, isSingleVendor } = useSettings();
  const { payment_summary, items, total_quantity } = cart;
  const { selectedAddress, deliveryMode, useWallet } = useSelector(
    (state: RootState) => state.checkout,
  );

  const dispatch = useDispatch();

  const isLoading = useSelector((state: RootState) => state.cart.isLoading);
  const [isWalletUse, setIsWalletUse] = useState(useWallet);

  useEffect(() => {
    setIsWalletUse(useWallet);
  }, [useWallet]);

  const handleUseWalletSwitchToggle = async (checked: boolean) => {
    setIsWalletUse(checked);

    dispatch(setUseWallet(checked));

    setTimeout(() => {
      updateCartData(true, false);
    }, 500);
  };

  const handleCheckoutClick = async (walletOnly = false) => {
    try {
      if (deliveryMode === "delivery" && !selectedAddress) {
        addToast({
          title: t("checkout.noAddressSelected.title"),
          description: t("checkout.noAddressSelected.description"),
          color: "warning",
        });
        return;
      }

      // Check for required attachments
      const attachments = (window as any).__cartAttachments || {};
      const itemsRequiringAttachments =
        items?.filter(
          (item) =>
            item.product.is_attachment_required &&
            item.product.attachment_mode === "required",
        ) || [];

      if (itemsRequiringAttachments.length > 0) {
        const itemsMissingAttachments = itemsRequiringAttachments.filter(
          (item) =>
            !attachments[item.product.id] ||
            attachments[item.product.id].length === 0,
        );

        if (itemsMissingAttachments.length > 0) {
          const productNames = itemsMissingAttachments
            .map((item) => item.product.name)
            .filter(Boolean)
            .join(", ");

          addToast({
            title: t("checkout.attachmentsRequired.title", {
              defaultValue: "Attachments Required",
            }),
            description: t("checkout.attachmentsRequired.description", {
              products: productNames,
              defaultValue: `Please upload required attachments for: ${productNames}`,
            }),
            color: "warning",
          });
          return;
        }
      }

      // Check closed stores
      const closedStores =
        items?.length > 0
          ? items.filter((item) => !item.store?.status?.is_open)
          : [];

      if (closedStores.length > 0) {
        const closedStoreNames = closedStores
          .map((s) => s.store?.name)
          .filter(Boolean)
          .join(", ");

        addToast({
          title: t("checkout.closedStores.title"),
          description: t("checkout.closedStores.description", {
            stores: closedStoreNames,
          }),
          color: "danger",
        });

        return;
      }

      // Wallet-only checkout
      if (walletOnly) {
        setLoading(true);
        const res = await handleCheckout("wallet", {});

        if (res?.success) {
          await router.push("/my-account/orders");
          dispatch(setPromoCode(""));
          updateCartData(true, false);
        } else {
          addToast({
            title: t("checkout.failed.title"),
            description: res?.message || t("checkout.failed.description"),
            color: "danger",
          });
        }

        return;
      } else {
        // Open payment selection modal
        onOpen();
      }
    } catch (error) {
      console.error("Error in handleCheckoutClick:", error);
      addToast({
        title: t("general.error.title"),
        description: t("general.error.somethingWentWrong"),
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      (payment_summary.wallet_balance === 0 && payment_summary.use_wallet) ||
      (!isWalletEnabled && payment_summary.use_wallet)
    ) {
      setTimeout(() => {
        setIsWalletUse(false);
        dispatch(setUseWallet(false));
      }, 0);
      setTimeout(() => {
        updateCartData(true, false);
      }, 500);
    } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment_summary, dispatch]);

  const promo = Array.isArray(payment_summary?.promo_applied)
    ? null
    : payment_summary?.promo_applied || null;

  const isFreeShipping = promo?.discount_type === "free_shipping";
  const promo_mode = promo?.promo_mode;
  const isInstantPromo = promo_mode === "instant";
  const isCashbackPromo = promo_mode === "cashback";

  // Validation checks based on system settings
  const validationErrors: string[] = [];

  const uniqueStoreIds = useMemo(() => {
    return new Set(items.map((item) => item.store?.id).filter(Boolean));
  }, [items]);

  // Check checkout type (single_store vs multi_store)
  if (
    !isSingleVendor &&
    systemSettings?.checkoutType === "single_store" &&
    items?.length > 0
  ) {
    if (uniqueStoreIds.size > 1) {
      validationErrors.push(
        t("checkout.validation.multipleStores", {
          defaultValue:
            "Your cart contains products from multiple stores. Single store checkout only allows products from one store.",
        }),
      );
    }
  }



  // Check maximum items allowed in cart
  if (
    systemSettings?.maximumItemsAllowedInCart &&
    total_quantity > systemSettings.maximumItemsAllowedInCart
  ) {
    validationErrors.push(
      t("checkout.validation.maxItemsExceeded", {
        maxItems: systemSettings.maximumItemsAllowedInCart,
        currentItems:
          Number(total_quantity) -
          Number(systemSettings.maximumItemsAllowedInCart),
        defaultValue: `Maximum ${systemSettings.maximumItemsAllowedInCart} items allowed in cart. You have ${total_quantity} items.`,
      }),
    );
  }

  // Check minimum cart amount
  if (
    systemSettings?.minimumCartAmount &&
    payment_summary.items_total < systemSettings.minimumCartAmount
  ) {
    const remainingAmount =
      systemSettings.minimumCartAmount - payment_summary.items_total;
    validationErrors.push(
      t("checkout.validation.minCartAmount", {
        minAmount: formatAmount(systemSettings.minimumCartAmount),
        currentAmount: formatAmount(payment_summary.items_total),
        remainingAmount: formatAmount(remainingAmount),
        currencySymbol,
        defaultValue: `Minimum cart amount is ${currencySymbol}${formatAmount(systemSettings.minimumCartAmount)}. Add ${currencySymbol}${formatAmount(remainingAmount)} more to proceed.`,
      }),
    );
  }

  const payableAmount = useMemo(() => {
    if (deliveryMode === 'pickup') {
      const deliveryCharges = Number(payment_summary.total_delivery_charges || 0);
      const dropOffFee = Number(payment_summary.per_store_drop_off_fee || 0);
      return Math.max(0, Number(payment_summary.payable_amount) - deliveryCharges - dropOffFee);
    }
    return payment_summary.payable_amount;
  }, [deliveryMode, payment_summary]);

  const hasValidationErrors = validationErrors.length > 0;

  return (
    <div className="w-full flex justify-end">
      <Card radius="md" className="w-full p-2" shadow="sm">
        <CardHeader className="flex w-full justify-between items-center">
          <h2 className="font-semibold">{t("checkout.yourOrder")}</h2>
          <Button
            size="sm"
            className="h-6 text-xs"
            color="danger"
            title={t("checkout.clearCart")}
            onPress={() => setShowClearCartModal(true)}
          >
            {t("checkout.clearCart")}
          </Button>
        </CardHeader>
        <CardBody>
          <CartItems items={cart.items} currencySymbol={currencySymbol} />
        </CardBody>
        <CardFooter className="space-y-6 flex flex-col w-full border-t-1 border-gray-200 dark:border-default-100">
          <div className="space-y-3 pt-4 w-full text-sm">
            <div className="flex justify-between">
              <span>{t("checkout.itemsTotal")}</span>
              <span>
                {currencySymbol}
                {formatAmount(payment_summary.items_total)}
              </span>
            </div>
            <div className="w-full -mt-2 text-start text-xs text-gray-500">
              {`${t("checkout.allPricesIncludeTaxes")}`}
            </div>

            {deliveryMode === "delivery" && selectedAddress?.id && (
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5">
                  {t("checkout.deliveryCharges")}
                  {cart.delivery_zone?.free_delivery_amount &&
                    Number(cart.delivery_zone.free_delivery_amount) > 0 &&
                    Number(payment_summary.items_total) < Number(cart.delivery_zone.free_delivery_amount) && (
                      <Popover placement="top" showArrow={true}>
                        <PopoverTrigger>
                          <button className="outline-none focus:outline-none flex items-center justify-center" type="button">
                            <Info className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 cursor-pointer" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent>
                          <div className="px-3 py-2 text-xs font-medium max-w-[250px] text-foreground">
                            {t("filters.addMoreForFreeDelivery", {
                              amount: `${currencySymbol}${formatAmount(
                                Number(cart.delivery_zone.free_delivery_amount) -
                                  Number(payment_summary.items_total)
                              )}`,
                            }) ||
                              `Add items worth ${currencySymbol}${formatAmount(
                                Number(cart.delivery_zone.free_delivery_amount) -
                                  Number(payment_summary.items_total)
                              )} more to get FREE delivery!`}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                </span>

                {Number(payment_summary.total_delivery_charges) === 0 ? (
                  <span className="text-green-600 font-semibold">
                    {t("checkout.freeShipping") || "Free"}
                  </span>
                ) : isFreeShipping && isInstantPromo ? (
                  <span className="flex items-center gap-2">
                    {/* Strikethrough original amount */}
                    <span className="line-through text-gray-500">
                      {currencySymbol}
                      {formatAmount(payment_summary.total_delivery_charges)}
                    </span>

                    {/* Free Shipping text */}
                    <span className="text-green-600 font-semibold">
                      {t("checkout.freeShipping")}
                    </span>
                  </span>
                ) : (
                  <span>
                    {currencySymbol}
                    {formatAmount(payment_summary.total_delivery_charges)}
                  </span>
                )}
              </div>
            )}

            {payment_summary.handling_charges > 0 && (
              <div className="flex justify-between">
                <span>{t("checkout.handlingCharges")}</span>
                <span>
                  {currencySymbol}
                  {formatAmount(payment_summary.handling_charges)}
                </span>
              </div>
            )}

            {deliveryMode === "delivery" && payment_summary.per_store_drop_off_fee > 0 && (
              <div className="flex justify-between">
                <div>
                  {t("checkout.dropOffFee")}{" "}
                  {!isSingleVendor && (
                    <>
                      ({payment_summary.total_stores}
                      <span className="ml-1">{t("checkout.stores")})</span>
                    </>
                  )}
                </div>
                <span>
                  {currencySymbol}
                  {formatAmount(payment_summary.per_store_drop_off_fee)}
                </span>
              </div>
            )}

            {/* {payment_summary.delivery_distance_charges > 0 && (
              <div className="flex justify-between">
                <span>
                  {t("checkout.distanceCharges")} (
                  {payment_summary.delivery_distance_km} km)
                </span>
                <span>
                  {currencySymbol}
                  {formatAmount(payment_summary.delivery_distance_charges)}
                </span>
              </div>
            )} */}

            {deliveryMode === "delivery" && payment_summary.is_rush_delivery && (
              <div className="flex justify-between text-orange-600">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  {t("checkout.rushDelivery")}
                </span>
                <span className="text-xs">
                  {t("checkout.rushDeliveryDescription")}
                </span>
              </div>
            )}

            {deliveryMode === "delivery" && payment_summary.estimated_delivery_time > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>{t("checkout.estimatedDelivery")}</span>
                <span className="text-xs">
                  {payment_summary.estimated_delivery_time} {t("mins")}
                </span>
              </div>
            )}

            {(deliveryMode === "delivery" && selectedAddress?.id) || deliveryMode === "pickup" ? (
              <>
                {/* INSTANT PROMO - Shown as discount with deduction */}
                {payment_summary.promo_applied &&
                  payment_summary.promo_discount > 0 &&
                  isInstantPromo && (
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between text-green-700">
                        <div className="w-full flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4" />
                            <span className="font-medium">
                              {t("checkout.promo")}:{" "}
                              {payment_summary?.promo_code}
                            </span>
                          </div>
                        </div>

                        {/* Right side value - deduction */}
                        <span className="font-semibold inline-block whitespace-nowrap">
                          {isFreeShipping ? (
                            <span className="text-green-600 whitespace-nowrap">
                              {t("checkout.freeShipping")}
                            </span>
                          ) : (
                            `- ${currencySymbol} ${formatAmount(payment_summary.promo_discount)}`
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                {/* CASHBACK PROMO - Shown as reward */}
                {payment_summary.promo_applied &&
                  payment_summary.promo_discount > 0 &&
                  isCashbackPromo && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-start text-blue-700">
                        {/* Left Section */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <Wallet className="w-4 h-4" />
                            <span className="font-medium">
                              {t("checkout.promo")}:{" "}
                              {payment_summary?.promo_code}
                            </span>
                          </div>

                          <p className="text-xs text-blue-600 dark:text-blue-400 italic">
                            {t("cashbackPendingNote")}
                          </p>
                        </div>

                        {/* Right Section */}
                        <div className="flex flex-col items-end gap-1">
                          {isFreeShipping && (
                            <span className="text-green-600 font-semibold whitespace-nowrap">
                              {t("checkout.freeShipping")}
                            </span>
                          )}

                          <span className="font-semibold whitespace-nowrap text-blue-600">
                            + {currencySymbol}{" "}
                            {formatAmount(payment_summary.promo_discount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
              </>
            ) : null}

            {/* Wallet Section */}
            {isWalletEnabled ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    isSelected={isWalletUse}
                    isDisabled={
                      isLoading || payment_summary.wallet_balance == 0
                    }
                    onValueChange={handleUseWalletSwitchToggle}
                    size="sm"
                    classNames={{ label: "text-xs", thumbIcon: "w-2" }}
                    color="success"
                  >
                    {t("checkout.useWalletBalance")}
                  </Switch>
                  <span className="text-xxs text-foreground/80">
                    ({currencySymbol}
                    {payment_summary.wallet_balance || 0})
                  </span>
                </div>
              </div>
            ) : null}
            {isWalletUse && payment_summary.wallet_amount_used > 0 ? (
              <>
                <div className="flex justify-between text-green-600">
                  <span>{t("checkout.walletAmountUsed")}</span>
                  <span>
                    -{currencySymbol}
                    {payment_summary.wallet_amount_used}
                    
                  </span>
                </div>

                {/* Remaining Wallet Balance */}
                <div className="flex justify-between text-blue-600">
                  <span>{t("checkout.remainingWalletBalance")}</span>
                  <span>
                    {currencySymbol}
                    {(
                      Number(payment_summary?.wallet_balance ?? 0) -
                      Number(payment_summary?.wallet_amount_used ?? 0)
                    ).toFixed(2)}
                  </span>
                </div>
              </>
            ) : null}

            {/* Total Section */}
            <Divider orientation="horizontal" />
            <div className="pt-1">
              <div className="flex justify-between text-lg font-semibold">
                <span>{t("checkout.totalAmount")}</span>
                <span>
                  {currencySymbol}
                  {formatAmount(payableAmount)}
                </span>
              </div>
            </div>
          </div>

          {hasValidationErrors ? (
            <Alert
              color="warning"
              variant="faded"
              title={t("checkout.validation.title", {
                defaultValue: "Cannot proceed to checkout",
              })}
              description={
                <ul className="list-disc pl-5">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              }
              classNames={{
                description: "text-xs",
              }}
            />
          ) : payableAmount == 0 && isWalletUse ? (
            <Button
              className="w-full font-medium py-3 rounded-lg"
              color="primary"
              isLoading={loading}
              onPress={() => handleCheckoutClick(true)}
              isDisabled={isLoading}
            >
              {t("checkout.payWithWallet")}
            </Button>
          ) : (
            <Button
              className="w-full font-medium py-3 rounded-lg"
              color="primary"
              onPress={() => handleCheckoutClick(false)}
              isDisabled={isLoading}
            >
              {t("checkout.proceedToCheckout")}
            </Button>
          )}
        </CardFooter>
      </Card>
      <PaymentModal open={isOpen} onOpenChange={onOpenChange} />
      <ConfirmationModal
        isOpen={showClearCartModal}
        onClose={() => setShowClearCartModal(false)}
        onConfirm={async () => {
          await clearCart();
          setShowClearCartModal(false);
          addToast({
            title: t("checkout.cartCleared.title"),
            description: t("checkout.cartCleared.description"),
            color: "success",
          });
          await router.push("/");
          updateCartData(true, false);
        }}
        title="Clear Cart"
        icon={<Trash2 className="w-4 h-4" />}
        description={t("checkout.clearCartModal.description")}
        confirmText={t("checkout.clearCartModal.confirmText")}
        cancelText={t("checkout.clearCartModal.cancelText")}
        variant="danger"
        alertTitle={t("checkout.clearCartModal.alertTitle")}
        alertDescription={t("checkout.clearCartModal.alertDescription")}
      />
    </div>
  );
};

export default CheckoutSection;
