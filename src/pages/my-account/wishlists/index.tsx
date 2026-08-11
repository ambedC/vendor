import { useEffect, useState, useCallback } from "react";
import UserLayout from "@/layouts/UserLayout";
import { useDisclosure } from "@heroui/react";
import {
  getAllWishlistTitles,
  getWishlistById,
  UpdateWishlistById,
  deleteWishlistById,
  deleteWishlistItemById,
  getSettings,
} from "@/routes/api";
import { Wishlist, WishTitle } from "@/types/ApiResponse";
import { GetServerSideProps } from "next";
import { NextPageWithLayout } from "@/types";
import { isSSR } from "@/helpers/getters";
import useSWR from "swr";
import { getAccessTokenFromContext } from "@/helpers/auth";
import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import dynamic from "next/dynamic";
import { loadTranslations } from "../../../../i18n";
import PageHead from "@/SEO/PageHead";
import { useTranslation } from "react-i18next";

const EditWishlistModal = dynamic(
  () => import("@/components/Modals/EditWishlistModal"),
  { ssr: false }
);
const WishListPageView = dynamic(() => import("@/views/WishListPageView"), {
  ssr: false,
});

interface LoadingState {
  wishlists: boolean;
  wishlistDetails: boolean;
  updating: boolean;
  deleting: string | null;
  removingItem: number | null;
}

interface ErrorState {
  message: string;
  type: "error" | "warning" | "info";
}

interface EditingWishlist {
  id: string | number;
  title: string;
}

interface WishlistsPageProps {
  initialWishlists: WishTitle[] | null;
  error?: string;
}

