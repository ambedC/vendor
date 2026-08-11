"use client";
import React from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Skeleton,
} from "@heroui/react";

const SectionCardSkeleton = () => {
  return (
    <Card
      radius="lg"
      shadow="sm"
      className="group overflow-hidden border border-default-200 bg-content1"
    >
      {/* Decorative top border */}
      <div className="h-1 w-full bg-default-200 dark:bg-default-700" />

      <CardHeader className="flex flex-col items-start gap-2 px-4 pt-4 pb-3 w-full">
        <div className="flex justify-between items-start w-full gap-2">
          {/* Title skeleton */}
          <Skeleton className="h-5 w-3/4 rounded-md" />

          {/* Product count badge skeleton */}
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>
      </CardHeader>

      <CardBody className="px-4 py-2 space-y-2">
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-5/6 rounded-md" />
      </CardBody>

      <CardFooter className="px-4 pb-4 pt-3 flex justify-between items-center border-t border-default-100">
        {/* Chip skeleton */}
        <Skeleton className="h-5 w-20 rounded-full" />

        {/* Browse text/arrow skeleton */}
        <Skeleton className="h-4 w-16 rounded-md" />
      </CardFooter>
    </Card>
  );
};

export default SectionCardSkeleton;
