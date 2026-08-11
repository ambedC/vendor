import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import RatingModal from "@/components/Modals/RatingModal";
import ReturnOrderItemModal from "@/components/Modals/ReturnOrderItemModal";
import { orderStatusColorMap } from "@/config/constants";
import { useSettings } from "@/contexts/SettingsContext";
import { formatString } from "@/helpers/validator";
import { getFormattedDate, getOrderStatusBtnConfig } from "@/helpers/getters";
import UserLayout from "@/layouts/UserLayout";
import { Order, OrderItem } from "@/types/ApiResponse";
import { Button, Chip, useDisclosure } from "@heroui/react";
import { ArrowLeft, Download, RotateCcw } from "lucide-react";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import OrderSummary from "./OrderSummary";
import PaymentInfo from "./PaymentInfo";
import DeliveryInfo from "./DeliveryInfo";
import ShippingInfo from "./ShippingInfo";
import OrderItems from "./OrderItems";
import OrderNote from "./OrderNote";
import SellerFeedbacks from "./SellerFeedbacks";
import PageHead from "@/SEO/PageHead";
import CancelOrderItemModal from "@/components/Modals/CancelOrderItemModal";
import { reorderOrder } from "@/routes/api";
import { addToast } from "@heroui/react";
import { updateCartData } from "@/helpers/updators";
import dynamic from "next/dynamic";

const TrackOrderModal = dynamic(
  () => import("@/components/Modals/TrackOrderModal"),
  { ssr: false },
);

interface OrderDetailPageViewProps {
  order: Order;
}

