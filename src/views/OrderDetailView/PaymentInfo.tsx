import React, { FC } from "react";
import { Card, CardBody, CardHeader, Chip } from "@heroui/react";
import { useTranslation } from "react-i18next";
import { CreditCard } from "lucide-react";
import { Order } from "@/types/ApiResponse";
import { useSettings } from "@/contexts/SettingsContext";

interface PaymentInfoProps {
  order: Order;
}

const PaymentInfo: FC<PaymentInfoProps> = ({ order }) => {
  const { t } = useTranslation();
  const { currencySymbol } = useSettings();

  // Calculate wallet amount used
  const walletAmountUsed = Math.max(0, Number(order.wallet_balance || 0));
  const hasWalletUsed = walletAmountUsed > 0;

  return (
    <Card shadow="sm" radius="sm">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {t("paymentDetails")}
          </h3>
        </div>
      </CardHeader>
      <CardBody className="pt-0">
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-300">
              {t("paymentMethod")}
            </span>
            <div className="flex gap-1 flex-wrap justify-end">
              {hasWalletUsed && (
                <Chip
                  size="sm"
                  variant="flat"
                  color="secondary"
                  radius="sm"
                  classNames={{ content: "text-xs" }}
                  title="WALLET"
                >
                  WALLET
                </Chip>
              )}
              {order.payment_method &&
                order.payment_method.toLowerCase() !== "wallet" && (
                  <Chip
                    size="sm"
                    variant="flat"
                    color="primary"
                    radius="sm"
                    classNames={{ content: "text-xs" }}
                    title={order.payment_method?.toUpperCase()}
                  >
                    {order.payment_method?.toUpperCase()}
                  </Chip>
                )}
            </div>
          </div>
          {hasWalletUsed && (
            <div className="flex justify-between items-center pt-1">
              <span className="text-gray-600 dark:text-gray-300">
                {t("walletAmountUsed")}
              </span>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                {currencySymbol}
                {walletAmountUsed.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-300">
              {t("paymentStatus")}
            </span>
            <Chip
              size="sm"
              variant="flat"
              radius="sm"
              classNames={{ content: "text-xs" }}
              title={
                order.payment_status?.charAt(0).toUpperCase() +
                order.payment_status?.slice(1)
              }
              color={order.payment_status === "pending" ? "warning" : "success"}
            >
              {order.payment_status?.charAt(0).toUpperCase() +
                order.payment_status?.slice(1)}
            </Chip>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default PaymentInfo;
