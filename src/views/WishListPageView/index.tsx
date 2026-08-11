import React from "react";
import EmptyWishListState from "./EmptyWishListState";
import WishlistItemCard from "@/components/Cards/WishlistItemCard";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Skeleton,
  Chip,
  useDisclosure,
  ScrollShadow,
} from "@heroui/react";
import { Bookmark, Plus, ShoppingBag } from "lucide-react";
import WishlistCard from "@/components/Cards/WishlistCard";
import WishListSkeleton from "@/components/Skeletons/WishListSkeleton";
import WishListErrorAlert from "./WishListErrorAlert";
import { Wishlist, WishTitle } from "@/types/ApiResponse";
import CreateWishListModal from "@/components/Modals/CreateWishListModal";
import { useTranslation } from "react-i18next";

interface ErrorState {
  message: string;
  type: "error" | "warning" | "info";
}

interface WishListPageViewProps {
  error: ErrorState | null;
  setError: React.Dispatch<React.SetStateAction<ErrorState | null>>;
  loading: {
    wishlists: boolean;
    wishlistDetails: boolean;
    updating: boolean;
    deleting: string | null;
    removingItem: number | null;
  };
  wishlists: WishTitle[];
  selectedWishlist: Wishlist | null;
  fetchWishlistDetails: (id: string, forceFetch?: boolean) => void;
  fetchWishlists: () => void;
  setEditingWishlist: React.Dispatch<
    React.SetStateAction<{ id: string | number; title: string } | null>
  >;
  onOpen: () => void;
  confirmDelete: (id: string, title: string) => void;
  handleRemoveItem: (id: number, forceFetch: boolean) => void;
}

const WishListPageView: React.FC<WishListPageViewProps> = ({
  error,
  setError,
  loading,
  wishlists,
  selectedWishlist,
  fetchWishlistDetails,
  fetchWishlists,
  setEditingWishlist,
  onOpen,
  confirmDelete,
  handleRemoveItem,
}) => {
  const {
    isOpen: isCreateWishListModalOpen,
    onClose: onCreateWishListModalClose,
    onOpen: onCreateWishListModalOpen,
  } = useDisclosure();
  const { t } = useTranslation();
  return (
    <div className="max-w-7xl mx-auto">
      <WishListErrorAlert error={error} setError={setError} />

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Wishlists Sidebar */}
        <div className="lg:col-span-4">
          <Card shadow="sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-primary-500" />
                  <h2 className="text-sm font-semibold">
                    {t("userLayout.myWishlists")}
                  </h2>
                </div>
                <Button
                  size="sm"
                  color="primary"
                  variant="flat"
                  startContent={<Plus className="w-4 h-4" />}
                  className="text-xs"
                  onPress={onCreateWishListModalOpen}
                >
                  {t("wishlist_create_new")}
                </Button>
              </div>
            </CardHeader>
            <Divider />
            <CardBody className="p-3">
              <ScrollShadow className="h-[40vh] p-1">
                {loading.wishlists ? (
                  <WishListSkeleton />
                ) : wishlists.length === 0 ? (
                  <EmptyWishListState
                    icon={Bookmark}
                    title="No wishlists yet"
                    description="Create your first wishlist to start saving your favorite products"
                  />
                ) : (
                  <div className="space-y-2">
                    {wishlists.map((wishlist) => (
                      <WishlistCard
                        key={wishlist.id}
                        wishlist={wishlist}
                        selectedWishlist={selectedWishlist}
                        loading={loading}
                        fetchWishlistDetails={fetchWishlistDetails}
                        setEditingWishlist={setEditingWishlist}
                        onOpen={onOpen}
                        confirmDelete={confirmDelete}
                      />
                    ))}
                  </div>
                )}
              </ScrollShadow>
            </CardBody>
          </Card>
        </div>

        {/* Wishlist Details */}
        <div className="lg:col-span-8">
          <Card shadow="sm" className="h-fit">
            {selectedWishlist ? (
              <>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <Bookmark className="w-5 h-5 text-primary-500 fill-current" />
                      <div>
                        <h2 className="text-sm font-semibold">
                          {selectedWishlist.title}
                        </h2>
                        <p className="text-xs text-default-500">
                          {t("created")}{" "}
                          {new Date(
                            selectedWishlist.created_at
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Chip
                      color="primary"
                      variant="flat"
                      size="sm"
                      className="text-xs"
                    >
                      {selectedWishlist.items?.length || 0} {t("products")}
                    </Chip>
                  </div>
                </CardHeader>
                <Divider />
                <CardBody>
                  <ScrollShadow className="h-[40vh] pr-2">
                    {loading.wishlistDetails ? (
                      <div className="grid gap-4">
                        {[1, 2, 3].map((i) => (
                          <Card
                            key={i}
                            shadow="none"
                            className="border border-divider"
                          >
                            <CardBody className="p-3">
                              <div className="flex gap-3">
                                <Skeleton className="rounded-lg w-15 h-15" />
                                <div className="flex-1 space-y-2">
                                  <Skeleton className="h-4 w-3/4 rounded" />
                                  <Skeleton className="h-3 w-1/2 rounded" />
                                  <Skeleton className="h-3 w-1/3 rounded" />
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        ))}
                      </div>
                    ) : selectedWishlist.items?.length === 0 ? (
                      <EmptyWishListState
                        icon={ShoppingBag}
                        title="No items in this wishlist"
                        description="Start adding items to see them here"
                      />
                    ) : (
                      <div className="grid gap-3">
                        {selectedWishlist.items?.map((item) => (
                          <WishlistItemCard
                            key={item.id}
                            item={item}
                            loading={loading}
                            handleRemoveItem={handleRemoveItem}
                            wishlists={wishlists}
                            fetchWishlists={fetchWishlists}
                            fetchWishlistDetails={fetchWishlistDetails}
                          />
                        ))}
                      </div>
                    )}
                  </ScrollShadow>
                </CardBody>
              </>
            ) : (
              <CardBody>
                <EmptyWishListState
                  icon={Bookmark}
                  title={t("wishlist_selectTitle")}
                  description={t("wishlist_selectDescription")}
                />
              </CardBody>
            )}
          </Card>
        </div>
      </div>

      <CreateWishListModal
        isOpen={isCreateWishListModalOpen}
        onClose={onCreateWishListModalClose}
        onSuccess={() => {
          fetchWishlists();
        }}
      />
    </div>
  );
};

export default WishListPageView;
