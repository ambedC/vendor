import { FC, useMemo, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Divider,
  Avatar,
  ScrollShadow,
  Chip,
  addToast,
  Textarea,
  Form,
  Image as HeroImage,
} from "@heroui/react";
import { Undo2, UploadCloud, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { Order, OrderItem, OrderItemReturnRequest } from "@/types/ApiResponse";
import { cancelReturnReq, returnOrderItem } from "@/routes/api";
import { useSettings } from "@/contexts/SettingsContext";
import { orderStatusColorMap } from "@/config/constants";
import { formatString } from "@/helpers/validator";

interface ImagePreview {
  id: string;
  file: File;
  preview: string;
}

interface ReturnOrderItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onItemReturned?: (itemId: string | number) => void;
}

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

const ReturnOrderItemModal: FC<ReturnOrderItemModalProps> = ({
  isOpen,
  onClose,
  order,
  onItemReturned,
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { currencySymbol } = useSettings();

  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReturnRequestsModalOpen, setIsReturnRequestsModalOpen] =
    useState(false);
  const [cancellingOrderItemId, setCancellingOrderItemId] = useState<
    string | number | null
  >(null);

  const orderReturnRequests = useMemo<
    { item: OrderItem; request: OrderItemReturnRequest }[]
  >(() => {
    if (!order?.items?.length) {
      return [];
    }

    return order.items.flatMap((item) => {
      if (!Array.isArray(item.returns) || !item.returns.length) {
        return [];
      }

      return item.returns.map((request) => ({
        item,
        request,
      }));
    });
  }, [order]);

  const hasReturnRequests = orderReturnRequests.length > 0;

  const resetFormState = () => {
    setReason("");
    setImages([]);
    setErrors({});
    setIsSubmitting(false);
  };

  const closeReasonModal = () => {
    setIsReasonModalOpen(false);
    setSelectedItem(null);
    resetFormState();
  };

  const closeReturnRequestsModal = () => {
    setIsReturnRequestsModalOpen(false);
  };

  const handleModalClose = () => {
    closeReasonModal();
    closeReturnRequestsModal();
    onClose();
  };

  const handleSelectItem = (item: OrderItem) => {
    setSelectedItem(item);
    resetFormState();
    setIsReasonModalOpen(true);
  };

  const canReturnItem = (item: OrderItem) => {
    if (typeof item.return_eligible === "boolean") {
      return item.return_eligible;
    }

    const product = item.product as unknown;
    if (product && typeof product === "object") {
      const productRecord = product as Record<string, unknown>;
      if ("is_returnable" in productRecord) {
        return Boolean(productRecord["is_returnable"]);
      }
      if ("returnable_days" in productRecord) {
        const value = productRecord["returnable_days"];
        if (typeof value === "number") {
          return value > 0;
        }
      }
    }

    return false;
  };

  const hasExistingReturn = (item: OrderItem) => {
    return Array.isArray(item.returns) && item.returns.length > 0;
  };

  const getLatestReturnRequest = (item: OrderItem) => {
    if (!Array.isArray(item.returns) || !item.returns.length) {
      return undefined;
    }

    return item.returns[item.returns.length - 1];
  };

  type ChipColor =
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger";

  const getReturnStatusColor = (status?: string): ChipColor => {
    if (!status) return "default";

    const normalized = status.toLowerCase();
    const statusColorMap: Record<string, ChipColor> = {
      pending: "warning",
      requested: "warning",
      initiating: "warning",
      initiated: "warning",
      processing: "warning",
      reviewing: "warning",
      approved: "success",
      completed: "success",
      processed: "success",
      refunded: "success",
      resolved: "success",
      cancelled: "danger",
      canceled: "danger",
      declined: "danger",
      rejected: "danger",
      failed: "danger",
    };

    return statusColorMap[normalized] ?? "default";
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString();
  };

  const getReturnReason = (request?: OrderItemReturnRequest) => {
    if (!request?.reason) return "";

    return request.reason;
  };

  const getSellerComment = (request?: OrderItemReturnRequest) => {
    if (!request) return "";

    const possibleComments = [request.seller_comment];

    return (
      possibleComments.find(
        (entry) => typeof entry === "string" && entry.trim().length,
      ) || ""
    );
  };

  const getReturnAttachments = (request?: OrderItemReturnRequest) => {
    if (!request) return [];

    const candidates = [request.images];
    const attachmentList = candidates.find(
      (candidate) => Array.isArray(candidate) && candidate.length,
    );

    if (!attachmentList) return [];

    return attachmentList
      .map((value) => (typeof value === "string" ? value : ""))
      .filter(Boolean);
  };

  const canCancelReturnRequest = (request?: OrderItemReturnRequest) => {
    if (!request) return false;

    const status = (request.return_status || request.return_status || "")
      .toString()
      .toLowerCase();

    if (!status) return true;

    const terminalStatuses = new Set([
      "cancelled",
      "canceled",
      "declined",
      "rejected",
      "completed",
      "approved",
      "processed",
      "refunded",
      "closed",
      "resolved",
      "failed",
      "seller_approved",
      "picked_up",
    ]);

    return !terminalStatuses.has(status);
  };

  const handleCancelReturnRequest = async (orderItemId: string | number) => {
    setCancellingOrderItemId(orderItemId);

    try {
      const response = await cancelReturnReq({
        orderItemId: String(orderItemId),
      });

      if (response.success) {
        addToast({
          title: t("return_request_cancelled") || "Return request cancelled",
          description:
            response.message ||
            t("return_request_cancelled_desc") ||
            "Your return request has been cancelled successfully.",
          color: "success",
        });
        router.replace(router.asPath);
      } else {
        addToast({
          title:
            t("return_request_cancel_failed") || "Unable to cancel request",
          description:
            response.message ||
            t("something_went_wrong") ||
            "Something went wrong, please try again.",
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Cancel return error:", error);
      addToast({
        title: t("return_request_cancel_failed") || "Unable to cancel request",
        description:
          t("network_error_description") ||
          "Please check your internet connection and try again.",
        color: "danger",
      });
    } finally {
      setCancellingOrderItemId(null);
      router.push("/my-account/orders", undefined, { scroll: false });
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    if (images.length + files.length > MAX_IMAGES) {
      addToast({
        title: t("image_limit_exceeded"),
        description: t("maximum_5_images_allowed"),
        color: "warning",
      });
      event.target.value = "";
      return;
    }

    files.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        addToast({
          title: t("invalid_file_type"),
          description: t("only_images_allowed"),
          color: "danger",
        });
        return;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        addToast({
          title: t("file_too_large"),
          description: t("image_size_limit_5mb"),
          color: "danger",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setImages((prev) => [
          ...prev,
          {
            id:
              Date.now().toString(36) + Math.random().toString(36).slice(2, 9),
            file,
            preview: loadEvent.target?.result as string,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    event.target.value = "";
  };

  const removeImage = (imageId: string) => {
    setImages((prev) => prev.filter((image) => image.id !== imageId));
  };

  const handleSubmitReturn = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!selectedItem) return;

    setIsSubmitting(true);
    try {
      const response = await returnOrderItem({
        orderItemId: String(selectedItem.id),
        reason: reason.trim(),
        images: images.map((image) => image.file),
      });

      if (response.success) {
        addToast({
          title: t("return_request_submitted") || "Return request submitted",
          description:
            response.message ||
            t("return_request_success_msg") ||
            "Your return request has been submitted successfully.",
          color: "success",
        });
        onItemReturned?.(selectedItem.id);
        closeReasonModal();
        onClose();
        router.push(router.asPath);
      } else {
        addToast({
          title: t("return_request_failed") || "Return request failed",
          description:
            response.message ||
            t("something_went_wrong") ||
            "Something went wrong, please try again.",
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Return item error:", error);
      addToast({
        title: t("return_request_failed") || "Return request failed",
        description:
          t("network_error_description") ||
          "Please check your internet connection and try again.",
        color: "danger",
      });
    } finally {
      setIsSubmitting(false);
      router.push("/my-account/orders", undefined, { scroll: false });
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleModalClose}
        size="lg"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-2 p-4">
            <h3 className="text-medium font-semibold text-foreground">
              {t("return_items") || "Return items"}
            </h3>
            <p className="text-xs text-foreground/50">
              {t("return_items_desc") || "Select the items you want to return."}
            </p>
          </ModalHeader>

          <Divider />

          <ModalBody className="px-2 py-4">
            <ScrollShadow className="space-y-2 w-full h-full max-h-[50vh] ">
              {order.items && order.items.length ? (
                order.items.map((item) => {
                  const isReturnable = canReturnItem(item);
                  const alreadyReturned = hasExistingReturn(item);
                  const disableAction = !isReturnable || alreadyReturned;
                  const productName = item.product?.name || item.variant_title;
                  const productSlug = item.product?.slug;
                  const return_deadline = item.return_deadline
                    ? new Date(item.return_deadline).toLocaleString()
                    : t("na");
                  const latestReturnRequest = getLatestReturnRequest(item);
                  const latestReason = getReturnReason(latestReturnRequest);
                  const sellerComment = getSellerComment(latestReturnRequest);
                  const latestStatus = latestReturnRequest?.return_status;
                  const latestUpdatedOn = latestReturnRequest
                    ? formatDateTime(
                        latestReturnRequest.updated_at ||
                          latestReturnRequest.created_at,
                      )
                    : "";
                  const recentReturnStatus =
                    item.returns?.[0]?.return_status || "";

                  // Calculate price with tax per unit
                  const priceWithTax =
                    parseFloat(item.price) + parseFloat(item.tax_amount);

                  const itemSubtotal = item.subtotal;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-md p-2"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          size="sm"
                          src={item.product?.image || undefined}
                          alt={item.product?.name || "item"}
                        />
                        <div className="min-w-0">
                          {productSlug ? (
                            <Link
                              href={`/products/${productSlug}`}
                              title={productName}
                              className="text-xs font-medium text-foreground truncate"
                            >
                              {productName}
                            </Link>
                          ) : (
                            <span
                              title={productName}
                              className="text-xs font-medium text-foreground truncate"
                            >
                              {productName || t("na")}
                            </span>
                          )}
                          <div className="text-xxs text-foreground/50 flex flex-col gap-0.5">
                            <div className="flex gap-2 flex-wrap">
                              <span>
                                {t("qty")}: {item.quantity}
                              </span>
                              <span>
                                {t("unit_price")}: {currencySymbol}
                                {priceWithTax.toFixed(2)}
                              </span>
                            </div>
                            <div className="text-primary font-semibold">
                              {t("subtotal")}: {currencySymbol}
                              {itemSubtotal}
                            </div>
                          </div>
                          {item.addons && item.addons.length > 0 && (
                            <div className="mt-2 w-full">
                              <p className="text-[10px] font-bold text-foreground/60 uppercase">
                                {t("addons") || "Addons"}:
                              </p>
                              <div className="text-[10px] text-foreground/40 leading-tight flex flex-col gap-1 mt-1">
                                {item.addons.map((addon: any, i: number) => {
                                  const addonPrice = Number(
                                    addon.price || addon.item?.price || 0,
                                  );
                                  const groupTitle =
                                    addon.group?.title ||
                                    addon.addon_group_name;
                                  const itemTitle =
                                    addon.title || addon.item?.title;
                                  return (
                                    <div key={i} className="flex items-center">
                                      {groupTitle ? `${groupTitle}: ` : ""}
                                      {itemTitle}
                                      <span className="ml-1 opacity-80 font-medium">
                                        ({item.quantity} × {currencySymbol}
                                        {addonPrice.toFixed(2)})
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          {item.return_deadline && (
                            <span className="text-foreground/40 text-xxs block mt-1">
                              {t("return_by") || "Return by"}: {return_deadline}
                            </span>
                          )}
                        </div>

                        {alreadyReturned && (
                          <div className="mt-1 space-y-1 text-xxs text-foreground/60">
                            {latestStatus && (
                              <p className="text-foreground">
                                <span className="font-semibold">
                                  {t("status") || "Status"}:
                                </span>{" "}
                                <span className="font-bold">
                                  {formatString(latestStatus)}
                                </span>
                                {latestUpdatedOn
                                  ? ` · ${latestUpdatedOn}`
                                  : ""}
                              </p>
                            )}
                            {latestReason && (
                              <p>
                                <span className="font-semibold">
                                  {t("reason")}:
                                </span>{" "}
                                {latestReason}
                              </p>
                            )}
                            {sellerComment && (
                              <p>
                                <span className="font-semibold">
                                  {t("seller_comment") || "Seller comment"}:
                                </span>{" "}
                                {sellerComment}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {alreadyReturned ? (
                          <Chip
                            size="sm"
                            radius="sm"
                            variant="flat"
                            color="success"
                            classNames={{ content: "text-xxs", base: "p-0" }}
                          >
                            {formatString(recentReturnStatus || "")}
                          </Chip>
                        ) : disableAction ? (
                          <Chip
                            size="sm"
                            radius="sm"
                            variant="flat"
                            color="default"
                            classNames={{ content: "text-xxs", base: "p-0" }}
                          >
                            {t("na")}
                          </Chip>
                        ) : (
                          <Button
                            size="sm"
                            variant="bordered"
                            color="primary"
                            className="text-xs"
                            startContent={<Undo2 className="w-3 h-3" />}
                            onPress={() => handleSelectItem(item)}
                          >
                            {t("return")}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-foreground/50">
                  {t("no_items")}
                </div>
              )}
            </ScrollShadow>
          </ModalBody>

          <Divider />

          <ModalFooter>
            {hasReturnRequests && (
              <Button
                size="sm"
                color="primary"
                variant="light"
                className="text-xs"
                onPress={() => setIsReturnRequestsModalOpen(true)}
              >
                {t("view_return_requests") || "See return requests"}
                {hasReturnRequests ? ` (${orderReturnRequests.length})` : ""}
              </Button>
            )}
            <Button
              size="sm"
              color="default"
              variant="bordered"
              className="text-xs"
              onPress={handleModalClose}
            >
              {t("close")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isReasonModalOpen && !!selectedItem}
        onClose={closeReasonModal}
        size="lg"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 pb-0">
            <h3 className="text-medium font-semibold text-foreground">
              {t("return_reason_title") || "Tell us why you are returning"}
            </h3>
            <p className="text-xs text-foreground/50">
              {t("return_reason_subtitle") ||
                "Add details to help us process your return faster."}
            </p>
          </ModalHeader>
          <Form onSubmit={handleSubmitReturn} className="w-full">
            <ModalBody className="pt-4 pb-2 space-y-5 w-full">
              {selectedItem && (
                <div className="flex items-center gap-3 bg-default-100/60 dark:bg-default-50/20 rounded-md p-3">
                  <Avatar
                    size="sm"
                    src={selectedItem.product.image || undefined}
                    alt={selectedItem.product.name || "item"}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {selectedItem.product.name ||
                        selectedItem.variant_title ||
                        ""}
                    </p>
                    <p className="text-xxs text-foreground/60">
                      {t("qty")}: {selectedItem.quantity} · {t("price")}:{" "}
                      {currencySymbol}
                      {selectedItem.price}
                    </p>
                  </div>
                  <Chip
                    size="sm"
                    radius="sm"
                    variant="flat"
                    color={orderStatusColorMap(selectedItem.status)}
                    classNames={{ content: "text-xxs", base: "p-0 ml-auto" }}
                  >
                    {formatString(selectedItem.status)}
                  </Chip>
                </div>
              )}

              <Textarea
                isRequired
                label={t("reason")}
                placeholder={
                  t("return_reason_placeholder") ||
                  "Describe the reason for return"
                }
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  if (errors.reason) {
                    setErrors((prev) => ({ ...prev, reason: "" }));
                  }
                }}
                errorMessage={t("return_reason_required")}
                minRows={3}
                maxRows={6}
                classNames={{
                  input: "text-sm",
                  label: "text-sm font-medium",
                  errorMessage: "text-xs",
                }}
              />

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">
                    {t("add_photos") || "Add photos"} {t("optional")}
                  </p>
                  <span className="text-xs text-foreground/60">
                    {images.length}/{MAX_IMAGES} {t("images") || "images"}
                  </span>
                </div>

                {images.length < MAX_IMAGES && (
                  <label
                    htmlFor="return-image-upload"
                    className="flex items-center gap-3 px-4 py-2 border-2 border-dashed border-default-300 rounded-lg cursor-pointer hover:border-primary-300 hover:bg-primary-50 transition-colors text-sm text-default-600"
                  >
                    <UploadCloud className="w-5 h-5 text-default-500" />
                    <span>
                      {t("upload_supporting_photos") ||
                        "Upload supporting photos"}
                    </span>
                    <input
                      id="return-image-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                )}

                {images.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                    {images.map((image) => (
                      <div key={image.id} className="relative group">
                        <div className="aspect-square rounded-md overflow-hidden bg-default-100">
                          <HeroImage
                            removeWrapper
                            disableAnimation
                            src={image.preview}
                            alt="Return evidence"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(image.id)}
                          className="absolute z-20 -top-2 -right-2 cursor-pointer w-6 h-6 bg-danger-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger-600"
                          aria-label={t("remove_image") || "Remove image"}
                        >
                          <X size={14} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xxs text-foreground/50">
                  {t("max_5_images_5mb_each")}
                </p>
              </div>
            </ModalBody>

            <Divider />

            <ModalFooter className="pt-4">
              <Button
                variant="flat"
                onPress={closeReasonModal}
                className="text-sm"
                isDisabled={isSubmitting}
              >
                {t("cancel")}
              </Button>
              <Button
                color="primary"
                type="submit"
                isLoading={isSubmitting}
                className="text-sm font-medium px-6"
              >
                {isSubmitting
                  ? t("submitting")
                  : t("submit_request") || "Submit request"}
              </Button>
            </ModalFooter>
          </Form>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isReturnRequestsModalOpen}
        onClose={closeReturnRequestsModal}
        size="lg"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 pb-0">
            <h3 className="text-medium font-semibold text-foreground">
              {t("return_requests_title") || "Return requests"}
            </h3>
            <p className="text-xs text-foreground/50">
              {t("return_requests_subtitle") ||
                "Track existing return requests and cancel if needed."}
            </p>
          </ModalHeader>
          <ModalBody className="pt-4 pb-2">
            {hasReturnRequests ? (
              <ScrollShadow className="space-y-4 pr-1 max-h-[60vh]">
                {orderReturnRequests.map(({ item, request }, index) => {
                  const requestKey =
                    request.id ??
                    `${item.id}-${index}-${request?.return_status || "request"}`;
                  const reason = getReturnReason(request);
                  const sellerComment = getSellerComment(request);
                  const attachments = getReturnAttachments(request);
                  const timelineLabel = formatDateTime(
                    request.updated_at || request.created_at,
                  );
                  const sellerApproveAt = formatDateTime(
                    request.seller_approved_at,
                  );
                  const isCancelable = canCancelReturnRequest(request);
                  const isCancelling = cancellingOrderItemId === item.id;
                  const return_status = request?.return_status || "";

                  return (
                    <div
                      key={requestKey}
                      className="border border-default-200 dark:border-default-100 rounded-lg p-3 flex flex-col gap-3 bg-default-50/60 dark:bg-default-50/20"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar
                          size="sm"
                          src={item.product?.image || undefined}
                          alt={item.product?.name || "item"}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {item.product?.name || item.variant_title || ""}
                          </p>
                          <p className="text-xxs text-foreground/60 flex flex-wrap gap-2">
                            <span>
                              {t("qty")}: {item.quantity}
                            </span>
                            <span>
                              {t("price")}: {currencySymbol}
                              {item.price}
                            </span>
                            {timelineLabel && (
                              <span>
                                {t("last_updated") || "Last updated"}:{" "}
                                {timelineLabel}
                              </span>
                            )}
                          </p>
                        </div>
                        {return_status && (
                          <Chip
                            size="sm"
                            radius="sm"
                            variant="flat"
                            color={getReturnStatusColor(
                              (return_status as string) || "",
                            )}
                            classNames={{ content: "text-xxs", base: "p-0" }}
                          >
                            {formatString(return_status || "")}
                          </Chip>
                        )}
                      </div>

                      <div className="space-y-1 text-xxs text-foreground/70">
                        {reason && (
                          <p>
                            <span className="font-semibold">
                              {t("reason")}:
                            </span>{" "}
                            {reason}
                          </p>
                        )}
                        {sellerComment && (
                          <p className="flex gap-1 items-center">
                            <span className="font-semibold">
                              {t("seller_comment") || "Seller comment"}:
                            </span>
                            <span>{sellerComment}</span>
                          </p>
                        )}

                        {requestKey && (
                          <p className="text-foreground/50">
                            <span className="font-semibold">
                              {t("reference") || "Reference"}:
                            </span>{" "}
                            {request.id || requestKey}
                          </p>
                        )}
                      </div>

                      {attachments.length > 0 && (
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                          {attachments.map((attachment, idx) => (
                            <div
                              key={`${requestKey}-${idx}`}
                              className="aspect-square rounded-md overflow-hidden bg-default-100"
                            >
                              <HeroImage
                                removeWrapper
                                disableAnimation
                                src={attachment}
                                alt={t("return_evidence") || "Return evidence"}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        {sellerApproveAt ? (
                          <p className="text-xxs text-foreground/50">
                            {"Seller Approve at"}: {sellerApproveAt}
                          </p>
                        ) : null}

                        {isCancelable && (
                          <Button
                            size="sm"
                            variant="bordered"
                            color="danger"
                            className="text-xs"
                            onPress={() => handleCancelReturnRequest(item.id)}
                            isLoading={isCancelling}
                          >
                            {t("cancel_request") || "Cancel request"}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </ScrollShadow>
            ) : (
              <div className="text-sm text-foreground/60 text-center py-6">
                {t("no_return_requests") || "No return requests yet."}
              </div>
            )}
          </ModalBody>
          <Divider />
          <ModalFooter>
            <Button
              size="sm"
              variant="bordered"
              className="text-xs"
              onPress={closeReturnRequestsModal}
            >
              {t("close")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ReturnOrderItemModal;
