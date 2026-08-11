import { useSettings } from "@/contexts/SettingsContext";
import { handleCheckout } from "@/helpers/functionalHelpers";
import { getCartDataFromRedux, getUserDataFromRedux } from "@/helpers/getters";
import { setPromoCode } from "@/lib/redux/slices/checkoutSlice";
import { createRazorPayOrder } from "@/routes/api";
import { RazorpayOrderData } from "@/types/ApiResponse";
import { addToast, Button } from "@heroui/react";
import React, { FC, useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";

// ✅ Razorpay Types
interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayPaymentFailure {
  error: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata: {
      order_id: string;
      payment_id: string;
    };
  };
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name?: string;
  image?: string | undefined;
  description: string;
  order_id: string;
  handler: (response: RazorpayPaymentResponse) => void;
  prefill?: {
    name: string;
    email: string;
    contact: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color: string;
  };
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    confirm_close?: boolean;
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (
    event: "payment.failed",
    handler: (response: RazorpayPaymentFailure) => void
  ) => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const RazorPay: FC<{
  onSuccess: () => void;
  onError: () => void;
  setIsLoading: (value: boolean) => void;
  isLoading: boolean;
  usageType?: "order" | "wallet";
  walletOrderData?: any;
  triggerRef?: React.MutableRefObject<(() => void) | null>;
}> = ({
  onSuccess,
  onError,
  isLoading,
  setIsLoading,
  usageType = "order",
  walletOrderData,
  triggerRef,
}) => {
  const [sdkReady, setSdkReady] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const { paymentSettings } = useSettings();
  const userData = getUserDataFromRedux();
  const dispatch = useDispatch();

  // ✅ Load Razorpay script dynamically
  useEffect(() => {
    if (document.getElementById("razorpay-sdk")) {
      setSdkReady(true);
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-sdk";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setSdkReady(true);
    script.onerror = () => console.error("Razorpay SDK failed to load.");
    document.body.appendChild(script);

    return () => {
      const existing = document.getElementById("razorpay-sdk");
      if (existing) existing.remove();
    };
  }, []);

  const handlePayment = useCallback(async () => {
    if (!sdkReady) {
      console.error("Razorpay SDK not ready yet.");
      return;
    }

    setIsLoading(true);

    try {
      let order: RazorpayOrderData;
      let transactionId: string | undefined;

      // ✅ Wallet Flow: Use pre-prepared order data
      if (usageType === "wallet") {
        if (!walletOrderData?.payment_response) {
          addToast({
            title: "Invalid wallet order data",
            color: "danger",
          });
          return console.error("Wallet order data is missing");
        }

        order = {
          id: walletOrderData.payment_response.id,
          amount: walletOrderData.payment_response.amount / 100,
          currency: walletOrderData.payment_response.currency,
          receipt: walletOrderData.payment_response.receipt,
        } as RazorpayOrderData;

        transactionId = walletOrderData.transaction?.id?.toString();
      } else {
        const cartData = getCartDataFromRedux();
        const res = await createRazorPayOrder({
          amount: cartData?.payment_summary.payable_amount || 1,
          currency: "INR",
          receipt: new Date().toISOString(),
        });

        if (!res.success || !res.data) {
          addToast({
            title: res.message || "Failed to Create Order!",
            color: "danger",
          });
          return console.error("Failed to create Razorpay order");
        }

        order = res.data;
      }

      const options: RazorpayOptions = {
        key: paymentSettings?.razorpayKeyId || "",
        amount: order.amount * 100,
        currency: order.currency,
        description: usageType === "wallet" ? "Wallet Recharge" : "Pay Safe",
        order_id: order.id,
        handler: async (response: RazorpayPaymentResponse) => {
          setIsConfirming(true);

          try {
            console.log("Payment success response:", response);

            const checkoutData: any = {
              razorpay_order_id: response.razorpay_order_id,
              transaction_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            };

            if (usageType === "wallet" && transactionId) {
              checkoutData.wallet_transaction_id = transactionId;
            }

            const res =
              usageType === "wallet" && transactionId
                ? { success: true, message: "Wallet Recharge Done !" }
                : await handleCheckout("razorpayPayment", checkoutData);

            if (res?.success) {
              onSuccess();
              addToast({
                title:
                  usageType === "wallet"
                    ? "Wallet Recharged Successfully!"
                    : "Order Placed Successfully!",
                color: "success",
              });

              if (usageType !== "wallet") {
                dispatch(setPromoCode(""));
              }
            } else {
              setIsConfirming(false);
              setIsLoading(false);
              addToast({
                title:
                  usageType === "wallet"
                    ? "Wallet Recharge Failed!"
                    : "Order Placement Failed!",
                color: "danger",
                description:
                  res?.message ||
                  "Something went wrong while processing the payment.",
              });
            }
          } catch (error) {
            console.error("Error while processing Razorpay payment:", error);
            addToast({
              title: "Unexpected Error",
              color: "danger",
              description:
                "An error occurred while processing your payment. Please try again.",
            });
            setIsConfirming(false);
          } finally {
            setIsLoading(false);
          }
        },
        prefill: {
          name: userData?.name || "",
          email: userData?.email || "",
          contact: userData?.mobile || "",
        },
        notes:
          usageType === "wallet" && walletOrderData?.payment_response?.notes
            ? walletOrderData.payment_response.notes
            : { timeOfPayment: order.receipt },
        modal: {
          ondismiss: () => {
            addToast({
              title: "Payment Cancelled",
              description: "You have closed the Razorpay checkout.",
              color: "warning",
            });
            setIsConfirming(false);
            setIsLoading(false);
            onError();
          },
          confirm_close: true,
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", (response: RazorpayPaymentFailure) => {
        console.error("Payment failed:", response.error);
        addToast({
          title: "Payment Failed",
          description: response.error.description,
          color: "danger",
        });
        onError();
        setIsLoading(false);
      });

      rzp.open();
    } catch (err) {
      console.error(err);
      addToast({
        title: "Error",
        description: "Failed to initialize payment. Please try again.",
        color: "danger",
      });
      onError();
    } finally {
      setIsLoading(false);
    }
  }, [
    sdkReady,
    setIsLoading,
    usageType,
    walletOrderData,
    paymentSettings,
    onSuccess,
    onError,
    userData,
    setIsConfirming,
    dispatch,
  ]);

  // ✅ Expose handlePayment via triggerRef for auto-triggering
  useEffect(() => {
    if (triggerRef) {
      triggerRef.current = handlePayment;
    }
  }, [sdkReady, walletOrderData, triggerRef, handlePayment]);

  return (
    <Button
      onPress={handlePayment}
      isDisabled={!sdkReady}
      color="primary"
      isLoading={isLoading || isConfirming}
    >
      {sdkReady
        ? isConfirming
          ? "Confirming"
          : usageType === "wallet"
            ? "Pay with Razorpay"
            : "Pay with Razorpay"
        : "Loading..."}
    </Button>
  );
};

export default RazorPay;
