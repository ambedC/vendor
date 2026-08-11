import PageHeader from "@/components/custom/PageHeader";
import { Select, SelectItem, Pagination, Card } from "@heroui/react";
import { FC, useState } from "react";
import AverageRatingSection from "./AverageRatingSection";
import { getProductReviews } from "@/routes/api";
import useSWR from "swr";
import ProductReviewsSectionSkeleton from "@/components/Skeletons/ProductReviewsSectionSkeleton";
import { useTranslation } from "react-i18next";
import ReviewCard from "@/components/Cards/ReviewCard";
import { MessageSquareOff } from "lucide-react";

interface ProductReviewsSectionProps {
  productSlug: string;
}

const ProductReviewsSection: FC<ProductReviewsSectionProps> = ({
  productSlug,
}) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const perPage = 9;

  const fetcher = async () => {
    const response = await getProductReviews({
      slug: productSlug,
      page,
      per_page: perPage,
    });

    if (response.success && response.data) {
      return response.data.data;
    }
    console.error("Failed to fetch product reviews");
  };

  const {
    data: reviewsData,
    error,
    isLoading,
  } = useSWR(
    productSlug ? ["product-reviews", productSlug, page] : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const totalReviews = reviewsData?.total_reviews || 0;
  const averageRating = parseFloat(reviewsData?.average_rating || "0");
  const reviews = reviewsData?.reviews || [];
  const totalPages = reviewsData ? Math.ceil(totalReviews / perPage) : 1;

  const ratingsBreakdown = reviewsData
    ? [
        {
          rating: 5,
          count: parseInt(reviewsData.ratings_breakdown["5_star"] || "0"),
        },
        {
          rating: 4,
          count: parseInt(reviewsData.ratings_breakdown["4_star"] || "0"),
        },
        {
          rating: 3,
          count: parseInt(reviewsData.ratings_breakdown["3_star"] || "0"),
        },
        {
          rating: 2,
          count: parseInt(reviewsData.ratings_breakdown["2_star"] || "0"),
        },
        {
          rating: 1,
          count: parseInt(reviewsData.ratings_breakdown["1_star"] || "0"),
        },
      ]
    : [];

  if (isLoading) {
    return <ProductReviewsSectionSkeleton reviewsCount={perPage} />;
  }

  return (
    <div className="w-full flex flex-col mt-4">
      {/* Page Header and Filter */}
      <div className="grid grid-cols-2 w-full gap-2 justify-between p-0">
        <PageHeader
          title={t("productReviews.title", { count: totalReviews || 0 })}
          subtitle={t("productReviews.subtitle", {
            count: reviews.length || 0,
            total: totalReviews || 0,
          })}
        />
        <div className="w-full flex items-start justify-end">
          <Select
            defaultSelectedKeys={["latest"]}
            className="max-w-32 hidden"
            aria-label={t("productReviews.sortAriaLabel")}
          >
            {[
              { label: t("productReviews.sort.latest"), key: "latest" },
              { label: t("productReviews.sort.oldest"), key: "oldest" },
            ].map((item) => (
              <SelectItem key={item.key} textValue={item.label}>
                {item.label}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      {error ? (
        <div className="w-full text-center py-10">
          <p>{t("productReviews.error")}</p>
        </div>
      ) : reviewsData ? (
        <div className="flex flex-col gap-4">
          {reviews.length === 0 ? (
            <>
              {/* ⭐ Empty State UI when no reviews */}
              <Card
                className="w-full flex flex-col items-center justify-center py-10"
                shadow="sm"
              >
                <div className="p-4 bg-white dark:bg-gray-600 shadow-sm rounded-full mb-4">
                  <MessageSquareOff className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-sm md:text-xl font-semibold text-foreground/70">
                  {t("productReviews.noReviewsYet") || "No Reviews Yet"}
                </h3>
                <p className="text-xs md:text-sm text-foreground/50 mt-2 text-center max-w-md">
                  {t("productReviews.noReviewsDescription") ||
                    "This product has not received any reviews yet. Be the first to share your experience!"}
                </p>
              </Card>
            </>
          ) : (
            <>
              <section>
                <AverageRatingSection
                  totalReviews={totalReviews}
                  averageRating={averageRating}
                  ratingsBreakdown={ratingsBreakdown}
                />
              </section>
              <section className="w-full h-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </section>
            </>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination
                total={totalPages}
                initialPage={page}
                onChange={setPage}
                showControls
                isCompact
                size="sm"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="w-full text-center py-10">
          <p>{t("productReviews.noData")}</p>
        </div>
      )}
    </div>
  );
};

export default ProductReviewsSection;
