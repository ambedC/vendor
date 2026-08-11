import { Button } from "@heroui/react";
import React from "react";
import { useTranslation } from "react-i18next";

const OrdersEmpty: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="w-full">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-gray-500 text-lg font-medium mb-2">
            {t("orders_empty_title")}
          </div>
          <p className="text-gray-600 mb-4">{t("orders_empty_description")}</p>
          <Button
            onPress={() => (window.location.href = "/")}
            className="text-xs"
            size="sm"
          >
            {t("orders_empty_button")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrdersEmpty;
