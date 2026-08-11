import React from "react";
import { Card, CardBody, Button, Image, useDisclosure } from "@heroui/react";
import { ArrowRightLeft, Trash2 } from "lucide-react";
import { WishlistItem, WishTitle } from "@/types/ApiResponse";
import MoveWishlistModal from "../Modals/MoveWishlistModal";
import { useTranslation } from "react-i18next";

interface WishlistItemCardProps {
  key?: string | number;
  item: WishlistItem;
  loading: { removingItem: number | null };
  handleRemoveItem: (id: number, forceFetch: boolean) => void;
  wishlists: WishTitle[];
  fetchWishlistDetails: (id: string, forceFetch?: boolean) => void;
  fetchWishlists: () => void;
}

const WishlistItemCard: React.FC<WishlistItemCardProps> = ({
  item,
  loading,
  handleRemoveItem,
  wishlists,
  fetchWishlistDetails,
  fetchWishlists,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isRemoving = loading?.removingItem === item?.id;

  const { t } = useTranslation();

  const confirmRemoveItem = () => {
    const message = t("wishlist.wishlist_removeConfirmation", {
      product: item.product.title,
    });

    const confirmed = window.confirm(message);
    if (confirmed) {
      handleRemoveItem(item.id, true);
    }
  };

  return (
    <>
      <Card shadow="none" className="border border-divider">
        <CardBody className="p-3">
          <div className="flex gap-3">
            {/* Product Image */}
            <div className="shrink-0">
              <Image
                src={item.product.image}
                alt={item.product.title}
                className="w-15 h-15 object-cover rounded-lg bg-default-100"
              />
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-foreground line-clamp-2 mb-2">
                {item.product.title}
              </h4>

              {item.product.short_description && (
                <p className="text-xs text-default-500 line-clamp-2 mb-2">
                  {item.product.short_description}
                </p>
              )}
            </div>

            {/* Remove Button */}
            <div className="shrink-0">
              <div className="flex gap-2 items-center">
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  color="primary"
                  onPress={onOpen}
                  className="min-w-8 w-8 h-8"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </Button>
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  color="danger"
                  isLoading={isRemoving}
                  onPress={confirmRemoveItem}
                  className="min-w-8 w-8 h-8"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
      <MoveWishlistModal
        isOpen={isOpen}
        onClose={onClose}
        wishlists={wishlists}
        itemId={item.id}
        currentWishlistId={item.wishlist_id}
        onItemMoved={() => {
          fetchWishlistDetails(item?.wishlist_id?.toString() || "", true);
          fetchWishlists();
        }}
      />
    </>
  );
};

export default WishlistItemCard;
