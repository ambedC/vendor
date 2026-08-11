import OrderCard from "@/components/Cards/OrderCard";
import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import PageHeader from "@/components/custom/PageHeader";
import UserLayout from "@/layouts/UserLayout";
import { GetServerSideProps } from "next";
import { Order, PaginatedResponse } from "@/types/ApiResponse";
import { isSSR } from "@/helpers/getters";
import { getOrders, getSettings } from "@/routes/api";
import { NextPageWithLayout } from "@/types";
import { Button, Pagination, Select, SelectItem } from "@heroui/react";
import { getAccessTokenFromContext } from "@/helpers/auth";
import { useRouter } from "next/router";
import useSWR from "swr";
import { useState, useEffect, ReactNode } from "react";
import OrdersEmpty from "@/components/Empty/OrdersEmpty";
import { loadTranslations } from "../../../../i18n";
import { useTranslation } from "react-i18next";
import PageHead from "@/SEO/PageHead";
import OrderCardSkeleton from "@/components/Skeletons/OrderCardSkeleton";
import { getCookie } from "@/lib/cookies";

const PER_PAGE = 9;

interface OrdersData {
  data: Order[];
  current_page: number;
  per_page: number;
  total: number;
}

interface OrdersPageProps {
  orders?: OrdersData;
  error?: string | null;
  isSSR: boolean;
}

// SWR fetcher function
const ordersFetcher = async (url: string) => {
  const [, queryString = ""] = url.split("?");
  const urlParams = new URLSearchParams(queryString);
  const page = urlParams.get("page") || "1";
  const date_range = urlParams.get("date_range") || undefined;
  const status = urlParams.get("status") || undefined;
  const order_type = urlParams.get("order_type") || undefined;

  // Ensure client-side auth even when the interceptor isn't attaching headers for some reason
  const access_token = getCookie<string>("access_token") || "";

  const response: PaginatedResponse<Order[]> = await getOrders({
    per_page: PER_PAGE,
    page: page,
    date_range,
    status,
    order_type,
    access_token,
  });

  if (response.success && response.data) {
    return {
      data: response.data.data ?? [],
      current_page: response.data.current_page ?? 1,
      per_page: response.data.per_page ?? PER_PAGE,
      total: response.data.total ?? 0,
    };
  } else {
    throw new Error(response.message || "Failed to fetch orders");
  }
};

const OrdersLayout = ({ children, rightContent }: { children: ReactNode; rightContent?: ReactNode }) => {
  const { t } = useTranslation();
  return (
    <>
      <MyBreadcrumbs
        breadcrumbs={[
          { href: "/my-account/orders", label: t("pageTitle.orders") },
        ]}
      />

      <UserLayout activeTab="orders">
        <div className="w-full">
          <PageHeader
            title={t("pageTitle.orders")}
            subtitle={t("pages.ordersPage.subtitle")}
            rightContent={rightContent}
          />
          {children}
        </div>
      </UserLayout>
    </>
  );
};

// Loading component
const OrdersLoading = () => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
      {Array(PER_PAGE)
        .fill(0)
        .map((_, index) => (
          <OrderCardSkeleton key={index} />
        ))}
    </div>
  );
};

// Error component
const OrdersError = ({ error }: { error: string }) => {
  const { t } = useTranslation();
  return (
    <div className="w-full flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="text-red-500 text-lg font-medium mb-2">
          {t("pages.ordersPage.errorTitle")}
        </div>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button
          onPress={() => window.location.reload()}
          size="md"
          variant="flat"
          color="warning"
          className="px-4 py-2 text-xs"
        >
          {t("pages.ordersPage.tryAgain")}
        </Button>
      </div>
    </div>
  );
};

