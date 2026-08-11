import React from "react";
import { Card, CardBody, CardFooter, Chip } from "@heroui/react";
import { DeliveryZone } from "@/types/ApiResponse";
import { useRouter } from "next/router";
import { useSettings } from "@/contexts/SettingsContext";
import { formatString } from "@/helpers/validator";
import { useTranslation } from "react-i18next";

interface DeliveryZoneCardProps {
  zone: DeliveryZone;
}

const DeliveryZoneCard: React.FC<DeliveryZoneCardProps> = ({ zone }) => {
  const router = useRouter();
  const { t } = useTranslation();
  const { currencySymbol } = useSettings();

  return (
    <Card
      onPress={() => router.push(`/delivery-zones/${zone.id}`)}
      isPressable
      isHoverable
      as={"div"}
      className="w-full h-full"
    >
      <CardBody className="p-0 overflow-hidden">
        <div className="relative w-full h-32 bg-center bg-contain bg-[url('/images/map-pin.png')]">
          <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent p-2">
            <h3 className="text-white font-semibold text-sm truncate">
              {zone.name}
            </h3>
          </div>
        </div>
      </CardBody>
      <CardFooter className="flex flex-col items-start gap-2 p-3">
        <div className="flex justify-between w-full">
          <Chip
            size="sm"
            color={zone.status === "active" ? "success" : "danger"}
            variant="flat"
            radius="sm"
            className="text-xs"
            title={formatString(zone.status)}
          >
            {formatString(zone.status)}
          </Chip>

          {zone.rush_delivery_enabled && (
            <Chip
              size="sm"
              color="warning"
              variant="flat"
              radius="sm"
              className="text-xs"
              title={t("rushAvailable")}
            >
              {t("rushAvailable")}
            </Chip>
          )}
        </div>

        <div className="w-full mt-1 space-y-1">
          <div className="flex justify-between w-full text-xs text-foreground/50">
            <span>{t("deliveryFee")}</span>
            <span className="font-semibold">
              {currencySymbol}
              {zone.regular_delivery_charges}
            </span>
          </div>

          <div className="flex justify-between w-full text-xs text-foreground/50">
            <span>{t("freeAbove")}</span>
            {zone.free_delivery_amount ? (
              <span className="font-semibold text-success">
                {currencySymbol} {zone.free_delivery_amount}
              </span>
            ) : (
              <span className="text-foreground/50">{t("na")}</span>
            )}
          </div>

          <div className="flex justify-between w-full text-xs text-foreground/50">
            <span>{t("radius")}</span>
            <span>{zone.radius_km} km</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default DeliveryZoneCard;
