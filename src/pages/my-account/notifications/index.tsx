import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Button,
  Chip,
  Pagination,
  Card,
  CardBody,
  Spinner,
} from "@heroui/react";
import {
  Bell,
  ShoppingBag,
  Wallet,
  Package,
  RotateCcw,
  BellOff,
  ArrowRight,
  CheckCheck,
} from "lucide-react";
import useSWR from "swr";
import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import PageHeader from "@/components/custom/PageHeader";
import UserLayout from "@/layouts/UserLayout";
import PageHead from "@/SEO/PageHead";
import { NextPageWithLayout } from "@/types";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/routes/api";
import { getNotificationRedirectUrl } from "@/helpers/notificationUrl";

// ── Types ─────────────────────────────────────────────────────────────────────
type NotificationMetadata = {
  order_id?: number;
  order_slug?: string;
  order_item_id?: number;
  status_old?: string;
  status_new?: string;
  status?: string;
  total?: number;
  type?: string;
  slug?: string;
  redirect_url?: string;
  [key: string]: unknown;
};

interface Notification {
  id: string;
  user_id: number;
  store_id: number | null;
  order_id: number | null;
  type: string;
  sent_to: string;
  title: string;
  message: string;
  is_read: boolean;
  metadata: NotificationMetadata | string | null;
  created_at: string;
  updated_at: string;
}

