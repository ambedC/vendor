import { useState, useEffect, useCallback } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  Button,
  Input,
  Spinner,
  Chip,
  ModalBody,
  Divider,
  Card,
  CardBody,
  Listbox,
  ListboxItem,
  useDisclosure,
} from "@heroui/react";
import { Bookmark, Trash2, BookmarkPlus, Sparkles, X } from "lucide-react";
import {
  CreateWishListWithItems,
  getAllWishlistTitles,
  deleteWishlistById,
  deleteWishlistItemById,
} from "@/routes/api";
import { FavoriteItem, WishTitle } from "@/types/ApiResponse";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/router";
import ConfirmationModal from "./ConfirmationModal";
import { updateDataOnAuth } from "@/helpers/updators";

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number;
  productVariantId?: number;
  storeId: number;
  favorite: FavoriteItem[] | null;
}

const WishlistModal = ({
  isOpen,
  onClose,
  productId,
  productVariantId,
  storeId,
  favorite = null,
}: WishlistModalProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    onClose: onConfirmationModalClose,
    onOpen: onConfirmationModalOpen,
    isOpen: isConfirmationModalOpen,
  } = useDisclosure();

  const [wishlists, setWishlists] = useState<WishTitle[]>([]);
  const [newListTitle, setNewListTitle] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [wishlistItemToRemove, setWishlistItemToRemove] =
    useState<WishTitle | null>(null);
  const [isRemoveItemFromWishlist, setIsRemoveItemFromWishlist] = useState("");
  const [isDeletingWishlist, setIsDeletingWishlist] = useState<number | null>(
    null
  );
  const [wishlistToDelete, setWishlistToDelete] = useState<WishTitle | null>(
    null
  );

  const [error, setError] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const selectedWishlistId = Array.from(selectedKeys)[0];

  useEffect(() => {
    if (wishlists.length > 0 && selectedKeys.size === 0) {
      setSelectedKeys(new Set([wishlists[0].id.toString()]));
    }
  }, [wishlists, selectedKeys.size]);

  const fetchWishlists = useCallback(async () => {
    setIsFetching(true);
    try {
      const response = await getAllWishlistTitles();
      if (response.success && response.data) {
        setWishlists([response.data].flat());
      }
    } catch {
      setError(t("wishlist.failed_fetch_wishlists"));
    } finally {
      setIsFetching(false);
    }
  }, [t]);

  useEffect(() => {
    if (isOpen) {
      fetchWishlists();
      setError("");
      setNewListTitle("");
      setSelectedKeys(new Set());
    }
  }, [isOpen, fetchWishlists]);

  const triggerRefetchButtons = () => {
    updateDataOnAuth();
  };

  const handleCreateWishlist = async () => {
    if (!newListTitle.trim()) {
      setError(t("wishlist.enter_wishlist_name"));
      return;
    }
    setIsCreating(true);
    setError("");

    try {
      const response = await CreateWishListWithItems({
        wishlist_title: newListTitle,
        product_id: productId,
        product_variant_id: productVariantId || null,
        store_id: storeId,
      });

      if (response.success) {
        await router.push(
          {
            pathname: router.pathname,
            query: router.query,
          },
          undefined,
          { scroll: false, shallow: true }
        );
        setNewListTitle("");
        triggerRefetchButtons();

        await fetchWishlists();
      } else {
        setError(response.message || t("wishlist.failed_create_wishlist"));
      }
    } catch {
      setError(t("wishlist.failed_create_wishlist"));
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveToSelectedWishlist = async () => {
    if (!selectedWishlistId) {
      setError(t("wishlist.select_wishlist"));
      return;
    }

    const selectedWishlist = wishlists.find(
      (w) => w.id.toString() === selectedWishlistId
    );

    if (!selectedWishlist) {
      setError(t("wishlist.selected_wishlist_not_found"));
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const response = await CreateWishListWithItems({
        wishlist_title: selectedWishlist.title,
        product_id: productId,
        product_variant_id: productVariantId || null,
        store_id: storeId,
      });

      if (response.success) {
        triggerRefetchButtons();
        await router.push(
          {
            pathname: router.pathname,
            query: router.query,
          },
          undefined,
          { scroll: false, shallow: true }
        );

        onClose();
      } else {
        setError(response.message || t("wishlist.failed_add_to_wishlist"));
      }
    } catch {
      setError(t("wishlist.failed_add_to_wishlist"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isCreating) {
      handleCreateWishlist();
    }
  };

  const getSelectedWishlistTitle = () => {
    const selectedWishlist = wishlists.find(
      (w) => w.id.toString() === selectedWishlistId
    );
    return selectedWishlist?.title || "";
  };

  const isInWishlist = (wishlistId: number | string) =>
    Array.isArray(favorite) &&
    favorite.some(
      (fav) => fav.wishlist_id.toString() === wishlistId.toString()
    );

  const getFavoriteItemByWishlist = (wishlistId: number | string) =>
    Array.isArray(favorite)
      ? favorite.find(
          (fav) => fav.wishlist_id.toString() === wishlistId.toString()
        )
      : undefined;

  const handleConfirmDeleteWishlist = async () => {
    if (!wishlistToDelete) return;
    const id = wishlistToDelete.id;

    onConfirmationModalClose();
    setIsDeletingWishlist(id);

    try {
      const response = await deleteWishlistById(id.toString());
      if (response.success) {
        await router.push(
          {
            pathname: router.pathname,
            query: router.query,
          },
          undefined,
          { scroll: false }
        );
        triggerRefetchButtons();
        await fetchWishlists();
        if (selectedWishlistId === id.toString()) {
          setSelectedKeys(new Set());
        }
      } else {
        setError(response.message || t("wishlist.failed_delete_wishlist"));
      }
    } catch {
      setError(t("wishlist.failed_delete_wishlist"));
    } finally {
      setWishlistToDelete(null);
      setIsDeletingWishlist(null);
    }
  };

  const handleConfirm = async () => {
    if (wishlistToDelete) return handleConfirmDeleteWishlist();
    if (wishlistItemToRemove) return handleConfirmRemoveItem();
  };

  const handleConfirmRemoveItem = async () => {
    if (!wishlistItemToRemove) return;

    const favoriteItem = getFavoriteItemByWishlist(wishlistItemToRemove.id);
    if (!favoriteItem) {
      setError(t("item_not_found"));
      return;
    }

    onConfirmationModalClose();
    setIsRemoveItemFromWishlist(wishlistItemToRemove.id.toString());

    try {
      const response = await deleteWishlistItemById(favoriteItem.id);
      if (response.success) {
        triggerRefetchButtons();
        await router.push(
          { pathname: router.pathname, query: router.query },
          undefined,
          { scroll: false, shallow: true }
        );
      } else {
        setError(response.message || t("wishlist.failed_remove_item"));
      }
    } catch {
      setError(t("wishlist.failed_remove_item"));
    } finally {
      fetchWishlists();
      setWishlistItemToRemove(null);
      setIsRemoveItemFromWishlist("");
    }
  };

  return (
    <>
      <Modal
        isDismissable={false}
        isKeyboardDismissDisabled={true}
        isOpen={isOpen}
        onClose={onClose}
        size="md"
        backdrop="blur"
      >
        <ModalContent>
          <ModalHeader className="flex items-center justify-start gap-3 text-lg font-semibold">
            <div className="p-2 bg-primary-100 rounded-full">
              <Bookmark className="w-5 h-5 text-primary-600" />
            </div>
            {t("wishlist.save_to_wishlist")}
          </ModalHeader>

          <ModalBody className="gap-6">
            {error && (
              <Card className="border-l-4 border-l-danger bg-danger-50">
                <CardBody className="py-3 flex items-center justify-between">
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
                </CardBody>
              </Card>
            )}

            {/* Create New Wishlist */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground-600">
                <Sparkles size={16} />
                {t("wishlist.create_new_wishlist")}
              </div>
              <div className="flex items-center gap-3">
                <Input
                  placeholder={t("wishlist.enter_wishlist_name")}
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  onKeyDown={handleKeyPress}
                  size="sm"
                  variant="bordered"
                  classNames={{
                    input: "text-sm",
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
                  size="sm"
                  onPress={handleCreateWishlist}
                  isLoading={isCreating}
                  variant="solid"
                  className="text-xs font-medium"
                  isDisabled={!newListTitle.trim()}
                >
                  {isCreating ? t("creating") : t("create")}
                </Button>
              </div>
            </div>

            <Divider />

            {/* Existing Wishlists */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground-600">
                  <Bookmark size={16} />
                  {t("wishlist.select_wishlist")}
                </div>
                {wishlists.length > 0 && (
                  <Chip
                    size="sm"
                    variant="flat"
                    color="primary"
                    classNames={{ base: "text-xs" }}
                  >
                    {wishlists.length}{" "}
                    {wishlists.length === 1 ? t("list") : t("lists")}
                  </Chip>
                )}
              </div>

              {selectedWishlistId && (
                <div className="flex items-center gap-2 p-2 bg-primary-50 rounded-lg">
                  <Bookmark className="w-4 h-4 text-primary-600 fill-current" />
                  <span className="text-sm text-primary-700">
                    {t("selected")}:{" "}
                    <strong>{getSelectedWishlistTitle()}</strong>
                  </span>
                </div>
              )}

              {isFetching ? (
                <Card>
                  <CardBody className="flex flex-col items-center justify-center py-8 gap-3">
                    <Spinner color="primary" size="md" />
                    <span className="text-sm text-foreground-500">
                      {t("wishlist.loading_wishlists")}
                    </span>
                  </CardBody>
                </Card>
              ) : wishlists.length === 0 ? (
                <Card>
                  <CardBody className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                    <div className="p-3 bg-default-100 rounded-full">
                      <Bookmark className="w-6 h-6 text-default-400" />
                    </div>
                    <p className="text-foreground-500 text-sm">
                      {t("wishlist.no_wishlists_found")}
                    </p>
                    <p className="text-foreground-400 text-xs">
                      {t("wishlist.create_first_wishlist")}
                    </p>
                  </CardBody>
                </Card>
              ) : (
                <Card>
                  <CardBody className="p-2">
                    <Listbox
                      aria-label={t("wishlist.select_wishlist")}
                      className="max-h-[280px] overflow-auto"
                      variant="flat"
                      selectionMode="single"
                      selectedKeys={selectedKeys}
                      onSelectionChange={(keys) =>
                        setSelectedKeys(
                          new Set(
                            typeof keys === "string"
                              ? [keys]
                              : Array.from(keys as Set<string>)
                          )
                        )
                      }
                      disallowEmptySelection={wishlists.length > 0}
                    >
                      {wishlists.map((wishlist) => (
                        <ListboxItem
                          key={wishlist.id.toString()}
                          className="data-[hover=true]:bg-default-100 rounded-lg mb-1"
                          textValue={wishlist.title}
                        >
                          <div className="flex items-center justify-between py-1 px-2">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div
                                className={`p-1.5 rounded-full shrink-0 ${
                                  isInWishlist(wishlist.id)
                                    ? "bg-success-100"
                                    : "bg-primary-100"
                                }`}
                              >
                                <Bookmark
                                  className={`w-3.5 h-3.5 fill-current ${
                                    isInWishlist(wishlist.id)
                                      ? "text-success-600"
                                      : "text-primary-600"
                                  }`}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm text-foreground-800 truncate">
                                    {wishlist.title}
                                  </p>
                                  {isInWishlist(wishlist.id) && (
                                    <Chip
                                      size="sm"
                                      variant="flat"
                                      color="success"
                                      className="text-xs h-5"
                                    >
                                      {t("already_in_list")}
                                    </Chip>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Chip
                                    size="sm"
                                    variant="flat"
                                    color="default"
                                    className="text-xs h-5"
                                  >
                                    {wishlist.items_count}{" "}
                                    {wishlist.items_count === 1
                                      ? t("item")
                                      : t("items")}
                                  </Chip>
                                  {isInWishlist(wishlist.id) && (
                                    <Button
                                      title={t("remove_item")}
                                      isLoading={
                                        isRemoveItemFromWishlist ===
                                        wishlist.id.toString()
                                      }
                                      size="sm"
                                      variant="light"
                                      className="text-xs text-danger p-0"
                                      onPress={() => {
                                        const item = wishlists.find(
                                          (w) => w.id === wishlist.id
                                        );
                                        if (!item) return;
                                        setWishlistItemToRemove(item);
                                        onConfirmationModalOpen();
                                      }}
                                    >
                                      {t("remove")}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {wishlist.title !== "Favorite" && (
                              <div className="flex items-center gap-2 shrink-0">
                                <Button
                                  size="sm"
                                  isIconOnly
                                  color="danger"
                                  variant="light"
                                  title={t("wishlist.delete_wishlist")}
                                  onPress={() => {
                                    setWishlistToDelete(wishlist);
                                    onConfirmationModalOpen();
                                  }}
                                  isLoading={isDeletingWishlist === wishlist.id}
                                  isDisabled={
                                    isDeletingWishlist !== null ||
                                    isSaving ||
                                    isCreating
                                  }
                                  className="hover:bg-danger-100"
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            )}
                          </div>
                        </ListboxItem>
                      ))}
                    </Listbox>
                  </CardBody>
                </Card>
              )}
            </div>
          </ModalBody>

          <ModalFooter className="justify-between">
            <Button variant="light" onPress={onClose} className="font-medium">
              {t("cancel")}
            </Button>

            {wishlists.length > 0 && (
              <Button
                color="primary"
                onPress={handleSaveToSelectedWishlist}
                isLoading={isSaving}
                variant="solid"
                className="px-6 font-medium"
                isDisabled={
                  !selectedWishlistId ||
                  isCreating ||
                  isDeletingWishlist !== null ||
                  isInWishlist(selectedWishlistId)
                }
              >
                {isSaving ? t("saving") : t("wishlist.save_to_wishlist")}
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={onConfirmationModalClose}
        onConfirm={handleConfirm}
        title={
          wishlistToDelete
            ? t("wishlist.confirm_delete_wishlist")
            : t("wishlist.confirm_remove_item")
        }
        alertTitle={
          wishlistToDelete
            ? t("wishlist.confirm_delete_wishlist")
            : t("wishlist.confirm_remove_item")
        }
      />
    </>
  );
};

export default WishlistModal;
