import { Card, CardBody } from "@heroui/react";
import { RotateCcw, Shield, MapPin, XCircle } from "lucide-react"; // Added XCircle
import { FC } from "react";
import type { Product } from "@/types/ApiResponse";
import { useTranslation } from "react-i18next";

interface AdditionalSectionProps {
  product: Product;
}

const AdditionalSection: FC<AdditionalSectionProps> = ({ product }) => {
  const { t } = useTranslation();
  const {
    is_returnable,
    warranty_period,
    guarantee_period,
    made_in,
    returnable_days,
    is_cancelable,
    cancelable_till,
  } = product;

  // Helper logic to determine the correct text for Returns
  const getReturnLabel = () => {
    if (!is_returnable) return t("not_returnable");
    if (returnable_days) {
      // Passes the count to i18n for pluralization (e.g., "7 Days Return")
      return t("return_days_policy", { count: returnable_days });
    }
    return t("returnable");
  };

  // Helper logic to determine the correct text for Cancellations
  const getCancelLabel = () => {
    if (!is_cancelable) return t("not_cancelable");
    if (cancelable_till) {
      // You might want to format 'cancelable_till' if it is a raw date string
      return t("cancel_till_policy", { date: cancelable_till });
    }
    return t("cancelable");
  };

  const infoCards = [
    {
      icon: <RotateCcw className="h-5 w-5" />,
      label: t("returns"),
      value: getReturnLabel(),
      available: !!is_returnable,
      baseColor: "green",
    },
    {
      icon: <XCircle className="h-5 w-5" />,
      label: t("cancellation"),
      value: getCancelLabel(),
      available: !!is_cancelable,
      baseColor: "red",
    },
    {
      icon: <Shield className="h-5 w-5" />,
      label: t("warranty"),
      value: warranty_period || "Not Specified",
      available: warranty_period && warranty_period != "0",
      baseColor: "purple",
    },
    {
      icon: <Shield className="h-5 w-5" />,
      label: t("guarantee"),
      labelKey: "guarantee",
      value: guarantee_period || "Not Specified",
      available: guarantee_period && guarantee_period != "0",
      baseColor: "purple",
    },
    {
      icon: <MapPin className="h-5 w-5" />,
      label: t("origin"),
      value: made_in || "Not Specified",
      available: !!made_in,
      baseColor: "orange",
    },
  ].filter((card) => card.available);

  if (infoCards.length === 0) return null;

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {infoCards.map((card, index) => (
          <Card
            key={index}
            isHoverable
            radius="sm"
            shadow="none"
            className="border border-gray-100 dark:border-default-100"
          >
            <CardBody>
              <div className={`flex items-center justify-between w-full`}>
                <span className={`text-${card.baseColor}-600`}>
                  {card.icon}
                </span>

                <div className="flex flex-col gap-0 items-end">
                  <p className="text-xs font-medium text-foreground/50 uppercase">
                    {card.label}
                  </p>
                  <p
                    className={`text-xs font-semibold text-${card.baseColor}-600 dark:text-white truncate max-w-[100px]`}
                    title={card.value}
                  >
                    {card.value}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdditionalSection;
