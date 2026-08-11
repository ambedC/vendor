import React from "react";
import { Card, CardBody, CardHeader, Button } from "@heroui/react";
import { MessageSquare, Star, Store, Edit2 } from "lucide-react";
import { SellerFeedbackItem, OrderItem } from "@/types/ApiResponse";
import { useTranslation } from "react-i18next";

type ExistingReview = {
  id?: number | string;
  rating?: number;
  title?: string;
  comment?: string;
  review_images?: string[];
};

interface SellerFeedbacksProps {
  seller_feedbacks: SellerFeedbackItem[] | undefined | null;
  items: OrderItem[];
  onOpenReview: (payload: {
    sellerId: number | string;
    sellerName?: string;
    existingReview?: ExistingReview;
    itemsID?: string[];
  }) => void;
}

const SellerFeedbacks: React.FC<SellerFeedbacksProps> = ({
  seller_feedbacks,
  items,
  onOpenReview,
}) => {
  const { t } = useTranslation();

  if (!seller_feedbacks || seller_feedbacks.length === 0) return null;

  // ✅ FILTER SELLERS WHO HAVE DELIVERED ITEMS (TYPE-SAFE)
  const validSellers = seller_feedbacks
    .map((seller, idx) => {
      const sellerId = seller.seller_id ?? idx;

      const sellerItems = items.filter(
        (it: OrderItem) =>
          String(it.seller_id) === String(sellerId) &&
          String(it.status).toLowerCase() === "delivered"
      );

      if (sellerItems.length === 0) return null;

      return {
        seller,
        sellerId,
        sellerItems,
        sellerName: sellerItems[0]?.seller_name,
      };
    })
    .filter((x) => x !== null) as {
    seller: SellerFeedbackItem;
    sellerId: number | string;
    sellerItems: OrderItem[];
    sellerName?: string;
  }[];

  // ❗ If no sellers left → hide whole card including header
  if (validSellers.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {t("sellerReviewsTitle")}
          </h3>
        </div>
      </CardHeader>

      <CardBody className="pt-0">
        <div className="grid gap-3">
          {validSellers.map(({ seller, sellerId, sellerItems, sellerName }, idx) => {
            const feedback = seller.feedback;
            const isGiven = seller.is_feedback_given;
            const fbObj = feedback ?? undefined;

            return (
              <Card
                // `sellerId` can repeat in `seller_feedbacks` payload, so use a composite key
                key={`${String(sellerId)}-${idx}`}
                className="border border-divider"
                shadow="none"
              >
                <CardBody className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Store className="w-4 h-4 text-primary" />
                        </div>

                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">
                            {sellerName || `${t("seller")} #${sellerId}`}
                          </span>

                          <span className="text-xs text-foreground/60">
                            {sellerItems
                              .map((si: OrderItem) => si.title)
                              .join(", ")}
                          </span>
                        </div>
                      </div>

                      {isGiven && fbObj ? (
                        <div className="space-y-2 pl-10">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= (fbObj.rating || 0)
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-semibold text-foreground">
                              {fbObj.rating}/5
                            </span>
                          </div>

                          {fbObj.title && (
                            <p
                              className="text-sm font-medium text-foreground"
                              title={fbObj.title}
                            >
                              {fbObj.title}
                            </p>
                          )}

                          {fbObj.description && (
                            <p
                              className="text-xs text-foreground/60 line-clamp-2"
                              title={fbObj.description}
                            >
                              {fbObj.description}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 pl-10">
                          <MessageSquare className="w-4 h-4 text-warning" />
                          <span className="text-xs text-foreground/60">
                            {t("noSellerReview")}
                          </span>
                        </div>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant={isGiven ? "flat" : "solid"}
                      color={isGiven ? "default" : "primary"}
                      title={isGiven ? t("updateReview") : t("reviewSeller")}
                      startContent={
                        isGiven ? (
                          <Edit2 className="w-3.5 h-3.5" />
                        ) : (
                          <Star className="w-3.5 h-3.5" />
                        )
                      }
                      className="min-w-fit shrink-0 text-xs"
                      onPress={() =>
                        onOpenReview({
                          sellerId,
                          sellerName,
                          existingReview: fbObj
                            ? {
                                id: fbObj.id,
                                rating: fbObj.rating,
                                title: fbObj.title,
                                comment: fbObj.description,
                                review_images: [],
                              }
                            : undefined,
                          itemsID: sellerItems.map((it: OrderItem) =>
                            it.id.toString()
                          ),
                        })
                      }
                    >
                      {isGiven ? t("updateReview") : t("reviewSeller")}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
};

export default SellerFeedbacks;
