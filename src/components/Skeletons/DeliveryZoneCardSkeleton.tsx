import React from "react";
import { Card, CardBody, CardFooter, Skeleton } from "@heroui/react";

const DeliveryZoneCardSkeleton: React.FC = () => {
  return (
    <Card className="w-full h-full">
      <CardBody className="p-0 overflow-hidden">
        {/* Map Image Placeholder Skeleton */}
        <Skeleton className="w-full h-32 rounded-none" />
      </CardBody>
      <CardFooter className="flex flex-col items-start gap-2 p-3">
        <div className="flex justify-between w-full">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        
        <div className="w-full mt-1 space-y-2">
          <div className="flex justify-between w-full">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-3 w-10 rounded" />
          </div>
          
          <div className="flex justify-between w-full">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-3 w-12 rounded" />
          </div>
          
          <div className="flex justify-between w-full">
            <Skeleton className="h-3 w-14 rounded" />
            <Skeleton className="h-3 w-8 rounded" />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default DeliveryZoneCardSkeleton;