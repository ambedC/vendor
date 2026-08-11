import { FC } from "react";

const ProductDetailSectionSkeleton: FC = () => {
  return (
    <div className="md:px-4 w-full flex flex-col gap-2 animate-pulse">
      {/* Product Category */}
      <div className="w-16 h-3 md:h-4 bg-gray-300 dark:bg-gray-700 rounded-md" />

      {/* Product Name */}
      <div className="w-3/4 md:w-2/3 h-5 md:h-8 bg-gray-300 dark:bg-gray-700 rounded-md" />

      {/* Description */}
      <div className="w-full md:w-4/5 h-3 md:h-4 bg-gray-300 dark:bg-gray-700 rounded-md" />

      {/* Rating and Reviews */}
      <div className="flex items-center gap-2 mt-1">
        <div className="w-4 h-4 md:w-5 md:h-5 bg-gray-300 dark:bg-gray-700 rounded-sm" />
        <div className="w-16 md:w-20 h-3 md:h-4 bg-gray-300 dark:bg-gray-700 rounded-md" />
        <div className="w-20 md:w-24 h-3 md:h-4 bg-gray-300 dark:bg-gray-700 rounded-md" />
      </div>

      {/* Price Section */}
      <div className="mt-5">
        <div className="flex items-center gap-2">
          <div className="w-20 md:w-32 h-6 md:h-10 bg-gray-300 dark:bg-gray-700 rounded-md" />
          <div className="w-16 md:w-20 h-4 md:h-5 bg-gray-300 dark:bg-gray-700 rounded-md mt-0 md:mt-2" />
        </div>
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-gray-300 dark:bg-gray-700 my-4" />

      {/* Content Container */}
      <div className="flex flex-col gap-6">
        {/* Quantity Section */}
        <div className="w-full max-w-36 flex flex-col gap-2 my-2">
          <div className="w-16 h-6 bg-gray-300 dark:bg-gray-700 rounded-md" />
          <div className="w-28 h-12 bg-gray-300 dark:bg-gray-700 rounded-md" />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center max-w-md gap-4">
          <div className="flex-1 h-10 bg-gray-300 dark:bg-gray-700 rounded-md" />
          <div className="flex-1 h-10 bg-gray-300 dark:bg-gray-700 rounded-md" />
        </div>

        {/* Save and Compare Links */}
        <div className="flex gap-4 w-full justify-between max-w-fit">
          {/* Save For Later */}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-300 dark:bg-gray-700 rounded-sm" />
            <div className="w-20 md:w-24 h-3 md:h-4 bg-gray-300 dark:bg-gray-700 rounded-md" />
          </div>

          {/* Vertical Divider */}
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 md:mx-4" />

          {/* Compare With Others */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-300 dark:bg-gray-700 rounded-sm" />
            <div className="w-28 md:w-32 h-3 md:h-4 bg-gray-300 dark:bg-gray-700 rounded-md" />
          </div>
        </div>

        {/* Additional Section (Shipping/Service Info) */}
        <div>
          <div className="flex flex-col gap-3">
            {/* Service Item 1 */}
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-gray-300 dark:bg-gray-700 rounded-sm" />
              <div className="w-48 md:w-56 h-4 bg-gray-300 dark:bg-gray-700 rounded-md" />
            </div>

            {/* Service Item 2 */}
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-gray-300 dark:bg-gray-700 rounded-sm" />
              <div className="w-40 md:w-48 h-4 bg-gray-300 dark:bg-gray-700 rounded-md" />
            </div>

            {/* Service Item 3 */}
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-gray-300 dark:bg-gray-700 rounded-sm" />
              <div className="w-36 md:w-44 h-4 bg-gray-300 dark:bg-gray-700 rounded-md" />
            </div>

            {/* Service Item 4 */}
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-gray-300 dark:bg-gray-700 rounded-sm" />
              <div className="w-44 md:w-52 h-4 bg-gray-300 dark:bg-gray-700 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailSectionSkeleton;
