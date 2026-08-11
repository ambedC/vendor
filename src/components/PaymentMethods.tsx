import { useSettings } from "@/contexts/SettingsContext";
import { Image, Radio, RadioGroup, ScrollShadow } from "@heroui/react";
import { FC } from "react";
import { useTranslation } from "react-i18next";

interface PaymentMethodsProps {
  selectedPayment: string;
  setSelectedPayment: (value: string) => void;
  hideCOD: boolean;
  isLoading: boolean;
}

const PaymentMethods: FC<PaymentMethodsProps> = ({
  selectedPayment,
  setSelectedPayment,
  hideCOD = false,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const { paymentSettings } = useSettings();

  const allMethods = [
    {
      id: "cod",
      name: t("payments.cod.name"),
      tagline: t("payments.cod.tagline"),
      icon: "/Payments/cod.png",
      isEnabled: paymentSettings?.cod === true && !hideCOD,
    },
    {
      id: "directBankTransfer",
      name: t("payments.directBankTransfer.name"),
      tagline: t("payments.directBankTransfer.tagline"),
      icon: "/Payments/bank_transfer.png",
      isEnabled: false,
    },
    {
      id: "stripePayment",
      name: t("payments.stripe.name"),
      tagline: t("payments.stripe.tagline"),
      icon: "/Payments/stripe.png",
      isEnabled: paymentSettings?.stripePayment === true,
    },
    {
      id: "flutterwavePayment",
      name: t("payments.flutterwave.name"),
      tagline: t("payments.flutterwave.tagline"),
      icon: "/Payments/flutterwave.png",
      isEnabled: paymentSettings?.flutterwavePayment === true,
    },
    {
      id: "paypal",
      name: t("payments.paypal.name"),
      tagline: t("payments.paypal.tagline"),
      icon: "/Payments/paypal.png",
      isEnabled: false,
    },
    {
      id: "razorpayPayment",
      name: t("payments.razorpay.name"),
      tagline: t("payments.razorpay.tagline"),
      icon: "/Payments/razorpay.png",
      isEnabled: paymentSettings?.razorpayPayment === true,
    },
    {
      id: "paystackPayment",
      name: t("payments.paystack.name"),
      tagline: t("payments.paystack.tagline"),
      icon: "/Payments/paystack.png",
      isEnabled: paymentSettings?.paystackPayment === true,
    },
    {
      id: "phonepe",
      name: t("payments.phonepe.name"),
      tagline: t("payments.phonepe.tagline"),
      icon: "/Payments/phonepe-logo.png",
      isEnabled: false,
    },
  ];

  const paymentMethods = allMethods.filter((method) => method.isEnabled);

  return (
    <ScrollShadow className="w-full h-full max-h-[50vh] pr-2 py-1">
      <RadioGroup
        value={selectedPayment}
        onValueChange={setSelectedPayment}
        className="gap-3"
        isDisabled={isLoading}
      >
        {paymentMethods.map((method) => (
          <Radio
            key={method.id}
            value={method.id}
            classNames={{
              base: "inline-flex m-0 items-center justify-between flex-row-reverse max-w-full cursor-pointer rounded-lg gap-4 p-3 border border-gray-200 dark:border-default-100 data-[selected=true]:border-primary-500 data-[selected=true]:bg-primary-50 dark:data-[selected=true]:bg-content1",
              control: "text-primary-600",
            }}
          >
            <div className="flex items-center gap-4">
              <Image
                src={method.icon}
                alt={method.name}
                width={32}
                height={32}
                className="rounded-md"
              />
              <div>
                <h4 className="font-medium text-sm">{method.name}</h4>
                <p className="text-xs opacity-50">{method.tagline}</p>
              </div>
            </div>
          </Radio>
        ))}
      </RadioGroup>
    </ScrollShadow>
  );
};

export default PaymentMethods;