// OrderDetailPageView component
const OrderDetailPageView: React.FC<OrderDetailPageViewProps> = ({ order }) => {
  const { currencySymbol } = useSettings();
  const { t } = useTranslation();
  const router = useRouter();
  const { isOpen, onClose, onOpen } = useDisclosure();
  const {
    isOpen: isDeliveryRatingOpen,
    onClose: onDeliveryRatingClose,
    onOpen: onDeliveryRatingOpen,
  } = useDisclosure();

  const {
    isOpen: isOpenProductReview,
    onClose: onProductReviewClose,
    onOpen: onProductReviewOpen,
  } = useDisclosure();

  const {
    isOpen: isCancelOpen,
    onClose: onCancelClose,
    onOpen: onCancelOpen,
  } = useDisclosure();

  const buttonConfig = getOrderStatusBtnConfig(order.status);

  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<{
    sellerId: number | string;
    sellerName?: string;
    itemsID?: string[];
    existingReview?: {
      id?: number | string;
      rating?: number;
      title?: string;
      comment?: string;
      review_images?: string[];
    } | null;
  } | null>(null);

  const {
    isOpen: isSellerReviewOpen,
    onOpen: onSellerReviewOpen,
    onClose: onSellerReviewClose,
  } = useDisclosure();

  const {
    isOpen: isReturnOpen,
    onOpen: onReturnOpen,
    onClose: onReturnClose,
  } = useDisclosure();

  const [isReordering, setIsReordering] = useState(false);

  const handleReorder = async () => {
    try {
      setIsReordering(true);
      const response = await reorderOrder(order.id);
      if (response.success) {
        addToast({
          title:
            t("pages.ordersPage.reorderSuccess") || "Reordered successfully",
          color: "success",
        });
        await updateCartData(true, true);
      } else {
        addToast({
          title:
            response.message ||
            t("pages.ordersPage.reorderFailed") ||
            "Reorder failed",
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Reorder error:", error);
      addToast({
        title:
          t("pages.ordersPage.reorderFailed") ||
          "An error occurred during reorder",
        color: "danger",
      });
    } finally {
      setIsReordering(false);
    }
  };

  const handleProductReview = (item: OrderItem) => {
    setSelectedItem(item);
    onProductReviewOpen();
  };

  return (
    <>
      <MyBreadcrumbs
        breadcrumbs={[
          { href: "/my-account/orders", label: t("myOrders") },
          { href: "#", label: `${t("order")} #${order.id}` },
        ]}
      />
      <PageHead pageTitle={`${t("order")} #${order?.id || ""}`} />

      <UserLayout activeTab="orders">
        <div className="w-full mx-auto">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <Button
                isIconOnly
                variant="flat"
                color="default"
                size="sm"
                onPress={() => router.push("/my-account/orders")}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {t("order")} #{order.id}
                  </h1>
                  {order.delivery_type === "pickup" && (
                    <Chip
                      size="sm"
                      radius="sm"
                      variant="flat"
                      color="secondary"
                      className="text-xs font-semibold shrink-0"
                    >
                      {t("cart.deliveryMode.pickup") || "Self Pick-Up"}
                    </Chip>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("placedOn")} {getFormattedDate(order.created_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Chip
                color={orderStatusColorMap(order?.status)}
                variant="flat"
                size="sm"
                radius="sm"
                className="text-xs h-8 cursor-pointer"
                title={formatString(order?.status)}
              >
                {formatString(order?.status)}
              </Chip>

              {order.status !== "cancelled" && (
                <Button
                  color="primary"
                  variant="flat"
                  size="sm"
                  startContent={<Download className="w-4 h-4" />}
                  onPress={() => {
                    if (order.invoice) {
                      window.open(order.invoice, "_blank");
                    }
                  }}
                  title={t("invoice")}
                  className="text-xs"
                >
                  {t("invoice")}
                </Button>
              )}

              {order.status === "delivered" && buttonConfig.reorder && (
                <Button
                  color="primary"
                  variant="bordered"
                  size="sm"
                  startContent={<RotateCcw className="w-4 h-4" />}
                  onPress={handleReorder}
                  isLoading={isReordering}
                  title={t("reorder")}
                  className="text-xs"
                >
                  {t("reorder")}
                </Button>
              )}
            </div>
          </div>


          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Order Items & Details */}
            <div className="lg:col-span-2 space-y-4">
              {/* Order Items */}
              <OrderItems
                onOpen={onOpen}
                order={order}
                currencySymbol={currencySymbol}
                handleProductReview={handleProductReview}
                onReturnOpen={
                  buttonConfig.returnOrder ? onReturnOpen : undefined
                }
                onCancelOpen={
                  buttonConfig.cancelOrder ? onCancelOpen : undefined
                }
              />

              {/* Shipping Address */}
              <ShippingInfo order={order} />

              {/* Order Note */}
              <OrderNote order={order} />

              {/* Seller Feedbacks (grouped) */}
              {buttonConfig.review && (
                <SellerFeedbacks
                  seller_feedbacks={order.seller_feedbacks}
                  items={order.items}
                  onOpenReview={({
                    sellerId,
                    sellerName,
                    existingReview,
                    itemsID,
                  }) => {
                    setSelectedSeller({
                      sellerId,
                      sellerName,
                      existingReview,
                      itemsID,
                    });
                    onSellerReviewOpen();
                  }}
                />
              )}
            </div>

            {/* Right Column - Order Summary & Actions */}
            <div className="space-y-4">
              {/* Order Summary */}
              <OrderSummary currencySymbol={currencySymbol} order={order} />

              {/* Payment Information */}
              <PaymentInfo order={order} />

              {/* Delivery Information */}
              {order.delivery_type !== "pickup" && (
                <DeliveryInfo
                  order={order}
                  onDeliveryRatingOpen={onDeliveryRatingOpen}
                />
              )}
            </div>

            {buttonConfig.review && order.delivery_boy_id && (
              <RatingModal
                isOpen={isDeliveryRatingOpen}
                onClose={onDeliveryRatingClose}
                deliveryBoyId={order.delivery_boy_id}
                orderId={order.id}
                type="delivery"
                existingReview={
                  order.is_delivery_feedback_given && order.delivery_feedback
                    ? {
                        id: (order as any)?.delivery_feedback?.id,
                        rating: order.delivery_feedback.rating,
                        title: order.delivery_feedback.title,
                        comment: order.delivery_feedback.description,
                      }
                    : null
                }
              />
            )}
          </div>
        </div>
        {buttonConfig.trackOrder && (
          <TrackOrderModal isOpen={isOpen} onClose={onClose} order={order} />
        )}
        {/* Rating Modal */}
        {selectedItem && (
          <RatingModal
            isOpen={isOpenProductReview}
            onClose={() => {
              onProductReviewClose();
              setSelectedItem(null);
            }}
            productId={selectedItem.product_id}
            orderItemId={selectedItem.id}
            onSuccess={() => {}}
            type="product"
          />
        )}
        {/* Seller Rating Modal */}
        {selectedSeller && (
          <RatingModal
            isOpen={isSellerReviewOpen}
            onClose={() => {
              onSellerReviewClose();
              setSelectedSeller(null);
            }}
            type="seller"
            orderId={order.id}
            sellerId={selectedSeller.sellerId}
            sellerName={selectedSeller.sellerName}
            existingReview={selectedSeller.existingReview}
            onSuccess={() => {}}
            orderItemId={selectedSeller?.itemsID?.[0] || "0"}
          />
        )}
        {/* Return Order Items Modal */}
        {buttonConfig.returnOrder && (
          <ReturnOrderItemModal
            isOpen={isReturnOpen}
            onClose={onReturnClose}
            order={order}
          />
        )}
        <CancelOrderItemModal
          isOpen={isCancelOpen}
          onClose={onCancelClose}
          order={order}
          onItemCancelled={onCancelClose}
        />
      </UserLayout>
    </>
  );
};

export default OrderDetailPageView;
