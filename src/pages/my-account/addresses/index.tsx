import React, { useState } from "react";
import { Plus } from "lucide-react";
import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import PageHeader from "@/components/custom/PageHeader";
import { getPageFromUrl, isSSR } from "@/helpers/getters";
import UserLayout from "@/layouts/UserLayout";
import { getAddresses, getSettings } from "@/routes/api";
import { Address, PaginatedResponse } from "@/types/ApiResponse";
import { GetServerSideProps } from "next";
import { Button, useDisclosure, Pagination } from "@heroui/react";
import AddressCard from "@/components/Cards/AddressCard";
import AddressModal from "@/components/Modals/AddressModal";
import { getAccessTokenFromContext } from "@/helpers/auth";
import { useRouter } from "next/router";
import AddressCardSkeleton from "@/components/Skeletons/AddressCardSkeleton";
import useSWR from "swr";
import { NextPageWithLayout } from "@/types";
import { loadTranslations } from "../../../../i18n";
import PageHead from "@/SEO/PageHead";
import { useTranslation } from "react-i18next";

const per_page = 6;

interface AddressesPageProps {
  paginatedAddresses: PaginatedResponse<Address[]>["data"] | null;
  error?: string;
  initialPage: number;
}

// SWR fetcher
const addressesFetcher = async (url: string) => {
  const [, page] = url.split(":");
  const response: PaginatedResponse<Address[]> = await getAddresses({
    page: parseInt(page),
    per_page,
  });

  if (!response.success) {
    throw new Error(response.message || "Failed to fetch addresses");
  }

  return response.data;
};

const AddressesPage: NextPageWithLayout<AddressesPageProps> = ({
  paginatedAddresses: ssrPaginatedAddresses,
  error: ssrError,
  initialPage,
}) => {
  const router = useRouter();
  const { isOpen, onOpenChange, onOpen } = useDisclosure();
  const { t } = useTranslation();

  const [currentPage, setCurrentPage] = useState<number>(
    initialPage ?? getPageFromUrl()
  );

  const swrKey = `addresses:${currentPage}`;
  const {
    data: paginatedData,
    error: swrError,
    isLoading,
    mutate,
  } = useSWR(swrKey, addressesFetcher, {
    fallbackData: ssrPaginatedAddresses ?? undefined,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    errorRetryCount: 2,
    errorRetryInterval: 1000,
    revalidateOnMount: !isSSR(),
  });

  const loading = isLoading;
  const error = swrError?.message || ssrError;
  const addresses = paginatedData?.data || [];
  const totalPages = paginatedData?.last_page || 1;
  const totalAddresses = paginatedData?.total || 0;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, page: page.toString() },
      },
      undefined,
      { shallow: true }
    );
  };

  const handleEditAddress = async () => {
    await mutate();
  };

  const handleDeleteAddress = async () => {
    await mutate();
  };

  const handleAddressAdded = async () => {
    await mutate();
  };

  const handleRetry = () => mutate();

  if (error && !paginatedData) {
    return (
      <>
        <MyBreadcrumbs
          breadcrumbs={[
            { href: "/my-account/addresses", label: t("pageTitle.addresses") },
          ]}
        />
        <PageHead pageTitle={t("pageTitle.addresses")} />

        <UserLayout activeTab="addresses">
          <PageHeader
            title={t("pages.addresses.myAddresses")}
            subtitle={t("pages.addresses.subtitle")}
          />
          <div className="w-full p-6 text-center">
            <div className="text-red-500 text-lg mb-4">
              {t("pages.addresses.errorLoading")}
            </div>
            <div className="text-gray-600 mb-4">{error}</div>
            <Button
              color="primary"
              variant="flat"
              onPress={handleRetry}
              isLoading={loading}
            >
              {t("pages.addresses.tryAgain")}
            </Button>
          </div>
        </UserLayout>
      </>
    );
  }

  return (
    <>
      <MyBreadcrumbs
        breadcrumbs={[
          { href: "/my-account/addresses", label: t("pageTitle.addresses") },
        ]}
      />

      <PageHead pageTitle={t("pageTitle.addresses")} />

      <UserLayout activeTab="addresses">
        <div className="w-full">
          <div className="flex justify-between items-center">
            <PageHeader
              title={t("pages.addresses.myAddresses")}
              subtitle={`${t("pages.addresses.subtitle")}${
                totalAddresses > 0
                  ? ` (${totalAddresses} ${t("pages.addresses.total")})`
                  : ""
              }`}
            />
            <Button
              variant="bordered"
              size="sm"
              className="text-xs px-1 md:px-2"
              startContent={<Plus className="w-4 h-4" />}
              onPress={onOpen}
            >
              {t("pages.addresses.addNew")}
            </Button>
          </div>

          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <AddressCardSkeleton key={index} />
              ))}
            </div>
          )}

          {addresses.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {addresses.map((address) => (
                  <AddressCard
                    key={address.id}
                    address={address}
                    onEdit={handleEditAddress}
                    onDelete={handleDeleteAddress}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <Pagination
                    total={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    showControls
                    showShadow
                    color="primary"
                    size="sm"
                    isCompact
                    classNames={{
                      item: "text-sm",
                      cursor: "text-sm",
                      next: "text-sm",
                      prev: "text-sm",
                    }}
                  />
                </div>
              )}

              <div className="text-center text-sm text-gray-500">
                {t("pages.addresses.showingRange", {
                  from: paginatedData?.from || 0,
                  to: paginatedData?.to || 0,
                  total: totalAddresses,
                })}
              </div>
            </div>
          ) : (
            !loading && (
              <div className="w-full p-12 text-center rounded-lg">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                    <Plus className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    {t("pages.addresses.noAddresses")}
                  </h3>
                  <p className="mb-6 text-xs text-foreground/50">
                    {t("pages.addresses.noAddressesDesc")}
                  </p>
                  <Button
                    color="primary"
                    variant="flat"
                    startContent={<Plus className="w-4 h-4" />}
                    onPress={onOpen}
                  >
                    {t("pages.addresses.addFirst")}
                  </Button>
                </div>
              </div>
            )
          )}
        </div>
      </UserLayout>

      <AddressModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onSave={handleAddressAdded}
      />
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
        const page = parseInt(context.query.page as string) || 1;

        const response = await getAddresses({ access_token, page, per_page });
        const settings = await getSettings();
        await loadTranslations(context);

        return {
          props: {
            paginatedAddresses: response.success ? response.data : null,
            initialSettings: settings?.data || null,
            initialPage: page,
            error: response.success
              ? null
              : response.message || "Failed to fetch addresses",
          },
        };
      } catch (error) {
        console.error("SSR Error fetching addresses:", error);
        return {
          props: {
            paginatedAddresses: null,
            initialSettings: null,
            initialPage: 1,
            error: "Unable to load addresses. Please try again later.",
          },
        };
      }
    }
  : undefined;

export default AddressesPage;
