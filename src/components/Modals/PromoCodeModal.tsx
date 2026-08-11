import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ScrollShadow,
  Spinner,
} from "@heroui/react";
import useSWR from "swr";
import { PromoCode, ApiResponse } from "@/types/ApiResponse";
import { getPromoCodes } from "@/routes/api";
import PromoCard from "../Cards/PromoCard";
import { useTranslation } from "react-i18next";

interface PromoCodeModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onApplyPromo?: (promoCode: string) => void;
}

const fetcher = async (): Promise<PromoCode[]> => {
  const response: ApiResponse<PromoCode[]> = await getPromoCodes();
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.message || "Failed to fetch promo codes");
};

const PromoCodeModal: React.FC<PromoCodeModalProps> = ({
  isOpen,
  onOpenChange,
  onApplyPromo = () => {},
}) => {
  const { t } = useTranslation();
  const {
    data: promoCodes = [],
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR<PromoCode[]>(isOpen ? "/promo-codes" : null, fetcher, {
    revalidateOnFocus: false,
  });

  const handleApplyPromo = (promoCode: string) => {
    onApplyPromo(promoCode);
    onOpenChange(false);
  };

  const activePromoCodes = promoCodes.filter((promo) => !promo.deleted_at);
  const availablePromoCodes = activePromoCodes.filter(
    (promo) => new Date(promo.end_date) >= new Date()
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <Spinner size="lg" />
          <p className="text-sm text-foreground/60 mt-4">
            {t("loading_promo_codes")}
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold mb-2 text-red-600">
            {t("error_loading_promo_codes")}
          </h3>
          <p className="text-sm text-foreground/60 mb-4">
            {(error as Error).message}
          </p>
          <button
            onClick={() => mutate()}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 transition-colors"
          >
            {t("try_again")}
          </button>
        </div>
      );
    }

    if (availablePromoCodes.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">🎫</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {t("no_active_promo_codes")}
          </h3>
          <p className="text-sm text-foreground/60">{t("check_back_later")}</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2 p-0.5">
        {availablePromoCodes.map((promo) => (
          <PromoCard
            key={promo.id}
            promo={promo}
            onApply={handleApplyPromo}
            isDisabled={isValidating}
          />
        ))}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      scrollBehavior="inside"
      placement="center"
      size="2xl"
      radius="md"
      classNames={{ body: "px-1 sm:px-4", header: "px-2 sm:px-4" }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col">
          <h2 className="text-sm sm:text-lg font-bold">
            {t("available_promo_codes")}
          </h2>
          <p className="text-xs text-foreground/50">
            {isLoading
              ? t("loading_available_offers")
              : error
                ? t("unable_to_load_offers")
                : t("choose_active_offers", {
                    count: availablePromoCodes.length,
                  })}
          </p>
        </ModalHeader>

        <ModalBody>
          <ScrollShadow className="w-full h-[50vh] px-0" hideScrollBar>
            {renderContent()}
          </ScrollShadow>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default PromoCodeModal;
