import React, { FC, useState, useCallback, useMemo, useRef } from "react";
import { Input } from "@heroui/react";
import clsx from "clsx";
import debounce from "lodash/debounce";
import { SelectedFilters } from ".";

interface PriceSectionProps {
  selectedFilters: SelectedFilters;
  setSelectedFilters: React.Dispatch<React.SetStateAction<SelectedFilters>>;
  // Add these props to define the absolute min/max bounds
  absoluteMinPrice?: number;
  absoluteMaxPrice?: number;
}

const PriceSection: FC<PriceSectionProps> = ({
  // selectedFilters,
  // setSelectedFilters,
  absoluteMinPrice = 0, // Default absolute minimum
  absoluteMaxPrice = 5000, // Default absolute maximum
}) => {
  const [selectedFilters, setSelectedFilters] = useState({
    minPrice: 0,
    maxPrice: 10,
  });
  const [priceRange, setPriceRange] = useState({
    minPrice: selectedFilters.minPrice,
    maxPrice: selectedFilters.maxPrice,
  });

  const minThumbRef = useRef<HTMLDivElement>(null);
  const maxThumbRef = useRef<HTMLDivElement>(null);

  const debouncedSetSelectedFilters = useMemo(
    () =>
      debounce((range: { minPrice: number; maxPrice: number }) => {
        setSelectedFilters((prev) => ({
          ...prev,
          ...range,
        }));
      }, 300),
    [setSelectedFilters]
  );

  const updatePriceRange = useCallback(
    (newRange: { minPrice?: number; maxPrice?: number }) => {
      setPriceRange((prev) => {
        const updatedRange = { ...prev, ...newRange };
        debouncedSetSelectedFilters(updatedRange);
        return updatedRange;
      });
    },
    [debouncedSetSelectedFilters]
  );

  // Fixed: Use absolute min/max for percentage calculations
  const minPercent = useMemo(
    () =>
      ((priceRange.minPrice - absoluteMinPrice) /
        (absoluteMaxPrice - absoluteMinPrice)) *
      100,
    [priceRange.minPrice, absoluteMinPrice, absoluteMaxPrice]
  );

  const maxPercent = useMemo(
    () =>
      ((priceRange.maxPrice - absoluteMinPrice) /
        (absoluteMaxPrice - absoluteMinPrice)) *
      100,
    [priceRange.maxPrice, absoluteMinPrice, absoluteMaxPrice]
  );

  const histogramBars = useMemo(() => {
    return [
      45.2, 32.1, 67.8, 23.4, 56.9, 41.3, 38.7, 52.1, 29.6, 64.3, 35.8, 48.2,
      33.9, 58.4, 42.7, 36.1, 49.8, 31.5, 55.6, 44.9,
    ];
  }, []);

  const handleThumbMove = useCallback(
    (type: "minPrice" | "maxPrice", startValue: number, startX: number) => {
      const handleMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - startX;
        const deltaPercent = (deltaX / 300) * 100;
        const deltaValue =
          (deltaPercent / 100) * (absoluteMaxPrice - absoluteMinPrice);

        const newValue =
          type === "minPrice"
            ? Math.max(
                absoluteMinPrice,
                Math.min(priceRange.maxPrice - 1, startValue + deltaValue)
              )
            : Math.max(
                priceRange.minPrice + 1,
                Math.min(absoluteMaxPrice, startValue + deltaValue)
              );

        updatePriceRange({ [type]: Math.round(newValue) });
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [priceRange, updatePriceRange, absoluteMinPrice, absoluteMaxPrice]
  );

  const handleSliderClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const slider = e.currentTarget;
      const rect = slider.getBoundingClientRect();
      const percent = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width)
      );
      const value = Math.round(
        absoluteMinPrice + percent * (absoluteMaxPrice - absoluteMinPrice)
      );

      if (
        Math.abs(value - priceRange.minPrice) <
        Math.abs(value - priceRange.maxPrice)
      ) {
        if (value < priceRange.maxPrice) {
          updatePriceRange({ minPrice: value });
        }
      } else {
        if (value > priceRange.minPrice) {
          updatePriceRange({ maxPrice: value });
        }
      }
    },
    [priceRange, updatePriceRange, absoluteMinPrice, absoluteMaxPrice]
  );

  const handleInputChange = useCallback(
    (type: "minPrice" | "maxPrice", value: string) => {
      const numValue = parseInt(value, 10) || 0;

      if (
        type === "minPrice" &&
        numValue >= absoluteMinPrice &&
        numValue < priceRange.maxPrice
      ) {
        updatePriceRange({ minPrice: numValue });
      }

      if (
        type === "maxPrice" &&
        numValue <= absoluteMaxPrice &&
        numValue > priceRange.minPrice
      ) {
        updatePriceRange({ maxPrice: numValue });
      }
    },
    [priceRange, updatePriceRange, absoluteMinPrice, absoluteMaxPrice]
  );

  return (
    <div className="w-full px-2">
      <h1 className="text-sm">Price Range</h1>
      <div className="space-y-6 py-2 pt-0">
        <div className="relative h-20 flex items-end justify-between gap-1">
          {histogramBars.map((height, index) => (
            <div
              key={index}
              className={clsx(
                "rounded-sm transition-colors duration-200 w-[4px]",
                index * (100 / histogramBars.length) >= minPercent &&
                  index * (100 / histogramBars.length) <= maxPercent
                  ? "bg-primary-500"
                  : "bg-foreground/30"
              )}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>

        <div className="relative">
          <div
            className="relative h-2 rounded-full cursor-pointer bg-foreground/30"
            onClick={handleSliderClick}
          >
            <div
              className="absolute h-2 bg-primary-400 rounded-full"
              style={{
                left: `${minPercent}%`,
                width: `${maxPercent - minPercent}%`,
              }}
            />

            <div
              ref={minThumbRef}
              className="min-thumb absolute w-4 h-4 bg-primary-500 border-2 border-white rounded-full shadow-lg cursor-pointer mt-1"
              style={{
                left: `${minPercent}%`,
                transform: "translateX(-50%) translateY(-50%)",
              }}
              onMouseDown={(e) =>
                handleThumbMove("minPrice", priceRange.minPrice, e.clientX)
              }
            />

            <div
              ref={maxThumbRef}
              className="max-thumb absolute w-4 h-4 bg-primary-500 border-2 border-white rounded-full shadow-lg cursor-pointer mt-1"
              style={{
                left: `${maxPercent}%`,
                transform: "translateX(-50%) translateY(-50%)",
              }}
              onMouseDown={(e) =>
                handleThumbMove("maxPrice", priceRange.maxPrice, e.clientX)
              }
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Input
            type="number"
            value={priceRange.minPrice.toString()}
            onValueChange={(value) => handleInputChange("minPrice", value)}
            startContent={<span className="text-sm">$</span>}
            classNames={{ base: "h-10", input: "text-sm" }}
            min={absoluteMinPrice}
            max={priceRange.maxPrice - 1}
          />
          <Input
            type="number"
            value={priceRange.maxPrice.toString()}
            onValueChange={(value) => handleInputChange("maxPrice", value)}
            startContent={<span className="text-sm">$</span>}
            classNames={{ base: "h-10", input: "text-sm" }}
            min={priceRange.minPrice + 1}
            max={absoluteMaxPrice}
          />
        </div>
      </div>
    </div>
  );
};

export default PriceSection;
