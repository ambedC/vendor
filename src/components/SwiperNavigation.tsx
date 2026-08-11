import { FC, RefObject } from "react";
import { Button } from "@heroui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SwiperNavigationProps {
  prevRef: RefObject<HTMLButtonElement | null>;
  nextRef: RefObject<HTMLButtonElement | null>;
  rtl?: boolean;
}

const SwiperNavigation: FC<SwiperNavigationProps> = ({
  prevRef,
  nextRef,
  rtl = false,
}) => {
  return (
    <>
      {/* Previous Button */}
      <Button
        isIconOnly
        ref={prevRef}
        size="sm"
        radius="lg"
        aria-label="Previous"
        className="hidden sm:flex
        absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-20
        bg-background border border-default-300 shadow-lg disabled:opacity-50
        transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110"
      >
        {rtl ? (
          <ChevronRight size={20} className="text-default-700" />
        ) : (
          <ChevronLeft size={20} className="text-default-700" />
        )}
      </Button>

      {/* Next Button */}
      <Button
        isIconOnly
        ref={nextRef}
        size="sm"
        radius="lg"
        aria-label="Next"
        className="hidden sm:flex
        absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-20
        bg-background border border-default-300 shadow-lg disabled:opacity-50
        transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110"
      >
        {rtl ? (
          <ChevronLeft size={20} className="text-default-700" />
        ) : (
          <ChevronRight size={20} className="text-default-700" />
        )}
      </Button>
    </>
  );
};

export default SwiperNavigation;
