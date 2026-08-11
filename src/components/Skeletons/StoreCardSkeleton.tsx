import { FC } from "react";
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Skeleton,
} from "@heroui/react";

const StoreCardSkeleton: FC = () => {
  return (
    <Card
      as="div"
      className="w-full h-full p-0 border border-gray-100 dark:border-default-100"
      shadow="sm"
    >
      {/* Roof Image Skeleton */}
      <CardHeader className="relative p-0">
        <div className="w-full h-[100px] relative overflow-hidden rounded-t-lg">
          <Skeleton className="absolute inset-0 rounded-t-lg" />
          {/* Store Name Plate Skeleton */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[80%]">
            <Skeleton className="h-5 w-full rounded" />
          </div>
        </div>
      </CardHeader>

      {/* Store Body Skeleton */}
      <CardBody className="p-4 flex-1">
        <div className="space-y-5">
          <Skeleton className="h-3 w-full rounded" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="w-2 h-3 rounded-full" />
              <Skeleton className="h-2 w-1/2 rounded" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-3 w-5 rounded" />
          </div>
        </div>
      </CardBody>

      {/* Store Footer Skeleton */}
      <CardFooter className="p-4 pt-2 flex flex-col space-y-3">
        <div className="flex items-start flex-col justify-start gap-3 w-full">
          <div className="flex items-center gap-2">
            <Skeleton className="w-5 h-3 rounded-full" />
            <Skeleton className="h-2 w-16 rounded" />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default StoreCardSkeleton;
