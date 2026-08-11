import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  Button,
  Input,
  ModalBody,
  Card,
  CardBody,
} from "@heroui/react";
import { Bookmark, BookmarkPlus, Sparkles, X } from "lucide-react";
import { CreateWishListWithOutItems } from "@/routes/api";
import { useTranslation } from "react-i18next"; // i18n hook

interface CreateWishListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateWishListModal = ({
  isOpen,
  onClose,
  onSuccess,
}: CreateWishListModalProps) => {
  const { t } = useTranslation();
  const [error, setError] = useState("");
  const [newListTitle, setNewListTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isCreating) {
      handleCreateWishlist();
    }
  };

  const handleCreateWishlist = async () => {
    if (!newListTitle.trim()) {
      setError(t("wishlist_error_required"));
      return;
    }
    setIsCreating(true);
    setError("");

    try {
      const response = await CreateWishListWithOutItems({
        title: newListTitle,
      });

      if (response.success) {
        setNewListTitle("");
        onSuccess();
        onClose();
      } else {
        setError(response.message || t("wishlist_error_failed"));
      }
    } catch {
      setError(t("wishlist_error_failed"));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" backdrop="blur">
      <ModalContent>
        <ModalHeader className="flex items-center gap-3 text-lg font-semibold">
          <div className="p-2 bg-primary-100 rounded-full">
            <Bookmark className="w-5 h-5 text-primary-600" />
          </div>
          {t("wishlist_modal_title")}
        </ModalHeader>

        <ModalBody className="gap-6">
          {error && (
            <Card className="border-l-4 border-l-danger bg-danger-50">
              <CardBody className="py-3">
                <div className="flex items-center justify-between">
                  <span className="text-danger-700 text-sm">{error}</span>
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    onPress={() => setError("")}
                    className="text-danger-500 hover:bg-danger-100"
                  >
                    <X size={16} />
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Create New Wishlist Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground-600">
              <Sparkles size={16} />
              {t("wishlist_create_new")}
            </div>
            <div className="flex items-center gap-3">
              <Input
                placeholder={t("wishlist_input_placeholder")}
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                onKeyDown={handleKeyPress}
                size="md"
                variant="flat"
                classNames={{
                  input: "text-sm",
                  base: "max-w-64",
                  inputWrapper:
                    "hover:border-primary-300 focus-within:border-primary-500",
                }}
                startContent={
                  <BookmarkPlus className="w-4 h-4 text-foreground/50" />
                }
                isDisabled={isCreating}
              />
              <Button
                color="primary"
                size="md"
                onPress={handleCreateWishlist}
                isLoading={isCreating}
                variant="solid"
                className="font-medium"
                isDisabled={!newListTitle.trim()}
              >
                {isCreating
                  ? t("wishlist_button_creating")
                  : t("wishlist_button_create")}
              </Button>
            </div>
          </div>
        </ModalBody>

        <ModalFooter className="justify-between"></ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateWishListModal;
