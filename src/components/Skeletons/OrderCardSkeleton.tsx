import { FC } from "react";
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Divider,
  Skeleton,
} from "@heroui/react";

const OrderCardSkeleton: FC = () => {
  return (
    <Card shadow="sm" radius="sm">
      <CardHeader className="flex flex-col justify-between w-full">
        <div className="flex items-start justify-between mb-3 w-full gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <Skeleton className="w-8 h-8 rounded-md shrink-0" />
            <div className="flex flex-col gap-2 min-w-0">
              <div className="flex gap-2 items-center">
                <Skeleton className="h-4 w-24 rounded-md shrink-0" />
                <Skeleton className="h-5 w-16 rounded-md shrink-0" />
              </div>
              <div className="flex gap-1 items-center">
                <Skeleton className="w-2.5 h-2.5 rounded-full shrink-0" />
                <Skeleton className="h-3 w-32 rounded-md" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Skeleton className="w-8 h-8 rounded-md" />
            <Skeleton className="w-8 h-8 rounded-md" />
          </div>
        </div>

        <Divider className="mb-2 opacity-50" />

        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5">
            <Skeleton className="w-3 h-3 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-12 rounded-md" />
              <Skeleton className="h-3 w-20 rounded-md" />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Skeleton className="w-3 h-3 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-12 rounded-md" />
              <Skeleton className="h-3 w-16 rounded-md" />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardBody className="pb-1 overflow-hidden">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="w-3 h-3 rounded-full" />
            <Skeleton className="h-4 w-24 rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Skeleton className="w-3 h-3 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-28 rounded-md" />
                <Skeleton className="h-3 w-20 rounded-md" />
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Skeleton className="w-3 h-3 rounded-full" />
              <Skeleton className="h-3 w-16 rounded-md" />
            </div>
          </div>
        </div>
      </CardBody>

      <CardFooter className="grid grid-cols-6 gap-2 w-full pt-0">
        <Skeleton className="h-8 rounded-md col-span-2" />
        <Skeleton className="h-8 rounded-md col-span-2" />
        <Skeleton className="h-8 rounded-md col-span-2" />
      </CardFooter>
    </Card>
  );
};

export default OrderCardSkeleton;
