import React, { FormEvent, useState } from "react";
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
import { deductBalance } from "@/routes/api";
import { updateUserDataInRedux } from "@/helpers/functionalHelpers";
import { useTranslation } from "react-i18next";

const WithdrawModal = () => {
  const { t } = useTranslation();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState("");

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const sanitizedValue = inputValue.replace(/\D/g, "");
    const numberValue = Math.max(0, parseInt(sanitizedValue, 10));
    setErrors((prev) => ({ ...prev, amount: "" }));
    setAmount(isNaN(numberValue) ? "" : numberValue.toString());

    if (!isNaN(numberValue) && numberValue > 0) {
      setErrors((prev) => {
        const { ...rest } = prev;
        return rest;
      });
    } else {
      setErrors((prev) => ({
        ...prev,
        amount: t("enter_positive_integer"),
      }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const description = formData.get("description")?.toString();
    setIsLoading(true);
    setErrors({});

    try {
      const parsedAmount = parseFloat(amount);
      if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
        setErrors((prev) => ({
          ...prev,
          amount: t("amount_positive_number"),
        }));
        return;
      }

      if (parsedAmount > 1000000) {
        setErrors((prev) => ({
          ...prev,
          amount: t("amount_max_limit"),
        }));
        return;
      }

      if (description) {
        if (description.length < 5) {
          setErrors((prev) => ({
            ...prev,
            description: t("description_min_5"),
          }));
          return;
        }

        if (description.length > 500) {
          setErrors((prev) => ({
            ...prev,
            description: t("description_max_500"),
          }));
          return;
        }

        if (!/^[a-zA-Z0-9\s.,!?()-]+$/.test(description)) {
          setErrors((prev) => ({
            ...prev,
            description: t("description_invalid_characters"),
          }));
          return;
        }
      }

      const res = await deductBalance({
        amount: parsedAmount,
        description,
        store_id: null,
      });

      if (res.success) {
        addToast({
          title: t("request_sent"),
          description: t("withdrawal_request_success"),
          color: "success",
        });
        onOpenChange();
        setAmount("");
      } else {
        addToast({
          title: t("error"),
          description: res.message || t("withdrawal_request_failed"),
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Withdraw error:", error);
      addToast({
        title: t("unexpected_error"),
        description: t("something_went_wrong"),
        color: "danger",
      });
    } finally {
      setIsLoading(false);
      updateUserDataInRedux();
    }
  };

  return (
    <>
      <Button
        onPress={onOpen}
        size="sm"
        radius="md"
        title={t("withdraw")}
        color="secondary"
        className="px-2 py-0.5 w-20  text-xs font-medium transition-colors md:px-4 md:py-1 md:w-24 md:text-sm"
      >
        {t("withdraw")}
      </Button>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        placement="center"
        backdrop="blur"
        isDismissable={isLoading}
      >
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            {t("withdraw_funds")}
          </ModalHeader>
          <ModalBody>
            <Form
              id="withdraw-form"
              className="flex flex-col gap-4"
              onSubmit={handleSubmit}
              validationErrors={errors}
            >
              <Input
                label={t("amount")}
                type="text"
                name="amount"
                placeholder={t("enter_withdraw_amount")}
                autoFocus
                isDisabled={isLoading}
                isRequired
                isInvalid={!!errors.amount}
                errorMessage={errors.amount}
                startContent={<span className="text-gray-500">$</span>}
                className="w-full"
                classNames={{
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
                label={t("description")}
                name="description"
                placeholder={t("description_placeholder")}
                isDisabled={isLoading}
                isInvalid={!!errors.description}
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
            </Form>
          </ModalBody>
          <ModalFooter>
            <Button
              type="submit"
              form="withdraw-form"
              color="danger"
              isLoading={isLoading}
            >
              {t("send_request")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default WithdrawModal;
