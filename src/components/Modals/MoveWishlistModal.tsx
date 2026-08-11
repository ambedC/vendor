import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Select,
  SelectItem,
  addToast,
} from "@heroui/react";
import { moveItemFromAnotherWishList } from "@/routes/api";
import { WishTitle } from "@/types/ApiResponse";
import { ArrowRightLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

interface MoveWishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishlists: WishTitle[];
  itemId: number;
  currentWishlistId: number;
  onItemMoved?: () => void; // Callback to refresh data
}

const MoveWishlistModal: React.FC<MoveWishlistModalProps> = ({
  isOpen,
  onClose,
  wishlists,
  itemId,
  currentWishlistId,
  onItemMoved,
}) => {
  const { t } = useTranslation();
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const handleMove = async () => {
    if (selectedKeys.size === 0) return;

    try {
      setLoading(true);

      const targetWishlistId = Array.from(selectedKeys)[0];
      const res = await moveItemFromAnotherWishList({
        itemId,
        target_wishlist_id: targetWishlistId,
      });

      if (res?.success) {
        addToast({ title: res.message, color: "success" });
        onClose();
        if (onItemMoved) onItemMoved();
      } else {
        addToast({
          title: res.message || t("move_failed"),
          color: "danger",
        });
      }
    } catch (error) {
      console.error(error);
      addToast({
        title: t("move_error"),
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredWishlists = wishlists.filter((w) => w.id !== currentWishlistId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      placement="center"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-primary" />
              {t("wishlist.move_modal_title")}
            </ModalHeader>
            <ModalBody>
              {filteredWishlists.length > 0 ? (
                <Select
                  label={t("wishlist.select_wishlist_label")}
                  placeholder={t("wishlist.select_wishlist_placeholder")}
                  selectedKeys={selectedKeys}
                  onSelectionChange={(keys) =>
                    setSelectedKeys(keys as Set<string>)
                  }
                >
                  {filteredWishlists.map((wishlist) => (
                    <SelectItem
                      key={wishlist.id.toString()}
                      textValue={wishlist.title}
                    >
                      {wishlist.title} ({wishlist.items_count} {t("items")})
                    </SelectItem>
                  ))}
                </Select>
              ) : (
                <p className="text-default-500 text-sm">
                  {t("wishlist.no_other_wishlists")}
                </p>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={close}>
                {t("cancel")}
              </Button>
              <Button
                color="primary"
                isDisabled={selectedKeys.size === 0}
                isLoading={loading}
                onPress={handleMove}
              >
                {t("move_button")}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default MoveWishlistModal;
