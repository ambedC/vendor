// Top imports
import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Form,
  Tooltip,
  addToast,
  Image,
} from "@heroui/react";
import {
  giveDeliveryBoyReview,
  updateDeliveryBoyReview,
  giveProductReview,
  updateProductReview,
  giveOrderItemSellerReview,
  updateOrderItemSellerReview,
} from "@/routes/api";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/router";
import { urlToFile } from "@/helpers/functionalHelpers";

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: string | number;
  orderItemId?: string | number;
  onSuccess?: () => void;
  type?: "delivery" | "product" | "seller";
  deliveryBoyId?: string | number;
  orderId?: string | number;
  sellerId?: string | number;
  // optional seller name to show when rating a seller
  sellerName?: string;
  // optional existing review when editing
  existingReview?: {
    id?: string | number;
    rating?: number;
    title?: string;
    comment?: string;
    review_images?: string[];
  } | null;
}

type RatingConfig = {
  emoji: string;
  label: string;
  description: string;
  color: string;
};

interface ImagePreview {
  file: File;
  preview: string;
  id: string;
}

// RatingModal component
const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  productId,
  onSuccess,
  type = "product",
  deliveryBoyId,
  orderId,
  sellerId,
  sellerName,
  existingReview,
  orderItemId = null,
}) => {
  const { t } = useTranslation();
  const router = useRouter();

  const [rating, setRating] = useState<number>(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [images, setImages] = useState<ImagePreview[]>([]);
  // when editing, prefill form from existingReview when modal opens
  useEffect(() => {
    if (isOpen && existingReview) {
      setRating(existingReview.rating || 0);
      setTitle(existingReview.title || "");
      setComment(
        (existingReview as any)?.description || existingReview.comment || ""
      );
    }
    if (!isOpen) {
      // reset when modal closes
      setRating(0);
      setTitle("");
      setComment("");
      setImages([]);
      setErrors({});
    }
    // only run when isOpen changes
  }, [isOpen, existingReview]);

  useEffect(() => {
    const preselectedImages = existingReview?.review_images || [];
    const loadPreselectedImages = async () => {
      if (
        isOpen &&
        type === "product" &&
        preselectedImages &&
        preselectedImages.length > 0
      ) {
        setImages([]); // Clear existing images first

        const loadedImages: ImagePreview[] = [];

        for (let i = 0; i < Math.min(preselectedImages.length, 5); i++) {
          const url = preselectedImages[i];
          try {
            // Extract filename from URL or generate one
            const filename = url.split("/").pop() || `image_${i + 1}.jpg`;
            const file = await urlToFile(url, filename);

            const newImage: ImagePreview = {
              file,
              preview: url, // Use the original URL for preview
              id:
                Date.now().toString() +
                Math.random().toString(36).substr(2, 9) +
                i,
            };

            loadedImages.push(newImage);
          } catch (error) {
            console.error(`Failed to load preselected image ${i}:`, error);
            addToast({
              title: t("image_load_failed"),
              description: t("could_not_load_some_images"),
              color: "warning",
            });
          }
        }

        if (loadedImages.length > 0) {
          setImages(loadedImages);
        }
      }
    };

    loadPreselectedImages();
  }, [isOpen, type, existingReview, t]);

  const ratingConfig: RatingConfig[] = [
    {
      emoji: "😞",
      label: t("very_bad"),
      description: t("terrible_experience"),
      color: "text-red-500",
    },
    {
      emoji: "😕",
      label: t("bad"),
      description: t("poor_quality"),
      color: "text-orange-500",
    },
    {
      emoji: "😐",
      label: t("good"),
      description: t("its_okay"),
      color: "text-yellow-500",
    },
    {
      emoji: "😊",
      label: t("very_good"),
      description: t("great_experience"),
      color: "text-lime-500",
    },
    {
      emoji: "🤩",
      label: t("excellent"),
      description: t("outstanding_quality"),
      color: "text-green-500",
    },
  ];

  const handleRatingSelect = (ratingValue: number) => {
    setRating(ratingValue);
    if (errors.rating) setErrors((prev) => ({ ...prev, rating: "" }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (images.length + files.length > 5) {
      addToast({
        title: t("image_limit_exceeded"),
        description: t("maximum_5_images_allowed"),
        color: "warning",
      });
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

      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        addToast({
          title: t("file_too_large"),
          description: t("image_size_limit_5mb"),
          color: "danger",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const newImage: ImagePreview = {
          file,
          preview: event.target?.result as string,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        };
        setImages((prev) => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input value to allow re-selecting the same file
    e.target.value = "";
  };

  const removeImage = (imageId: string) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (rating === 0) newErrors.rating = t("select_rating");
    if (!title.trim()) newErrors.title = t("review_title_required");
    if (!comment.trim()) newErrors.comment = t("review_comment_required");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClose = () => {
    setRating(0);
    setTitle("");
    setComment("");
    setErrors({});
    setHoveredRating(0);
    setImages([]);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      let response;
      if (type === "delivery") {
        // create vs update for delivery review
        if (existingReview && existingReview.id) {
          response = await updateDeliveryBoyReview({
            id: existingReview.id,
            rating,
            title: title.trim(),
            description: comment.trim(),
          });
        } else {
          response = await giveDeliveryBoyReview({
            order_id: orderId,
            rating,
            title: title.trim(),
            description: comment.trim(),
            delivery_boy_id: deliveryBoyId,
          });
        }
      } else if (type === "seller") {
        // seller review
        if (existingReview && existingReview.id) {
          response = await updateOrderItemSellerReview({
            id: existingReview.id,
            rating,
            title: title.trim(),
            description: comment.trim(),
          });
        } else {
          response = await giveOrderItemSellerReview({
            seller_id: sellerId,
            order_id: typeof orderId === "string" ? Number(orderId) : orderId,
            rating,
            title: title.trim(),
            description: comment.trim(),
            order_item_id: orderItemId?.toString(),
          });
        }
      } else {
        // If existingReview present -> update, otherwise create
        if (existingReview && existingReview.id) {
          // update review (allow adding new images)
          response = await updateProductReview({
            id: existingReview.id,
            rating,
            title: title.trim(),
            comment: comment.trim(),
            images: images.map((img) => img.file),
          });
        } else {
          // create new product review
          response = await giveProductReview({
            product_id: productId,
            rating,
            title: title.trim(),
            comment: comment.trim(),
            images: images.map((img) => img.file),
            order_item_id: orderItemId ? orderItemId : undefined,
          });
        }
      }

      if (response.success) {
        onSuccess?.();
        handleClose();
        router.push(router.asPath, undefined, { scroll: false });
        addToast({
          title: t("review_submitted"),
          description: t("review_posted_successfully"),
          color: "success",
        });
      } else {
        addToast({
          title: t("submission_failed"),
          description: response.message || t("review_submission_failed"),
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      setErrors({ submit: t("review_submission_failed") });
      addToast({
        title: t("network_error"),
        description: t("network_error_description"),
        color: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentRating = hoveredRating || rating;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="2xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 pb-2">
          <h3 className="text-medium font-bold text-foreground">
            {t("rate_your_experience")}
          </h3>
          {/* show seller name when rating a seller for clarity */}
          {type === "seller" && sellerName ? (
            <p className="text-sm text-foreground/80 font-semibold">
              {sellerName}
            </p>
          ) : (
            <p className="text-xs text-foreground/50 font-normal">
              {t("share_your_thoughts")}
            </p>
          )}
        </ModalHeader>
        <Form onSubmit={handleSubmit} validationBehavior="native">
          <ModalBody className="gap-6 w-full">
            <div className="flex flex-col items-center gap-4 w-full">
              <h6 className="text-sm sm:text-medium md:text-lg font-medium text-foreground">
                {t("how_would_you_rate", { type })}
              </h6>
              <div className="flex gap-2">
                {ratingConfig.map((config, index) => {
                  const ratingValue = index + 1;
                  const isActive = ratingValue <= currentRating;
                  const isSelected = ratingValue === rating;

                  return (
                    <Tooltip key={index} content={config.label} showArrow>
                      <button
                        type="button"
                        onClick={() => handleRatingSelect(ratingValue)}
                        onMouseEnter={() => setHoveredRating(ratingValue)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className={`relative p-2 rounded-full transition-all duration-200 ease-out
                          hover:scale-110 active:scale-95
                          ${isSelected ? "bg-primary-100 shadow-lg" : "hover:bg-default-100"}
                          ${isActive ? "opacity-100" : "opacity-40 hover:opacity-70"}`}
                      >
                        <span
                          className={`text-2xl transition-all duration-200 ${isActive ? "filter-none" : "grayscale"} ${isSelected ? "animate-pulse" : ""}`}
                        >
                          {config.emoji}
                        </span>
                      </button>
                    </Tooltip>
                  );
                })}
              </div>
              {errors.rating && (
                <p className="text-danger-500 text-sm">{errors.rating}</p>
              )}
            </div>

            <div className="flex flex-col gap-4 w-full">
              <Input
                isRequired
                label={t("review_title")}
                placeholder={t("review_title_placeholder")}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title)
                    setErrors((prev) => ({ ...prev, title: "" }));
                }}
                errorMessage={errors.title}
                classNames={{ input: "text-sm", label: "text-sm font-medium" }}
              />

              <Textarea
                isRequired
                label={t("your_review")}
                placeholder={t("your_review_placeholder", { type })}
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  if (errors.comment)
                    setErrors((prev) => ({ ...prev, comment: "" }));
                }}
                errorMessage={errors.comment}
                minRows={3}
                maxRows={6}
                classNames={{ input: "text-sm", label: "text-sm font-medium" }}
              />
            </div>

            {/* Image Upload Section - Only for Product Reviews */}
            {type === "product" && (
              <div className="flex flex-col gap-4 w-full">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    {t("add_photos")} {t("optional")}
                  </label>
                  <span className="text-xs text-foreground/60">
                    {images.length}/5 {t("images")}
                  </span>
                </div>

                {/* Image Upload Button */}
                {images.length < 5 && (
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-default-300 rounded-lg cursor-pointer hover:border-primary-300 hover:bg-primary-50 transition-colors"
                    >
                      <svg
                        className="w-5 h-5 text-default-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      <span className="text-sm text-default-600">
                        {t("add_photos")}
                      </span>
                    </label>
                    <p className="text-xs text-default-500">
                      {t("max_5_images_5mb_each")}
                    </p>
                  </div>
                )}

                {/* Image Previews */}
                {images.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                    {images.map((image) => (
                      <div key={image.id} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-default-100">
                          <Image
                            removeWrapper
                            disableAnimation
                            src={image.preview}
                            alt="Review image preview"
                            className="w-full h-full object-cover relative"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(image.id)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-danger-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger-600 z-50 cursor-pointer"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {errors.submit && (
              <div className="p-3 rounded-lg bg-danger-50 border border-danger-200">
                <p className="text-danger-600 text-sm">{errors.submit}</p>
              </div>
            )}
          </ModalBody>

          <ModalFooter className="pt-6 w-full">
            <Button
              variant="flat"
              onPress={handleClose}
              className="font-medium"
              isDisabled={isSubmitting}
            >
              {t("cancel")}
            </Button>
            <Button
              color="primary"
              type="submit"
              isLoading={isSubmitting}
              className="font-medium px-6"
            >
              {isSubmitting ? t("submitting") : t("submit_review")}
            </Button>
          </ModalFooter>
        </Form>
      </ModalContent>
    </Modal>
  );
};

export default RatingModal;
