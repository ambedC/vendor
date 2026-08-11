import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Button,
} from "@heroui/react";
import { Heart } from "lucide-react";
import { useTranslation } from "react-i18next";

interface EditingWishlist {
  id: string | number;
  title: string;
}

interface EditWishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingWishlist: EditingWishlist | null;
  setEditingWishlist: React.Dispatch<
    React.SetStateAction<EditingWishlist | null>
  >;
  loading: { updating: boolean };
  handleUpdateWishlist: () => void;
}

const EditWishlistModal: React.FC<EditWishlistModalProps> = ({
  isOpen,
  onClose,
  editingWishlist,
  setEditingWishlist,
  loading,
  handleUpdateWishlist,
}) => {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-primary-500" />
          {t("wishlist.edit_wishlist_title")}
        </ModalHeader>
        <ModalBody>
          <Input
            label={t("wishlist.edit_wishlist_label")}
            placeholder={t("wishlist.edit_wishlist_placeholder")}
            value={editingWishlist?.title || ""}
            onChange={(e) =>
              setEditingWishlist((prev) =>
                prev ? { ...prev, title: e.target.value } : null
              )
            }
            variant="bordered"
            isInvalid={editingWishlist?.title === ""}
            errorMessage={
              editingWishlist?.title === ""
                ? t("wishlist.edit_wishlist_error")
                : ""
            }
          />
        </ModalBody>
        <ModalFooter>
          <Button
            variant="light"
            onPress={onClose}
            isDisabled={loading.updating}
          >
            {t("cancel")}
          </Button>
          <Button
            color="primary"
            onPress={handleUpdateWishlist}
            isLoading={loading.updating}
          >
            {t("save_changes")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditWishlistModal;
