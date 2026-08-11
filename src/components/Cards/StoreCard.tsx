import React, { memo } from "react";
import { Card, CardBody, Avatar, Image, Chip } from "@heroui/react";
import { MapPin, Star, Award } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Store } from "@/types/ApiResponse";

interface StoreCardProps {
  store: Store;
}

const StoreCard: React.FC<StoreCardProps> = ({ store }) => {
  const { t } = useTranslation();

  const rating = parseFloat(store.avg_store_rating).toFixed(1) || 0;
  const lat = store.latitude;
  const lng = store.longitude;
  const getStatusColor = () => {
    if (!store.status.is_open) return "danger";
    return store.status.status === "online" ? "success" : "default";
  };

  const getStatusText = () => {
    if (!store.status.is_open) return "Closed";
    return store.status.status === "online" ? "Open Now" : "Offline";
  };

  return (
    <Link href={`/stores/${store.slug}`} title={store.name}>
      <Card
        className="w-full cursor-pointer"
        shadow="sm"
        isHoverable
        as={"div"}
        disableRipple
        isDisabled={!store.status.is_open}
        isPressable={false}
      >
        <CardBody className="p-0">
          {/* Banner Image */}
          <div className="relative w-full h-24 sm:h-32">
            <div className="relative w-full h-full overflow-hidden group rounded-t-lg">
              <Image
                src={store.banner || "/images/roof.png"}
                alt={store.name}
                className="w-full h-full object-top absolute inset-0 z-10 rounded-t-lg rounded-b-none 
               transition-transform duration-300 ease-in-out group-hover:scale-110"
                removeWrapper
                loading="eager"
              />
            </div>

            {/* Store Logo Avatar - Overlapping */}
            <div className="relative">
              <Avatar
                isBordered
                color="default"
                src={store.logo}
                alt={store.name}
                className="absolute -bottom-6 left-4 w-14 h-14 sm:w-16 sm:h-16 z-20"
              />

              <span
                className={`absolute top-2 left-16 w-3.5 h-3.5 ${store.status.is_open ? "bg-green-400" : "bg-red-400"}  border-2 border-white rounded-full z-30`}
              ></span>

              {store.is_recommended && (
                <div className="absolute -bottom-7 right-4 z-30">
                  <Chip
                    className="bg-linear-to-r from-blue-400 to-blue-600 capitalize text-white font-semibold shadow-sm tracking-wide border-none"
                    classNames={{
                      base: "p-1 h-4 sm:h-5",
                      content: "p-1 text-[8px] sm:text-[10px]",
                    }}
                    radius="sm"
                    startContent={<Award size={10} className="fill-current" />}
                  >
                    {t("recommended")}
                  </Chip>
                </div>
              )}
            </div>
            {!store.status.is_open ? (
              <div className="w-full flex justify-end mt-1">
                <Chip
                  size="sm"
                  color={getStatusColor()}
                  variant="dot"
                  className="text-xxs mr-2"
                >
                  {getStatusText()}
                </Chip>
              </div>
            ) : null}

            {/* Rating Badge */}
            <div className="absolute z-20 top-2 right-2 bg-white dark:bg-content1 rounded-md px-2 py-1 flex items-center gap-1 shadow-sm">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <div className="text-xs font-semibold">
                {rating}/5{" "}
                <span className="text-xxs">
                  {`(${store.total_store_feedback})`}
                </span>
              </div>
            </div>
          </div>

          {/* Store Details */}
          <div className="px-4 pb-4 pt-8">
            {/* Store Name */}
            <h3 className="text-sm sm:text-base font-semibold mb-2 line-clamp-1">
              {store.name}
            </h3>

            {/* Location and Distance */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-start gap-1.5 flex-1">
                <MapPin className="w-3 h-3 text-foreground/50 mt-0.5 shrink-0" />
                <div
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps?q=${lat},${lng}`,
                      "_blank",
                    )
                  }
                  className="text-xxs text-foreground/60 dark:text-foreground/70 line-clamp-1 cursor-pointer"
                  title={t("viewOnMap")}
                >
                  {store.address}
                </div>
              </div>

              <Chip
                className="text-xxs"
                size="sm"
                variant="flat"
                color="success"
                radius="sm"
                classNames={{
                  content: "p-0",
                  base: "py-0 text-xxs text-foreground",
                }}
              >
                {Number(store.distance) < 1
                  ? `${(Number(store.distance) * 1000).toFixed(0)} m`
                  : `${Number(store.distance).toFixed(1)} km`}
              </Chip>
            </div>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
};

export default memo(StoreCard);
