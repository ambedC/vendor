import { FC, useState, useEffect, useMemo } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  useDisclosure,
  Textarea,
  Divider,
  Tabs,
  Tab,
  Alert,
} from "@heroui/react";
import { Shield, Edit } from "lucide-react";
import AddressModal from "../../components/Modals/AddressModal";
import AddressSection from "@/components/Cart/AddressSection";
import { setOrderNote, setDeliveryMode, setRusDelivery, setPromoCode } from "@/lib/redux/slices/checkoutSlice";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { getPickupSettings } from "@/routes/api";
import { debounce } from "lodash";
import { updateCartData } from "@/helpers/updators";
import ExpressDelivery from "@/components/Cart/ExpressDelivery";
import PromoCodeSection from "@/components/Cart/PromoCodeSection";
import SimilarProductsSection from "@/components/Products/ProductDetailPage/SimilarProductsSection";
import useSWR from "swr";
import { getProducts } from "@/routes/api";
import { useTranslation } from "react-i18next";
import { getCookie } from "@/lib/cookies";
import { UserLocation } from "@/components/Location/types/LocationAutoComplete.types";
import { CartResponse } from "@/types/ApiResponse";
import SaveForLaterItems from "./SaveForLaterItems";

interface CartAdditionalInfoProps {
  cart?: CartResponse | null;
}

