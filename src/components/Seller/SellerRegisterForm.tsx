import { useState, useRef } from "react";
import {
  Input,
  Button,
  Card,
  CardBody,
  Divider,
  addToast,
} from "@heroui/react";
import { Upload, CheckCircle, MapPin, FileCheck, User } from "lucide-react";
import { sellerRegister } from "@/routes/api";
import { useTranslation } from "react-i18next";
import LocationAutoComplete from "@/components/Location/LocationAutoComplete";
import type { LocationAutoCompleteRef } from "@/components/Location/types/LocationAutoComplete.types";

interface FormData {
  sellerName: string;
  mobile: string;
  email: string;
  password: string;
  confirmPassword: string;
  address: string;
  city: string;
  landmark: string;
  state: string;
  zipcode: string;
  country: string;
  countryCode: string;
  latitude: string;
  longitude: string;
}

interface FileData {
  businessLicense: File | null;
  articlesOfIncorporation: File | null;
  nationalId: File | null;
  authorizedSignature: File | null;
}

// Allowed image MIME types
const validImageTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

export default function SellerRegisterForm() {
  const locationAutoCompleteRef = useRef<LocationAutoCompleteRef>(null);
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [files, setFiles] = useState<FileData>({
    businessLicense: null,
    articlesOfIncorporation: null,
    nationalId: null,
    authorizedSignature: null,
  });
  const [formData, setFormData] = useState<FormData>({
    sellerName: "",
    mobile: "",
    email: "",
    password: "",
    confirmPassword: "",
    address: "",
    city: "",
    landmark: "",
    state: "",
    zipcode: "",
    country: "",
    countryCode: "",
    latitude: "",
    longitude: "",
  });

  const resetState = () => {
    setFormData({
      sellerName: "",
      mobile: "",
      email: "",
      password: "",
      confirmPassword: "",
      address: "",
      city: "",
      landmark: "",
      state: "",
      zipcode: "",
      country: "",
      countryCode: "",
      latitude: "",
      longitude: "",
    });
    setFiles({
      businessLicense: null,
      articlesOfIncorporation: null,
      nationalId: null,
      authorizedSignature: null,
    });
    setErrors({});
    if (locationAutoCompleteRef.current) {
      locationAutoCompleteRef.current.setInputValue("");
    }
  };

  const handleLocationSelect = async (locationData: {
    placeName: string;
    latLng: { lat: number; lng: number };
    placeDescription: string;
  }) => {
    try {
      const geocoder = new window.google.maps.Geocoder();
      const result = await geocoder.geocode({ location: locationData.latLng });

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

        setFormData((prev) => ({
          ...prev,
          address: addressLine1,
          city,
          state,
          zipcode,
          country,
          countryCode: countryCode,
          latitude: locationData.latLng.lat.toString(),
          longitude: locationData.latLng.lng.toString(),
        }));

        if (locationAutoCompleteRef.current) {
          locationAutoCompleteRef.current.setInputValue(
            place.formatted_address
          );
        }
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }
  };

  const handleInputChange = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (
    name: keyof FileData,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate by MIME type
    if (!validImageTypes.includes(file.type)) {
      addToast({
        title: t("pages.sellerRegister.toast.invalidFileTitle"),
        description: t("pages.sellerRegister.toast.invalidFileDescription"),
        color: "danger",
      });
      setFiles((prev) => ({ ...prev, [name]: null }));
      setErrors((prev) => ({
        ...prev,
        [name]: t("pages.sellerRegister.error.invalidFile"),
      }));
      return;
    }

    // Valid file
    setFiles((prev) => ({ ...prev, [name]: file }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Text field validation
    if (!formData.sellerName)
      newErrors.sellerName = t("pages.sellerRegister.error.required");
    if (!formData.mobile)
      newErrors.mobile = t("pages.sellerRegister.error.required");
    if (!formData.email)
      newErrors.email = t("pages.sellerRegister.error.required");
    if (!formData.password)
      newErrors.password = t("pages.sellerRegister.error.required");
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = t(
        "pages.sellerRegister.error.passwordMismatch"
      );
    if (!formData.address)
      newErrors.address = t("pages.sellerRegister.error.required");
    if (!formData.city)
      newErrors.city = t("pages.sellerRegister.error.required");
    if (!formData.state)
      newErrors.state = t("pages.sellerRegister.error.required");
    if (!formData.zipcode)
      newErrors.zipcode = t("pages.sellerRegister.error.required");
    if (!formData.landmark)
      newErrors.landmark = t("pages.sellerRegister.error.required");
    if (!formData.country)
      newErrors.country = t("pages.sellerRegister.error.required");
    if (!formData.latitude)
      newErrors.latitude = t("pages.sellerRegister.error.required");
    if (!formData.longitude)
      newErrors.longitude = t("pages.sellerRegister.error.required");

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      addToast({
        title: t("pages.sellerRegister.toast.validationErrorTitle"),
        description: t("pages.sellerRegister.toast.validationErrorDesc"),
        color: "danger",
      });
      return false;
    }

    // File presence + type validation (extra safety)
    const missingFiles: string[] = [];
    const invalidTypes: string[] = [];

    const checkFile = (
      file: File | null,
      label: string,
      key: keyof FileData
    ) => {
      if (!file) {
        missingFiles.push(label);
        newErrors[key as string] = t("pages.sellerRegister.error.required");
      } else if (!validImageTypes.includes(file.type)) {
        invalidTypes.push(label);
        newErrors[key as string] = t("pages.sellerRegister.error.invalidFile");
      }
    };

    checkFile(files.businessLicense, "Business License", "businessLicense");
    checkFile(
      files.articlesOfIncorporation,
      "Articles of Incorporation",
      "articlesOfIncorporation"
    );
    checkFile(files.nationalId, "National ID Card", "nationalId");
    checkFile(
      files.authorizedSignature,
      "Authorized Signature",
      "authorizedSignature"
    );

    if (missingFiles.length > 0) {
      addToast({
        title: t("pages.sellerRegister.toast.missingDocumentsTitle"),
        description: t("pages.sellerRegister.toast.missingDocumentsDesc", {
          files: missingFiles.join(", "),
        }),
        color: "warning",
      });
    }

    if (invalidTypes.length > 0) {
      addToast({
        title: t("pages.sellerRegister.toast.invalidFileTypeTitle"),
        description: t("pages.sellerRegister.toast.invalidFileTypeDesc", {
          types: invalidTypes.join(", "),
        }),
        color: "danger",
      });
    }

    setErrors(newErrors);
    return (
      Object.keys(newErrors).length === 0 &&
      missingFiles.length === 0 &&
      invalidTypes.length === 0
    );
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Use FormData for multipart/form-data file upload
      const submitData = new FormData();

      // Append text fields
      submitData.append("name", formData.sellerName);
      submitData.append("email", formData.email);
      submitData.append("mobile", formData.mobile);
      submitData.append("password", formData.password);
      submitData.append("address", formData.address);
      submitData.append("city", formData.city);
      submitData.append("state", formData.state);
      submitData.append("landmark", formData.landmark);
      submitData.append("zipcode", formData.zipcode);
      submitData.append("country", formData.country);
      submitData.append("latitude", formData.latitude);
      submitData.append("longitude", formData.longitude);

      // Append files directly as binary
      if (files.businessLicense) {
        submitData.append("business_license", files.businessLicense);
      }
      if (files.articlesOfIncorporation) {
        submitData.append(
          "articles_of_incorporation",
          files.articlesOfIncorporation
        );
      }
      if (files.nationalId) {
        submitData.append("national_identity_card", files.nationalId);
      }
      if (files.authorizedSignature) {
        submitData.append("authorized_signature", files.authorizedSignature);
      }

      const response = await sellerRegister(submitData);

      // Check if response has errors (validation errors) or if success is false
      const hasErrors =
        (response.errors &&
          (typeof response.errors === "object" ||
            Array.isArray(response.errors))) ||
        response.success === false;

      if (response.success === true) {
        resetState();
        addToast({
          title: t("pages.sellerRegister.toast.successTitle"),
          description: t("pages.sellerRegister.toast.successDesc"),
          color: "success",
        });

        setTimeout(() => {
          window
            .open(`${process.env.NEXT_PUBLIC_ADMIN_PANEL_URL}/seller`, "_blank")
            ?.focus();
        }, 2000);
      } else if (hasErrors || !response.success) {
        // Handle API validation errors
        const errorMessages: string[] = [];
        const fieldErrors: { [key: string]: string } = {};

        // Check if response has validation errors object (not array)
        if (
          response.errors &&
          typeof response.errors === "object" &&
          !Array.isArray(response.errors)
        ) {
          const errors = response.errors as {
            [key: string]: string[] | string;
          };

          // Process each field error
          Object.keys(errors).forEach((field) => {
            const fieldError = errors[field];
            const errorMessagesArray = Array.isArray(fieldError)
              ? fieldError
              : [fieldError];

            // Add first error message to toast
            if (errorMessagesArray.length > 0) {
              errorMessages.push(errorMessagesArray[0]);
            }

            // Map API field names to form field names
            let formFieldName = field;
            if (field === "email") formFieldName = "email";
            else if (field === "mobile") formFieldName = "mobile";
            else if (field === "name") formFieldName = "sellerName";
            else if (field === "password") formFieldName = "password";

            // Set field error in form state
            if (errorMessagesArray.length > 0) {
              fieldErrors[formFieldName] = errorMessagesArray[0];
            }
          });
        } else if (Array.isArray(response.errors)) {
          // Handle case where errors is an array
          response.errors.forEach((error) => {
            if (typeof error === "string") {
              errorMessages.push(error);
            }
          });
        }

        // Update form errors state
        if (Object.keys(fieldErrors).length > 0) {
          setErrors((prev) => ({ ...prev, ...fieldErrors }));
        }

        // Show toast with all error messages
        const errorMessage =
          errorMessages.length > 0
            ? errorMessages.join(". ")
            : response.message ||
              t("pages.sellerRegister.toast.genericErrorDesc");

        addToast({
          title: t("pages.sellerRegister.toast.errorTitle"),
          description: errorMessage,
          color: "danger",
        });
      }
    } catch (error: any) {
      console.error("Registration error:", error);

      // Handle axios errors with validation responses
      const errorMessages: string[] = [];
      const fieldErrors: { [key: string]: string } = {};

      if (error?.response?.data) {
        const errorData = error.response.data;

        // Check if error response has validation errors (not array)
        if (
          errorData.errors &&
          typeof errorData.errors === "object" &&
          !Array.isArray(errorData.errors)
        ) {
          const errors = errorData.errors as {
            [key: string]: string[] | string;
          };

          // Process each field error
          Object.keys(errors).forEach((field) => {
            const fieldError = errors[field];
            const errorMessagesArray = Array.isArray(fieldError)
              ? fieldError
              : [fieldError];

            // Add first error message to toast
            if (errorMessagesArray.length > 0) {
              errorMessages.push(errorMessagesArray[0]);
            }

            // Map API field names to form field names
            let formFieldName = field;
            if (field === "email") formFieldName = "email";
            else if (field === "mobile") formFieldName = "mobile";
            else if (field === "name") formFieldName = "sellerName";
            else if (field === "password") formFieldName = "password";

            // Set field error in form state
            if (errorMessagesArray.length > 0) {
              fieldErrors[formFieldName] = errorMessagesArray[0];
            }
          });
        } else if (Array.isArray(errorData.errors)) {
          // Handle case where errors is an array
          errorData.errors.forEach((error: any) => {
            if (typeof error === "string") {
              errorMessages.push(error);
            }
          });
        }

        // Update form errors state
        if (Object.keys(fieldErrors).length > 0) {
          setErrors((prev) => ({ ...prev, ...fieldErrors }));
        }

        // Show toast with error messages
        const errorMessage =
          errorMessages.length > 0
            ? errorMessages.join(". ")
            : errorData.message ||
              t("pages.sellerRegister.toast.unexpectedError");

        addToast({
          title: t("pages.sellerRegister.toast.errorTitle"),
          description: errorMessage,
          color: "danger",
        });
      } else {
        // Generic error for unexpected errors
        addToast({
          title: t("pages.sellerRegister.toast.errorTitle"),
          description: t("pages.sellerRegister.toast.unexpectedError"),
          color: "danger",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const FileUploadField = ({
    label,
    name,
    required = false,
  }: {
    label: string;
    name: keyof FileData;
    required?: boolean;
  }) => {
    const file = files[name];
    const error = errors[name];

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label className="text-sm font-medium text-start">
          {t(label)} {required && <span className="text-danger">*</span>}
        </label>
        <div
          className={`border rounded-md px-4 py-3 flex items-center cursor-pointer transition w-full
            ${file && !error ? "bg-success-50 border-success text-success" : ""}
            ${
              error
                ? "border-danger bg-danger-50"
                : "border-gray-300 dark:border-default-100 hover:border-primary"
            }`}
        >
          <input
            type="file"
            id={name}
            className="hidden"
            accept="image/jpeg,image/png,image/jpg,image/webp,.jpeg,.png,.jpg,.webp"
            onChange={(e) => handleFileChange(name, e)}
          />
          <label
            htmlFor={name}
            className="flex items-center gap-2 w-full cursor-pointer"
          >
            {file && !error ? (
              <div className="flex items-center gap-2 w-full justify-start">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span className="truncate text-sm text-start rtl:text-right ltr:text-left">{file.name}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 w-full justify-start">
                <Upload
                  className={`w-4 h-4 flex-shrink-0 ${error ? "text-danger" : "text-gray-500"}`}
                />
                <span
                  className={`text-sm text-start rtl:text-right ltr:text-left ${error ? "text-danger" : "text-gray-500"}`}
                >
                  {t("pages.sellerRegister.button.chooseFile")}
                </span>
              </div>
            )}
          </label>
        </div>
        {error && <p className="text-xs text-danger mt-0.5 text-start">{error}</p>}
      </div>
    );
  };

  return (
    <Card
      className="border border-gray-200  dark:border-default-100 shadow-sm w-full"
      id="seller-register"
    >
      <CardBody className="p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column */}
          <div className="flex flex-col gap-6 h-full">
            {/* Personal Information */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-lg">
                  {t("pages.sellerRegister.personalInfo")}
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t("pages.sellerRegister.form.sellerName")}
                  placeholder={t("pages.sellerRegister.placeholder.sellerName")}
                  value={formData.sellerName}
                  onValueChange={(v) => handleInputChange("sellerName", v)}
                  isInvalid={!!errors.sellerName}
                  errorMessage={errors.sellerName}
                  variant="bordered"
                  isRequired
                  classNames={{ errorMessage: "text-xs" }}
                />
                <Input
                  label={t("pages.sellerRegister.form.mobile")}
                  placeholder={t("pages.sellerRegister.placeholder.mobile")}
                  value={formData.mobile}
                  onValueChange={(v) => {
                    if (/^\d*$/.test(v)) {
                      handleInputChange("mobile", v);
                    }
                  }}
                  isInvalid={!!errors.mobile}
                  errorMessage={errors.mobile}
                  variant="bordered"
                  isRequired
                  maxLength={10}
                  classNames={{ errorMessage: "text-xs" }}
                />
                <Input
                  label={t("pages.sellerRegister.form.email")}
                  placeholder={t("pages.sellerRegister.placeholder.email")}
                  value={formData.email}
                  onValueChange={(v) => handleInputChange("email", v)}
                  isInvalid={!!errors.email}
                  errorMessage={errors.email}
                  variant="bordered"
                  isRequired
                  type="email"
                  classNames={{ errorMessage: "text-xs" }}
                />
                <Input
                  label={t("pages.sellerRegister.form.password")}
                  type="password"
                  value={formData.password}
                  onValueChange={(v) => handleInputChange("password", v)}
                  variant="bordered"
                  isInvalid={!!errors.password}
                  errorMessage={errors.password}
                  isRequired
                  classNames={{ errorMessage: "text-xs" }}
                />
                <Input
                  label={t("pages.sellerRegister.form.confirmPassword")}
                  type="password"
                  value={formData.confirmPassword}
                  onValueChange={(v) => handleInputChange("confirmPassword", v)}
                  variant="bordered"
                  isInvalid={!!errors.confirmPassword}
                  errorMessage={errors.confirmPassword}
                  isRequired
                  classNames={{ errorMessage: "text-xs" }}
                />
              </div>
            </section>

            <Divider />

            {/* Required Documents */}
            <section className="flex flex-col justify-between flex-1">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FileCheck className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-lg">
                    {t("pages.sellerRegister.requiredDocs")}
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FileUploadField
                    label="pages.sellerRegister.docs.businessLicense"
                    name="businessLicense"
                    required
                  />
                  <FileUploadField
                    label="pages.sellerRegister.docs.articlesOfIncorporation"
                    name="articlesOfIncorporation"
                    required
                  />
                  <FileUploadField
                    label="pages.sellerRegister.docs.nationalId"
                    name="nationalId"
                    required
                  />
                  <FileUploadField
                    label="pages.sellerRegister.docs.authorizedSignature"
                    name="authorizedSignature"
                    required
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Right Column */}
          <section className="flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-lg">
                  {t("pages.sellerRegister.businessAddress")}
                </h2>
              </div>
              <div className="flex flex-col gap-4">
                <LocationAutoComplete
                  ref={locationAutoCompleteRef}
                  onLocationSelect={handleLocationSelect}
                  initialLocation={null}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={t("pages.sellerRegister.form.address")}
                    placeholder={t("pages.sellerRegister.placeholder.address")}
                    value={formData.address}
                    onValueChange={(v) => handleInputChange("address", v)}
                    variant="bordered"
                    isInvalid={!!errors.address}
                    errorMessage={errors.address}
                    isRequired
                    classNames={{ errorMessage: "text-xs" }}
                  />
                  <Input
                    label={t("pages.sellerRegister.form.city")}
                    placeholder={t("pages.sellerRegister.placeholder.city")}
                    value={formData.city}
                    onValueChange={(v) => handleInputChange("city", v)}
                    variant="bordered"
                    isInvalid={!!errors.city}
                    errorMessage={errors.city}
                    isRequired
                    classNames={{ errorMessage: "text-xs" }}
                  />
                  <Input
                    label={t("pages.sellerRegister.form.landmark")}
                    placeholder={t("pages.sellerRegister.placeholder.landmark")}
                    value={formData.landmark}
                    onValueChange={(v) => handleInputChange("landmark", v)}
                    variant="bordered"
                    isInvalid={!!errors.landmark}
                    errorMessage={errors.landmark}
                    classNames={{ errorMessage: "text-xs" }}
                    isRequired
                  />
                  <Input
                    label={t("pages.sellerRegister.form.state")}
                    placeholder={t("pages.sellerRegister.placeholder.state")}
                    value={formData.state}
                    onValueChange={(v) => handleInputChange("state", v)}
                    variant="bordered"
                    isInvalid={!!errors.state}
                    errorMessage={errors.state}
                    isRequired
                    classNames={{ errorMessage: "text-xs" }}
                  />
                  <Input
                    label={t("pages.sellerRegister.form.zipcode")}
                    placeholder={t("pages.sellerRegister.placeholder.zipcode")}
                    value={formData.zipcode}
                    onValueChange={(v) => handleInputChange("zipcode", v)}
                    variant="bordered"
                    isInvalid={!!errors.zipcode}
                    errorMessage={errors.zipcode}
                    isRequired
                    classNames={{ errorMessage: "text-xs" }}
                  />
                  <Input
                    label={t("pages.sellerRegister.form.country")}
                    placeholder={t("pages.sellerRegister.placeholder.country")}
                    value={formData.country}
                    onValueChange={(v) => handleInputChange("country", v)}
                    variant="bordered"
                    isInvalid={!!errors.country}
                    errorMessage={errors.country}
                    isRequired
                    classNames={{ errorMessage: "text-xs" }}
                  />
                  <Input
                    label={t("pages.sellerRegister.form.latitude")}
                    placeholder={t("pages.sellerRegister.placeholder.latitude")}
                    value={formData.latitude}
                    variant="bordered"
                    onValueChange={(v) => {
                      // Allow empty string or valid number format
                      if (v === "" || /^-?\d*\.?\d*$/.test(v)) {
                        handleInputChange("latitude", v);
                      }
                    }}
                    isInvalid={!!errors.latitude}
                    errorMessage={errors.latitude}
                    isRequired
                    classNames={{ errorMessage: "text-xs" }}
                  />

                  <Input
                    label={t("pages.sellerRegister.form.longitude")}
                    placeholder={t(
                      "pages.sellerRegister.placeholder.longitude"
                    )}
                    value={formData.longitude}
                    variant="bordered"
                    onValueChange={(v) => {
                      // Allow empty string or valid number format
                      if (v === "" || /^-?\d*\.?\d*$/.test(v)) {
                        handleInputChange("longitude", v);
                      }
                    }}
                    isInvalid={!!errors.longitude}
                    errorMessage={errors.longitude}
                    isRequired
                    classNames={{ errorMessage: "text-xs" }}
                  />
                </div>
              </div>
            </div>

            {/* Buttons side-by-side */}
            <div className="flex justify-end gap-4 mt-6">
              <Button variant="bordered" onPress={() => resetState()}>
                {t("pages.sellerRegister.button.reset")}
              </Button>
              <Button
                color="primary"
                onPress={handleSubmit}
                isLoading={isSubmitting}
              >
                {t("pages.sellerRegister.button.register")}
              </Button>
            </div>
          </section>
        </div>
      </CardBody>
    </Card>
  );
}
