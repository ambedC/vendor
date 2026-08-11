import { FC, useState } from "react";
import {
  Download,
  Package,
  Calendar,
  MapPin,
  CreditCard,
  Eye,
  Truck,
  Star,
  HandCoins,
  RotateCcw,
} from "lucide-react";
import {
  Accordion,
  AccordionItem,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Divider,
  Image,
  ScrollShadow,
  useDisclosure,
} from "@heroui/react";
import { Order } from "@/types/ApiResponse";
import {
  getFormattedDate,
  getOrderStatusBtnConfig,
  isStatusBeforeOrAt,
} from "@/helpers/getters";
import { useSettings } from "@/contexts/SettingsContext";
import { formatString } from "@/helpers/validator";
import { orderStatusColorMap } from "@/config/constants";
import CancelOrderItemModal from "@/components/Modals/CancelOrderItemModal";
import ReturnOrderItemModal from "@/components/Modals/ReturnOrderItemModal";
import RatingModal from "../Modals/RatingModal";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import Lightbox from "yet-another-react-lightbox";
import dynamic from "next/dynamic";
import { reorderOrder } from "@/routes/api";
import { addToast } from "@heroui/react";
import { updateCartData } from "@/helpers/updators";

const TrackOrderModal = dynamic(
  () => import("@/components/Modals/TrackOrderModal"),
  { ssr: false },
);

interface OrderCardProps {
  order: Order;
}

