import React from "react";
import { Avatar, Skeleton } from "@heroui/react";

const StoreProfileSkeleton: React.FC = () => {
  return (
    <div className="w-full mx-auto rounded-3xl overflow-hidden bg-white dark:bg-content1 shadow-md">
      {/* ================= Banner Section ================= */}
      <div className="relative h-64 sm:h-72 md:h-80 lg:h-[400px] w-full overflow-hidden">
        <Skeleton className="absolute inset-0 w-full h-full rounded-none" />

        {/* -------- Desktop Overlay Skeleton (Matching img-3 style) -------- */}
        <div className="absolute inset-0 hidden lg:flex flex-col justify-end">
          <div className="relative z-10 p-10 flex items-end gap-6">
            <div className="-translate-y-1/3">
              <Skeleton className="rounded-full">
                <Avatar className="w-32 h-32 sm:w-44 sm:h-44 border-4 border-transparent" />
              </Skeleton>
            </div>
            <div className="flex-1 space-y-4 pb-6">
              <Skeleton className="h-10 w-1/3 rounded-lg" />
              <div className="flex gap-3">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <div className="mt-4 max-w-3xl space-y-2">
                <Skeleton className="h-4 w-full rounded-md opacity-20" />
                <Skeleton className="h-4 w-5/6 rounded-md opacity-20" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= Mobile UI Skeleton (Matching img-2 style) ================= */}
      <div className="lg:hidden relative px-6 pb-10 bg-white dark:bg-content1">
        {/* Avatar - Positioned to overlap banner from below */}
        <div className="absolute -top-16 sm:-top-20 left-6 sm:left-10 z-20">
          <Skeleton className="rounded-full">
            <Avatar className="w-32 h-32 sm:w-44 sm:h-44 border-4 border-transparent" />
          </Skeleton>
        </div>

        {/* Mobile Header Content Skeleton */}
        <div className="pt-20 sm:pt-28 flex flex-col gap-6">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-3 flex-1">
              <Skeleton className="h-8 w-3/4 rounded-xl" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="h-8 w-24 rounded-full shrink-0" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-5 h-5 rounded-full" />
              <Skeleton className="h-5 w-2/3 rounded-lg" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="w-5 h-5 rounded-full" />
              <Skeleton className="h-5 w-1/2 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Mobile Contact Skeletons */}
        <div className="mt-8 flex flex-col gap-4 pt-8 border-t border-divider">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <Skeleton className="h-5 w-40 rounded-md" />
            </div>
          ))}
        </div>
      </div>

      {/* ================= Desktop Contact Bar Skeleton (Matching img-3) ================= */}
      <div className="hidden lg:flex items-center justify-between px-10 py-6 bg-white dark:bg-content1 border-t border-divider">
        <div className="flex items-center gap-10 w-full overflow-x-auto no-scrollbar">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 shrink-0">
              <Skeleton className="w-5 h-5 rounded-full" />
              <Skeleton className="h-4 w-32 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StoreProfileSkeleton;