const CartAdditionalInfo: FC<CartAdditionalInfoProps> = ({ cart }) => {
  const { t } = useTranslation();
  const [deliveryInstructions, setDeliveryInstructions] = useState<string>("");
  const userLocation = getCookie("userLocation") as UserLocation;
  const items = cart?.items ?? [];

  const ProductSlugs =
    items?.length > 0 &&
    items
      ?.map((item: { product?: { slug?: string } }) => item?.product?.slug)
      .filter((slug: string | undefined): slug is string => !!slug)
      .join(", ");

  const {
    data: productsData,
    isLoading: isProductsLoading,
    mutate,
  } = useSWR("/you-might-also-like", () =>
    getProducts({
      per_page: 10,
      page: 1,
      latitude: userLocation.lat,
      longitude: userLocation.lng,
      exclude_product: ProductSlugs || "",
      include_child_categories: 0,
    })
  );

  // Fetch similar products for "You might also like" section

  const {
    isOpen: isAddressModalOpen,
    onOpen: onAddressModalOpen,
    onClose: onAddressModalClose,
  } = useDisclosure();
  const dispatch = useDispatch();

  const debouncedDispatch = useMemo(() => {
    return debounce((note: string) => {
      dispatch(setOrderNote(note));
    }, 500);
  }, [dispatch]);

  const { deliveryMode } = useSelector((state: RootState) => state.checkout);

  const { data: pickupSettingsRes } = useSWR("/settings/pickup", () => getPickupSettings());
  const isGlobalPickupEnabled = pickupSettingsRes?.success && pickupSettingsRes?.data?.value?.enabled;

  const storesNotSupportingPickup = useMemo(() => {
    if (!cart?.items) return [];
    const storesMap = new Map<number, string>();
    cart.items.forEach((item) => {
      if (!item.store?.allows_pickup) {
        storesMap.set(item.store.id, item.store.name);
      }
    });
    return Array.from(storesMap.values());
  }, [cart]);

  const allStoresAllowPickup = storesNotSupportingPickup.length === 0;



  useEffect(() => {
    debouncedDispatch(deliveryInstructions);
    return debouncedDispatch.cancel;
  }, [deliveryInstructions, debouncedDispatch]);

  return (
    <div className="space-y-4">
      <button
        onClick={() => mutate()}
        id="refetch-similar-products"
        className="hidden"
      />

      {isGlobalPickupEnabled && (
        <div className="w-full mb-4">
          <Tabs
            aria-label="Delivery Mode"
            selectedKey={deliveryMode}
            onSelectionChange={(key) => {
              const mode = key as 'delivery' | 'pickup';
              dispatch(setDeliveryMode(mode));
              if (mode === 'delivery') {
                dispatch(setPromoCode(""));
              }
              if (mode === 'pickup') {
                dispatch(setRusDelivery(false));
              }
              setTimeout(() => {
                updateCartData(true, false);
              }, 100);
            }}
            color="primary"
            variant="solid"
            className="w-full"
            classNames={{
              tabList: "w-full bg-default-100 p-1 rounded-xl",
              tab: "py-2.5",
              tabContent: "font-semibold text-xs md:text-sm"
            }}
          >
            <Tab
              key="delivery"
              title={
                <div className="flex items-center gap-2">
                  <span> {t("cart.deliveryMode.delivery")}</span>
                </div>
              }
            />
            <Tab
              key="pickup"
              title={
                <div className="flex items-center gap-2">
                  <span>{t("cart.deliveryMode.pickup")}</span>
                </div>
              }
              isDisabled={!allStoresAllowPickup}
            />
          </Tabs>
        </div>
      )}

      {isGlobalPickupEnabled && !allStoresAllowPickup && (
        <Alert
          color="warning"
          variant="flat"
          title={t("cart.pickup.not_supported_title") || "Self-Pickup Not Supported"}
          description={
            (t("cart.pickup.not_supported_desc") || "To place a pickup order, please remove items from the following stores from your cart or select delivery instead:") +
            " " +
            storesNotSupportingPickup.join(", ")
          }
          className="mb-4 text-xs"
        />
      )}

      {deliveryMode === "delivery" && (
        <>
          <AddressSection onAddAddressModalOpen={onAddressModalOpen} />
          <ExpressDelivery />
        </>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Delivery / Order Instructions */}
        <Card className="w-full" radius="md" shadow="sm">
          <CardHeader className="flex gap-3 relative flex-col items-start pb-0">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-warning-100 rounded-lg">
                <Edit className="w-5 h-5 text-warning" />
              </div>
              <div className="flex flex-col">
                <p className="text-xs md:text-small font-semibold">
                  {deliveryMode === "pickup"
                    ? t("cart.orderInstructions.title")
                    : t("cart.deliveryInstructions.title")}
                </p>
                <p className="text-xxs md:text-xs text-default-500">
                  {deliveryMode === "pickup"
                    ? t("cart.orderInstructions.description")
                    : t("cart.deliveryInstructions.description")}
                </p>
              </div>
            </div>
            <Divider orientation="horizontal" />
          </CardHeader>
          <CardBody>
            <Textarea
              placeholder={
                deliveryMode === "pickup"
                  ? t("cart.orderInstructions.placeholder")
                  : t("cart.deliveryInstructions.placeholder")
              }
              value={deliveryInstructions}
              onValueChange={setDeliveryInstructions}
              minRows={3}
              maxRows={3}
              isClearable
            />
          </CardBody>
        </Card>

        {/* Promo Code Section */}
        <PromoCodeSection />
      </div>

      {/* Cancellation Policy */}
      <Card className="w-full hidden" radius="md" shadow="sm">
        <CardHeader className="flex gap-3 relative flex-col items-start pb-0">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-default-500" />
            <div className="flex flex-col">
              <p className="text-xs md:text-small font-semibold">
                {t("cart.cancellationPolicy.title")}
              </p>
              <p className="text-xxs md:text-xs text-default-500">
                {t("cart.cancellationPolicy.description")}
              </p>
            </div>
          </div>
          <Divider orientation="horizontal" className="pb-0" />
        </CardHeader>
        <CardBody className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <p className="text-xs">
                {t("cart.cancellationPolicy.freeCancellation")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-warning rounded-full"></div>
              <p className="text-xs">
                {t("cart.cancellationPolicy.partialRefund")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-danger rounded-full"></div>
              <p className="text-xs">{t("cart.cancellationPolicy.noRefund")}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      <SaveForLaterItems moreProductsInline={false} />

      {/* You might also like - similar products */}
      <SimilarProductsSection
        initialSimilarProducts={
          (productsData && productsData.data && productsData.data.data) || []
        }
        isLoading={isProductsLoading}
        title={t("youMightAlsoLike") || "You might also like"}
        page="cart"
      />

      <AddressModal
        isOpen={isAddressModalOpen}
        onOpenChange={(state) =>
          state ? onAddressModalOpen() : onAddressModalClose()
        }
        onSave={() => {
          document.getElementById("reset-cart-addresses")?.click();
        }}
      />
    </div>
  );
};

export default CartAdditionalInfo;
