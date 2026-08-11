import { Button, addToast } from "@heroui/react";
import { Minus, Plus } from "lucide-react";
import { FC } from "react";
import { useTranslation } from "react-i18next";

interface QtyInputProps {
  quantity: number;
  setQuantity: (val: number) => void;
  min?: number;
  step?: number;
  max?: number;
  stock?: number;
}

const QtyInput: FC<QtyInputProps> = ({
  quantity,
  setQuantity,
  min = 1,
  step = 1,
  max = 9999,
  stock = 9999,
}) => {
  const { t } = useTranslation();

  const handleChange = (newQty: number) => {
    if (newQty < min) {
      addToast({
        title: t("min_quantity_error_title"),
        description: t("min_quantity_error_description", { min }),
        color: "danger",
      });
      return;
    }

    if (newQty > max) {
      addToast({
        title: t("max_quantity_error_title"),
        description: t("max_quantity_error_description", { max }),
        color: "danger",
      });
      return;
    }

    if (newQty > stock) {
      addToast({
        title: t("stock_limit_error_title"),
        description: t("stock_limit_error_description", { stock }),
        color: "danger",
      });
      return;
    }

    if ((newQty - min) % step !== 0) {
      addToast({
        title: t("step_error_title"),
        description: t("step_error_description", { step }),
        color: "danger",
      });
      return;
    }

    setQuantity(newQty);
  };

  const decrement = () => handleChange(quantity - step);
  const increment = () => handleChange(quantity + step);

  return (
    <div
      id="qty-input"
      className="w-full grid grid-cols-[27%_48%_27%] rounded-xl p-2 items-center border-default-300 dark:border-default-100 max-w-28"
    >
      <div className="flex justify-center">
        <Button
          radius="full"
          isIconOnly
          onPress={decrement}
          color="primary"
          size="sm"
          isDisabled={quantity == 1}
        >
          <Minus size={12} />
        </Button>
      </div>
      <div className="text-center font-medium text-lg">{quantity}</div>
      <div className="flex justify-center">
        <Button
          radius="full"
          isIconOnly
          onPress={increment}
          color="primary"
          size="sm"
          // isDisabled={quantity >= max || quantity >= stock}
        >
          <Plus size={12} />
        </Button>
      </div>
    </div>
  );
};

export default QtyInput;
