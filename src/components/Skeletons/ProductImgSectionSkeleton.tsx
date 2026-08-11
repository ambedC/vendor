import { FC } from "react";

interface ProductImgSectionSkeletonProps {
  isVertical: boolean;
}

const ProductImgSectionSkeleton: FC<ProductImgSectionSkeletonProps> = ({
  isVertical,
}) => {
  return (
    <div
      className={`w-full h-full flex ${
        isVertical ? "flex-col" : "flex-col-reverse"
      } gap-6 animate-pulse`}
    >
      {/* Main Content Skeleton */}
      <div
        className={`w-full h-[60vh] ${
          isVertical ? "order-2" : "order-1"
        } bg-gray-200 dark:bg-gray-800 rounded-lg`}
      />

      {/* Thumbnail Skeletons */}
      <div
        className={`w-full flex ${
          isVertical ? "flex-col items-start gap-4 md:gap-6" : "flex-row gap-2"
        }`}
      >
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className={`bg-gray-200 dark:bg-gray-800 rounded-lg ${
              isVertical ? "h-16 md:h-28 w-full" : "h-16 md:h-20 w-24"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductImgSectionSkeleton;
