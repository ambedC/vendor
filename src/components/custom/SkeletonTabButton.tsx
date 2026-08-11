import { Skeleton } from "@heroui/react";
import React from "react";

interface SkeletonTabButtonProps {
  size?: "sm" | "lg";
}

const SkeletonTabButton: React.FC<SkeletonTabButtonProps> = ({
  size = "sm",
}) => {
  const isLarge = size === "lg";
  return (
    <div
      className={`
        flex flex-col items-center justify-center gap-2
        ${
          isLarge
            ? "px-1 py-2 sm:min-w-[80px] lg:min-w-[110px] lg:px-4 lg:py-3"
            : "px-1 py-2 sm:min-w-[72px] min-w-[50px]"
        }
        border-b-2 border-transparent
      `}
    >
      {/* Icon Skeleton */}
      <div
        className={`
          flex items-center justify-center rounded-lg bg-default-100 dark:bg-transparent
          ${
            isLarge
              ? "w-10 h-10 md:w-14 md:h-14 lg:w-16 lg:h-16"
              : "w-10 h-10 md:w-12 md:h-12"
          }
        `}
      >
        <Skeleton
          className={`
            rounded-lg
            ${
              isLarge
                ? "w-6 h-6 md:w-9 md:h-9 lg:w-11 lg:h-11"
                : "w-6 h-6 md:w-8 md:h-8"
            }
          `}
        />
      </div>

      {/* Title Skeleton */}
      <Skeleton
        className={`
          h-3 rounded-sm mt-1
          ${isLarge ? "w-12 lg:h-4 lg:w-16" : "w-12"}
        `}
      />
    </div>
  );
};

export default SkeletonTabButton;