// Main orders content component
const OrdersContent = ({ orders }: { orders: OrdersData }) => {
  const router = useRouter();
  return (
    <div className="w-full">
      {/* Orders List */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
        {orders.data.map((order: Order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>

      {/* Pagination */}
      {orders.total > orders.per_page && (
        <div className="mt-8 flex justify-center">
          <Pagination
            total={Math.ceil(orders.total / orders.per_page)}
            initialPage={orders.current_page}
            showControls
            size="sm"
            isCompact
            classNames={{
              item: "text-sm",
              cursor: "text-sm",
              next: "text-sm",
              prev: "text-sm",
            }}
            onChange={(page) => {
              const currentQuery = { ...router.query };
              currentQuery.page = page.toString();
              router.push({
                pathname: "/my-account/orders",
                query: currentQuery,
              });
            }}
          />
        </div>
      )}
    </div>
  );
};

const OrdersPage: NextPageWithLayout<OrdersPageProps> = ({
  orders: initialOrders,
  error: initialError,
}) => {
  const router = useRouter();
  const { t } = useTranslation();
  const shouldFetch = typeof window !== "undefined" && router.isReady;

  const [currentPage, setCurrentPage] = useState(
    parseInt(router.query.page as string) || 1
  );

  const [dateRange, setDateRange] = useState(
    (router.query.date_range as string) || ""
  );
  const [status, setStatus] = useState(
    (router.query.status as string) || ""
  );
  const [orderType, setOrderType] = useState(
    (router.query.order_type as string) || ""
  );

  // Update current page when router query changes
  useEffect(() => {
    const page = parseInt(router.query.page as string) || 1;
    const qDateRange = (router.query.date_range as string) || "";
    const qStatus = (router.query.status as string) || "";
    const qOrderType = (router.query.order_type as string) || "";
    
    // defer the state update to the next tick
    const timer = setTimeout(() => {
      setCurrentPage(page);
      setDateRange(qDateRange);
      setStatus(qStatus);
      setOrderType(qOrderType);
    }, 0);
    return () => clearTimeout(timer);
  }, [router.query.page, router.query.date_range, router.query.status, router.query.order_type]);

  // Use SWR for client-side data fetching when not SSR
  const {
    data: swrOrders,
    error: swrError,
    isLoading,
  } = useSWR(
    shouldFetch
      ? `/api/orders?page=${currentPage}&date_range=${dateRange}&status=${status}&order_type=${orderType}`
      : null,
    ordersFetcher,
    {
      fallbackData: initialOrders,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      errorRetryCount: 3,
      errorRetryInterval: 2000,
      refreshInterval: 10000,
    }

  );

  // Determine which data to use
  const orders = swrOrders || initialOrders;
  const error = swrError ? swrError.message : initialError;

  const dateRangeOptions = [
    { label: t("filters.all") || "All Time", value: "" },
    { label: t("filters.last_30_minutes") || "Last 30 Min", value: "last_30_minutes" },
    { label: t("filters.last_1_hour") || "Last 1 Hour", value: "last_1_hour" },
    { label: t("filters.last_5_hours") || "Last 5 Hours", value: "last_5_hours" },
    { label: t("filters.last_1_day") || "Last 1 Day", value: "last_1_day" },
    { label: t("filters.last_7_days") || "Last 7 Days", value: "last_7_days" },
    { label: t("filters.last_30_days") || "Last 30 Days", value: "last_30_days" },
    { label: t("filters.last_365_days") || "Last 365 Days", value: "last_365_days" },
  ];

  const statusOptions = [
    { label: t("filters.all") || "All Status", value: "" },
    { label: t("statusFilters.pending") || "Pending", value: "pending" },
    { label: t("statusFilters.awaiting_store_response") || "Awaiting Store Response", value: "awaiting_store_response" },
    { label: t("statusFilters.partially_accepted") || "Partially Accepted", value: "partially_accepted" },
    { label: t("statusFilters.rejected_by_seller") || "Rejected", value: "rejected_by_seller" },
    { label: t("statusFilters.accepted_by_seller") || "Accepted By Seller", value: "accepted_by_seller" },
    { label: t("statusFilters.accepted") || "Accepted", value: "accepted" },
    { label: t("statusFilters.ready_for_pickup") || "Ready for Pickup", value: "ready_for_pickup" },
    { label: t("statusFilters.assigned") || "Assigned", value: "assigned" },
    { label: t("statusFilters.preparing") || "Preparing", value: "preparing" },
    { label: t("statusFilters.collected") || "Collected", value: "collected" },
    { label: t("statusFilters.out_for_delivery") || "Out for Delivery", value: "out_for_delivery" },
    { label: t("statusFilters.delivered") || "Delivered", value: "delivered" },
    { label: t("statusFilters.cancelled") || "Cancelled", value: "cancelled" },
    { label: t("statusFilters.failed") || "Failed", value: "failed" },
    { label: t("statusFilters.returned") || "Returned", value: "returned" },
  ];

  const orderTypeOptions = [
    { label: t("filters.allTypes") || "All Types", value: "" },
    { label: t("filters.regular") || "Regular", value: "regular" },
    { label: t("filters.pickup") || "Self Pick-up", value: "pickup" },
  ];

  const handleFilterChange = (key: string, value: string) => {
    const currentQuery = { ...router.query };
    if (value) {
      currentQuery[key] = value;
    } else {
      delete currentQuery[key];
    }
    delete currentQuery.page; // reset to page 1
    router.push({
      pathname: "/my-account/orders",
      query: currentQuery,
    });
  };

  const renderFilters = () => (
    <div className="flex flex-col sm:flex-row gap-4 mb-2 md:mb-0 w-full md:w-auto">
      <Select
        size="sm"
        label={t("filters.dateRange") || "Date Range"}
        className="w-full min-w-[150px] md:max-w-xs"
        selectedKeys={[dateRange]}
        onChange={(e) => handleFilterChange("date_range", e.target.value)}
      >
        {dateRangeOptions.map((opt) => (
          <SelectItem key={opt.value} textValue={opt.label}>
            {opt.label}
          </SelectItem>
        ))}
      </Select>

      <Select
        size="sm"
        label={t("filters.status") || "Status"}
        className="w-full min-w-[150px] md:max-w-xs"
        selectedKeys={[status]}
        onChange={(e) => handleFilterChange("status", e.target.value)}
      >
        {statusOptions.map((opt) => (
          <SelectItem key={opt.value} textValue={opt.label}>
            {opt.label}
          </SelectItem>
        ))}
      </Select>

      <Select
        size="sm"
        label={t("filters.orderType") || "Order Type"}
        className="w-full min-w-[150px] md:max-w-xs"
        selectedKeys={[orderType]}
        onChange={(e) => handleFilterChange("order_type", e.target.value)}
      >
        {orderTypeOptions.map((opt) => (
          <SelectItem key={opt.value} textValue={opt.label}>
            {opt.label}
          </SelectItem>
        ))}
      </Select>
    </div>
  );

  // Handle loading state for client-side
  if (!orders && (!shouldFetch || isLoading)) {
    return (
      <OrdersLayout rightContent={renderFilters()}>
        <PageHead pageTitle={t("pageTitle.orders")} />
        <OrdersLoading />
      </OrdersLayout>
    );
  }

  // Handle error state
  if (error) {
    return (
      <OrdersLayout rightContent={renderFilters()}>
        <PageHead pageTitle={t("pageTitle.orders")} />
        <OrdersError error={error} />
      </OrdersLayout>
    );
  }

  // Handle empty state
  if (!orders?.data || orders.data.length === 0) {
    return (
      <OrdersLayout rightContent={renderFilters()}>
        <PageHead pageTitle={t("pageTitle.orders")} />
        <OrdersEmpty />
      </OrdersLayout>
    );
  }

  // Render main content
  return (
    <OrdersLayout rightContent={renderFilters()}>
      <PageHead pageTitle={t("pageTitle.orders")} />
      <OrdersContent orders={orders} />
    </OrdersLayout>
  );
};

export const getServerSideProps: GetServerSideProps | undefined = isSSR()
  ? async (context) => {
      try {
        const access_token = (await getAccessTokenFromContext(context)) || "";
        const { page = "1", date_range, status, order_type } = context.query;
        await loadTranslations(context);

        if (!access_token) {
          return {
            redirect: {
              destination: "/",
              permanent: false,
            },
          };
        }

        const response: PaginatedResponse<Order[]> = await getOrders({
          access_token: access_token,
          per_page: PER_PAGE,
          page: String(page),
          date_range: date_range ? String(date_range) : undefined,
          status: status ? String(status) : undefined,
          order_type: order_type ? String(order_type) : undefined,
        });

        const settings = await getSettings();

        if (response.success && response.data) {
          return {
            props: {
              orders: {
                data: response.data.data ?? [],
                current_page: response.data.current_page ?? 1,
                per_page: response.data.per_page ?? 15,
                total: response.data.total ?? 0,
              },
              initialSettings: settings.data ?? null,
              isSSR: true,
            },
          };
        } else {
          return {
            props: {
              orders: {
                data: [],
                current_page: 1,
                per_page: PER_PAGE,
                total: 0,
              },
              initialSettings: settings?.data ?? null,
              error: response.message || "Failed to fetch orders",
              isSSR: true,
            },
          };
        }
      } catch (error) {
        console.error("Error fetching orders:", error);

        return {
          props: {
            orders: {
              data: [],
              current_page: 1,
              per_page: PER_PAGE,
              total: 0,
            },
            initialSettings: null,
            error: "Unable to load orders. Please try again later.",
            isSSR: true,
          },
        };
      }
    }
  : undefined;

export default OrdersPage;
