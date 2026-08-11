import { Skeleton } from "@heroui/react";
import { FC } from "react";

interface SellerReviewSectionSkeletonProps {
  reviewsCount?: number;
  hideHeader?: boolean;
  hideAvgRating?: boolean;
}

const SellerReviewSectionSkeleton: FC<SellerReviewSectionSkeletonProps> = ({
  reviewsCount = 9,
  hideHeader = false,
  hideAvgRating = false,
}) => {
  return (
    <div className="w-full flex flex-col mt-4 gap-4">
      {/* Header Skeleton */}
      {!hideHeader ? (
        <div className="grid grid-cols-2 w-full gap-2 justify-between p-0">
          {/* Page Header Skeleton */}
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-40 rounded-lg" />
            <Skeleton className="h-4 w-56 rounded-lg" />
          </div>

          {/* Select Dropdown Skeleton */}
          <div className="w-full flex items-start justify-end">
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </div>
      ) : null}

      {/* Average Rating Section Skeleton */}
      {!hideAvgRating ? (
        <section>
          <div className="w-full p-6 border border-divider rounded-lg bg-content1">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left side - Overall rating */}
              <div className="flex flex-col items-center lg:items-start gap-2">
                <Skeleton className="h-8 w-32 rounded-lg" />
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className="h-6 w-6 rounded-full" />
                  ))}
                </div>
                <Skeleton className="h-4 w-24 rounded-lg" />
              </div>

              {/* Right side - Rating breakdown */}
              <div className="flex-1">
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Skeleton className="h-4 w-8 rounded-lg" />
                      <Skeleton className="h-2 flex-1 rounded-full" />
                      <Skeleton className="h-4 w-8 rounded-lg" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Reviews Grid Skeleton */}
      <section className="w-full h-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: reviewsCount }).map((_, index) => (
          <div
            key={index}
            className="border border-divider rounded-lg p-3 bg-content1"
          >
            {/* Card Header Skeleton */}
            <div className="flex justify-between items-center mb-4">
              {/* User Info */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 md:h-8 md:w-8 rounded-full" />
                <Skeleton className="h-4 w-20 rounded-lg" />
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, starIndex) => (
                  <Skeleton
                    key={starIndex}
                    className="h-3 w-3 md:h-4 md:w-4 rounded-full"
                  />
                ))}
                <Skeleton className="h-3 w-6 rounded-lg ml-1" />
              </div>
            </div>

            {/* Card Body Skeleton */}
            <div className="space-y-2 mb-4">
              <Skeleton className="h-4 w-3/4 rounded-lg" />
              <Skeleton className="h-3 w-full rounded-lg" />
            </div>

            {/* Card Footer Skeleton */}
            <div className="flex justify-end">
              <Skeleton className="h-3 w-16 rounded-lg" />
            </div>
          </div>
        ))}
      </section>

      {/* Pagination Skeleton */}
      <div className="flex justify-center mt-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export default SellerReviewSectionSkeleton;
