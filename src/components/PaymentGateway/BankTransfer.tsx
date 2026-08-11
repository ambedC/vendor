import { FC } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
  addToast,
} from "@heroui/react";
import { handleCheckout } from "@/helpers/functionalHelpers";
import { useRouter } from "next/router";
import { updateCartData } from "@/helpers/updators";
import { useSettings } from "@/contexts/SettingsContext";
import { Copy } from "lucide-react";
import { useDispatch } from "react-redux";
import { setPromoCode } from "@/lib/redux/slices/checkoutSlice";

const BankTransfer: FC<{
  setIsLoading: (value: boolean) => void;
  isLoading: boolean;
}> = ({ isLoading, setIsLoading }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { paymentSettings } = useSettings();
  const { onOpen, onClose, isOpen, onOpenChange } = useDisclosure();

  // Example bank details (you can fetch these from settings or API)
  const bankDetails = {
    accountName: paymentSettings?.bankAccountName,
    accountNumber: paymentSettings?.bankAccountNumber,
    ifsc: paymentSettings?.bankCode,
    bankName: paymentSettings?.bankName,
    note: paymentSettings?.bankExtraNote,
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast({ title: "Copied to clipboard!", color: "success" });
    } catch (error) {
      console.error("Copy failed:", error);
      addToast({ title: "Failed to copy", color: "danger" });
    }
  };

  const handleConfirmOrder = async () => {
    try {
      setIsLoading(true);
      const res = await handleCheckout("directBankTransfer", {});
      if (res.success) {
        addToast({ title: "Order placed successfully!", color: "success" });
        onClose();
        await router.push("/my-account/orders");
        dispatch(setPromoCode(""));
      }
    } catch (error) {
      console.error("Bank transfer checkout error:", error);
      addToast({ title: "Failed to place order", color: "danger" });
    } finally {
      updateCartData(true, false);
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        id="bank_transfer_modal_btn"
        onClick={onOpen}
        className="hidden"
      />
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        isDismissable={false}
        backdrop="blur"
        size="md"
        classNames={{
          header: "border-b border-gray-200",
          body: "py-6",
          footer: "border-t border-gray-200",
        }}
      >
        <ModalContent>
          <>
            <ModalHeader className="flex flex-col gap-1">
              <h2 className="font-semibold">Direct Bank Transfer</h2>
              <p className="text-xs opacity-50 font-normal">
                Please transfer the total amount to our bank account.
              </p>
            </ModalHeader>

            <ModalBody>
              <div className="space-y-3 text-sm">
                <p>
                  Please transfer the order amount to the below bank account.
                  Once the payment is received and verified, your order will be
                  confirmed.
                </p>

                <div className="rounded-lg border p-3 bg-gray-50 dark:bg-content1 space-y-2">
                  <div className="flex items-center justify-between">
                    <p>
                      <strong>Account Holder:</strong> {bankDetails.accountName}
                    </p>
                    {bankDetails.accountName && (
                      <Copy
                        size={16}
                        className="cursor-pointer opacity-70 hover:opacity-100"
                        onClick={() => handleCopy(bankDetails.accountName!)}
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <p>
                      <strong>Account Number:</strong>{" "}
                      {bankDetails.accountNumber}
                    </p>
                    {bankDetails.accountNumber && (
                      <Copy
                        size={16}
                        className="cursor-pointer opacity-70 hover:opacity-100"
                        onClick={() =>
                          handleCopy(bankDetails.accountNumber!.toString())
                        }
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <p>
                      <strong>IFSC Code:</strong> {bankDetails.ifsc}
                    </p>
                    {bankDetails.ifsc && (
                      <Copy
                        size={16}
                        className="cursor-pointer opacity-70 hover:opacity-100"
                        onClick={() => handleCopy(bankDetails.ifsc!)}
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <p>
                      <strong>Bank Name:</strong> {bankDetails.bankName}
                    </p>
                    {bankDetails.bankName && (
                      <Copy
                        size={16}
                        className="cursor-pointer opacity-70 hover:opacity-100"
                        onClick={() => handleCopy(bankDetails.bankName!)}
                      />
                    )}
                  </div>
                </div>

                <div className="text-xs opacity-70 leading-relaxed">
                  {bankDetails.note}
                </div>
              </div>
            </ModalBody>

            <ModalFooter className="flex flex-col gap-2">
              <Button
                color="primary"
                className="w-full font-semibold"
                onPress={handleConfirmOrder}
                isLoading={isLoading}
              >
                I Will Transfer the Amount
              </Button>
              <Button
                variant="light"
                onPress={onClose}
                className="w-full"
                isDisabled={isLoading}
              >
                Cancel
              </Button>
            </ModalFooter>
          </>
        </ModalContent>
      </Modal>
    </>
  );
};

export default BankTransfer;
