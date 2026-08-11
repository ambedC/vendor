import { GetServerSideProps } from "next";
import { getDeliveryZones, getSettings } from "@/routes/api";
import React from "react";
import { isSSR } from "@/helpers/getters";
import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import PageHeader from "@/components/custom/PageHeader";
import InfiniteScroll from "@/components/Functional/InfiniteScroll";
import InfiniteScrollStatus from "@/components/Functional/InfiniteScrollStatus";
import { useInfiniteData } from "@/hooks/useInfiniteData";
import { DeliveryZone, PaginatedResponse } from "@/types/ApiResponse";
import { NextPageWithLayout } from "@/types";
import { ArrowRight, MapPin } from "lucide-react";
import NoProductsFound from "@/components/NoProductsFound";
import DeliveryZoneCardSkeleton from "@/components/Skeletons/DeliveryZoneCardSkeleton";
import DeliveryZoneCard from "@/components/Cards/DeliveryZoneCard";
import { loadTranslations } from "../../../i18n";
import PageHead from "@/SEO/PageHead";
import { useTranslation } from "react-i18next";
import { Button } from "@heroui/react";
import { useRouter } from "next/router";

interface DeliveryZonesPageProps {
  initialZones: PaginatedResponse<DeliveryZone[]> | null;
  error?: string;
}

const PER_PAGE = 24;

const DeliveryZonesPage: NextPageWithLayout<DeliveryZonesPageProps> = ({
  initialZones,
}) => {
  const { t } = useTranslation();
  const router = useRouter();

  const {
    data: zones,
    isLoading,
    isLoadingMore,
    hasMore,
    total,
    loadMore,
    refetch,
  } = useInfiniteData<DeliveryZone>({
    fetcher: getDeliveryZones,
    perPage: PER_PAGE,
    initialData: initialZones?.data?.data || [],
    initialTotal: initialZones?.data?.total || 0,
    extraParams: {},
  });

  return (
    <>
      <PageHead pageTitle={t("pageTitle.delivery-zones")} />

      <div className="min-h-screen">
        {/* Breadcrumb Navigation */}
        <MyBreadcrumbs
          breadcrumbs={[
            { href: "/delivery-zones", label: t("pageTitle.delivery-zones") },
          ]}
        />

        {/* Hidden refetch button for programmatic refreshing */}
        <button
          id="refetch-delivery-zones-page"
          className="hidden"
          onClick={() => refetch()}
        />

        {/* Page Header */}
        <PageHeader
          title={t("pages.deliveryZones.title")}
          subtitle={t("pages.deliveryZones.subtitle")}
          highlightText={
            total ? ` ${total} ${t("pages.deliveryZones.totalZones")}` : ""
          }
        />

        {/* Delivery Zones Grid with Infinite Scroll */}
        <InfiniteScroll
          hasMore={hasMore}
          isLoading={isLoadingMore}
          onLoadMore={loadMore}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {isLoading
              ? Array.from({ length: PER_PAGE }).map((_, index) => (
                  <DeliveryZoneCardSkeleton key={index} />
                ))
              : zones.map((zone) => (
                  <DeliveryZoneCard zone={zone} key={zone.id} />
                ))}
          </div>

          {/* Loading more skeleton */}
          {isLoadingMore && (
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
              {Array.from({ length: PER_PAGE }).map((_, index) => (
                <DeliveryZoneCardSkeleton key={`loading-${index}`} />
              ))}
            </div>
          )}

          {/* Status messages */}
          {zones.length > 0 ? (
            <InfiniteScrollStatus
              entityType="zone"
              total={total}
              hasMore={hasMore}
            />
          ) : (
            <NoProductsFound
              icon={MapPin}
              title={t("pages.deliveryZones.noZonesTitle")}
              description={t("pages.deliveryZones.noZonesDescription")}
              customActions={
                <div className="flex w-full justify-center items-center">
                  <Button
                    color="primary"
                    className="h-8"
                    variant="solid"
                    onPress={() => {
                      router.push("/");
                    }}
                    endContent={<ArrowRight size={16} />}
                  >
                    {t("home_title")}
                  </Button>
                </div>
              }
            />
          )}
        </InfiniteScroll>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps | undefined = isSSR()
  ? async (context) => {
      try {
        const [zonesResult, settingsResult] = await Promise.allSettled([
          getDeliveryZones({ page: 1, per_page: PER_PAGE }),
          getSettings(),
        ]);

        await loadTranslations(context);

        return {
          props: {
            initialZones:
              zonesResult.status === "fulfilled" ? zonesResult.value : null,
            initialSettings:
              settingsResult.status === "fulfilled"
                ? settingsResult.value.data ?? null
                : null,
            error:
              zonesResult.status === "rejected" ||
              settingsResult.status === "rejected"
                ? "Some data failed to load"
                : null,
          },
        };
      } catch (error) {
        console.error("Unexpected error fetching delivery zones:", error);
        return {
          props: {
            initialZones: null,
            initialSettings: null,
            error: "Unexpected failure",
          },
        };
      }
    }
  : undefined;

export default DeliveryZonesPage;
