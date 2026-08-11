import OrderItemReviewCard from "@/components/Modals/OrderItemReviewCard";
import FilePreview from "@/components/FilePreview";
import { orderStatusColorMap } from "@/config/constants";
import { getOrderStatusBtnConfig, isStatusBeforeOrAt } from "@/helpers/getters";
import { formatString } from "@/helpers/validator";
import { Order, OrderItem } from "@/types/ApiResponse";
import { Button, Card, CardBody, CardHeader, Chip, Image } from "@heroui/react";
import { Package, ShoppingBag, Star, Truck, Info } from "lucide-react";
import Link from "next/link";
import React, { FC, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Lightbox from "yet-another-react-lightbox";

interface GroupedStore {
  store: OrderItem["store"];
  items: OrderItem[];
}

interface OrderItemsProps {
  order: Order;
  currencySymbol: string;
  onOpen: () => void;
  handleProductReview: (item: OrderItem) => void;
  onReturnOpen?: () => void;
  onCancelOpen?: () => void;
}

const OrderItems: FC<OrderItemsProps> = ({
  order,
  onOpen,
  currencySymbol,
  handleProductReview,
  onReturnOpen,
  onCancelOpen,
}) => {
  const buttonConfig = getOrderStatusBtnConfig(order.status);
  const { t } = useTranslation();

  const groupedItems = useMemo(() => {
    const grouped = order.items.reduce(
      (acc, item) => {
        const storeId = item.store.id;
        if (!acc[storeId]) {
          acc[storeId] = {
            store: item.store,
            items: [],
          };
        }
        acc[storeId].items.push(item);
        return acc;
      },
      {} as Record<number, GroupedStore>,
    );

    return Object.values(grouped);
  }, [order.items]);

  const ProductImageWithLightbox = ({
    src,
    alt,
  }: {
    src?: string | null;
    alt: string;
  }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!src) {
      return (
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-md object-cover shrink-0 bg-gray-100 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-[10px] px-2 text-gray-500 dark:text-gray-400 text-center">
          {alt || "N/A"}
        </div>
      );
    }

    return (
      <>
        <Image
          src={src}
          alt={alt}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-md object-cover shrink-0 cursor-pointer"
          onClick={() => setIsOpen(true)}
        />

        {isOpen && (
          <Lightbox
            open={isOpen}
            close={() => setIsOpen(false)}
            slides={[{ src }]}
          />
        )}
      </>
    );
  };

  return (
    <Card shadow="sm" radius="sm">
      <CardHeader className="pb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-3">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {t("orderItems")} ({order.items.length})
          </h3>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {buttonConfig.cancelOrder &&
            onCancelOpen &&
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
                variant="light"
                startContent={<Package className="w-3 h-3" />}
                className="text-xs h-6 sm:h-5"
                onPress={onCancelOpen}
                title={t("cancel")}
              >
                {t("cancel")}
              </Button>
            )}
          {order.delivery_type !== "pickup" && buttonConfig.trackOrder && (
            <Button
              size="sm"
              color="primary"
              variant="light"
              className="text-xs h-6 sm:h-5"
              onPress={onOpen}
              startContent={<Truck className="w-4 h-4" />}
              title={t("trackOrder")}
            >
              {t("trackOrder")}
            </Button>
          )}
          {order.delivery_type !== "pickup" && buttonConfig.returnOrder &&
            order.items.some((item) => item.return_eligible) &&
            onReturnOpen && (
              <Button
                size="sm"
                color="primary"
                variant="light"
                className="text-xs h-6 sm:h-5"
                onPress={onReturnOpen}
                startContent={<Package className="w-4 h-4" />}
                title={t("return")}
              >
                {t("return")}
              </Button>
            )}
        </div>
      </CardHeader>
      <CardBody className="pt-0">
        <div className="space-y-4">
          {groupedItems.map((group) => (
            <div
              key={group.store.id}
              className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
            >
              {/* Store Header */}
              <div className="mb-3 pb-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-wrap gap-2">
                <div className="flex flex-wrap items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                  <span>{t("soldBySection.storeLabel")}</span>
                  <Link
                    title={group.store.name}
                    href={`/stores/${group.store.slug}`}
                    className="font-semibold text-gray-900 dark:text-gray-100 hover:text-primary"
                  >
                    {group.store.name}
                  </Link>
                </div>
                {group.items.find(item => item.otp)?.otp && (
                  <Chip
                    size="sm"
                    color="default"
                    variant="bordered"
                    radius="sm"
                    title={group.items.find(item => item.otp)?.otp || undefined}
                    classNames={{
                      content: "text-xxs sm:text-xs cursor-pointer font-semibold",
                    }}
                  >
                    {t("otp") || "OTP"}: {group.items.find(item => item.otp)?.otp}
                  </Chip>
                )}
              </div>

              {/* Items in this store */}
              <div className="space-y-3">
                {group.items.map((item, itemIndex) => (
                  <div key={item.id}>
                    <div className="flex flex-row justify-between w-full gap-3 sm:gap-4">
                      {/* Product Image */}
                      <div className="shrink-0 self-start">
                        <ProductImageWithLightbox
                          src={item.product?.image}
                          alt={item.variant_title}
                        />
                      </div>

                      {/* Content Container */}
                      <div className="flex-1 min-w-0 space-y-3">
                        {/* Product Name and Variant */}
                        <div className="space-y-1">
                          <h3 className="font-medium text-sm">
                            {item.product?.slug ? (
                              <Link
                                title={item.product?.name || ""}
                                href={`/products/${item.product?.slug}`}
                                className="hover:text-blue-600 dark:hover:text-blue-400 wrap-break-word"
                              >
                                {item.product?.name || item.title}
                              </Link>
                            ) : (
                              <span title={item.title}>{item.title}</span>
                            )}
                          </h3>

                          {!(item as any)?.product && (
                            <p className="text-xxs sm:text-xs text-red-600 dark:text-red-400">
                              {item.title} product is deleted.
                            </p>
                          )}

                          <div className="flex flex-wrap gap-2 items-center">
                            {item.variant?.title && (
                              <div className="text-xxs sm:text-xs text-foreground/50">
                                {item.variant.title}
                              </div>
                            )}
                             {/* ADDONS LIST */}
                             {item.addons && item.addons.length > 0 && (
                               <div className="mt-1 w-full">
                                 <p className="text-[10px] font-bold text-foreground/60 uppercase">
                                   {t("addons") || "Addons"}:
                                 </p>
                                 <div className="text-[10px] text-foreground/40 leading-tight break-words flex flex-col gap-0.5 mt-0.5">
                                   {item.addons.map((addon: any, idx: number) => {
                                     const groupTitle =
                                       addon.group?.title ||
                                       addon.addon_group_name;
                                     const itemTitle =
                                       addon.item?.title || addon.title;
                                     const addonPrice = Number(
                                       addon.price || addon.item?.price || 0,
                                     );
                                     return (
                                       <span key={idx} className="block">
                                          {groupTitle ? `${groupTitle}: ` : ""}
                                          {itemTitle}
                                          <span className="ml-1 opacity-80 font-medium">
                                            ({item.quantity} × {currencySymbol}
                                            {addonPrice.toFixed(2)})
                                          </span>
                                        </span>
                                     );
                                   })}
                                 </div>
                               </div>
                             )}
                          </div>
                        </div>

                        {/* Price, Status and Review Row */}
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          {/* Price Info */}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                            <span className="text-gray-600 dark:text-gray-300">
                              {currencySymbol}
                              {Number(item.price) +
                                Number(item.tax_amount)} × {item.quantity}
                            </span>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {currencySymbol}
                              {item.subtotal}
                            </p>
                          </div>

                          {/* Status Chip */}
                          <Chip
                            size="sm"
                            color={orderStatusColorMap(item?.status)}
                            variant="flat"
                            radius="sm"
                            className="hover:cursor-pointer"
                            classNames={{ content: "text-xs" }}
                            title={formatString(item?.status)}
                          >
                            {formatString(item?.status)}
                          </Chip>
                        </div>

                        {/* Review Section */}
                        {item.status === "delivered" && (
                          <div className="pt-1">
                            {item.is_user_review_given ? (
                              <OrderItemReviewCard
                                userReview={item.user_review}
                              />
                            ) : (
                              <Button
                                onPress={() => handleProductReview(item)}
                                size="sm"
                                variant="flat"
                                color="warning"
                                className="text-xs h-7 px-3"
                                startContent={<Star size={12} />}
                                title={t("review")}
                              >
                                {t("review")}
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Attachments Section */}
                        {item.attachments && item.attachments.length > 0 && (
                          <FilePreview attachments={item.attachments} />
                        )}
                      </div>
                    </div>

                    {/* Divider between items */}
                    {itemIndex < group.items.length - 1 && (
                      <div className="my-3 border-t border-gray-200 dark:border-gray-700" />
                    )}
                  </div>
                ))}
              </div>

              {order.delivery_type === "pickup" && order.status === "delivered" && (
                <div className="mt-3 p-2 bg-default-100 rounded text-xxs sm:text-xs text-default-600 flex items-center gap-1.5 border border-default-200">
                  <Info className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>
                    {t("cart.pickup.return_notice") || "To return this item, please visit the store where the order was collected."}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};

export default OrderItems;