const OrderCard: FC<OrderCardProps> = ({ order }) => {
  const { currencySymbol } = useSettings();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<{ src: string }[]>([]);
  const [isReordering, setIsReordering] = useState(false);

  const { t } = useTranslation();
  const {
    isOpen: isTrackOpen,
    onClose: onTrackClose,
    onOpen: onTrackOpen,
  } = useDisclosure();
  const {
    isOpen: isReviewOpen,
    onClose: onReviewClose,
    onOpen: onReviewOpen,
  } = useDisclosure();

  const buttonConfig = getOrderStatusBtnConfig(order.status);

  const {
    isOpen: isCancelOpen,
    onClose: onCancelClose,
    onOpen: onCancelOpen,
  } = useDisclosure();

  const {
    isOpen: isReturnOpen,
    onClose: onReturnClose,
    onOpen: onReturnOpen,
  } = useDisclosure();

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

  return (
    <>
      <Card shadow="sm" radius="sm">
        <CardHeader className="flex flex-col justify-between w-full">
          <div className="flex items-start justify-between mb-3 w-full gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-md shrink-0">
                <Package className="w-4 h-4 text-foreground/50" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex gap-2 items-center flex-wrap">
                  <h3 className="font-semibold text-sm sm:text-medium text-foreground whitespace-nowrap">
                    {t("orderId", { id: order.id })}
                  </h3>
                  <Chip
                    size="sm"
                    radius="sm"
                    variant="flat"
                    color={orderStatusColorMap(order?.status)}
                    classNames={{
                      content: "text-xxs",
                      base: "p-0 hover:cursor-pointer shrink-0 max-w-full",
                    }}
                    title={formatString(order?.status)}
                  >
                    <span className="truncate">{formatString(order?.status)}</span>
                  </Chip>
                </div>

                {order.delivery_type !== "pickup" && order.shipping_address_1 && (
                  <div className="flex gap-1 items-center min-w-0">
                    <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-foreground/50 shrink-0" />
                    <a
                      href={`https://www.google.com/maps?q=${order.shipping_latitude},${order.shipping_longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={order.shipping_address_1}
                      className="text-xxs text-foreground/50 truncate hover:cursor-pointer"
                    >
                      {order.shipping_address_1}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              {buttonConfig.reorder && order.status == "delivered" && (
                <Button
                  size="sm"
                  variant="flat"
                  color="secondary"
                  className="min-w-8 h-8 w-8"
                  isIconOnly
                  onPress={handleReorder}
                  isLoading={isReordering}
                  title={t("reorder")}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}

              {order.status !== "cancelled" && (
                <Button
                  size="sm"
                  color="primary"
                  startContent={<Download className="w-4 h-4" />}
                  title={t("invoice")}
                  className="text-xs font-medium min-w-8 h-8 w-8"
                  isIconOnly
                  onPress={() => {
                    if (order.invoice) window.open(order.invoice, "_blank");
                  }}
                />
              )}
            </div>
          </div>

          <Divider className="mb-2 opacity-50" />

          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-foreground/50" />
              <div>
                <p className="text-xxs sm:text-xs text-foreground/50">
                  {t("date")}
                </p>
                <p className="text-xxs sm:text-xs font-medium text-foreground">
                  {getFormattedDate(order.created_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-foreground/50" />
              <div>
                <p className="text-xxs sm:text-xs text-foreground/50">
                  {t("finalTotal") || "Final Total"}
                </p>
                <p className="text-xs sm:text-sm font-semibold text-foreground">
                  {currencySymbol}
                  {order.final_total}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardBody className="pb-1 overflow-hidden">
          <div className="mb-4">
            <Accordion
              variant="light"
              className="px-0"
              itemClasses={{
                base: "px-0",
                title: "text-xs font-medium text-gray-900 dark:text-gray-100",
                trigger: "px-0 py-0 h-5",
                content: "px-0 pb-0",
                indicator: "text-gray-400 dark:text-gray-500",
              }}
            >
              <AccordionItem
                key="order-items"
                aria-label={t("itemsCount", {
                  count: order.items.length,
                })}
                title={t("itemsCount", { count: order.items.length })}
                startContent={
                  <Package className="w-4 h-4 text-foreground/50" />
                }
              >
                <ScrollShadow className="space-y-1.5 mt-2 w-full max-h-[200px]">
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-1.5 px-2.5 bg-gray-50 dark:bg-gray-700 rounded-md"
                    >
                      <div className="flex items-center flex-1 min-w-0 space-x-2">
                        {item.product?.image ? (
                          <Image
                            loading="lazy"
                            src={item.product.image}
                            alt={item?.product?.name || "Not Available"}
                            className="w-9 h-9 rounded-lg object-contain cursor-pointer"
                            radius="none"
                            onClick={() => {
                              setLightboxImages([{ src: item.product.image }]);
                              setLightboxOpen(true);
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-500">
                            {t("na")}
                          </div>
                        )}

                        <div className="max-w-[80%]">
                          <h3 className="font-medium text-xs mb-1">
                            <Link
                              title={item?.product?.name || ""}
                              href={`/products/${item?.product?.slug}`}
                              className="block truncate overflow-hidden text-ellipsis max-w-full hover:text-primary"
                            >
                              {item?.product?.name || t("na")}
                            </Link>

                            {item?.variant?.title && (
                              <div
                                title={item.variant.title || ""}
                                className="block truncate overflow-hidden text-ellipsis max-w-full text-xxs  text-foreground/50"
                              >
                                {item.variant.title}
                              </div>
                            )}
                          </h3>
                          <p className="text-xs text-foreground/50 -mt-1">
                            {currencySymbol}
                            {Number(item.price) +
                              Number(item.tax_amount)} × {item.quantity}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs font-semibold text-foreground/60 ml-2">
                        {currencySymbol}
                        {item.subtotal}
                      </p>
                    </div>
                  ))}
                </ScrollShadow>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="grid grid-cols-1 gap-2 mb-4">
            <div className="flex items-center justify-between">
              {order.delivery_type === "pickup" ? (
                <div className="flex items-center gap-1.5">
                  <Chip
                    size="sm"
                    radius="sm"
                    variant="flat"
                    color="secondary"
                    classNames={{
                      content: "text-xxs font-semibold",
                    }}
                  >
                    {t("cart.deliveryMode.pickup") || "Self Pick-Up"}
                  </Chip>
                </div>
              ) : (
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-foreground/50" />
                    <div className="flex gap-1 items-center">
                      <p className="text-xxs sm:text-xs text-foreground">
                        {t("estimatedDelivery")}
                      </p>
                      <p className="text-xxs sm:text-xs font-medium text-foreground">
                        {order.estimated_delivery_time &&
                        buttonConfig.deliveryTime
                          ? `${order.estimated_delivery_time} ${t("mins")}`
                          : t("na")}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                {order.payment_method == "cod" ? (
                  <HandCoins className="w-4 h-4 text-foreground/50" />
                ) : (
                  <CreditCard className="w-4 h-4 text-foreground/50" />
                )}
                <p className="text-xs text-foreground">
                  {order.payment_method}
                </p>
              </div>
            </div>
          </div>
        </CardBody>

        <CardFooter className="grid grid-cols-6 gap-2 w-full pt-0">
          <Button
            size="sm"
            variant="bordered"
            as={Link}
            href={`/my-account/orders/${order.slug}`}
            startContent={<Eye className="w-3 h-3" />}
            className="text-xs font-medium w-full col-span-2"
            title={t("details")}
          >
            {t("details")}
          </Button>

          {buttonConfig.trackOrder && order.delivery_type !== "pickup" && (
            <Button
              size="sm"
              variant="bordered"
              startContent={<Truck className="w-3 h-3" />}
              className="text-xs font-medium w-full col-span-2"
              onPress={onTrackOpen}
              title={t("track")}
            >
              {t("track")}
            </Button>
          )}

          {buttonConfig.cancelOrder &&
            order.items.some(
              (item) =>
                item.product?.is_cancelable &&
                (!item.product?.cancelable_till ||
                  isStatusBeforeOrAt(
                    order.status,
                    item.product.cancelable_till,
                  )),
            ) && (
              <Button
                size="sm"
                variant="bordered"
                startContent={<Package className="w-3 h-3" />}
                className="text-xs font-medium w-full col-span-2"
                onPress={onCancelOpen}
                title={t("cancel")}
              >
                {t("cancel")}
              </Button>
            )}

          {buttonConfig.returnOrder && order.delivery_type !== "pickup" &&
            order.items.some((item) => item.return_eligible) && (
              <Button
                size="sm"
                variant="bordered"
                startContent={<Package className="w-3 h-3" />}
                className="text-xs font-medium w-full col-span-2"
                onPress={onReturnOpen}
                title={t("return")}
              >
                {t("return")}
              </Button>
            )}

          {buttonConfig.review &&
            order.delivery_boy_id &&
            !order.is_delivery_feedback_given && (
              <Button
                size="sm"
                variant="bordered"
                startContent={<Star className="w-3 h-3" />}
                className="text-xs font-medium w-full col-span-2"
                onPress={onReviewOpen}
                title={t("deliveryReview")}
              >
                {t("deliveryReview")}
              </Button>
            )}

        </CardFooter>
      </Card>

      {buttonConfig.trackOrder && order.delivery_type !== "pickup" && (
        <TrackOrderModal
          isOpen={isTrackOpen}
          onClose={onTrackClose}
          order={order}
        />
      )}

      {buttonConfig.review && order.delivery_boy_id && (
        <RatingModal
          type="delivery"
          isOpen={isReviewOpen}
          onClose={onReviewClose}
          deliveryBoyId={order.delivery_boy_id}
          orderId={order.id}
        />
      )}

      {/* Cancel Order Items Modal */}
      <CancelOrderItemModal
        isOpen={isCancelOpen}
        onClose={onCancelClose}
        order={order}
        onItemCancelled={onCancelClose}
      />

      {buttonConfig.returnOrder && (
        <ReturnOrderItemModal
          isOpen={isReturnOpen}
          onClose={onReturnClose}
          order={order}
        />
      )}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={lightboxImages}
      />
    </>
  );
};

export default OrderCard;
