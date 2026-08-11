import React, { useEffect, useMemo } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Divider,
  ScrollShadow,
  useDisclosure,
} from "@heroui/react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/router";

export interface RemovedItem {
  product_name: string;
  variant_name: string;
  store_name: string;
  quantity: number;
  reason: string;
}

const RemovedItemsModal: React.FC = () => {
  const { cartData } = useSelector((state: RootState) => state.cart);
  const items_count = cartData?.items_count || 0;
  const removedItems = cartData?.removed_items || [];
  const removedCount = cartData?.removed_count || 0;
  const router = useRouter();

  // const itemsCount = cartData?.items_count || 0;

  const { t } = useTranslation();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Expose open button
  useEffect(() => {
    const btn = document.getElementById("removed-items-modal-open");
    if (!btn) return;
    btn.onclick = () => onOpen();
  }, [onOpen]);

  // Auto-open on changes
  useEffect(() => {
    if (removedCount > 0 && removedItems.length > 0) {
      onOpen();
    } else {
      onClose();
    }
  }, [removedCount, removedItems.length, onOpen, onClose]);

  const title = useMemo(() => {
    return removedCount > 1
      ? t("removedItems.multipleTitle")
      : t("removedItems.singleTitle");
  }, [removedCount, t]);

  return (
    <>
      <button id="removed-items-modal-open" className="hidden" />

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 p-4">
            <h3 className="text-medium font-semibold">{title}</h3>
            <p className="text-xs text-foreground/60">
              {t("removedItems.description")}
            </p>
          </ModalHeader>

          <Divider />

          <ModalBody className="px-2 py-4">
            <ScrollShadow className="space-y-2 w-full h-full max-h-[50vh]">
              {removedItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-md p-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <div
                        title={item.variant_name}
                        className="text-xs font-medium text-foreground truncate"
                      >
                        {item.product_name}
                      </div>
                      <span className="text-xxs text-foreground/50">
                        {item.variant_name}
                      </span>

                      <div className="text-xxs text-foreground/50 flex flex-col">
                        <span>
                          {t("removedItems.qty")}: {item.quantity}
                        </span>
                        <span>
                          {t("removedItems.store")}: {item.store_name}
                        </span>
                        <span>
                          {t("reason")}: {item.reason}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {removedItems.length === 0 && (
                <div className="text-xs text-foreground/50">
                  {t("removedItems.empty")}
                </div>
              )}
            </ScrollShadow>
          </ModalBody>

          <Divider />

          <ModalFooter>
            <Button
              variant="bordered"
              className="text-xs"
              onPress={async () => {
                if (items_count == 0) {
                  const currentPath = window.location.pathname;
                  if (currentPath === "/cart" || currentPath === "/cart/") {
                    router.push("/");
                    onClose();
                    return;
                  }
                }
                onClose();
              }}
            >
              {t("removedItems.close")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default RemovedItemsModal;
