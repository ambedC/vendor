import { FC, useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  addToast,
  useDisclosure,
  Divider,
} from "@heroui/react";
import { Ticket, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { validatePromoCode } from "@/routes/api";
import { setPromoCode } from "@/lib/redux/slices/checkoutSlice";
import { updateCartData } from "@/helpers/updators";
import PromoCodeModal from "../Modals/PromoCodeModal";
import { useTranslation } from "react-i18next";

const PromoCodeSection: FC = () => {
  const [code, setCode] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const dispatch = useDispatch();
  const { cartData, isLoading } = useSelector((state: RootState) => state.cart);
  const { t } = useTranslation();

  const { promoCode, selectedAddress, deliveryMode } = useSelector(
    (state: RootState) => state.checkout
  );

  useEffect(() => {
    if (!promoCode) {
      setCode("");
    } else {
      setCode(promoCode);
    }
  }, [promoCode]);

  const handleApplyPromoCode = async () => {
    if (!code.trim()) {
      addToast({
        title: "Please enter a promo code",
        color: "warning",
      });
      return;
    }

    setIsApplying(true);
    try {
      const response = await validatePromoCode({
        cart_amount: cartData?.payment_summary.items_total,
        promo_code: code,
        delivery_charge: cartData?.payment_summary.delivery_charges,
      });

      if (response.success) {
        dispatch(setPromoCode(code));
        // The actual discount amount would come from the API response
        // For now, we'll just set it to a placeholder value

        addToast({
          title: "Promo code applied successfully",
          color: "success",
        });

        // Update cart data with the applied promo code
        updateCartData(true, false);
      } else {
        addToast({
          title: "Invalid promo code",
          description: response.message || "This promo code cannot be applied",
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Error applying promo code:", error);
      addToast({
        title: "Error",
        description: "Failed to apply promo code. Please try again.",
        color: "danger",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemovePromoCode = () => {
    dispatch(setPromoCode(""));
    setCode("");
    updateCartData(true, false);
    addToast({
      title: t("promoCode.removed"),
      color: "success",
    });
  };

  return (
    <div className="w-full h-full">
      <Card className="w-full h-full" radius="md" shadow="sm">
        <CardHeader className="flex gap-3 relative flex-col items-start pb-0">
          <div className="flex items-center gap-2">
            <Button
              isIconOnly
              color="primary"
              variant="flat"
              className="w-9 h-9 max-w-9"
            >
              <Ticket className="w-5 h-5 text-primary" />
            </Button>
            <div className="flex flex-col">
              <p className="text-xs md:text-small font-semibold">
                {t("promoCode.sectionTitle")}
              </p>
              <p className="text-xxs md:text-xs text-default-500">
                {t("promoCode.sectionDescription")}
              </p>
            </div>
          </div>
          <Divider orientation="horizontal" />
        </CardHeader>

        <CardBody>
          {promoCode ? (
            <div className="flex items-center justify-between bg-primary-50 p-2 rounded-md">
              <div>
                <p className="text-sm font-medium">{promoCode}</p>
                <p
                  className={`text-xs ${
                    (selectedAddress == null && deliveryMode === "delivery")
                      ? "text-danger"
                      : cartData?.payment_summary.promo_error !== null
                        ? "text-danger"
                        : "text-success"
                  }`}
                >
                  {(selectedAddress == null && deliveryMode === "delivery")
                    ? t("promoCode.selectAddress")
                    : cartData?.payment_summary.promo_error === null
                      ? t("promoCode.applied")
                      : `${cartData?.payment_summary.promo_error || "PromoCode is Invalid kindly remove it."}`}
                </p>
              </div>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                color="danger"
                onPress={handleRemovePromoCode}
                isDisabled={isLoading}
              >
                <X size={16} />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Enter promo code"
                value={code}
                onValueChange={setCode}
                size="sm"
                className="flex-1 pr-0"
                classNames={{
                  inputWrapper: "pr-0",
                }}
                isDisabled={isLoading || isApplying}
                endContent={
                  <Button
                    color="primary"
                    variant="light"
                    size="sm"
                    className="text-xs"
                    onPress={onOpen}
                    isDisabled={isApplying}
                  >
                    {t("view_all")}
                  </Button>
                }
              />
              <Button
                color="primary"
                size="sm"
                className="text-xs"
                onPress={handleApplyPromoCode}
                isLoading={isApplying}
                isDisabled={isLoading || !code.trim()}
              >
                {t("apply")}
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      <PromoCodeModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onApplyPromo={(promoCode) => {
          // Apply the promo code directly without setting the input field
          if (!promoCode.trim()) return;

          setIsApplying(true);
          validatePromoCode({
            cart_amount: cartData?.payment_summary.items_total,
            promo_code: promoCode,
            delivery_charge: cartData?.payment_summary.delivery_charges,
          })
            .then((response) => {
              if (response.success) {
                dispatch(setPromoCode(promoCode));
                if (selectedAddress?.id || deliveryMode === "pickup") {
                  addToast({
                    title: t("promoCode.appliedSuccess"),
                    color: "success",
                  });
                } else {
                  addToast({
                    title: t("promoCode.pleaseSelectAddress"),
                    color: "danger",
                  });
                }

                updateCartData(true, false);
              } else {
                addToast({
                  title: t("promoCode.invalid"),
                  description:
                    response.message || "This promo code cannot be applied",
                  color: "danger",
                });
              }
            })
            .catch((error) => {
              console.error("Error applying promo code:", error);
              addToast({
                title: t("promoCode.error"),
                description: "Failed to apply promo code. Please try again.",
                color: "danger",
              });
            })
            .finally(() => {
              setIsApplying(false);
            });
        }}
      />
    </div>
  );
};

export default PromoCodeSection;
