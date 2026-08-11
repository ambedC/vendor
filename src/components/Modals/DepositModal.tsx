import React, { FormEvent, useState, useRef, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Form,
  useDisclosure,
  addToast,
} from "@heroui/react";
import PaymentMethods from "../PaymentMethods";
import { prepareWalletRecharge } from "@/routes/api";
import { updateUserDataInRedux } from "@/helpers/functionalHelpers";
import { useTranslation } from "react-i18next";
import RazorPay from "../PaymentGateway/RazorPay";
import Stripe from "../PaymentGateway/Stripe";
import PayStack from "../PaymentGateway/Paystack";
import { isValidUrl } from "@/helpers/validator";

const DepositModal = () => {
  const { t } = useTranslation();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedPayment, setSelectedPayment] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [walletOrderData, setWalletOrderData] = useState<any>(null);
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);

  // Refs to trigger payment automatically
  const razorpayTriggerRef = useRef<() => void>(null);
  const stripeTriggerRef = useRef<() => void>(null);
  const paystackTriggerRef = useRef<() => void>(null);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const sanitizedValue = inputValue.replace(/\D/g, "");
    const numberValue = Math.max(0, parseInt(sanitizedValue, 10));
    setErrors((prev) => ({
      ...prev,
      amount: "",
    }));
    setAmount(isNaN(numberValue) ? "" : numberValue.toString());

    if (!isNaN(numberValue) && numberValue > 0) {
      setErrors((prev) => {
        const { ...rest } = prev;
        return rest;
      });
    } else {
      setErrors((prev) => ({
        ...prev,
        amount: t("deposit_error.positive"),
      }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const description = formData.get("description")?.toString();
    setIsLoading(true);

    // Reset errors
    setErrors({});

    try {
      const parsedAmount = parseFloat(amount);
      if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
        setErrors((prev) => ({
          ...prev,
          amount: t("deposit.error.invalid"),
        }));
        return;
      }

      if (parsedAmount > 1000000) {
        setErrors((prev) => ({
          ...prev,
          amount: t("deposit.error.exceed"),
        }));
        return;
      }

      if (description) {
        if (description.length < 5) {
          setErrors((prev) => ({
            ...prev,
            description: t("deposit.error.descMin"),
          }));
          return;
        }

        if (description.length > 500) {
          setErrors((prev) => ({
            ...prev,
            description: t("deposit.error.descMax"),
          }));
          return;
        }

        if (!/^[a-zA-Z0-9\s.,!?()-]+$/.test(description)) {
          setErrors((prev) => ({
            ...prev,
            description: t("deposit.error.descInvalid"),
          }));
          return;
        }
      }

      const res = await prepareWalletRecharge({
        amount: parsedAmount,
        payment_method: selectedPayment,
        description: description,
        transaction_reference: `${Date.now()}`,
        redirect_url: `${window.location.origin}/my-account/wallet`,
      });
      if (res.success && res.data) {
        // ✅ Store wallet order data
        setWalletOrderData(res.data);
        setShowPaymentGateway(true);

        if (selectedPayment === "flutterwavePayment") {
          const paymentLink = res?.data?.payment_response?.link;

          // ✅ Validate URL before redirecting
          if (paymentLink && isValidUrl(paymentLink)) {
            window.location.href = paymentLink;
          } else {
            console.error(
              "Invalid or missing Flutterwave payment link:",
              paymentLink
            );
            addToast({
              title: t("checkout.flutterwave_link_invalid"),
              description:
                t("checkout.flutterwave_link_error_message") ||
                "Payment link is invalid or missing. Please try again.",
              color: "danger",
            });
            return; // Stop further execution
          }
        }

        // ✅ Automatically trigger payment gateway after short delay
        setTimeout(() => {
          if (
            selectedPayment === "razorpayPayment" &&
            razorpayTriggerRef.current
          ) {
            razorpayTriggerRef.current();
          } else if (
            selectedPayment === "stripePayment" &&
            stripeTriggerRef.current
          ) {
            stripeTriggerRef.current();
          } else if (
            selectedPayment === "paystackPayment" &&
            paystackTriggerRef.current
          ) {
            paystackTriggerRef.current();
          }
        }, 100);
      } else {
        addToast({
          title: t("deposit.error.title"),
          description: res.message || t("deposit.error.message"),
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Unexpected error during form submission:", error);

      addToast({
        title: t("deposit.unexpected.title"),
        description: t("deposit.unexpected.message"),
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    addToast({
      title: t("deposit.success.title"),
      description: t("deposit.success.message"),
      color: "success",
    });
    onOpenChange();
    setAmount("");
    setSelectedPayment("");
    setWalletOrderData(null);
    setShowPaymentGateway(false);
    updateUserDataInRedux();
  };

  const handlePaymentError = () => {
    // setWalletOrderData(null);
    // setShowPaymentGateway(false);
    updateUserDataInRedux();
  };

  const handleModalClose = () => {
    onOpenChange();
    setShowPaymentGateway(false);
    setWalletOrderData(null);
  };

  // Add this useEffect in DepositModal component
  useEffect(() => {
    if (showPaymentGateway && walletOrderData) {
      const timer = setTimeout(() => {
        if (
          selectedPayment === "razorpayPayment" &&
          razorpayTriggerRef.current
        ) {
          razorpayTriggerRef.current();
        } else if (
          selectedPayment === "stripePayment" &&
          stripeTriggerRef.current
        ) {
          stripeTriggerRef.current();
        }
      }, 300); // Increase delay slightly

      return () => clearTimeout(timer);
    }
  }, [showPaymentGateway, walletOrderData, selectedPayment]);

  return (
    <>
      <Button
        onPress={onOpen}
        size="sm"
        radius="md"
        title={t("deposit_title")}
        color="primary"
        className="px-2 py-0.5 w-20 text-xs font-medium transition-colors md:px-4 md:py-1 md:w-24 md:text-sm"
      >
        {t("deposit_title")}
      </Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={handleModalClose}
        placement="bottom-center"
        backdrop="blur"
        isDismissable={!isLoading && !showPaymentGateway}
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            {t("deposit.modalTitle")}
          </ModalHeader>
          <ModalBody>
            {!showPaymentGateway ? (
              <Form
                id="deposit-form"
                className="flex flex-col gap-4"
                onSubmit={handleSubmit}
                validationErrors={errors}
              >
                <Input
                  label={t("deposit.input.amount.label")}
                  type="text"
                  name="amount"
                  placeholder={t("deposit.input.amount.placeholder")}
                  isDisabled={isLoading}
                  autoFocus
                  isRequired
                  errorMessage={errors.amount}
                  startContent={<span className="text-gray-500">$</span>}
                  className="w-full"
                  classNames={{
                    input: "",
                    label: "font-medium",
                    errorMessage: "text-xs",
                  }}
                  value={amount}
                  onChange={handleAmountChange}
                  onKeyDown={(e) => {
                    const allowedKeys = [
                      "Backspace",
                      "Delete",
                      "ArrowLeft",
                      "ArrowRight",
                      "Tab",
                      ".",
                    ];

                    if (!/[0-9]/.test(e.key) && !allowedKeys.includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
                <Textarea
                  isRequired
                  label={t("deposit.input.description.label")}
                  name="description"
                  placeholder={t("deposit.input.description.placeholder")}
                  isDisabled={isLoading}
                  errorMessage={errors.description}
                  className="w-full"
                  classNames={{
                    label: "font-medium",
                    errorMessage: "text-xs",
                  }}
                  onChange={() =>
                    setErrors((prev) => ({
                      ...prev,
                      description: "",
                    }))
                  }
                  maxLength={500}
                />

                <PaymentMethods
                  selectedPayment={selectedPayment}
                  setSelectedPayment={setSelectedPayment}
                  hideCOD={true}
                  isLoading={isLoading}
                />
              </Form>
            ) : (
              <div className="flex flex-col gap-4 py-4">
                <p className="text-center text-sm text-gray-600">
                  {t("deposit.processingPayment")}
                </p>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            {showPaymentGateway && walletOrderData ? (
              <>
                {selectedPayment === "razorpayPayment" && (
                  <RazorPay
                    usageType="wallet"
                    walletOrderData={walletOrderData}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                    triggerRef={razorpayTriggerRef}
                  />
                )}
                {selectedPayment === "stripePayment" && (
                  <Stripe
                    usageType="wallet"
                    walletOrderData={walletOrderData}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                    triggerRef={stripeTriggerRef}
                  />
                )}

                {selectedPayment === "paystackPayment" && (
                  <PayStack
                    usageType="wallet"
                    walletOrderData={walletOrderData}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                    triggerRef={paystackTriggerRef}
                  />
                )}
              </>
            ) : (
              <Button
                type="submit"
                form="deposit-form"
                color="primary"
                isLoading={isLoading}
                isDisabled={!selectedPayment}
              >
                {t("deposit.submitButton")}
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default DepositModal;
