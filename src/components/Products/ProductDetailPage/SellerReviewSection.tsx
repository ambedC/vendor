import { Select, SelectItem, Pagination } from "@heroui/react";
import { FC, useState, useMemo } from "react";
import AverageRatingSection from "./AverageRatingSection";
import { getSellerReviews } from "@/routes/api";
import useSWR from "swr";
import SellerReviewSectionSkeleton from "@/components/Skeletons/SellerReviewSectionSkeleton";
import { useTranslation } from "react-i18next";
import SellerReviewCard from "@/components/Cards/SellerReviewCard";
import { Product } from "@/types/ApiResponse";

interface SellerReviewSectionProps {
  product: Product;
}

const SellerReviewSection: FC<SellerReviewSectionProps> = ({ product }) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const perPage = 9;
  const sellerId = product?.seller_id || 0;

  const fetcher = async () => {
    const response = await getSellerReviews({
      seller_id: sellerId,
      page,
      per_page: perPage,
    });

    if (response.success && response.data) {
      return response.data;
    }
    console.error("Failed to fetch seller reviews");
  };

  const {
    data: reviewsData,
    error,
    isLoading,
  } = useSWR(sellerId ? ["seller-reviews", sellerId, page] : null, fetcher, {
    revalidateOnFocus: false,
  });

  // Calculate statistics from reviews array
  const { totalReviews, averageRating, ratingsBreakdown, reviews } =
    useMemo(() => {
      const reviewsList = reviewsData?.data || [];

      const ratings = product.seller_ratings;

      // Fallback if not available
      const total = ratings?.total_reviews || 0;
      const avg = ratings?.average_rating || 0;

      const ratingsBreakdownArray = [
        { rating: 5, count: ratings?.five_star_count || 0 },
        { rating: 4, count: ratings?.four_star_count || 0 },
        { rating: 3, count: ratings?.three_star_count || 0 },
        { rating: 2, count: ratings?.two_star_count || 0 },
        { rating: 1, count: ratings?.one_star_count || 0 },
      ];

      return {
        totalReviews: total,
        averageRating: avg,
        ratingsBreakdown: ratingsBreakdownArray,
        reviews: reviewsList,
      };
    }, [reviewsData, product]);

  const totalPages = reviewsData ? Math.ceil(totalReviews / perPage) : 1;

  if (isLoading) {
    return (
      <SellerReviewSectionSkeleton
        reviewsCount={perPage}
        hideHeader={true}
        hideAvgRating={false}
      />
    );
  }

  return (
    <div className="w-full flex flex-col mt-4">
      {/* Page Header and Filter */}
      <div className="grid grid-cols-2 w-full gap-2 justify-between p-0">
        <div className="w-full flex items-start justify-end">
          <Select
            defaultSelectedKeys={["latest"]}
            className="max-w-32 hidden"
            aria-label={t("sellerReviews.sortAriaLabel")}
          >
            {[
              { label: t("sellerReviews.sort.latest"), key: "latest" },
              { label: t("sellerReviews.sort.oldest"), key: "oldest" },
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
          <p>{t("sellerReviews.error")}</p>
        </div>
      ) : reviewsData && reviews.length > 0 ? (
        <div className="flex flex-col gap-4">
          <section>
            <AverageRatingSection
              totalReviews={Number(totalReviews)}
              averageRating={Number(averageRating)}
              ratingsBreakdown={ratingsBreakdown}
            />
          </section>

          <section className="w-full h-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.map((review) => (
              <SellerReviewCard key={review.id} review={review} />
            ))}
          </section>

          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination
                total={totalPages}
                initialPage={page}
                onChange={setPage}
                showControls
                isCompact
                size="sm"
                classNames={{
                  item: "text-sm",
                  cursor: "text-sm",
                  next: "text-sm",
                  prev: "text-sm",
                }}
              />
            </div>
          )}
          <span className="w-full text-center text-foreground/50 text-xs">
            {t("sellerReviews.subtitle", {
              count: reviews.length || 0,
              total: totalReviews || 0,
            })}
          </span>
        </div>
      ) : null}
    </div>
  );
};

export default SellerReviewSection;
