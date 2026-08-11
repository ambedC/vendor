import { Skeleton } from "@heroui/react";
import { FC } from "react";

const BrandCardSkeleton: FC = () => {
  return (
    <div className="flex flex-col items-center pb-1">
      <Skeleton className="aspect-square w-full h-full rounded-lg animate-pulse" />
      <Skeleton className="w-3/4 h-3 mt-2 rounded animate-pulse" />
    </div>
  );
};

export default BrandCardSkeleton;
