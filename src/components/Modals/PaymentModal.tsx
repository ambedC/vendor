import { FC, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  addToast,
} from "@heroui/react";
import PaymentMethods from "../PaymentMethods";
import { handleCheckout } from "@/helpers/functionalHelpers";
import { useRouter } from "next/router";
import { updateCartData } from "@/helpers/updators";
import RazorPay from "../PaymentGateway/RazorPay";
import Stripe from "../PaymentGateway/Stripe";
import { useTranslation } from "react-i18next";
import PayStack from "../PaymentGateway/Paystack";
import FlutterwavePayment from "../PaymentGateway/FlutterwavePayment";
import { useDispatch, useSelector } from "react-redux";
import { setPromoCode } from "@/lib/redux/slices/checkoutSlice";
import { RootState } from "@/lib/redux/store";
import { useEffect } from "react";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const PaymentModal: FC<PaymentModalProps> = ({ open, onOpenChange }) => {
  const [selectedPayment, setSelectedPayment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { deliveryMode } = useSelector(
    (state: RootState) => state.checkout,
  );

  useEffect(() => {
    if (deliveryMode === "pickup" && selectedPayment === "cod") {
      setSelectedPayment("");
    }
  }, [deliveryMode, selectedPayment]);

  const handleContinue = async () => {
    if (!selectedPayment) {
      return addToast({
        title: t("please_select_payment_method"),
        color: "warning",
      });
    }

    if (selectedPayment === "cod") {
      setIsLoading(true);
      try {
        const res = await handleCheckout("cod", {});
        if (res?.success) {
          onOpenChange(false);
          await router.push("/my-account/orders");
          dispatch(setPromoCode(""));
        }
      } finally {
        setIsLoading(false);
        updateCartData(true, false);
      }
    } else if (selectedPayment === "directBankTransfer") {
      document.getElementById("bank_transfer_modal_btn")?.click();
    }
  };

  const handlePaymentSuccess = async () => {
    onOpenChange(false);
    await router.push("/my-account/orders");
  };

  const handleError = () => {
    // onOpenChange(false);
  };

  return (
    <>
      <Modal
        isOpen={open}
        onOpenChange={onOpenChange}
        backdrop="blur"
        size="xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            <h2 className="font-semibold">{t("select_payment_method")}</h2>
          </ModalHeader>

          <ModalBody>
            <PaymentMethods
              selectedPayment={selectedPayment}
              setSelectedPayment={setSelectedPayment}
              hideCOD={deliveryMode === "pickup"}
              isLoading={isLoading}
            />
          </ModalBody>

          <ModalFooter>
            {(selectedPayment === "cod" ||
              selectedPayment === "directBankTransfer") && (
              <Button
                color="primary"
                onPress={handleContinue}
                isLoading={isLoading}
                className="w-full"
              >
                {t("continue")}
              </Button>
            )}

            {selectedPayment === "stripePayment" && (
              <Stripe
                onSuccess={handlePaymentSuccess}
                onError={handleError}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            )}

            {selectedPayment === "razorpayPayment" && (
              <RazorPay
                onSuccess={handlePaymentSuccess}
                onError={handleError}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            )}

            {selectedPayment === "paystackPayment" && (
              <PayStack
                onSuccess={handlePaymentSuccess}
                onError={handleError}
                setIsLoading={setIsLoading}
                isLoading={isLoading}
                usageType="order"
              />
            )}

            {selectedPayment === "flutterwavePayment" && (
              <FlutterwavePayment
                onSuccess={handlePaymentSuccess}
                onError={handleError}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default PaymentModal;
