import React, { useEffect, useRef } from "react";
import { Image } from "@heroui/react";
import { LayoutGrid } from "lucide-react";

interface Category {
  id: number;
  title: string;
  slug: string;
  image: string;
  icon: string;
  active_icon: string;
  description: string | null;
  status: string;
}

interface TabButtonProps {
  slug: string;
  title: string;
  category?: Category | null;
  isSelected: boolean;
  isLoading?: boolean;
  onClick?: () => void;
  staticIcon?: React.ReactNode;
  size?: "sm" | "lg";
}

const TabButton: React.FC<TabButtonProps> = ({
  slug,
  title,
  category = null,
  isSelected,
  isLoading = false,
  onClick,
  staticIcon,
  size = "sm",
}) => {
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Auto trigger when "see-more" is visible
  useEffect(() => {
    if (slug !== "see-more" || !buttonRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoading) {
          onClick?.();
        }
      },
      { threshold: 1 },
    );

    observer.observe(buttonRef.current);
    return () => observer.disconnect();
  }, [slug, isLoading, onClick]);

  const iconUrl =
    isSelected && category?.active_icon
      ? category.active_icon
      : category?.icon || category?.image;

  const isLarge = size === "lg";

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      disabled={isLoading}
      className={`
        flex flex-col items-center justify-center gap-2
        ${
          isLarge
            ? "px-1 py-2 sm:min-w-[80px] lg:min-w-[110px] lg:px-4 lg:py-3"
            : "px-1 py-2 sm:min-w-[72px] min-w-[50px]"
        }
        border-b-2 transition-all duration-200  hover:border-primary hover:bg-transparent
        ${
          isSelected
            ? "border-primary text-primary"
            : "border-transparent text-default-600 hover:text-default-900"
        }
        ${
          isLoading
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer hover:bg-default-100/50"
        }
      `}
    >
      {/* Icon */}
      <div
        className={`
            flex items-center justify-center rounded-lg
            ${
              isLarge
                ? "w-10 h-10 md:w-14 md:h-14 lg:w-16 lg:h-16"
                : "w-10 h-10 md:w-12 md:h-12"
            }
            ${
              isSelected
                ? "bg-primary/10 dark:bg-transparent"
                : "bg-default-100 dark:bg-default-100"
            }
          `}
      >
        {iconUrl ? (
          <Image
            src={iconUrl}
            alt={title}
            loading="eager"
            radius="none"
            className={`
                object-contain
                ${
                  isLarge
                    ? "w-6 h-6 md:w-9 md:h-9 lg:w-11 lg:h-11"
                    : "w-6 h-6 md:w-8 md:h-8"
                }
                ${!isSelected ? "" : ""}
              `}
          />
        ) : (
          staticIcon || (
            <LayoutGrid
              className={`
                ${
                  isLarge
                    ? "w-6 h-6 md:w-9 md:h-9 lg:w-11 lg:h-11"
                    : "w-6 h-6 md:w-8 md:h-8"
                }
                ${isSelected ? "text-primary" : "text-default-400"}
              `}
            />
          )
        )}
      </div>

      {/* Title */}
      <span
        className={`
          text-xxs sm:text-xs text-center leading-tight truncate
          ${
            isLarge
              ? "lg:text-sm max-w-[80px] sm:max-w-[100px] lg:max-w-[120px]"
              : "max-w-[60px] sm:max-w-[80px]"
          }
          ${isSelected ? "font-semibold text-primary" : "font-medium"}
        `}
      >
        {title}
      </span>

      {/* Loader */}
      {isLoading && (
        <div className="mt-1 animate-spin rounded-sm h-4 w-4 border-b-2 border-secondary" />
      )}
    </button>
  );
};

export default TabButton;
