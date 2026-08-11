import React from "react";
import { Star, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Store } from "@/types/ApiResponse";

interface StoreMarkerPopupProps {
  store: Store;
  position: { x: number; y: number };
  mapHeight?: number;
  disableRedirect?: boolean;
}

const ConditionalLink = ({
  children,
  href,
  disableRedirect,
}: {
  children: React.ReactNode;
  href: string;
  disableRedirect: boolean;
}) => {
  if (disableRedirect) return <>{children}</>;
  return <Link href={href}>{children}</Link>;
};

const StoreMarkerPopup: React.FC<StoreMarkerPopupProps> = ({
  store,
  position,
  mapHeight = 400,
  disableRedirect = false,
}) => {
  const rating = parseFloat(store.avg_store_rating || "0");
  const distanceValue =
    typeof store.distance === "string"
      ? parseFloat(store.distance)
      : store.distance;
  const displayDistance =
    distanceValue && distanceValue > 0
      ? `${(distanceValue / 1000).toFixed(1)} km`
      : "0 km";

  // Calculate if popup should show above or below
  const POPUP_HEIGHT = 220; // approximate height in pixels
  const shouldShowAbove = position.y + POPUP_HEIGHT + 20 > mapHeight;

  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translate(-50%, -50%)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Pointer Arrow - shows below on top, above on bottom */}
      {!shouldShowAbove && (
        <div className="flex justify-center pointer-events-none">
          <div
            className="w-0 h-0 border-l-3 border-r-3 border-t-3 border-l-transparent border-r-transparent border-t-white dark:border-t-content2 drop-shadow-sm"
            style={{ marginTop: "-12px" }}
          />
        </div>
      )}

      {/* Card */}
      <div className="bg-white dark:bg-content2 rounded-xl shadow-lg overflow-visible border border-gray-100 dark:border-default-100 w-64 pointer-events-auto hover:shadow-xl transition-shadow">
        {/* Banner Image - Reduced height */}
        <div className="relative h-20 bg-gray-200 overflow-hidden rounded-t-xl">
          {store.banner ? (
            <Image
              src={store.banner}
              alt={store.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-blue-400 to-blue-600" />
          )}
        </div>

        <ConditionalLink
          href={`/stores/${store.slug}`}
          disableRedirect={disableRedirect}
        >
          {/* Logo Badge - positioned to overlap banner and info */}
          <div className="flex justify-start -mt-6 px-3 relative z-10">
            <div className="w-12 h-12 rounded-full bg-white dark:bg-content2 border-2 border-white dark:border-content2 overflow-hidden shadow-lg flex-shrink-0 flex items-center justify-center p-1">
              {store.logo ? (
                <Image
                  src={store.logo}
                  alt={store.name}
                  width={48}
                  height={48}
                  className=""
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-600">
                    {store.name?.charAt(0) || "S"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </ConditionalLink>
        {/* Store Info Container */}
        <div className="pt-2 pb-2 px-3">
          {/* Name and Rating in one row */}
          <div className="flex items-start justify-between gap-2">
            <ConditionalLink
          href={`/stores/${store.slug}`}
          disableRedirect={disableRedirect}
        >
              <h3 className="font-bold text-gray-900 dark:text-default-900 text-sm line-clamp-2 flex-1">
                {store.name}
              </h3>
            </ConditionalLink>
            <div className="flex items-center gap-0.5 flex-shrink-0 whitespace-nowrap">
              <Star
                width={13}
                height={13}
                className="fill-yellow-400 text-yellow-400"
              />
              <span className="text-xs font-semibold text-gray-800 dark:text-default-800">
                {rating.toFixed(2)}
              </span>
              <span className="text-xs text-default-500 ml-1">
                ({store.total_store_feedback})
              </span>
            </div>
          </div>

          {/* Distance */}
          <div className="flex items-center justify-end mt-1">
            {displayDistance && displayDistance !== "0 km" && (
              <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded">
                {displayDistance}
              </span>
            )}
          </div>

          {/* Address - Clickable to redirect to store */}
          {store.address && (
            <ConditionalLink
          href={`/stores/${store.slug}`}
          disableRedirect={disableRedirect}
        >
              <div
                className={`flex items-start gap-1.5 mt-2 transition-opacity ${
                  disableRedirect
                    ? "cursor-default"
                    : "cursor-pointer hover:opacity-70"
                }`}
              >
                <MapPin
                  width={13}
                  height={13}
                  className="text-gray-400 flex-shrink-0 mt-0.5"
                />
                <p className="text-xs text-default-600 line-clamp-1">
                  {store.address}
                </p>
              </div>
            </ConditionalLink>
          )}
        </div>
      </div>

      {/* Pointer Arrow - shows above on top */}
      {shouldShowAbove && (
        <div className="flex justify-center mt-0.5 pointer-events-none">
          <div
            className="w-0 h-0 border-l-3 border-r-3 border-b-3 border-l-transparent border-r-transparent border-b-white dark:border-b-content2 drop-shadow-sm"
            style={{ marginTop: "12px" }}
          />
        </div>
      )}
    </div>
  );
};

export default StoreMarkerPopup;
