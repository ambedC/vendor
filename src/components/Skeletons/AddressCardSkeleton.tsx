import React from "react";
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Divider,
  Skeleton,
} from "@heroui/react";

const AddressCardSkeleton = () => {
  return (
    <Card className="w-full h-full" shadow="sm">
      <CardHeader className="flex items-center justify-between pb-0">
        <div className="flex items-center gap-2">
          {/* Address type chip skeleton */}
          <Skeleton className="rounded-full">
            <div className="h-6 w-16 bg-default-200"></div>
          </Skeleton>
        </div>
        {/* Default chip skeleton (conditionally shown) */}
        <Skeleton className="rounded-full">
          <div className="h-6 w-14 bg-default-200"></div>
        </Skeleton>
      </CardHeader>

      <CardBody className="space-y-6 pb-0">
        {/* Address Text */}
        <div className="space-y-2">
          {/* Address line 1 */}
          <Skeleton className="rounded-lg">
            <div className="h-5 w-3/4 bg-default-200"></div>
          </Skeleton>

          {/* Address line 2 */}
          <Skeleton className="rounded-lg">
            <div className="h-4 w-1/2 bg-default-200"></div>
          </Skeleton>

          {/* City, State, Zipcode */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 w-fit">
              <Skeleton className="rounded-full">
                <div className="w-3.5 h-3.5 bg-default-200"></div>
              </Skeleton>
              <Skeleton className="rounded-lg">
                <div className="h-4 w-32 bg-default-200"></div>
              </Skeleton>
            </div>
          </div>

          {/* Landmark and Country */}
          <div className="flex items-center gap-4">
            {/* Landmark */}
            <div className="flex items-center gap-2 w-fit">
              <Skeleton className="rounded-full">
                <div className="w-3.5 h-3.5 bg-default-200"></div>
              </Skeleton>
              <Skeleton className="rounded-lg">
                <div className="h-4 w-24 bg-default-200"></div>
              </Skeleton>
            </div>

            {/* Divider */}
            <Divider orientation="vertical" className="h-4" />

            {/* Country */}
            <div className="flex items-center gap-2">
              <Skeleton className="rounded-full">
                <div className="w-3.5 h-3.5 bg-default-200"></div>
              </Skeleton>
              <Skeleton className="rounded-lg">
                <div className="h-4 w-20 bg-default-200"></div>
              </Skeleton>
            </div>
          </div>
          <div className="flex justify-start w-full gap-4">
            {/* Phone */}
            <div className="flex items-center gap-2">
              <Skeleton className="rounded-full">
                <div className="w-3 h-3 bg-default-200"></div>
              </Skeleton>
              <Skeleton className="rounded-lg">
                <div className="h-3 w-20 bg-default-200"></div>
              </Skeleton>
            </div>

            <Divider orientation="vertical" />

            {/* Coordinates */}
            <div className="flex items-center gap-2">
              <Skeleton className="rounded-full">
                <div className="w-3 h-3 bg-default-200"></div>
              </Skeleton>
              <Skeleton className="rounded-lg">
                <div className="h-3 w-24 bg-default-200"></div>
              </Skeleton>
            </div>
          </div>
        </div>
      </CardBody>

      <CardFooter className="flex gap-2">
        {/* View Map Button */}
        <Skeleton className="rounded-lg flex-1">
          <div className="h-8 w-full bg-default-200"></div>
        </Skeleton>

        {/* Edit Button */}
        <Skeleton className="rounded-lg flex-1">
          <div className="h-8 w-full bg-default-200"></div>
        </Skeleton>

        {/* Delete Button */}
        <Skeleton className="rounded-lg flex-1">
          <div className="h-8 w-full bg-default-200"></div>
        </Skeleton>
      </CardFooter>
    </Card>
  );
};

export default AddressCardSkeleton;
