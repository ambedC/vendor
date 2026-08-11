// src/components/WishlistCard.tsx
import React from "react";
import {
  Card,
  CardBody,
  Avatar,
  Badge,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Spinner,
} from "@heroui/react";
import { Bookmark, MoreVertical, Pencil, Trash2 } from "lucide-react";

// Make sure to import the type for wishlist
import { WishTitle } from "@/types/ApiResponse";
import { useTranslation } from "react-i18next";

interface WishlistCardProps {
  key?: number | string;
  wishlist: WishTitle;
  selectedWishlist?: WishTitle | null;
  loading: { deleting: string | null };
  fetchWishlistDetails: (id: string, forceFetch?: boolean) => void;

  setEditingWishlist: (data: { id: string | number; title: string }) => void;
  onOpen: () => void;
  confirmDelete: (id: string, title: string) => void;
}

const WishlistCard: React.FC<WishlistCardProps> = ({
  wishlist,
  selectedWishlist,
  loading,
  fetchWishlistDetails,
  setEditingWishlist,
  onOpen,
  confirmDelete,
}) => {
  const isSelected = selectedWishlist?.id === wishlist.id;
  const isDeleting = loading.deleting === wishlist.id.toString();

  const { t } = useTranslation();

  return (
    <Card
      as={"div"}
      isPressable
      shadow="sm"
      className={`transition-all w-full duration-200 cursor-pointer ${
        isSelected
          ? "bg-primary text-content1 dark:text-foreground"
          : "hover:bg-content2"
      }`}
      onPress={() => fetchWishlistDetails(wishlist.id.toString())}
    >
      <CardBody className="px-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Badge
              content={wishlist.items_count || undefined}
              color="primary"
              size="md"
              className="text-xs"
              isInvisible={!wishlist.items_count}
            >
              <Avatar
                icon={<Bookmark className="w-5 h-5" />}
                className={`${
                  isSelected
                    ? "bg-primary-500 text-white"
                    : "bg-default-100 text-default-500"
                }`}
                size="sm"
              />
            </Badge>

            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm truncate">
                {wishlist.title}
              </h3>
            </div>
          </div>

          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button
                isIconOnly
                variant="light"
                size="sm"
                className={`min-w-6 w-6 h-6 ${
                  isSelected
                    ? "bg-primary-400 text-white"
                    : "bg-default-100 text-default-500"
                }`}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu aria-label="Wishlist actions">
              <DropdownItem
                key="edit"
                textValue={t("edit")}
                startContent={<Pencil className="w-4 h-4" />}
                onPress={() => {
                  setEditingWishlist({
                    id: wishlist.id,
                    title: wishlist.title,
                  });
                  onOpen();
                }}
              >
                {t("edit")}
              </DropdownItem>
              <DropdownItem
                key="delete"
                textValue={t("delete")}
                color="danger"
                startContent={
                  isDeleting ? (
                    <Spinner size="sm" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )
                }
                onPress={() => {
                  confirmDelete(wishlist.id.toString(), wishlist.title);
                }}
                isReadOnly={isDeleting}
              >
                {t("delete")}
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </CardBody>
    </Card>
  );
};

export default WishlistCard;
