import { FC } from "react";
import { Progress } from "@heroui/react";

interface CartStepperProps {
  CurrentStep: number;
}

const CartStepper: FC<CartStepperProps> = ({ CurrentStep }) => {
  const steps = ["Review", "Payment", "Order Placed"];

  return (
    <div className="flex justify-between items-center gap-4 w-full max-w-md">
      {steps.map((label, index) => (
        <div
          key={index}
          className="flex-1 flex flex-col items-start justify-start w-full"
        >
          {/* Step Label */}
          <p
            className={`text-sm mb-2 transition-all text-start ${
              CurrentStep === index + 1
                ? "text-primary dark:text-white"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {label}
          </p>
          {/* Hero UI Progress Bar */}
          <Progress
            aria-label={`step ${index}`}
            value={CurrentStep === index + 1 ? 100 : 0}
            className={`w-full rounded-full`}
          />
        </div>
      ))}
    </div>
  );
};

export default CartStepper;
