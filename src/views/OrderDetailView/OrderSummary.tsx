import { Order } from "@/types/ApiResponse";
import { Card, CardBody, CardHeader, Divider, Chip } from "@heroui/react";
import { ReceiptText, Gift, Zap } from "lucide-react";
import React, { FC } from "react";
import { useTranslation } from "react-i18next";

interface OrderSummaryProps {
  order: Order;
  currencySymbol: string;
}

const OrderSummary: FC<OrderSummaryProps> = ({ order, currencySymbol }) => {
  const { t } = useTranslation();

  const formatCurrency = (amount: string) => {
    return `${currencySymbol}${parseFloat(amount).toFixed(2)}`;
  };

  const getPromoStatus = () => {
    if (order.promo_line?.cashback_flag) {
      return order.promo_line?.is_awarded ? "awarded" : "pending";
    }
    return "applied";
  };

  const getPromoLabel = () => {
    if (order.promo_line?.cashback_flag) {
      return order.promo_line?.is_awarded
        ? t("cashbackAwarded")
        : t("cashbackReward");
    }
    return t("promoDiscountApplied");
  };

  const promoStatus = getPromoStatus();

  // Calculate wallet amount used
  const walletAmountUsed = Math.max(0, Number(order.wallet_balance || 0));
  const hasWalletUsed = walletAmountUsed > 0;

  return (
    <Card shadow="sm" radius="lg" className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ReceiptText className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {t("orderSummary")}
          </h3>
        </div>
      </CardHeader>

      <Divider className="my-0" />

      <CardBody className="py-4 px-4 space-y-0">
        {/* Subtotal */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t("subtotal")}
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {formatCurrency(order.subtotal)}
          </span>
        </div>

        {/* Charges */}
        <div className="space-y-2 py-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t("deliveryCharge")}
            </span>
            <span className="text-sm text-gray-900 dark:text-gray-100">
              {order.delivery_type !== "pickup" && Number(order.delivery_charge) === 0 ? (
                <span className="text-green-600 font-semibold">
                  {t("checkout.freeShipping") || "Free"}
                </span>
              ) : (
                formatCurrency(order.delivery_charge.toString())
              )}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t("handlingCharges")}
            </span>
            <span className="text-sm text-gray-900 dark:text-gray-100">
              {formatCurrency(order.handling_charges.toString())}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t("dropOffFee")}
            </span>
            <span className="text-sm text-gray-900 dark:text-gray-100">
              {formatCurrency(order.per_store_drop_off_fee.toString())}
            </span>
          </div>
        </div>
        {order.promo_line && <Divider className="my-3" />}

        {/* Promo / Cashback */}
        <div className="space-y-3 py-2">
          {order.promo_line && (
            <div className="bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2 flex-1">
                  {order.promo_line.cashback_flag ? (
                    <Zap className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  ) : (
                    <Gift className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  )}

                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {getPromoLabel()}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      {t("code")}:{" "}
                      <span className="font-semibold">
                        {order.promo_line.promo_code}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <Chip
                  size="sm"
                  variant="flat"
                  classNames={{ base: "text-xs" }}
                  className={
                    promoStatus === "awarded"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : promoStatus === "pending"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  }
                >
                  {promoStatus === "awarded"
                    ? t("credited")
                    : promoStatus === "pending"
                      ? t("pending")
                      : t("applied")}
                </Chip>
              </div>

              {/* Discount / Cashback Amount */}
              <div className="flex justify-between items-center pt-1 border-t border-blue-200 dark:border-blue-700">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {order.promo_line.cashback_flag
                    ? t("cashbackAmount")
                    : t("discountAmount")}
                </span>
                <span
                  className={`text-sm font-semibold ${
                    order.promo_line.cashback_flag
                      ? "text-blue-600"
                      : "text-green-600"
                  }`}
                >
                  {order.promo_line.cashback_flag ? "" : "-"}
                  {formatCurrency(order.promo_line.discount_amount)}
                </span>
              </div>

              {/* Pending Cashback Note */}
              {order.promo_line.cashback_flag &&
                !order.promo_line.is_awarded && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 italic pt-1">
                    {t("cashbackPendingNote")}
                  </p>
                )}
            </div>
          )}

          {/* Gift Card */}
          {parseFloat(order.gift_card_discount) > 0 && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  {t("giftCardApplied")}
                </span>
                <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                  -{formatCurrency(order.gift_card_discount)}
                </span>
              </div>
            </div>
          )}
        </div>

        {order.promo_line || hasWalletUsed ? (
          <Divider className="my-3" />
        ) : (
          <Divider className="mb-3" />
        )}

        {/* Final Total */}
        <div className="flex justify-between items-center py-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3">
          <span className="text-base font-bold text-gray-900 dark:text-gray-100">
            {t("finalTotal") || "Final Total"}
          </span>
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(order.final_total)}
          </span>
        </div>

        {/* Total Payable — only shown when amount > 0 */}
        {parseFloat(order.total_payable) > 0 && (
          <div className="flex justify-between items-center py-2 px-3">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t("totalPayable") || "Total Payable"}
            </span>
            <span className="text-base font-bold text-green-600 dark:text-green-400">
              {formatCurrency(order.total_payable)}
            </span>
          </div>
        )}

        {/* Wallet Note if used */}
        {hasWalletUsed && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-3 italic">
            {t("walletPaymentNote", {
              walletAmount: formatCurrency(walletAmountUsed.toFixed(2)),
              remainingAmount: formatCurrency(order.total_payable),
              paymentMethod:
                order.payment_method?.toUpperCase() || "PAYMENT GATEWAY",
            })}
          </p>
        )}

      </CardBody>
    </Card>
  );
};

export default OrderSummary;
