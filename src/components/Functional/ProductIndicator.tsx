import { FC } from "react";

interface ProductIndicatorProps {
  indicator?: "veg" | "non_veg" | "non-veg" | "nonveg" | string | null;
  size?: number;
}

const ProductIndicator: FC<ProductIndicatorProps> = ({
  indicator = null,
  size = 14,
}) => {
  if (!indicator) return null;

  const normalized = indicator.trim().toLowerCase();

  const isVeg = normalized === "veg" || normalized === "vegetarian";
  const isNonVeg =
    normalized === "non_veg" ||
    normalized === "non-veg" ||
    normalized === "nonveg" ||
    normalized === "nonvegetarian";

  if (isVeg) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="inline-block shrink-0 align-middle select-none mr-1"
        aria-label="Vegetarian"
      >
        <rect
          x="2.5"
          y="2.5"
          width="19"
          height="19"
          rx="4.5"
          stroke="#0f8c3b"
          strokeWidth="2.5"
          fill="none"
        />
        <circle cx="12" cy="12" r="5" fill="#0f8c3b" />
      </svg>
    );
  }

  if (isNonVeg) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="inline-block shrink-0 align-middle select-none mr-1"
        aria-label="Non-Vegetarian"
      >
        <rect
          x="2.5"
          y="2.5"
          width="19"
          height="19"
          rx="4.5"
          stroke="#a23835"
          strokeWidth="2.5"
          fill="none"
        />
        <polygon points="12,6.5 6.5,17 17.5,17" fill="#a23835" />
      </svg>
    );
  }

  return null;
};

export default ProductIndicator;
