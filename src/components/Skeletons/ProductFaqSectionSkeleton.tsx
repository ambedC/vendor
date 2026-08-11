import { Skeleton } from "@heroui/react";
import { FC } from "react";

interface ProductFaqSectionSkeletonProps {
  itemsCount?: number;
}

const ProductFaqSectionSkeleton: FC<ProductFaqSectionSkeletonProps> = ({
  itemsCount = 5,
}) => {
  return (
    <div className="w-full h-full flex flex-col text-medium gap-4">
      {/* FAQ Accordion Skeleton */}
      <div className="h-full w-full">
        <div className="flex flex-col gap-3">
          {Array.from({ length: itemsCount }).map((_, index) => (
            <div
              key={index}
              className="border border-divider rounded-lg p-4 bg-content1"
            >
              {/* FAQ Question Skeleton */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

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

export default ProductFaqSectionSkeleton;
