import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import PageHeader from "@/components/custom/PageHeader";
import UserLayout from "@/layouts/UserLayout";
import { GetServerSideProps } from "next";
import { Order } from "@/types/ApiResponse";
import { isSSR } from "@/helpers/getters";
import { getSpecificOrders, getSettings } from "@/routes/api";
import { NextPageWithLayout } from "@/types";
import { getAccessTokenFromContext } from "@/helpers/auth";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/router";
import OrderDetailPageView from "@/views/OrderDetailView";
import { Button, Spinner } from "@heroui/react";
import useSWR from "swr";
import { loadTranslations } from "../../../../../i18n";
import { useTranslation } from "react-i18next";
import PageHead from "@/SEO/PageHead";
import { getCookie } from "@/lib/cookies";

interface OrderDetailsPageProps {
  order?: Order;
  error?: string;
  isSSR: boolean;
}


// SWR fetcher function
const fetchOrderDetails = async (slug: string) => {
  const access_token = getCookie<string>("access_token") || "";
  const response = await getSpecificOrders({
    slug,
    access_token: access_token,
  });

  if (!response.success) {
    throw new Error(response.message || "Failed to fetch order details");
  }
  return response.data;
};

const OrderDetailsPage: NextPageWithLayout<OrderDetailsPageProps> = ({
  order: initialOrder,
  error: initialError,
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { slug } = router.query;

  const shouldFetch = typeof window !== "undefined" && !!slug;
  const {
    data: clientOrder,
    error: clientError,
    isLoading,
  } = useSWR(
    shouldFetch ? `/api/orders/detail/${slug}` : null,
    () => fetchOrderDetails(slug as string),
    {
      fallbackData: initialOrder,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      errorRetryCount: 3,
      errorRetryInterval: 1000,
      refreshInterval: 10000,
    }

  );

  const order = clientOrder || initialOrder;
  const error = clientError ? clientError.message : initialError;

  // Common layout wrapper
  const renderContent = (content: React.ReactNode) => (
    <>
      <MyBreadcrumbs
        breadcrumbs={[
          { href: "/my-account/orders", label: t("pageTitle.orders") },
          { href: "#", label: t("pages.order.details") },
        ]}
      />

      <PageHead pageTitle={`${t("order")} #${order?.id || ""}`} />

      <UserLayout activeTab="orders">
        <div className="w-full">
          <PageHeader
            title={t("pages.order.details")}
            subtitle={t("pages.order.detailsSubtitle")}
          />
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">{content}</div>
          </div>
        </div>
      </UserLayout>
    </>
  );

  // Loading state (only show spinner if actively fetching and no data yet)
  const isClientLoading = isLoading && !order;

  if (isClientLoading) {
    return renderContent(
      <>
        <Spinner size="lg" className="mb-4" />
        <div className="text-gray-600">{t("pages.order.loading")}</div>
      </>
    );
  }

  // Error state
  if (error) {
    return renderContent(
      <>
        <div className="text-red-500 text-lg font-medium mb-2">
          {t("pages.order.errorLoading")}
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button
          color="primary"
          variant="flat"
          startContent={<ArrowLeft className="w-4 h-4" />}
          onPress={() => router.push("/my-account/orders")}
        >
          {t("pages.order.backToList")}
        </Button>
      </>
    );
  }

  // Order not found
  if (!order) {
    return renderContent(
      <>
        <div className="text-gray-500 text-lg font-medium mb-2">
          {t("pages.order.notFound")}
        </div>
        <p className="text-gray-600 mb-4">{t("pages.order.notFoundDesc")}</p>
        <Button
          color="primary"
          variant="flat"
          startContent={<ArrowLeft className="w-4 h-4" />}
          onPress={() => router.push("/my-account/orders")}
        >
          {t("pages.order.backToList")}
        </Button>
      </>
    );
  }

  // Success
  return <OrderDetailPageView order={order} />;
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
        const { slug } = context.params || {};
        await loadTranslations(context);

        if (!slug || typeof slug !== "string") {
          return {
            props: {
              order: null,
              error: "Invalid order identifier",
            },
          };
        }
        const response = await getSpecificOrders({ slug, access_token });
        const settings = await getSettings();

        if (response.success && response.data) {
          return {
            props: { order: response.data, initialSettings: settings.data, isSSR: true },
          };
        } else {
          return {
            props: {
              order: null,
              initialSettings: settings.data,
              error: response.message || "Failed to fetch order details",
              isSSR: true,
            },
          };
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
        return {
          props: {
            order: null,
            initialSettings: null,
            error: "Unable to load order details. Please try again later.",
            isSSR: true,
          },
        };
      }
    }
  : undefined;

export default OrderDetailsPage;
