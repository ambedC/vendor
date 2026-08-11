import { FC, useEffect, useState, useCallback } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Card,
  CardBody,
  Chip,
  Spinner,
  CardHeader,
} from "@heroui/react";
import {
  ApiResponse,
  DeliveryLocationResponse,
  Order,
} from "@/types/ApiResponse";
import { getDeliveryBoyLocation } from "@/routes/api";
import OpenStreetMapTracking from "@/components/Location/OpenStreetMapTracking";
import {
  MapPin,
  Package,
  User,
  Phone,
  Clock,
  Navigation,
  RefreshCcw,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
}

const TrackOrderModal: FC<TrackOrderModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  const { t } = useTranslation();
  const [deliveryData, setDeliveryData] =
    useState<DeliveryLocationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDeliveryBoyLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res: ApiResponse<DeliveryLocationResponse> =
        await getDeliveryBoyLocation(order.slug);
      if (res.success && res.data) {
        setDeliveryData(res.data);
      } else {
        setError(res.message || t("trackOrderModal.error.fetchFailed"));
      }
    } catch (err) {
      setError(t("trackOrderModal.error.generic"));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [order.slug, t]);

  useEffect(() => {
    if (isOpen) {
      fetchDeliveryBoyLocation();
      const interval = setInterval(fetchDeliveryBoyLocation, 2000); // Poll every 2 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen, fetchDeliveryBoyLocation]);

  const getStatusColor = (
    status: string,
  ):
    | "success"
    | "warning"
    | "danger"
    | "default"
    | "primary"
    | "secondary"
    | undefined =>
    (
      ({
        delivered: "success",
        out_for_delivery: "warning",
        cancelled: "danger",
      }) as const
    )[status] || "default";

  const formatStatus = (status: string) =>
    status
      .split("_")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="4xl"
      scrollBehavior="inside"
      classNames={{ base: "max-h-[85vh]", body: "p-0" }}
    >
      <ModalContent>
        <ModalHeader className="flex justify-between items-center  px-4">
          <div className="flex items-center gap-2">
            <div>
              <div className="flex gap-2 justify-start items-center">
                <h2 className="text-lg font-semibold">{t("trackOrder")}</h2>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={fetchDeliveryBoyLocation}
                >
                  <RefreshCcw className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-foreground/70">
                {t("trackOrderModal.orderNumber", { slug: order.id })}
              </p>
            </div>
          </div>
        </ModalHeader>

        <ModalBody>
          {isLoading && !deliveryData ? (
            <div className="flex flex-col items-center justify-center min-h-[450px] gap-4">
              <Spinner size="lg" color="primary" />
              <p className="text-sm text-gray-500">
                {t("trackOrderModal.loading")}
              </p>
            </div>
          ) : error && !deliveryData ? (
            <div className="flex flex-col items-center justify-center min-h-[450px] gap-4">
              <p className="text-red-500 text-sm">{error}</p>
              <Button
                size="sm"
                className="text-xs"
                onPress={fetchDeliveryBoyLocation}
              >
                {t("try_again")}
              </Button>
            </div>
          ) : deliveryData ? (
            <>
              <div className="h-[420px] rounded-md overflow-hidden">
                <OpenStreetMapTracking
                  data={deliveryData}
                  isLoading={isLoading}
                  useTransportLayer={false}
                />
              </div>

              <div className="p-4 space-y-3 overflow-y-scroll">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Card>
                    <CardBody className="p-3 gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Package className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="text-xs text-foreground/70">
                              {t("trackOrderModal.orderStatus")}
                            </p>
                            <Chip
                              size="sm"
                              color={getStatusColor(
                                deliveryData.order.status || "",
                              )}
                              variant="flat"
                              className="text-[11px]"
                            >
                              {formatStatus(deliveryData.order.status)}
                            </Chip>
                          </div>
                        </div>
                        <div className="text-right text-xs">
                          <p className="text-foreground/70">
                            {t("estimatedDelivery")}
                          </p>
                          <p className="font-semibold">
                            {deliveryData.order.estimated_delivery_time}{" "}
                            {t("mins")}
                          </p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>

                  {deliveryData.delivery_boy.data && (
                    <Card>
                      <CardBody className="p-3 gap-2">
                        <div className="flex items-start gap-3">
                          <User className="w-6 h-6 text-green-600" />
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <p className="text-sm font-medium">
                                {
                                  deliveryData.delivery_boy.data.delivery_boy
                                    .full_name
                                }
                              </p>
                              <Chip
                                color="success"
                                size="sm"
                                variant="flat"
                                className="text-[11px]"
                              >
                                {t("trackOrderModal.active")}
                              </Chip>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-foreground/70">
                              <Phone className="w-3 h-3" />
                              {deliveryData.order.delivery_boy_phone}
                              <Navigation className="w-3 h-3" />
                              {
                                deliveryData.delivery_boy.data.delivery_boy
                                  .vehicle_type
                              }
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  )}
                </div>

                <Card>
                  <CardHeader className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      <p className="font-medium text-sm">
                        {t("trackOrderModal.deliveryRoute")}
                      </p>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2 text-foreground/70">
                        <Clock className="w-3 h-3" />
                        {t("trackOrderModal.totalDistance")}
                      </div>
                      <p className="font-medium ml-1">
                        {Number(deliveryData.route.total_distance) < 1
                          ? `${(Number(deliveryData.route.total_distance) * 1000).toFixed(0)} m`
                          : `${Number(deliveryData.route.total_distance).toFixed(1)} km`}
                      </p>
                    </div>
                  </CardHeader>
                  <CardBody className="p-3 space-y-0">
                    {deliveryData.route.route_details
                      .filter((s) => s.store_id !== null)
                      .map((store, index, array) => {
                        const isLastStore = index === array.length - 1;
                        return (
                          <div key={index} className="relative pl-8 pb-4">
                            {/* Dotted connector - only if not last store */}
                            {!isLastStore && (
                              <div className="absolute left-[11px] top-6 h-full border-l-2 border-dotted border-gray-300"></div>
                            )}

                            {/* If this is the last store, draw dotted line down to address */}
                            {isLastStore && (
                              <div className="absolute left-[11px] top-6 h-full border-l-2 border-dotted border-gray-300"></div>
                            )}

                            {/* Number Circle */}
                            <div className="absolute left-0 top-0 w-6 h-6 flex items-center justify-center bg-blue-500 text-white rounded-full text-xs font-bold">
                              {index + 1}
                            </div>

                            {/* Store Info */}
                            <p className="font-medium text-xs">
                              {store.store_name}
                            </p>
                            <p className="text-gray-500 text-[11px]">
                              {store.address}
                            </p>
                            {store.distance_from_previous && (
                              <p className="text-[10px] text-gray-400">
                                {store.distance_from_previous.toFixed(2)} km
                              </p>
                            )}
                          </div>
                        );
                      })}

                    {/* Delivery Address */}
                    <div className="relative pl-8">
                      <div className="absolute left-0 top-0 w-6 h-6 flex items-center justify-center bg-red-500 text-white rounded-full">
                        🏠
                      </div>

                      <p className="font-medium text-xs">
                        {t("address.deliveryAddress")}
                      </p>
                      <p className="text-gray-500 text-[11px]">
                        {deliveryData.order.shipping_address_1}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {deliveryData.order.shipping_city},{" "}
                        {deliveryData.order.shipping_state}
                      </p>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </>
          ) : null}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default TrackOrderModal;
