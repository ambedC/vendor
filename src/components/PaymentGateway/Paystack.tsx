import { handleCheckout } from "@/helpers/functionalHelpers";
import { getCartDataFromRedux } from "@/helpers/getters";
import { setPromoCode } from "@/lib/redux/slices/checkoutSlice";
import { paystackCreateOrder } from "@/routes/api";
import { ApiResponse, PaystackCreateOrderResponse } from "@/types/ApiResponse";
import { addToast, Button } from "@heroui/react";
import React, { FC, useEffect, useState } from "react";
import { useDispatch } from "react-redux";

// ✅ PayStack Types
interface PayStackResponse {
  reference: string;
  status: string;
  message: string;
  trans: string;
  transaction: string;
  trxref: string;
}

interface PayStackOrderData {
  transaction: {
    id: number;
    transaction_id: string;
    uuid: string;
    amount: string;
    currency?: string;
    currency_code?: string;
    payment_method: string;
    payment_status: string;
  };
  payment_response: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

declare global {
  interface Window {
    PaystackPop?: new () => {
      resumeTransaction(
        accessCode: string,
        options: {
          onSuccess: (response: PayStackResponse) => void;
          onCancel: () => void;
        }
      ): void;
    };
  }
}

const PayStack: FC<{
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
  const dispatch = useDispatch();

  // ✅ Load PayStack script dynamically
  useEffect(() => {
    if (document.getElementById("paystack-sdk")) {
      setSdkReady(true);
      return;
    }

    const script = document.createElement("script");
    script.id = "paystack-sdk";
    script.src = "https://js.paystack.co/v2/inline.js";
    script.async = true;
    script.onload = () => setSdkReady(true);
    script.onerror = () => console.error("PayStack SDK failed to load.");
    document.body.appendChild(script);

    return () => {
      const existing = document.getElementById("paystack-sdk");
      if (existing) existing.remove();
    };
  }, []);

  const handlePayment = React.useCallback(async () => {
    if (!sdkReady || !window.PaystackPop) {
      console.error("PayStack SDK not ready yet.");
      return;
    }

    setIsLoading(true);

    try {
      let orderData: PayStackOrderData;
      let transactionId: string | undefined = undefined;

      // ✅ Wallet Flow: Use pre-prepared order data
      if (usageType === "wallet") {
        if (!walletOrderData?.payment_response) {
          addToast({
            title: "Invalid wallet order data",
            color: "danger",
          });
          setIsLoading(false);
          return console.error("Wallet order data is missing");
        }

        orderData = walletOrderData;
        transactionId = walletOrderData.transaction?.id?.toString();
      } else {
        // ✅ Order Flow: Create new PayStack order
        const cartData = getCartDataFromRedux();

        // ✅ Always create a fresh order to avoid duplicate reference errors
        const res: ApiResponse<PaystackCreateOrderResponse> =
          await paystackCreateOrder({
            amount: cartData?.payment_summary.payable_amount || 1 * 100,
          });

        if (!res.success || !res.data) {
          addToast({
            title: res.message || "Failed to Create Order!",
            color: "danger",
          });
          setIsLoading(false);
          return console.error("Failed to create PayStack order");
        }

        orderData = res.data;

        // ✅ Ensure we have a valid, unique reference
        if (!orderData.payment_response?.reference) {
          addToast({
            title: "Invalid payment reference",
            color: "danger",
          });
          setIsLoading(false);
          return console.error("Payment reference is missing");
        }
      }

      const processPayment = async (response: PayStackResponse) => {
        setIsConfirming(true);

        try {
          const checkoutData: any = {
            reference: response.reference,
            transaction_id: response.reference,
          };

          if (usageType === "wallet" && transactionId) {
            checkoutData.wallet_transaction_id = transactionId;
          }

          const res =
            usageType === "wallet" && transactionId
              ? { success: true, message: "Wallet Recharge Done!" }
              : await handleCheckout("paystackPayment", checkoutData);

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
          console.error("Error while processing PayStack payment:", error);
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
      };

      const popup = new window.PaystackPop();

      popup.resumeTransaction(orderData.payment_response.access_code, {
        onSuccess: (response: PayStackResponse) => {
          // ✅ Payment successful, process it
          processPayment(response);
        },
        onCancel: () => {
          // ✅ User closed the popup
          addToast({
            title: "Payment Cancelled",
            description: "You have closed the PayStack checkout.",
            color: "warning",
          });
          setIsConfirming(false);
          setIsLoading(false);
          onError();
        },
      });

      setIsLoading(false);
    } catch (err) {
      console.error(err);
      addToast({
        title: "Error",
        description: "Failed to initialize payment. Please try again.",
        color: "danger",
      });
      onError();
      setIsLoading(false);
    }
  }, [
    sdkReady,
    setIsLoading,
    usageType,
    walletOrderData,
    onSuccess,
    onError,
    setIsConfirming,
    dispatch,
  ]);

  // ✅ Expose handlePayment via triggerRef for auto-triggering
  useEffect(() => {
    if (triggerRef && sdkReady && !isLoading && !isConfirming) {
      triggerRef.current = () => {
        if (!isLoading && !isConfirming) {
          handlePayment();
        }
      };
    }
  }, [
    sdkReady,
    walletOrderData,
    triggerRef,
    isLoading,
    isConfirming,
    handlePayment,
  ]);

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
            ? "Pay with PayStack"
            : "Pay with PayStack"
        : "Loading..."}
    </Button>
  );
};

export default PayStack;