const WishlistsPage: NextPageWithLayout<WishlistsPageProps> = ({
  initialWishlists,
  error: initialError,
}) => {
  const [wishlists, setWishlists] = useState<WishTitle[]>(
    initialWishlists || []
  );
  const [selectedWishlist, setSelectedWishlist] = useState<Wishlist | null>(
    null
  );
  const { t } = useTranslation();
  const [loading, setLoading] = useState<LoadingState>({
    wishlists: !initialWishlists,
    wishlistDetails: false,
    updating: false,
    deleting: null,
    removingItem: null,
  });
  const [error, setError] = useState<ErrorState | null>(
    initialError ? { message: initialError, type: "error" } : null
  );

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingWishlist, setEditingWishlist] =
    useState<EditingWishlist | null>(null);

  const { data: wishlistsData, error: wishlistsError } = useSWR(
    !isSSR() ? "/api/wishlists" : null,
    async () => {
      const response = await getAllWishlistTitles();
      if (response.success && response.data) {
        return Array.isArray(response.data) ? response.data : [response.data];
      }
      console.error(
        response.message || t("pages.wishlistsPage.errors.fetchFailed")
      );
    },
    {
      fallbackData: initialWishlists || undefined,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 3000,
    }
  );

  useEffect(() => {
    if (wishlistsData) {
      setWishlists(wishlistsData);
      setLoading((prev) => ({ ...prev, wishlists: false }));
    }
    if (wishlistsError) {
      setError({ message: wishlistsError.message, type: "error" });
    }
  }, [wishlistsData, wishlistsError]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const showError = useCallback(
    (message: string, type: ErrorState["type"] = "error") => {
      setError({ message, type });
    },
    []
  );

  const updateLoading = useCallback(
    (key: keyof LoadingState, value: boolean | string | number | null) => {
      setLoading((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const fetchWishlists = async () => {
    updateLoading("wishlists", true);
    try {
      const response = await getAllWishlistTitles();
      if (response.success && response.data) {
        const wishlistData = Array.isArray(response.data)
          ? response.data
          : [response.data];
        setWishlists(wishlistData);
      } else {
        showError(
          response.message || t("pages.wishlistsPage.errors.fetchFailed")
        );
      }
    } catch {
      showError(t("pages.wishlistsPage.errors.network"));
    } finally {
      updateLoading("wishlists", false);
    }
  };

  const fetchWishlistDetails = async (id: string, forceFetch?: boolean) => {
    if (selectedWishlist?.id.toString() === id && !forceFetch) return;

    updateLoading("wishlistDetails", true);
    try {
      const response = await getWishlistById(id);
      if (response.success && response.data) {
        setSelectedWishlist(response.data);
      } else {
        showError(
          response.message || t("pages.wishlistsPage.errors.fetchDetails")
        );
        setSelectedWishlist(null);
      }
    } catch {
      showError(t("pages.wishlistsPage.errors.network"));
      setSelectedWishlist(null);
    } finally {
      updateLoading("wishlistDetails", false);
    }
  };

  const handleUpdateWishlist = async () => {
    if (!editingWishlist || !editingWishlist.title.trim()) {
      showError(t("pages.wishlistsPage.errors.invalidTitle"), "warning");
      return;
    }

    updateLoading("updating", true);
    try {
      const response = await UpdateWishlistById({
        id:
          typeof editingWishlist.id === "string"
            ? parseInt(editingWishlist.id)
            : editingWishlist.id,
        title: editingWishlist.title.trim(),
      });

      if (response.success) {
        await fetchWishlists();
        if (selectedWishlist?.id === editingWishlist.id) {
          setSelectedWishlist((prev) =>
            prev ? { ...prev, title: editingWishlist.title } : null
          );
        }
        onClose();
        setEditingWishlist(null);
      } else {
        showError(
          response.message || t("pages.wishlistsPage.errors.updateFailed")
        );
      }
    } catch {
      showError(t("pages.wishlistsPage.errors.network"));
    } finally {
      updateLoading("updating", false);
    }
  };

  const handleDeleteWishlist = async (id: string) => {
    updateLoading("deleting", id);
    try {
      const response = await deleteWishlistById(id);
      if (response.success) {
        await fetchWishlists();
        if (selectedWishlist?.id.toString() === id) {
          setSelectedWishlist(null);
        }
      } else {
        showError(
          response.message || t("pages.wishlistsPage.errors.deleteFailed")
        );
      }
    } catch {
      showError(t("pages.wishlistsPage.errors.network"));
    } finally {
      updateLoading("deleting", null);
    }
  };

  const handleRemoveItem = async (itemId: number, forceFetch: boolean) => {
    updateLoading("removingItem", itemId);
    try {
      const response = await deleteWishlistItemById(itemId);
      if (response.success) {
        if (selectedWishlist) {
          await fetchWishlistDetails(
            selectedWishlist.id.toString(),
            forceFetch
          );
        }
        await fetchWishlists();
      } else {
        showError(
          response.message || t("pages.wishlistsPage.errors.removeItem")
        );
      }
    } catch {
      showError(t("pages.wishlistsPage.errors.network"));
    } finally {
      updateLoading("removingItem", null);
    }
  };

  const confirmDelete = (id: string, title: string) => {
    if (window.confirm(t("pages.wishlistsPage.confirmDelete", { title }))) {
      handleDeleteWishlist(id);
    }
  };

  return (
    <>
      <MyBreadcrumbs
        breadcrumbs={[
          { href: "/my-account/wishlists", label: t("pageTitle.wishlists") },
        ]}
      />
      <PageHead pageTitle={t("pageTitle.wishlists")} />

      <UserLayout activeTab="wishlists">
        <WishListPageView
          error={error}
          setError={setError}
          loading={loading}
          wishlists={wishlists}
          selectedWishlist={selectedWishlist}
          fetchWishlistDetails={fetchWishlistDetails}
          setEditingWishlist={setEditingWishlist}
          onOpen={onOpen}
          confirmDelete={confirmDelete}
          handleRemoveItem={handleRemoveItem}
          fetchWishlists={fetchWishlists}
        />

        <EditWishlistModal
          isOpen={isOpen}
          onClose={onClose}
          editingWishlist={editingWishlist}
          setEditingWishlist={setEditingWishlist}
          loading={loading}
          handleUpdateWishlist={handleUpdateWishlist}
        />
      </UserLayout>
    </>
  );
};

export const getServerSideProps: GetServerSideProps | undefined = isSSR()
  ? async (context) => {
      try {
        const access_token = (await getAccessTokenFromContext(context)) || "";
        if (!access_token) {
          return {
            redirect: {
              destination: "/",
              permanent: false,
            },
          };
        }
        await loadTranslations(context);

        const wishlistsResponse = await getAllWishlistTitles({ access_token });
        const settingsResponse = await getSettings();

        if (wishlistsResponse.success && wishlistsResponse.data) {
          return {
            props: {
              initialWishlists: Array.isArray(wishlistsResponse.data)
                ? wishlistsResponse.data
                : [wishlistsResponse.data],
              initialSettings: settingsResponse.data,
            },
          };
        } else {
          return {
            props: {
              initialWishlists: null,
              initialSettings: settingsResponse.data,
              error: wishlistsResponse.message || "Failed to fetch wishlists",
            },
          };
        }
      } catch (err) {
        console.error("Error in getServerSideProps:", err);
        return {
          props: {
            initialWishlists: null,
            initialSettings: null,
            error:
              err instanceof Error
                ? err.message
                : "An error occurred during SSR",
          },
        };
      }
    }
  : undefined;

export default WishlistsPage;
