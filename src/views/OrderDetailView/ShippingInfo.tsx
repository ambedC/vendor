import React, { FC } from "react";
import { Avatar, Card, CardBody, CardHeader } from "@heroui/react";
import { Order } from "@/types/ApiResponse";
import { Map, MapPin, Phone, Store } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getSpecificStore } from "@/routes/api";

interface ShippingInfoProps {
  order: Order;
}

const ShippingInfo: FC<ShippingInfoProps> = ({ order }) => {
  const { t } = useTranslation();
  const isPickup = order.delivery_type === "pickup";
  const uniqueStores = React.useMemo(() => {
    const storesMap = new globalThis.Map<number, any>();
    order.items?.forEach((item) => {
      if (item.store && item.store.id) {
        storesMap.set(item.store.id, item.store);
      }
    });
    const stores = Array.from(storesMap.values());
    if (stores.length === 0) {
      stores.push({
        id: "fallback",
        name: order.shipping_name,
        address: [order.shipping_address_1, order.shipping_address_2].filter(Boolean).join(", "),
        latitude: order.shipping_latitude,
        longitude: order.shipping_longitude,
      });;
    }
    return stores;
  }, [
    order.items,
    order.shipping_name,
    order.shipping_address_1,
    order.shipping_address_2,
    order.shipping_latitude,
    order.shipping_longitude,
  ]);

  const [storeAddresses, setStoreAddresses] = React.useState<
    Record<string, { address?: string; latitude?: number; longitude?: number }>
  >({});

  React.useEffect(() => {
    if (!isPickup) return;

    uniqueStores.forEach((store) => {
      if (
        store.slug &&
        store.id !== "fallback" &&
        !store.address &&
        !storeAddresses[store.slug]
      ) {
        getSpecificStore(store.slug)
          .then((res) => {
            if (res.success && res.data) {
              const storeData: any = res.data;
              setStoreAddresses((prev) => ({
                ...prev,
                [store.slug]: {
                  address: storeData.address,
                  latitude: storeData.latitude,
                  longitude: storeData.longitude,
                },
              }));
            }
          })
          .catch((err) => {
            console.error("Error fetching store info:", err);
          });
      }
    });
  }, [uniqueStores, isPickup, storeAddresses]);

  if (isPickup) {
    return (
      <Card shadow="sm" radius="sm">
        <CardHeader className="pb-2 flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {uniqueStores.length > 1
                ? t("pickupStoresInfo") || "Stores Pickup Address"
                : t("pickupStoreInfo") || "Store Pickup Address"}
            </h3>
          </div>
        </CardHeader>

        <CardBody className="pt-0 divide-y divide-gray-100 dark:divide-gray-800 space-y-3">
          {uniqueStores.map((store: any, index) => {
            const fetchedInfo = storeAddresses[store.slug] || {};
            const lat = store?.latitude || fetchedInfo.latitude || (index === 0 ? order.shipping_latitude : undefined);
            const lng = store?.longitude || fetchedInfo.longitude || (index === 0 ? order.shipping_longitude : undefined);
            const address = store?.address || fetchedInfo.address || (index === 0 ? [order.shipping_address_1, order.shipping_address_2].filter(Boolean).join(", ") : undefined);

            return (
              <div
                key={store.id || index}
                className={`flex flex-col gap-2 ${index === 0 ? "pt-0" : "pt-3"}`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-start gap-3">
                    <Avatar
                      showFallback
                      icon={<Store className="w-4 h-4" />}
                      size="sm"
                      className="shrink-0 w-8 h-8 text-[10px]"
                      title={store?.name}
                    />

                    <div className="flex-1 space-y-1">
                      {/* Store Name */}
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {store?.name}
                      </div>

                      {/* Full Address */}
                      {address && (
                        <div className="text-xs text-gray-600 dark:text-gray-300 leading-snug space-y-1">
                          <div className="flex items-start gap-1">
                            <MapPin className="w-3.5 h-3.5 mt-0.5 text-gray-500 dark:text-gray-400 shrink-0" />
                            <span>{address}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Google Maps Link */}
                  {lat && lng && (
                    <div className="flex items-center gap-1 text-xs shrink-0 pt-1">
                      <Map className="w-3.5 h-3.5 text-primary-500" />
                      <a
                        href={`https://www.google.com/maps?q=${lat},${lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 dark:text-primary-400 font-medium"
                        title={t("viewOnMap")}
                      >
                        {t("viewOnMap")}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </CardBody>
      </Card>
    );
  }

  return (
    <Card shadow="sm" radius="sm">
      <CardHeader className="pb-2 flex justify-between items-start">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {t("shippingAddress")}
          </h3>
        </div>
        {/* Google Maps Link */}
        {order.shipping_latitude && order.shipping_longitude && (
          <div className="flex items-center gap-1 text-xs">
            <Map className="w-3.5 h-3.5 text-primary-500" />
            <a
              href={`https://www.google.com/maps?q=${order.shipping_latitude},${order.shipping_longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 dark:text-primary-400"
              title={t("viewOnMap")}
            >
              {t("viewOnMap")}
            </a>
          </div>
        )}
      </CardHeader>

      <CardBody className="pt-0">
        <div className="flex items-start gap-3">
          <Avatar
            showFallback
            name={order.shipping_name}
            size="sm"
            className="shrink-0 w-8 h-8 text-[10px]"
            title={order.shipping_name}
          />

          <div className="flex-1 space-y-1">
            {/* Name */}
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {order.shipping_name}
            </div>

            {/* Full Address */}
            <div className="text-xs text-gray-600 dark:text-gray-300 leading-snug space-y-1">
              {[
                [order.shipping_address_1, order.shipping_address_2]
                  .filter(Boolean)
                  .join(", "),
                `${order.shipping_city}, ${order.shipping_state} ${order.shipping_zip}, ${order.shipping_country}`,
              ].map((line, idx) => (
                <div key={idx} className="flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 text-gray-500 dark:text-gray-400" />
                  <span>{line}</span>
                </div>
              ))}
            </div>

            {/* Phone */}
            {order.shipping_phone && (
              <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300 mt-1">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                <span>{order.shipping_phone}</span>
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default ShippingInfo;
