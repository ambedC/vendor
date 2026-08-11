import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { addToast, Button } from "@heroui/react";
import { useSettings } from "@/contexts/SettingsContext";
import { getCartDataFromRedux, getUserDataFromRedux } from "@/helpers/getters";
import { handleCheckout } from "@/helpers/functionalHelpers";
import { createStripeIntent } from "@/routes/api";
import { setPromoCode } from "@/lib/redux/slices/checkoutSlice";
import { useDispatch } from "react-redux";

const CheckoutForm: React.FC<{
  onSuccess: () => void;
  onError: () => void;
  setIsLoading: (value: boolean) => void;
  isLoading: boolean;
  usageType?: "order" | "wallet";
  walletOrderData?: any;
  triggerRef?: React.MutableRefObject<(() => void) | null>;
}> = ({
  onError,
  onSuccess,
  isLoading,
  setIsLoading,
  usageType = "order",
  walletOrderData,
  triggerRef,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const userData = getUserDataFromRedux();
  const dispatch = useDispatch();

  // Wait for PaymentElement to be fully ready
  useEffect(() => {
    if (stripe && elements) {
      // Give elements a moment to fully mount
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [stripe, elements]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();

      if (!stripe || !elements) {
        console.error("❌ Stripe or Elements not loaded");
        setMessage("Stripe hasn't loaded yet. Please try again.");
        return;
      }

      if (!isReady) {
        console.error("❌ Payment form not ready");
        setMessage("Payment form is still loading. Please wait...");
        return;
      }

      setIsLoading(true);
      setMessage(null);

      try {
        console.log("🚀 Confirming payment...");

        const { error, paymentIntent } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/my-account/${
              usageType === "wallet" ? "wallet" : "orders"
            }`,
            receipt_email: userData?.email || "",
          },
          redirect: "if_required",
        });

        console.log("✅ Payment response:", { error, paymentIntent });

        if (error) {
          console.error("❌ Payment error:", error);
          onError();
          addToast({
            title: error.message,
            color: "danger",
          });
          setMessage(error.message || "An unexpected error occurred.");
          return;
        }

        if (!paymentIntent) {
          console.error("❌ Payment Intent is undefined");
          setMessage("Payment failed. No payment intent returned.");
          onError();
          return;
        }

        console.log(
          "✅ Payment Intent received:",
          paymentIntent.id,
          paymentIntent.status
        );

        // Handle wallet vs order flow
        let res;
        if (usageType === "wallet" && walletOrderData?.transaction?.id) {
          res = {
            success: true,
            message: "Wallet Recharge Done!",
          };
        } else {
          res = await handleCheckout("stripePayment", {
            transaction_id: paymentIntent.id,
          });
        }

        if (res.success) {
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
          setMessage(
            usageType === "wallet"
              ? "Wallet Recharge Failed!"
              : "Order Placement Failed!"
          );
          addToast({
            title:
              usageType === "wallet"
                ? "Wallet Recharge Failed!"
                : "Order Placement Failed!",
            color: "danger",
            description: `${res.message || ""}`,
          });
        }
      } catch (err) {
        addToast({ title: "An unexpected error occurred.", color: "danger" });
        setMessage("An unexpected error occurred.");
        console.error("Payment error:", err);
        onError();
      } finally {
        setIsLoading(false);
      }
    },
    [
      stripe,
      elements,
      isReady,
      userData?.email,
      usageType,
      walletOrderData?.transaction?.id,
      onSuccess,
      onError,
      setIsLoading,
      dispatch,
    ]
  );

  // ✅ Expose handleSubmit via triggerRef for auto-triggering
  useEffect(() => {
    if (triggerRef && stripe && elements && isReady) {
      triggerRef.current = () => handleSubmit();
      console.log("✅ Payment trigger ready");
    }
  }, [stripe, elements, isReady, triggerRef, handleSubmit]);

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 w-full flex justify-center flex-col items-end"
    >
      <div className="space-y-4 w-full h-full max-w-full overflow-y-scroll max-h-[40vh] px-2">
        <PaymentElement />
      </div>

      {message && (
        <div
          className={`p-3 rounded ${
            message.includes("successful")
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message}
        </div>
      )}
      <Button
        type="submit"
        isDisabled={!stripe || !elements || !isReady || isLoading}
        color="primary"
        isLoading={isLoading}
      >
        {isLoading ? "Processing..." : "Pay Now"}
      </Button>
    </form>
  );
};

interface StripeProps {
  onSuccess: () => void;
  onError: () => void;
  setIsLoading: (value: boolean) => void;
  isLoading: boolean;
  usageType?: "order" | "wallet";
  walletOrderData?: any;
  triggerRef?: React.MutableRefObject<(() => void) | null>;
}

const Stripe: React.FC<StripeProps> = ({
  onError,
  onSuccess,
  isLoading,
  setIsLoading,
  usageType = "order",
  walletOrderData,
  triggerRef,
}) => {
  const { paymentSettings } = useSettings();
  const [clientSecret, setClientSecret] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  const cartData = getCartDataFromRedux();
  const calledRef = useRef(false);

  // Get amount based on usage type
  const amount =
    usageType === "wallet"
      ? walletOrderData?.transaction?.amount
      : cartData?.payment_summary?.payable_amount;

  // Dynamically load Stripe when publishable key is available
  const stripePromise = useMemo(() => {
    const key = paymentSettings?.stripePublishableKey || "";
    return key ? loadStripe(key) : null;
  }, [paymentSettings]);

  useEffect(() => {
    // Reset the calledRef when walletOrderData changes
    calledRef.current = false;
    setIsInitializing(true);
    setError("");
    setClientSecret("");
  }, [walletOrderData, usageType]);

  useEffect(() => {
    const createPaymentIntent = async () => {
      if (calledRef.current) return;
      calledRef.current = true;

      try {
        // For wallet, use existing client secret from walletOrderData
        if (usageType === "wallet") {
          const secret = walletOrderData?.payment_response?.clientSecret;

          if (!secret) {
            setError("Payment initialization failed. Client secret not found.");
            console.error("Wallet client secret missing:", walletOrderData);
            setIsInitializing(false);
            return;
          }

          setClientSecret(secret);
          setIsInitializing(false);
          return;
        }

        // For orders, create new payment intent
        const res = await createStripeIntent({
          amount: amount || 0,
          currency: paymentSettings?.stripeCurrencyCode || "usd",
        });

        if (res.success && res.data?.clientSecret) {
          setClientSecret(res.data.clientSecret);
        } else {
          setError(res.message || "Failed to initialize payment");
          console.error("Error creating payment intent:", res.message);
        }
      } catch (err) {
        console.error("Payment intent creation error:", err);
        setError("Failed to initialize payment");
      } finally {
        setIsInitializing(false);
      }
    };

    if (paymentSettings?.stripeCurrencyCode && amount) {
      createPaymentIntent();
    } else {
      setIsInitializing(false);
    }
  }, [paymentSettings?.stripeCurrencyCode, amount, usageType, walletOrderData]);

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-800 rounded-lg">
        Error: {error}
      </div>
    );
  }

  if (isInitializing || !clientSecret || !stripePromise) {
    return (
      <div className="flex items-center justify-center p-8">
        <Button isLoading={true} color="primary">
          Loading payment form...
        </Button>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: "stripe" as const,
      variables: { colorPrimary: "#2563eb" },
    },
  };

  return (
    <div className="w-full">
      <Elements stripe={stripePromise} options={options}>
        <CheckoutForm
          onSuccess={onSuccess}
          onError={onError}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          usageType={usageType}
          walletOrderData={walletOrderData}
          triggerRef={triggerRef}
        />
      </Elements>
    </div>
  );
};

export default Stripe;
