import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalFooter,
  Input,
  Select,
  SelectItem,
  Button,
  Switch,
  addToast,
} from "@heroui/react";
import { FC, useState, useRef } from "react";
import GoogleMap from "@/components/Location/GoogleMap";
import LocationAutoComplete from "@/components/Location/LocationAutoComplete";
import { Address } from "@/types/ApiResponse";
import type { LocationAutoCompleteRef } from "@/components/Location/types/LocationAutoComplete.types";
import { addAddress, editAddress } from "@/routes/api";
import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation } from "react-i18next";
import { staticLat, staticLng } from "@/config/constants";

interface AddressModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave?: (
    addressData: Omit<Address, "id" | "user_id" | "created_at" | "updated_at">,
  ) => void;
  initialData?: Partial<Address>;
}

type AddressFormData = {
  id: string | number;
  address_line1: string;
  address_line2: string;
  city: string;
  landmark: string;
  state: string;
  zipcode: string;
  mobile: string;
  address_type: "home" | "work" | "other";
  country: string;
  country_code: string;
};

const AddressModal: FC<AddressModalProps> = ({
  isOpen,
  onOpenChange,
  onSave,
  initialData,
}) => {
  const locationAutoCompleteRef = useRef<LocationAutoCompleteRef>(null);
  const { defaultLocation, demoMode } = useSettings();
  const { t } = useTranslation();

  const [isDefault, setIsDefault] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    initialData?.latitude && initialData?.longitude
      ? { lat: initialData.latitude, lng: initialData.longitude }
      : defaultLocation,
  );

  const [formData, setFormData] = useState<AddressFormData>({
    id: initialData?.id || "",
    address_line1: initialData?.address_line1 || "",
    address_line2: initialData?.address_line2 || "",
    city: initialData?.city || "",
    landmark: initialData?.landmark || "",
    state: initialData?.state || "",
    zipcode: initialData?.zipcode || "",
    mobile: initialData?.mobile || "",
    address_type:
      (initialData?.address_type as "home" | "work" | "other") || "home",
    country: initialData?.country || "India",
    country_code: initialData?.country_code || "IN",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const initialLocation =
    initialData?.latitude && initialData?.longitude
      ? {
          placeName: initialData.address_line1 || "Selected Location",
          latLng: { lat: initialData.latitude, lng: initialData.longitude },
          placeDescription: `${initialData.city || ""}, ${
            initialData.state || ""
          }`
            .trim()
            .replace(/^,|,$/, ""),
        }
      : null;

  const handleMapLocationUpdate = async (latLng: {
    lat: number;
    lng: number;
  }) => {
    setLocation(latLng);

    try {
      if (typeof window === "undefined" || !window.google?.maps?.Geocoder) {
        return;
      }

      const geocoder = new window.google.maps.Geocoder();
      const result = await geocoder.geocode({ location: latLng });

      if (result.results && result.results.length > 0) {
        const place = result.results[0];
        let city = "";
        let state = "";
        let country = "";
        let zipcode = "";
        let countryCode = "";

        for (const component of place.address_components) {
          const componentType = component.types[0];

          switch (componentType) {
            case "locality":
              city = component.long_name;
              break;
            case "administrative_area_level_1":
              state = component.long_name;
              break;
            case "country":
              country = component.long_name;
              countryCode = component.short_name;
              break;
            case "postal_code":
              zipcode = component.long_name;
              break;
          }
        }

        const addressLine1 = place.formatted_address;
        const addressLine2 = "";

        setFormData((prev) => ({
          ...prev,
          address_line1: addressLine1,
          address_line2: addressLine2,
          city: city || prev.city,
          state: state || prev.state,
          zipcode: zipcode || prev.zipcode,
          country: country || prev.country,
          country_code: countryCode || prev.country_code,
          landmark: "",
        }));

        if (locationAutoCompleteRef.current) {
          locationAutoCompleteRef.current.setInputValue(
            place.formatted_address,
          );
        }
      } else {
        console.log("No geocoding results found.");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }
  };

  const handleLocationSelect = async (locationData: {
    placeName: string;
    latLng: { lat: number; lng: number };
    placeDescription: string;
  }) => {
    setLocation(locationData.latLng);
    handleMapLocationUpdate(locationData.latLng);
  };

  const handleInputChange = (field: keyof AddressFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.address_line1.trim())
      newErrors.address_line1 = t("validation.required");
    if (!formData.city.trim()) newErrors.city = t("validation.required");
    if (!formData.state.trim()) newErrors.state = t("validation.required");
    if (!formData.zipcode.trim()) newErrors.zipcode = t("validation.required");
    if (!formData.country_code.trim())
      newErrors.country_code = "Country code is required";
    if (!formData.mobile.trim()) {
      newErrors.mobile = t("validation.mobileRequired");
    } else if (!/^\d+$/.test(formData.mobile.replace(/\s+/g, ""))) {
      newErrors.mobile = t("validation.mobileInvalid");
    }
    if (!location) newErrors.location = t("validation.locationRequired");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      if (!validateForm()) {
        addToast({
          title: "Validation Failed",
          description: "Please fill all required fields correctly.",
          color: "warning",
        });
        return;
      }

      const addressData = {
        ...formData,
        latitude: demoMode ? defaultLocation?.lat || staticLat : location!.lat,
        longitude: demoMode ? defaultLocation?.lng || staticLng : location!.lng,
      };

      const response = initialData
        ? await editAddress(addressData)
        : await addAddress(addressData);

      if (response?.success) {
        addToast({
          title: initialData
            ? t("address.toast.updateSuccess")
            : t("address.toast.addSuccess"),
          color: "success",
        });
        onSave?.(addressData);
        onOpenChange(false);
      } else {
        // Extract field-specific errors from response.data
        let errorDescription = response?.message || "Something went wrong.";

        if (response?.data && typeof response.data === "object") {
          const fieldErrors = Object.entries(response.data)
            .map(([field, errors]) => {
              console.log(field);
              if (Array.isArray(errors)) {
                return errors.join(", ");
              }
              return String(errors);
            })
            .filter(Boolean)
            .join(". ");

          if (fieldErrors) {
            errorDescription = fieldErrors;
          }
        }

        addToast({
          title: response?.message || t("address.toast.save_failed"),
          description:
            errorDescription !== response?.message
              ? errorDescription
              : undefined,
          color: "danger",
        });
      }
    } catch (error: any) {
      console.error("Save error:", error);

      // Check if error response has validation errors
      const errorResponse = error?.response?.data || error?.data;
      if (errorResponse && !errorResponse.success) {
        let errorDescription =
          errorResponse?.message || "Something went wrong.";

        if (errorResponse?.data && typeof errorResponse.data === "object") {
          const fieldErrors = Object.entries(errorResponse.data)
            .map(([field, errors]) => {
              console.log(field);
              if (Array.isArray(errors)) {
                return errors.join(", ");
              }
              return String(errors);
            })
            .filter(Boolean)
            .join(". ");

          if (fieldErrors) {
            errorDescription = fieldErrors;
          }
        }

        addToast({
          title: errorResponse?.message || t("address.toast.save_failed"),
          description:
            errorDescription !== errorResponse?.message
              ? errorDescription
              : undefined,
          color: "danger",
        });
      } else {
        addToast({
          title: t("address.toast.error"),
          description: error?.message || "An unexpected error occurred.",
          color: "danger",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      id: "",
      address_line1: "",
      address_line2: "",
      city: "",
      landmark: "",
      state: "",
      zipcode: "",
      mobile: "",
      address_type: "home",
      country: "India",
      country_code: "IN",
    });
    setLocation(defaultLocation);
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      className="max-w-5xl"
      scrollBehavior="inside"
      isDismissable={!isLoading}
    >
      <ModalContent>
        <ModalHeader>
          {initialData ? t("address.update") : t("address.addNew")}
        </ModalHeader>
        <ModalBody className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="">
            <div className="mb-4">
              <LocationAutoComplete
                ref={locationAutoCompleteRef}
                onLocationSelect={handleLocationSelect}
                initialLocation={initialLocation}
              />
            </div>
            <div className="h-[320px] md:h-[400px] rounded-lg overflow-hidden shadow-md">
              <GoogleMap
                latLng={location || { lat: 0, lng: 0 }}
                onLocationUpdate={handleMapLocationUpdate}
              />
            </div>
            {errors.location && (
              <p className="text-red-500 text-sm mt-2">{errors.location}</p>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Address Line 1"
                value={formData.address_line1}
                onChange={(e) =>
                  handleInputChange("address_line1", e.target.value)
                }
                isInvalid={!!errors.address_line1}
                errorMessage={errors.address_line1}
                isRequired
                isReadOnly={isLoading}
                classNames={{ errorMessage: "text-xs" }}
              />
              <Input
                label="Address Line 2"
                value={formData.address_line2}
                onChange={(e) =>
                  handleInputChange("address_line2", e.target.value)
                }
                isReadOnly={isLoading}
                classNames={{ errorMessage: "text-xs" }}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="City"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                isInvalid={!!errors.city}
                errorMessage={errors.city}
                isRequired
                isReadOnly={isLoading}
                classNames={{ errorMessage: "text-xs" }}
              />
              <Input
                label="State"
                value={formData.state}
                onChange={(e) => handleInputChange("state", e.target.value)}
                isInvalid={!!errors.state}
                errorMessage={errors.state}
                isRequired
                isReadOnly={isLoading}
                classNames={{ errorMessage: "text-xs" }}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Zipcode"
                value={formData.zipcode}
                onChange={(e) => handleInputChange("zipcode", e.target.value)}
                isInvalid={!!errors.zipcode}
                errorMessage={errors.zipcode}
                isRequired
                isReadOnly={isLoading}
                classNames={{ errorMessage: "text-xs" }}
              />
              <Input
                label="Mobile Number"
                value={formData.mobile}
                onChange={(e) => {
                  const value = e.target.value;
                  if (!isNaN(Number(value))) {
                    handleInputChange("mobile", value);
                  }
                }}
                isInvalid={!!errors.mobile}
                errorMessage={errors.mobile}
                isRequired
                isReadOnly={isLoading}
                classNames={{ errorMessage: "text-xs" }}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Landmark"
                value={formData.landmark}
                onChange={(e) => handleInputChange("landmark", e.target.value)}
                classNames={{ errorMessage: "text-xs" }}
              />
              <Input
                label="Country"
                value={formData.country}
                onChange={(e) => handleInputChange("country", e.target.value)}
                classNames={{ errorMessage: "text-xs" }}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Address Type"
                selectedKeys={[formData.address_type]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as
                    | "home"
                    | "work"
                    | "other";
                  handleInputChange("address_type", selected);
                }}
              >
                <SelectItem key="home" textValue={t("home_title")}>
                  {t("home_title")}
                </SelectItem>
                <SelectItem key="work" textValue={t("work")}>
                  {t("work")}
                </SelectItem>
                <SelectItem key="other" textValue={t("other")}>
                  {t("other")}
                </SelectItem>
              </Select>
              <Switch
                isSelected={isDefault}
                onValueChange={setIsDefault}
                className="hidden"
              >
                Is Default
              </Switch>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="danger"
            variant="light"
            onPress={handleClose}
            isDisabled={isLoading}
          >
            {t("cancel")}
          </Button>
          <Button color="primary" onPress={handleSave} isLoading={isLoading}>
            {initialData ? t("address.update") : t("save")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddressModal;
