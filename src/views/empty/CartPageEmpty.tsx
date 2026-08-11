import React from "react";
import { Button } from "@heroui/react";
import { ArrowLeft, Package } from "lucide-react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";

const CartPageEmpty = () => {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center relative overflow-hidden">
      {/* Background decorative circles */}
      <div className="absolute w-[40vw] h-[55vh] border border-blue-200 dark:border-gray-700 rounded-full opacity-30"></div>
      <div className="absolute w-[50vw] h-[80vh] border border-indigo-200 dark:border-gray-600 rounded-full opacity-30"></div>

      <div className="relative z-10 max-w-md w-full px-4 py-6 text-center">
        {/* Cart icon */}
        <div className="relative w-32 h-32 mx-auto mb-6">
          <div className="absolute inset-0 bg-linear-to-r from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-full opacity-40 blur-md"></div>
          <div className="relative h-full flex items-center justify-center">
            <div className="w-16 h-12 border-4 border-gray-400 dark:border-gray-300 rounded-md bg-white dark:bg-gray-800 relative">
              <div className="absolute -left-2 top-1 w-4 h-6 border-4 border-gray-400 dark:border-gray-300 border-r-0 rounded-l-md"></div>
              <div className="absolute inset-0 flex items-center justify-center gap-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full opacity-50"
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Headings */}
        <h2 className="text-2xl font-bold mb-3 text-gray-800 dark:text-white">
          {t("cart.cartEmptyTitle")}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          {t("cart.cartEmptyDescription")}
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">

          <Button
            variant="flat"
            color="default"
            fullWidth
            onPress={() => router.push("/categories")}
            startContent={<Package className="w-4 h-4" />}
          >
            {t("cart.browseCategories")}
          </Button>

          <Button
            variant="ghost"
            color="default"
            onPress={() => router.push("/")}
            fullWidth
            startContent={<ArrowLeft className="w-4 h-4" />}
          >
            {t("cart.backToHome")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartPageEmpty;
