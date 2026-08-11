import React, { useState } from "react";
import { Avatar, Chip, Image } from "@heroui/react";
import { MapPin, Phone, Mail, Clock, Star, Package, Award } from "lucide-react";
import { Store } from "@/types/ApiResponse";
import { useTranslation } from "react-i18next";
import Lightbox from "yet-another-react-lightbox";

interface StoreProfileProps {
  store: Store;
}

/* --------------------------------------------
   Original Store Content (for Desktop)
--------------------------------------------- */
const StoreContent = ({
  store,
  rating,
  t,
  textColor = "text-gray-900",
  openLightbox,
}: any) => {
  const getStatusColor = () => {
    if (!store.status.is_open) return "danger";
    return store.status.status === "online" ? "success" : "default";
  };

  const getStatusText = () => {
    if (!store.status.is_open) return "Closed";
    return store.status.status === "online" ? "Open Now" : "Offline";
  };

  return (
    <div className="relative flex md:items-end items-start gap-4 px-4 md:px-6 w-full">
      <div
        className="absolute 
             left-0 right-0 
             -top-10 h-[calc(100%+5rem)]
             z-0
             bg-linear-to-t
             to-transparent 
             md:from-black/70 
             md:via-black/60 
             md:to-transparent"
      />

      <div className="md:-translate-y-1/3">
        <Avatar
          isBordered
          src={store.logo}
          alt={store.name}
          className="w-32 h-32 sm:w-44 sm:h-44 cursor-pointer border-4 border-white"
          radius="full"
          onClick={() => openLightbox("avatar")}
        />
      </div>
      {/* Content */}
      <div className="relative z-10 p-4 sm:p-6">
        <h1 className={`text-2xl sm:text-3xl font-bold ${textColor}`}>
          {store.name}
        </h1>

        {/* Status + Products + Rating */}
        <div className="flex flex-wrap items-center gap-2.5 mt-2">
          {store.is_recommended && (
            <Chip
              size="sm"
              className="bg-linear-to-r from-blue-400 to-blue-600 capitalize text-white font-semibold shadow-sm tracking-wide border-none"
              classNames={{
                base: "h-6",
                content: "px-1.5 text-xs",
              }}
              radius="sm"
              startContent={<Award size={12} className="fill-current" />}
            >
              {t("recommended")}
            </Chip>
          )}
          <Chip
            size="sm"
            color={getStatusColor()}
            variant="dot"
            className="text-xs md:text-white"
          >
            {getStatusText()}
          </Chip>

          <Chip
            size="sm"
            variant="bordered"
            startContent={<Package className="w-4 h-4" />}
            className="font-semibold text-xs md:text-white border-white/50"
          >
            {t("products_count", { count: store.product_count })}
          </Chip>

          {rating > 0 && (
            <Chip
              size="sm"
              variant="bordered"
              startContent={
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 border-none" />
              }
              className="font-bold text-xs md:text-white border-white/50"
            >
              {rating}/5 {`(${store.total_store_feedback})`}
            </Chip>
          )}
        </div>

        {/* Description */}
        {store.description && (
          <div className="mt-3 max-w-3xl">
            <div
              className={`text-sm text-foreground/50 md:text-gray-300 leading-relaxed`}
              dangerouslySetInnerHTML={{ __html: store.description }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

/* --------------------------------------------
   Main Component
--------------------------------------------- */
const StoreProfile: React.FC<StoreProfileProps> = ({ store }) => {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);
  const [slides, setSlides] = useState<any[]>([]);

  const rating = parseFloat(store.avg_store_rating).toFixed(1) || "0.0";
  const lat = store.latitude;
  const lng = store.longitude;

  /* Lightbox handler */
  const openLightbox = (clicked: "banner" | "avatar") => {
    const banner = store.banner || "/images/roof.png";
    const avatar = store.logo || "/images/roof.png";

    setSlides(
      clicked === "avatar"
        ? [{ src: avatar }, { src: banner }]
        : [{ src: banner }, { src: avatar }]
    );
    setOpen(true);
  };

  const getStatusColor = () => {
    if (!store.status.is_open) return "danger";
    return store.status.status === "online" ? "success" : "default";
  };

  const getStatusText = () => {
    if (!store.status.is_open) return t("closed") || "Closed";
    return store.status.status === "online" ?  "Open Now" : "Offline";
  };

  return (
    <div className="w-full mx-auto rounded-3xl overflow-hidden bg-white dark:bg-content1 shadow-md">
      <Lightbox open={open} close={() => setOpen(false)} slides={slides} />

      {/* ================= Banner Section ================= */}
      <div className="relative h-64 sm:h-72 md:h-80 lg:h-[400px] w-full overflow-hidden">
        <div
          className="absolute inset-0 cursor-pointer"
          onClick={() => openLightbox("banner")}
        >
          <Image
            src={store.banner || "/images/roof.png"}
            alt={`${store.name} banner`}
            className="w-full h-full object-cover"
            removeWrapper
          />
        </div>

        {/* -------- Desktop Overlay (Original Style as per img-3) -------- */}
        <div className="absolute inset-0 hidden lg:flex flex-col justify-end">
          <div className="relative z-10 text-white">
            <StoreContent
              store={store}
              rating={rating}
              t={t}
              textColor="text-white"
              openLightbox={openLightbox}
            />
          </div>
        </div>
      </div>

      {/* ================= Mobile UI Update (New Design - from img-2) ================= */}
      <div className="lg:hidden relative px-6 pb-10 bg-white dark:bg-content1">
        {/* Avatar - Positioned to overlap banner from below */}
        <div className="absolute -top-16 sm:-top-20 left-6 sm:left-10 z-20">
          <Avatar
            isBordered
            src={store.logo}
            alt={store.name}
            className="w-32 h-32 sm:w-44 sm:h-44 cursor-pointer border-4 border-white dark:border-content1 bg-white dark:bg-content1"
            radius="full"
            onClick={() => openLightbox("avatar")}
          />
        </div>

        {/* Mobile Header Content */}
        <div className="pt-20 sm:pt-28 flex flex-col gap-6">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-2 flex-1">
              <h1 className="text-2xl font-black tracking-tight text-default-900 leading-tight">
                {store.name}
              </h1>
              {store.is_recommended && (
                <Chip size="sm" color="primary" variant="shadow" className="font-bold text-[10px] h-6">
                  {t("recommended")}
                </Chip>
              )}
            </div>

            {/* Simple Rating Badge */}
            {parseFloat(rating) > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 border border-divider rounded-full shrink-0">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-bold text-default-700">
                  {rating}/5 ({store.total_store_feedback})
                </span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {store.address && (
              <div className="flex items-start gap-3 text-default-500">
                <MapPin size={20} className="mt-0.5 shrink-0" />
                <span className="text-base font-medium leading-snug">{store.address}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-default-500">
              <Clock size={20} className="shrink-0 text-default-400" />
              <div className="flex items-center gap-2 text-base">
                <Chip
                  size="sm"
                  color={getStatusColor()}
                  variant="dot"
                  className="text-xs"
                >
                  {getStatusText()}
                </Chip>
                {store.timing && <span className="text-default-400 font-medium">• {store.timing}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Contact Links */}
        <div className="mt-8 flex flex-col gap-4 pt-8 border-t border-divider">
          {store.contact_number && (
            <a href={`tel:${store.contact_number}`} className="flex items-center gap-4 text-default-600">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-default-100">
                <Phone size={18} />
              </div>
              <span>{store.contact_number}</span>
            </a>
          )}
          {store.contact_email && (
            <a href={`mailto:${store.contact_email}`} className="flex items-center gap-4 text-default-600">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-default-100">
                <Mail size={18} />
              </div>
              <span className="truncate flex-1">{store.contact_email}</span>
            </a>
          )}
        </div>
      </div>

      {/* ================= Desktop Contact Bar (as per img-3) ================= */}
      <div className="hidden lg:flex items-center justify-between px-10 py-6 bg-white dark:bg-content1 border-t border-divider text-default-600">
        <div className="flex items-center gap-10 w-full overflow-x-auto no-scrollbar">
          {store.timing && (
            <div className="flex items-center gap-2.5 shrink-0">
              <Clock size={20} className="text-default-400" />
              <span className="text-sm font-semibold">{store.timing}</span>
            </div>
          )}

          {store.address && (
            <div className="flex items-center gap-2.5 shrink-0 max-w-xs xl:max-w-md">
              <MapPin size={20} className="text-default-400" />
              <a
                href={`https://www.google.com/maps?q=${lat},${lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold hover:underline truncate"
              >
                {store.address}
              </a>
            </div>
          )}

          {store.contact_number && (
            <div className="flex items-center gap-2.5 shrink-0 ml-auto">
              <Phone size={20} className="text-default-400" />
              <a href={`tel:${store.contact_number}`} className="text-sm font-semibold hover:underline">
                {store.contact_number}
              </a>
            </div>
          )}

          {store.contact_email && (
            <div className="flex items-center gap-2.5 shrink-0">
              <Mail size={20} className="text-default-400" />
              <a href={`mailto:${store.contact_email}`} className="text-sm font-semibold hover:underline">
                {store.contact_email}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreProfile;
