import {
  Button,
  Card,
  CardBody,
  CardHeader,
  useDisclosure,
  Chip,
} from "@heroui/react";
import { MapPin, Plus, ChevronDown } from "lucide-react";
import { FC, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import useSWR, { mutate } from "swr";
import { setSelectedAddress } from "@/lib/redux/slices/checkoutSlice";
import AddressSelectionModal from "../Modals/AddressSelectionModal";
import { getAddresses } from "@/routes/api";
import { updateCartData } from "@/helpers/updators";
import { useTranslation } from "react-i18next";
import { getCookie } from "@/lib/cookies";
import { UserLocation } from "../Location/types/LocationAutoComplete.types";
import { Address } from "@/types/ApiResponse";

type AddressSectionProps = {
  onAddAddressModalOpen: () => void;
};

const AddressSection: FC<AddressSectionProps> = ({ onAddAddressModalOpen }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { t } = useTranslation();
  const { cartData } = useSelector((state: RootState) => state.cart);
  const zone_id = cartData?.delivery_zone?.zone_id || "";

  const dispatch = useDispatch();
  const selectedAddress = useSelector(
    (state: RootState) => state.checkout.selectedAddress
  );

  const [tempSelectedId, setTempSelectedId] = useState<string>("");
  const [allAddresses, setAllAddresses] = useState<Address[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddressesLoading, setIsAddressesLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isInitialMount = useRef(true);

  // Create SWR keys that include resetTrigger to force refetch on reset
  const initialDataKey = useMemo(
    () => ["/cart-addresses/initial", zone_id] as const,
    [zone_id]
  );

  // Fetch initial data to get total count
  const { data: initialData, isLoading: initialLoading } = useSWR(
    initialDataKey,
    async () => {
      const location = getCookie("userLocation") as UserLocation | undefined;
      const { lat = "", lng = "" } = location || {};
      const response = await getAddresses({
        page: 1,
        per_page: 1,
        latitude: lat,
        longitude: lng,
        zone_id,
      });
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch addresses");
      }
      return {
        addresses: response.data.data || [],
        total: response.data.total || 0,
      };
    }
  );

  // Derive total from initialData
  const total = initialData?.total || 0;
  const initialFetchDone = !!initialData;

  const fetchAddressesData = useCallback(
    async (page: number, perPage: number = 10) => {
      const location = getCookie("userLocation") as UserLocation | undefined;
      const { lat = "", lng = "" } = location || {};
      const response = await getAddresses({
        page,
        per_page: perPage,
        latitude: lat,
        longitude: lng,
        zone_id,
      });
      if (!response.success) {
        throw new Error(response.message || "Failed to fetch addresses");
      }

      const data = response.data;
      let addressesArray: Address[] = [];

      if (data && typeof data === "object" && "data" in data) {
        const nestedData = (data as any).data;
        if (Array.isArray(nestedData)) {
          addressesArray = nestedData;
        } else if (nestedData && typeof nestedData === "object") {
          addressesArray = Object.values(nestedData);
        }
      } else if (Array.isArray(data)) {
        addressesArray = data;
      }

      return addressesArray;
    },
    [zone_id]
  );

  // Clear redux selected address on initial mount
  useEffect(() => {
    if (isInitialMount.current) {
      dispatch(setSelectedAddress(null));
      isInitialMount.current = false;
    }
  }, [dispatch]);

  // Reset function
  const handleReset = useCallback(async () => {
    // Reset local state and trigger refetch
    setAllAddresses([]);
    setCurrentPage(1);
    setTempSelectedId("");

    // Clear SWR cache for address-related keys
    await mutate(
      (key) =>
        Array.isArray(key) &&
        typeof key[0] === "string" &&
        key[0].includes("/cart-addresses"),
      undefined,
      { revalidate: true }
    );
  }, []);

  // Handle modal opening
  const handleSelectAddressClick = useCallback(async () => {
    setTempSelectedId(selectedAddress?.id?.toString() || "");
    onOpen();

    if (allAddresses.length === 0 && total > 0) {
      setIsAddressesLoading(true);
      try {
        const addresses = await fetchAddressesData(1);
        setAllAddresses(addresses);
        setCurrentPage(1);
      } catch (error) {
        console.error("Error fetching initial addresses:", error);
      } finally {
        setIsAddressesLoading(false);
      }
    }
  }, [allAddresses.length, total, selectedAddress, onOpen, fetchAddressesData]);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || allAddresses.length >= total) return;

    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const addresses = await fetchAddressesData(nextPage);
      setAllAddresses((prev) => [...prev, ...addresses]);
      setCurrentPage(nextPage);
    } catch (error) {
      console.error("Error loading more addresses:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    isLoadingMore,
    allAddresses.length,
    total,
    currentPage,
    fetchAddressesData,
  ]);

  const handleModalSelection = useCallback((addressId: string) => {
    setTempSelectedId(addressId);
  }, []);

  const handleConfirmSelection = useCallback(() => {
    if (tempSelectedId) {
      const selectedAddr = allAddresses.find(
        (addr) => addr.id.toString() === tempSelectedId
      );
      if (selectedAddr) {
        updateCartData(false, false, selectedAddr?.id?.toString() || "");

        dispatch(setSelectedAddress(selectedAddr));
        onOpenChange();
      }
    }
  }, [tempSelectedId, allAddresses, dispatch, onOpenChange]);

  const getAddressTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "home":
        return "success" as const;
      case "work":
        return "primary" as const;
      case "other":
        return "warning" as const;
      default:
        return "default" as const;
    }
  };

  const getAddressTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "home":
        return "🏠";
      case "work":
        return "🏢";
      case "other":
        return "📍";
      default:
        return "📍";
    }
  };

  const isLoading = initialLoading || isAddressesLoading;

  return (
    <>
      {/* Main Address Display Card */}
      <Card className="w-full" shadow="sm">
        <CardHeader className="flex justify-between flex-col sm:flex-row items-start pb-2 gap-2 w-full">
          <div className="flex items-center gap-3">
            <Button isIconOnly variant="flat" color="primary">
              <MapPin className="w-5 h-5 text-primary-600" />
            </Button>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {t("address.deliveryAddress")}
              </h3>
              <p className="text-xxs md:text-xs text-default-500">
                {t("address.chooseLocation")}
              </p>
            </div>
          </div>
          <div className="flex gap-2 sm:justify-end justify-between items-center w-full sm:w-fit">
            {/* Reset Button */}
            <button
              id="reset-cart-addresses"
              className="text-xs hidden"
              onClick={handleReset}
              disabled={isLoading}
            >
              {t("reset")}
            </button>
            <Button
              size="sm"
              color="primary"
              variant="flat"
              startContent={<Plus className="w-4 h-4" />}
              className="text-xs"
              onPress={onAddAddressModalOpen}
            >
              {t("address.addNew")}
            </Button>
            <div className="space-y-3">
              <Button
                variant="bordered"
                color="primary"
                className="text-xs"
                size="sm"
                fullWidth
                onPress={handleSelectAddressClick}
                startContent={<MapPin className="w-4 h-4" />}
                endContent={<ChevronDown className="w-4 h-4" />}
                isDisabled={!initialFetchDone || total === 0}
                isLoading={isLoading}
              >
                {!initialFetchDone
                  ? t("address.loading")
                  : total === 0
                    ? t("address.noAddresses")
                    : t("address.selectAddress")}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardBody className="pt-0">
          {initialFetchDone && total === 0 && (
            <div className="w-full text-center rounded-lg">
              <div className="max-w-md mx-auto">
                <div className="w-10 h-10 mx-auto mb-2 bg-gray-200 rounded-full flex items-center justify-center">
                  <Plus className="w-5 h-5 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium mb-2">
                  {t("pages.addresses.noAddresses")}
                </h3>
              </div>
            </div>
          )}
          {selectedAddress ? (
            // Show selected address with option to change
            <Button
              variant="bordered"
              className="w-full h-auto p-4 justify-start hover:bg-default-50 transition-colors"
              onPress={handleSelectAddressClick}
              endContent={<ChevronDown className="w-4 h-4 text-default-400" />}
            >
              <div className="flex items-start gap-3 w-full">
                <div className="text-lg">
                  {getAddressTypeIcon(selectedAddress.address_type)}
                </div>
                <div className="flex flex-col items-start gap-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Chip
                      size="sm"
                      color={getAddressTypeColor(selectedAddress.address_type)}
                      variant="flat"
                      className="text-xs capitalize"
                    >
                      {selectedAddress.address_type}
                    </Chip>
                  </div>
                  <p className="text-xs sm:text-sm text-left text-foreground line-clamp-1 max-w-[50vw] text-ellipsis">
                    {selectedAddress.address_line1}
                    {selectedAddress.address_line2 &&
                      `, ${selectedAddress.address_line2}`}
                  </p>
                  <p className="text-xs text-default-500 text-left">
                    {selectedAddress.city}, {selectedAddress.state}{" "}
                    {selectedAddress.zipcode}
                  </p>
                </div>
              </div>
            </Button>
          ) : (
            // Show placeholder when no address is selected and we have addresses available
            initialFetchDone &&
            total > 0 && (
              <div className="p-4 border-2 border-dashed border-default-200 rounded-lg text-center">
                <p className="text-sm text-default-500 mb-2">
                  {t("address.noSelected")}
                </p>

                <Button
                  variant="flat"
                  color="primary"
                  size="sm"
                  className="text-xs"
                  onPress={handleSelectAddressClick}
                  startContent={<MapPin className="w-4 h-4" />}
                >
                  {t("address.chooseAddress")}
                </Button>
              </div>
            )
          )}
        </CardBody>
      </Card>

      {/* Address Selection Modal */}
      <AddressSelectionModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onAddNew={onAddAddressModalOpen}
        addresses={allAddresses}
        selectedAddressId={selectedAddress?.id?.toString() || null}
        tempSelectedId={tempSelectedId}
        handleModalSelection={handleModalSelection}
        handleConfirmSelection={handleConfirmSelection}
        getAddressTypeIcon={getAddressTypeIcon}
        getAddressTypeColor={getAddressTypeColor}
        isLoading={isAddressesLoading}
        totalAddresses={total}
        onLoadMore={handleLoadMore}
        isLoadingMore={isLoadingMore}
      />
    </>
  );
};

export default AddressSection;
