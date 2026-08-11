import React, { useEffect, useMemo, useState } from "react";
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
  Image,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { Product } from "@/types/ApiResponse";
import Link from "next/link";

export interface FailedItem {
  store_id: number;
  product_variant_id: number;
  product: Product;
  reason: string;
}

const FailedItemsModal: React.FC = () => {
  const [failedItems, setFailedItems] = useState<FailedItem[]>([]);
  const { t } = useTranslation();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Expose function to open modal with failed items
  useEffect(() => {
    // Create a global function that can be called from anywhere
    (window as any).showFailedItemsModal = (items: FailedItem[]) => {
      if (items && items.length > 0) {
        setFailedItems(items);
        onOpen();
      }
    };

    return () => {
      delete (window as any).showFailedItemsModal;
    };
  }, [onOpen]);

  const handleClose = () => {
    setFailedItems([]);
    onClose();
  };

  const title = useMemo(() => {
    return failedItems.length > 1
      ? t("failedItems.multipleTitle")
      : t("failedItems.singleTitle");
  }, [failedItems.length, t]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
      scrollBehavior="inside"
      isDismissable={false}
      isKeyboardDismissDisabled={true}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 p-4">
          <h3 className="text-medium font-semibold">{title}</h3>
          <p className="text-xs text-foreground/60">
            {t("failedItems.description")}
          </p>
        </ModalHeader>

        <Divider />

        <ModalBody className="px-2 py-4">
          <ScrollShadow className="space-y-3 w-full h-full max-h-[60vh]">
            {failedItems.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
              >
                {/* Product Image */}
                <div className="shrink-0">
                  {item.product.main_image ? (
                    <Image
                      src={item.product.main_image}
                      alt={item.product.title || "Product"}
                      className="w-16 h-16 object-cover rounded-md"
                      fallbackSrc="/images/placeholder.png"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center">
                      <span className="text-xs text-gray-400">No Image</span>
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <Link
                    onClick={handleClose}
                    href={`/products/${item.product.slug}`}
                    className="text-sm font-medium text-foreground mb-1"
                  >
                    {item.product.title || "Unknown Product"}
                  </Link>

                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-foreground/50 mb-2">
                    {item.product.variants[0].store_name && (
                      <div>
                        <span className="mr-1">{t("failedItems.store")}:</span>
                        <Link
                          onClick={handleClose}
                          href={`/stores/${item.product.variants[0].store_slug}`}
                        >
                          {item.product.variants[0].store_name}
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Reason */}
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-2">
                    <div className="text-xs text-red-600 dark:text-red-400">
                      <span className="font-semibold mr-1">
                        {t("failedItems.reason")}:
                      </span>
                      {item.reason}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {failedItems.length === 0 && (
              <div className="text-sm text-center text-foreground/50 py-8">
                {t("failedItems.empty")}
              </div>
            )}
          </ScrollShadow>
        </ModalBody>

        <Divider />

        <ModalFooter>
          <Button color="primary" onPress={handleClose}>
            {t("failedItems.okay")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default FailedItemsModal;
