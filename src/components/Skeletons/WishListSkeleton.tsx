import { Card, CardBody, Skeleton } from "@heroui/react";
import React from "react";

const WishListSkeleton = () => {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} shadow="sm">
          <CardBody className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="rounded-full w-10 h-10" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
              <Skeleton className="rounded w-6 h-6" />
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
};

export default WishListSkeleton;
