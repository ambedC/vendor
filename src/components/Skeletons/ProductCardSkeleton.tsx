import { FC } from "react";
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Skeleton,
} from "@heroui/react";

const ProductCardSkeleton: FC = () => {
  return (
    <Card
      as="div"
      className="w-full h-full border-2 border-gray-100 dark:border-default-100"
      shadow="sm"
    >
      <CardHeader className="pb-0">
        <Skeleton className="w-16 h-4 rounded-sm" />
      </CardHeader>
      <CardBody className="pb-2.5 pt-2">
        {/* Image Placeholder */}
        <div className="relative mb-4 flex justify-center">
          <Skeleton className="w-full h-16 md:h-20 lg:h-24 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex w-full justify-start">
            <Skeleton className="w-12 h-2 rounded-sm" />
          </div>
          <div className="flex w-full justify-end">
            <Skeleton className="w-16 h-2 rounded-sm" />
          </div>
        </div>
        {/* Product Name Placeholder */}
        <Skeleton className="w-3/4 h-2.5 mt-2 rounded" />
        <Skeleton className="w-1/2 h-2.5 mt-1 rounded" />
        {/* Rating Placeholder */}
        <div className="flex items-center gap-1 mt-2">
          <Skeleton className="w-16 h-2.5 rounded" />
          <Skeleton className="w-8 h-2.5 rounded" />
        </div>
      </CardBody>
      <CardFooter className="flex items-start justify-between w-full pt-1">
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1">
            <Skeleton className="w-12 h-3 rounded" />
            <Skeleton className="w-10 h-2 rounded" />
          </div>
        </div>
        <Skeleton className="w-8 h-8 rounded-full" />
      </CardFooter>
    </Card>
  );
};

export default ProductCardSkeleton;
