import { Skeleton } from "@heroui/react";
import { FC } from "react";

const CategoryCardSkeleton: FC = () => {
  return (
    <div className="flex flex-col items-center w-full min-w-0 px-1 py-1 sm:py-2">
      <Skeleton className="w-full aspect-[4/4.8] sm:aspect-[4/5] rounded-[14px] sm:rounded-[18px] bg-default-200" />
    </div>
  );
};

export default CategoryCardSkeleton;