interface PaginationInfo {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const WALLET_TYPES = [
  "wallet_transaction",
  "withdrawal_request",
  "withdrawal_process",
];
const PER_PAGE = 6;

// ── Helpers ───────────────────────────────────────────────────────────────────
const getNotificationIcon = (type: string) => {
  if (type === "new_order")
    return <ShoppingBag className="w-5 h-5 text-blue-500" />;
  if (type === "order_update")
    return <Package className="w-5 h-5 text-orange-500" />;
  if (type === "return_order" || type === "return_order_update")
    return <RotateCcw className="w-5 h-5 text-purple-500" />;
  if (WALLET_TYPES.includes(type))
    return <Wallet className="w-5 h-5 text-green-500" />;
  return <Bell className="w-5 h-5 text-gray-500" />;
};

const getIconBg = (type: string) => {
  if (type === "new_order") return "bg-blue-50 dark:bg-blue-500/10";
  if (type === "order_update") return "bg-orange-50 dark:bg-orange-500/10";
  if (type === "return_order" || type === "return_order_update")
    return "bg-purple-50 dark:bg-purple-500/10";
  if (WALLET_TYPES.includes(type)) return "bg-green-50 dark:bg-green-500/10";
  return "bg-gray-50 dark:bg-gray-500/10";
};

const formatTime = (dateStr: string) => {
  try {
    const now = Date.now();
    const past = new Date(dateStr).getTime();
    const diffSecs = Math.round((past - now) / 1000);
    const diffMins = Math.round(diffSecs / 60);
    const diffHours = Math.round(diffMins / 60);
    const diffDays = Math.round(diffHours / 24);
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    if (Math.abs(diffSecs) < 60) return rtf.format(diffSecs, "second");
    if (Math.abs(diffMins) < 60) return rtf.format(diffMins, "minute");
    if (Math.abs(diffHours) < 24) return rtf.format(diffHours, "hour");
    return rtf.format(diffDays, "day");
  } catch {
    return dateStr;
  }
};

// ── SWR fetcher ───────────────────────────────────────────────────────────────
const notificationsFetcher = async (key: string) => {
  const page = parseInt(key.split("?page=")[1] || "1");
  const response = await getNotifications({ page, per_page: PER_PAGE });
  if (response.success && response.data) {
    return {
      notifications: (response.data.notifications ?? []) as Notification[],
      pagination: response.data.pagination as PaginationInfo,
    };
  }
  throw new Error(response.message || "Failed to fetch notifications");
};

// ── Skeleton ──────────────────────────────────────────────────────────────────
const NotificationSkeleton = () => (
  <div className="flex items-start gap-4 p-4 rounded-xl bg-default-50 animate-pulse">
    <div className="w-10 h-10 rounded-full bg-default-200 flex-none" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-default-200 rounded w-3/4" />
      <div className="h-3 bg-default-200 rounded w-full" />
      <div className="h-3 bg-default-200 rounded w-1/3" />
    </div>
  </div>
);

// ── Notification Row ──────────────────────────────────────────────────────────
const NotificationItem: React.FC<{
  notification: Notification;
  onRead: (id: string) => void;
  onNavigate: (url: string) => void;
}> = ({ notification, onRead, onNavigate }) => {
  const redirectUrl = getNotificationRedirectUrl(
    notification.metadata as NotificationMetadata | undefined,
    notification.type,
  );
  const isClickable = Boolean(redirectUrl);

  const handleClick = () => {
    if (!notification.is_read) {
      onRead(notification.id);
    }
    if (redirectUrl) {
      onNavigate(redirectUrl);
    }
  };

  return (
      <button
        type="button"
        onClick={handleClick}
        disabled={!isClickable}
        className={`
          w-full text-left flex items-start gap-4 p-4 rounded-xl
          transition-all duration-200 border border-transparent
          ${
            notification.is_read
              ? "bg-default-50/50 dark:bg-default-100/20"
              : "bg-primary/5 dark:bg-primary/10 border-primary/10"
          }
          ${isClickable ? "cursor-pointer hover:scale-[1.005] hover:shadow-sm" : "cursor-default"}
        `}
      >
      {/* Type Icon */}
      <div
        className={`flex-none flex items-center justify-center w-10 h-10 rounded-full relative ${getIconBg(notification.type)}`}
      >
        {getNotificationIcon(notification.type)}
        {!notification.is_read && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white dark:border-black" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <p
            className={`text-sm leading-snug line-clamp-1 ${
              notification.is_read
                ? "font-normal text-default-700"
                : "font-semibold text-default-900"
            }`}
          >
            {notification.title}
          </p>
          {!notification.is_read && (
            <Chip
              size="sm"
              color="primary"
              variant="flat"
              className="flex-none h-5 text-[10px]"
            >
              New
            </Chip>
          )}
        </div>
        <p className="text-xs text-default-500 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-[11px] text-default-400 mt-1.5">
          {formatTime(notification.created_at)}
        </p>
      </div>

      {/* Arrow */}
      {isClickable && (
        <div className="flex-none self-center text-default-400">
          <ArrowRight className="w-4 h-4" />
        </div>
      )}
    </button>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────
const NotificationsPage: NextPageWithLayout = () => {
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(
    parseInt(router.query.page as string) || 1,
  );
  const [markingAll, setMarkingAll] = useState(false);

  // Keep page in sync with URL
  useEffect(() => {
    const page = parseInt(router.query.page as string) || 1;
    const timer = setTimeout(() => setCurrentPage(page), 0);
    return () => clearTimeout(timer);
  }, [router.query.page]);

  const swrKey = `/api/notifications?page=${currentPage}`;

  const {
    data,
    error,
    isLoading,
    mutate: revalidate,
  } = useSWR(swrKey, notificationsFetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 30000,
    errorRetryCount: 3,
    errorRetryInterval: 2000,
  });

  const notifications = data?.notifications ?? [];
  const pagination = data?.pagination;
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleNavigate = useCallback(
    (url: string) => {
      router.push(url);
    },
    [router],
  );

  const handleMarkRead = useCallback(
    async (id: string) => {
      // Optimistic update
      revalidate(
        (prev) =>
          prev
            ? {
                ...prev,
                notifications: prev.notifications.map((n) =>
                  n.id === id ? { ...n, is_read: true } : n,
                ),
              }
            : prev,
        false,
      );
      await markNotificationRead(id);
    },
    [revalidate],
  );

  const handleMarkAllRead = useCallback(async () => {
    setMarkingAll(true);
    // Optimistic update
    revalidate(
      (prev) =>
        prev
          ? {
              ...prev,
              notifications: prev.notifications.map((n) => ({
                ...n,
                is_read: true,
              })),
            }
          : prev,
      false,
    );
    await markAllNotificationsRead();
    setMarkingAll(false);
  }, [revalidate]);

  const handlePageChange = (page: number) => {
    router.push(
      {
        pathname: "/my-account/notifications",
        query: { ...router.query, page },
      },
      undefined,
      { shallow: true },
    );
  };

  // ── Render states ────────────────────────────────────────────────────────────
  const renderContent = () => {
    if (isLoading && !data) {
      return (
        <div className="space-y-3">
          {Array.from({ length: PER_PAGE }).map((_, i) => (
            <NotificationSkeleton key={i} />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
            <BellOff className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-default-500 text-sm text-center">
            Failed to load notifications.
          </p>
          <Button
            size="sm"
            variant="flat"
            color="danger"
            onPress={() => revalidate()}
          >
            Retry
          </Button>
        </div>
      );
    }

    if (!notifications.length) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-20 h-20 rounded-full bg-default-100 flex items-center justify-center">
            <Bell className="w-10 h-10 text-default-300" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-default-700 mb-1">
              No notifications yet
            </p>
            <p className="text-sm text-default-400">
              You&apos;re all caught up! Check back later.
            </p>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="space-y-2">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={handleMarkRead}
              onNavigate={handleNavigate}
            />
          ))}
        </div>

        {pagination && pagination.total > pagination.per_page && (
          <div className="mt-8 flex justify-center">
            <Pagination
              total={Math.ceil(pagination.total / pagination.per_page)}
              initialPage={pagination.current_page}
              page={currentPage}
              showControls
              size="sm"
              isCompact
              classNames={{
                item: "text-sm",
                cursor: "text-sm",
                next: "text-sm",
                prev: "text-sm",
              }}
              onChange={handlePageChange}
            />
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <PageHead pageTitle="Notifications" />
      <MyBreadcrumbs
        breadcrumbs={[
          { href: "/my-account", label: "My Account" },
          { href: "/my-account/notifications", label: "Notifications" },
        ]}
      />

      <UserLayout activeTab="notifications">
        <div className="w-full">
          <PageHeader
            title="Notifications"
            subtitle="Stay updated with your orders, wallet, and more"
            highlightText={
              unreadCount > 0 ? `${unreadCount} unread` : undefined
            }
          />

          <Card shadow="none" radius="sm" className="border border-default-100">
            <CardBody className="p-4">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-default-500" />
                  <span className="text-sm font-medium text-default-700">
                    {pagination?.total ?? notifications.length} Total
                  </span>
                  {unreadCount > 0 && (
                    <Chip size="sm" color="primary" variant="flat" classNames={{ base: "text-xs" }}>
                      {unreadCount} new
                    </Chip>
                  )}
                </div>

                {unreadCount > 0 && (
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    isDisabled={markingAll}
                    startContent={
                      markingAll ? (
                        <Spinner size="sm" />
                      ) : (
                        <CheckCheck className="w-4 h-4" />
                      )
                    }
                    onPress={handleMarkAllRead}
                    className="text-xs"
                  >
                    mark all read
                  </Button>
                )}
              </div>

              {renderContent()}
            </CardBody>
          </Card>
        </div>
      </UserLayout>
    </>
  );
};

export default NotificationsPage;
