import UserLayout from "@/layouts/UserLayout";
import { GetServerSideProps } from "next";
import {
  Card,
  CardBody,
  CardHeader,
  Avatar,
  Button,
  Input,
  CardFooter,
  Form,
  useDisclosure,
  addToast,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { FormEvent, useRef, useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Camera,
  Mail,
  Trash,
  User,
  CheckCircle2,
  AlertCircle,
  Smartphone,
} from "lucide-react";
import CountryList from "country-list-with-dial-code-and-flag";
import PageHeader from "@/components/custom/PageHeader";
import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import {
  deleteUser,
  getSettings,
  getUserData,
  resendVerificationEmail,
  sendOtp,
  updateEmail,
  updateUserData,
  verifyOtp,
} from "@/routes/api";
import { isSSR } from "@/helpers/getters";
import ConfirmationModal from "@/components/Modals/ConfirmationModal";
import {
  getAccessTokenFromContext,
  handleLogout,
  handleSignUp,
  checkPhoneExists,
  handlePhoneLogin,
} from "@/helpers/auth";
import { useDispatch, useSelector } from "react-redux";
import { userData } from "@/types/ApiResponse";
import { RootState } from "@/lib/redux/store";
import { setUserDataRedux } from "@/lib/redux/slices/authSlice";
import { NextPageWithLayout } from "@/types";
import { demoEmail, demoNumber, staticProfileImage } from "@/config/constants";
import dynamic from "next/dynamic";
import { loadTranslations } from "../../../i18n";
import PageHead from "@/SEO/PageHead";
import { useTranslation } from "react-i18next";
import { getFirebaseErrorMessage } from "@/lib/firebase";
import Lightbox from "yet-another-react-lightbox";
import { useSettings } from "@/contexts/SettingsContext";

const PhoneInput = dynamic(() => import("@/components/Functional/PhoneInput"), {
  ssr: false,
});

type MyAccountPageProps = {
  initialData: userData;
};

const MyAccount: NextPageWithLayout<MyAccountPageProps> = ({ initialData }) => {
  const { isOpen, onClose, onOpen } = useDisclosure();
  const { demoMode, authSettings } = useSettings();
  const { t } = useTranslation();
  const [isLightboxOpen, setLightboxOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const userData = useSelector((state: RootState) => state.auth.user);
  const user = isSSR() ? initialData : userData;
  const stripDialCode = (mobile: string, iso_2: string) => {
    if (!mobile || !iso_2) return mobile;
    const countryData = CountryList.findOneByCountryCode(iso_2);
    if (countryData) {
      const dialCode = countryData.dialCode.replace("+", "");
      if (mobile.startsWith(dialCode)) {
        return mobile.slice(dialCode.length);
      }
    }
    return mobile;
  };

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    mobile: stripDialCode(user?.mobile || "", user?.iso_2 || ""),
    iso_2: user?.iso_2 || "",
    country: user?.country || "",
    friends_code: user?.friends_code || "",
  });

  const [fieldErrors, setFieldErrors] = useState({ phone: "" });
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const normalizedDemoNumber = demoNumber.replace(/\D/g, "");
  const normalizedCurrentUserNumber = stripDialCode(
    user?.mobile || "",
    user?.iso_2 || "",
  ).replace(/\D/g, "");
  const isDemoEmailLockedUser =
    (user?.email || "").toLowerCase() === demoEmail.toLowerCase();
  const isDemoPhoneLockedUser =
    normalizedCurrentUserNumber === normalizedDemoNumber;

  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setInitialState = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      mobile: stripDialCode(user?.mobile || "", user?.iso_2 || ""),
      iso_2: user?.iso_2 || "US",
      country: user?.country || "",
      friends_code: user?.friends_code || "",
    });
    setProfileImageFile(null);
  };

  const refreshUserData = useCallback(async () => {
    try {
      const res = await getUserData();
      if (res.success && res.data) {
        dispatch(setUserDataRedux(res.data));
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  }, [dispatch]);

  // Auto-refresh user data when the tab becomes visible or focused
  // This helps reflect email verification status instantly when returning from email
  useEffect(() => {
    if (user?.email_verified_at) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshUserData();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user?.email_verified_at, refreshUserData]);

  const debouncedPhoneCheck = useRef<NodeJS.Timeout | null>(null);
  const handlePhoneValidation = (phoneNumber: string) => {
    if (debouncedPhoneCheck.current) clearTimeout(debouncedPhoneCheck.current);

    if (phoneNumber === stripDialCode(user?.mobile || "", user?.iso_2 || "")) {
      setFieldErrors({ phone: "" });
      return;
    }

    if (!phoneNumber || phoneNumber.length < 8) {
      setFieldErrors({ phone: "" });
      return;
    }

    debouncedPhoneCheck.current = setTimeout(async () => {
      await checkPhoneExists(
        phoneNumber,
        setIsCheckingPhone,
        (callback: any) => {
          const newErrors = callback({ phone: "" });
          setFieldErrors(newErrors);
        },
      );
    }, 1000);
  };

  const handleInputChange = (
    field: string,
    value: string | number | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) setProfileImageFile(file);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (demoMode) {
      addToast({
        title: t("pages.myAccount.toasts.demoModeTitle") || "Demo Mode",
        description:
          t("pages.myAccount.toasts.demoModeDesc") ||
          "Updates are not allowed in demo mode",
        color: "warning",
      });
      return;
    }

    setIsLoading(true);

    try {
      const form = new FormData(e.currentTarget);
      if (profileImageFile) form.append("profile_image", profileImageFile);

      const res = await updateUserData(form);

      if (res.success) {
        dispatch(setUserDataRedux(res.data || {}));
        addToast({
          title: t("pages.myAccount.toasts.successTitle"),
          description: t("pages.myAccount.toasts.successDesc"),
          color: "success",
        });
      } else {
        addToast({
          title: t("pages.myAccount.toasts.updateFailedTitle"),
          description:
            res.message || t("pages.myAccount.toasts.updateFailedDesc"),
          color: "danger",
        });
        setInitialState();
      }
    } catch (error) {
      console.error("Error updating user data:", error);
      addToast({
        title: t("pages.myAccount.toasts.errorTitle"),
        description: t("pages.myAccount.toasts.errorDesc"),
        color: "danger",
      });
      setInitialState();
    } finally {
      setIsLoading(false);
    }
  };

  const [isEmailUpdating, setIsEmailUpdating] = useState(false);
  const handleUpdateEmail = async () => {
    if (
      isDemoEmailLockedUser &&
      (formData.email || "").toLowerCase() !== demoEmail.toLowerCase()
    ) {
      addToast({
        title: t("pages.myAccount.toasts.demoModeTitle") || "Demo Mode",
        description: "Demo email cannot be changed.",
        color: "warning",
      });
      setFormData((prev) => ({ ...prev, email: user?.email || prev.email }));
      return;
    }

    setIsEmailUpdating(true);
    try {
      const emailRes = await updateEmail(formData.email);
      if (!emailRes.success) {
        addToast({
          title: t("pages.myAccount.toasts.updateFailedTitle"),
          description: emailRes.message || "Failed to update email.",
          color: "danger",
        });
        return;
      }

      if (emailRes.data) {
        dispatch(setUserDataRedux(emailRes.data));
        setFormData((prev) => ({
          ...prev,
          email: emailRes.data?.email || prev.email,
        }));
      }

      addToast({
        title: t("pages.myAccount.labels.emailUpdateSuccess"),
        description: emailRes.message,
        color: "success",
      });
    } catch (error) {
      console.error("Error updating email:", error);
    } finally {
      setIsEmailUpdating(false);
    }
  };

  const [isResending, setIsResending] = useState(false);
  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      const res = await resendVerificationEmail();
      if (res.success) {
        addToast({
          title: t("pages.myAccount.toasts.successTitle"),
          description: res.message || "Verification email sent.",
          color: "success",
        });
      } else {
        addToast({
          title: t("pages.myAccount.toasts.errorTitle"),
          description: res.message,
          color: "danger",
        });
      }
    } catch (error) {
      console.error("Error resending verification:", error);
    } finally {
      setIsResending(false);
    }
  };

  const [isPhoneUpdating, setIsPhoneUpdating] = useState(false);
  const [isPhoneVerifying, setIsPhoneVerifying] = useState(false);
  const {
    isOpen: isOtpModalOpen,
    onOpen: onOtpModalOpen,
    onClose: onOtpModalClose,
  } = useDisclosure();
  const [otpValue, setOtpValue] = useState("");

  const smsGateway =
    authSettings?.smsGateway ||
    (authSettings?.firebase
      ? "firebase"
      : authSettings?.customSms
        ? "custom"
        : "firebase");
  const isFirebaseGateway = smsGateway === "firebase";

  const handleUpdatePhone = async () => {
    const originalLocalNumber = stripDialCode(
      user?.mobile || "",
      user?.iso_2 || "",
    ).replace(/\D/g, "");
    const editedLocalNumber = (formData.mobile || "").replace(/\D/g, "");

    if (
      originalLocalNumber === normalizedDemoNumber &&
      editedLocalNumber !== normalizedDemoNumber
    ) {
      addToast({
        title: t("pages.myAccount.toasts.demoModeTitle") || "Demo Mode",
        description: "Demo number cannot be changed.",
        color: "warning",
      });
      setFormData((prev) => ({
        ...prev,
        mobile: stripDialCode(user?.mobile || "", user?.iso_2 || ""),
        iso_2: user?.iso_2 || prev.iso_2,
        country: user?.country || prev.country,
      }));
      return;
    }

    const countryData = CountryList.findOneByCountryCode(
      formData.iso_2 || "US",
    );
    const dialCode = countryData?.dialCode || "";
    const fullPhone = dialCode.startsWith("+")
      ? `${dialCode}${formData.mobile}`
      : `+${dialCode}${formData.mobile}`;

    setIsPhoneUpdating(true);
    try {
      if (isFirebaseGateway) {
        const firebaseInstance = window.firebaseInstance;
        if (!firebaseInstance) {
          addToast({
            title: t("login_modal.errors.firebase_error_title"),
            description: t("login_modal.errors.firebase_error_desc"),
            color: "danger",
          });
          return;
        }

        const success = await handleSignUp(fullPhone, firebaseInstance);
        if (success) {
          onOtpModalOpen();
        }
      } else {
        const res = await sendOtp({ mobile: fullPhone });
        if (res.success) {
          addToast({
            title: t("pages.myAccount.labels.otpSentTitle") || "OTP Sent",
            description:
              t("pages.myAccount.labels.otpSentDesc") ||
              "Verification code sent to your mobile.",
            color: "success",
          });
          onOtpModalOpen();
        } else {
          addToast({
            title: t("pages.myAccount.toasts.errorTitle"),
            description: res.message,
            color: "danger",
          });
        }
      }
    } catch (error) {
      console.error("Error sending phone OTP:", error);
    } finally {
      setIsPhoneUpdating(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!otpValue || otpValue.length < 4) return;
    setIsPhoneVerifying(true);
    try {
      let res;
      if (isFirebaseGateway) {
        const confirmationResult = window.confirmationResult;
        if (!confirmationResult) {
          addToast({
            title: t("login_modal.errors.verification_error_title"),
            description: t("login_modal.errors.verification_error_desc"),
            color: "danger",
          });
          onOtpModalClose();
          return;
        }

        const userCredential = await confirmationResult.confirm(otpValue);
        const idToken = await userCredential.user.getIdToken();

        res = await handlePhoneLogin({
          idToken,
          dispatch,
          name: user?.name,
          friends_code: user?.friends_code,
          renderToast: false,
        });
      } else {
        const countryData = CountryList.findOneByCountryCode(
          formData.iso_2 || "US",
        );
        const dialCode = countryData?.dialCode || "";
        const fullPhone = dialCode.startsWith("+")
          ? `${dialCode}${formData.mobile}`
          : `+${dialCode}${formData.mobile}`;

        res = await verifyOtp({ mobile: fullPhone, otp: otpValue });
      }

      if (res && res.success) {
        addToast({
          title: t("pages.myAccount.toasts.successTitle"),
          description:
            t("pages.myAccount.labels.phoneUpdateSuccess") ||
            "Phone number verified successfully.",
          color: "success",
        });
        if (res.data) {
          dispatch(setUserDataRedux(res.data));
          // Reset local form state to match the newly verified user data
          setFormData({
            name: res.data.name || "",
            email: res.data.email || "",
            mobile: stripDialCode(res.data.mobile || "", res.data.iso_2 || ""),
            iso_2: res.data.iso_2 || "",
            country: res.data.country || "",
            friends_code: res.data.friends_code || "",
          });
        }
        onOtpModalClose();
        setOtpValue("");
      } else {
        const errorMsg =
          res?.message === "INVALID_CODE"
            ? t("login_modal.errors.invalid_otp_desc") ||
              "Invalid verification code. Please enter the correct code."
            : res?.message || t("pages.myAccount.toasts.updateFailedDesc");

        addToast({
          title: t("pages.myAccount.toasts.errorTitle"),
          description: errorMsg,
          color: "danger",
        });
      }
    } catch (error: any) {
      console.error("Error verifying phone OTP:", error);
      const firebaseMsg = getFirebaseErrorMessage(error);
      const errorMsg =
        firebaseMsg !== error.message
          ? firebaseMsg
          : error?.message || t("pages.myAccount.toasts.errorDesc");

      addToast({
        title: t("pages.myAccount.toasts.errorTitle"),
        description: errorMsg,
        color: "danger",
      });
    } finally {
      setIsPhoneVerifying(false);
    }
  };

  const handleDelete = async () => {
    if (demoMode) {
      addToast({
        title: t("pages.myAccount.toasts.demoModeTitle") || "Demo Mode",
        description:
          t("pages.myAccount.toasts.demoModeDesc") ||
          "This action is not allowed in demo mode",
        color: "warning",
      });
      return;
    }

    const res = await deleteUser();
    if (res.success) {
      await handleLogout(false);
      addToast({
        title: t("pages.myAccount.toasts.deleteSuccessTitle"),
        description: t("pages.myAccount.toasts.deleteSuccessDesc"),
        color: "success",
      });
    } else {
      addToast({
        title: t("pages.myAccount.toasts.deleteFailedTitle"),
        description: t("pages.myAccount.toasts.deleteFailedDesc"),
        color: "danger",
      });
    }
  };

  return (
    <>
      <MyBreadcrumbs
        breadcrumbs={[
          { href: "/my-account", label: t("pageTitle.my-account") },
        ]}
      />
      <PageHead pageTitle={t("pageTitle.my-account")} />

      <UserLayout activeTab="my-account">
        <div className="w-full">
          <div className="flex items-center justify-between">
            <PageHeader
              title={t("pages.myAccount.headerTitle")}
              subtitle={t("pages.myAccount.headerSubtitle")}
            />
            <Button
              startContent={<Trash size={16} />}
              color="danger"
              size="sm"
              className="text-xs"
              onPress={onOpen}
            >
              {t("pages.myAccount.deleteAccount")}
            </Button>
          </div>

          <Card shadow="sm" className="p-2">
            <Form onSubmit={onSubmit}>
              <CardHeader className="pb-0">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar
                      src={
                        profileImageFile
                          ? URL.createObjectURL(profileImageFile)
                          : user?.profile_image || staticProfileImage
                      }
                      className="w-16 h-16 cursor-pointer"
                      isBordered
                      color="primary"
                      onClick={() => setLightboxOpen(true)}
                    />
                    {isLightboxOpen && (
                      <Lightbox
                        open={isLightboxOpen}
                        close={() => setLightboxOpen(false)}
                        slides={[
                          {
                            src: profileImageFile
                              ? URL.createObjectURL(profileImageFile)
                              : user?.profile_image || staticProfileImage,
                          },
                        ]}
                      />
                    )}
                    <Button
                      isIconOnly
                      size="sm"
                      className="absolute -bottom-1 -right-1 min-w-unit-6 w-6 h-7"
                      radius="full"
                      color="primary"
                      onPress={() => fileInputRef.current?.click()}
                    >
                      <Camera size={16} />
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold">{formData.name}</h2>
                    <p className="flex items-center gap-1 mt-1 opacity-50 text-small">
                      <Mail size={16} />
                      {formData.email}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="mt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-5">
                    <div className="flex items-center gap-2">
                      <User className="text-primary" size={16} />
                      <h3 className="text-medium font-semibold">
                        {t("pages.myAccount.personalInfo")}
                      </h3>
                    </div>

                    <Input
                      name="name"
                      isReadOnly={isLoading}
                      label={t("pages.myAccount.labels.fullName")}
                      labelPlacement="outside"
                      isRequired
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      variant="flat"
                      startContent={
                        <User size={20} className="text-gray-400" />
                      }
                    />

                    <Input
                      isReadOnly
                      label={t("pages.myAccount.labels.memberSince")}
                      labelPlacement="outside"
                      variant="flat"
                      value={
                        user?.created_at
                          ? new Date(user.created_at).toLocaleString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""
                      }
                      startContent={
                        <Calendar size={20} className="text-gray-400" />
                      }
                    />
                  </div>

                  <div className="flex flex-col gap-5">
                    <div className="flex items-center gap-2">
                      <Mail className="text-primary" size={16} />
                      <h3 className="text-medium font-semibold">
                        {t("pages.myAccount.contactInfo")}
                      </h3>
                    </div>

                    <Input
                      name="email"
                      isReadOnly={isLoading || isDemoEmailLockedUser}
                      label={t("pages.myAccount.labels.email")}
                      labelPlacement="outside"
                      isRequired
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      variant="flat"
                      startContent={
                        <Mail size={20} className="text-gray-400" />
                      }
                      endContent={
                        <div className="flex items-center gap-2 mr-1">
                          {formData.email !== user?.email &&
                          !isDemoEmailLockedUser ? (
                            <Button
                              size="sm"
                              color="primary"
                              variant="solid"
                              className="h-8 px-4 text-xs font-semibold shadow-sm"
                              onPress={handleUpdateEmail}
                              isLoading={isEmailUpdating}
                            >
                              {t("pages.myAccount.labels.update") || "Update"}
                            </Button>
                          ) : user?.email_verified_at ? (
                            <Chip
                              startContent={<CheckCircle2 size={16} />}
                              color="success"
                              variant="flat"
                              size="md"
                              className="border-none h-8 px-2 sm:px-3 text-xs font-bold"
                            >
                              <span className="hidden sm:inline">
                                {t("pages.myAccount.labels.verified")}
                              </span>
                            </Chip>
                          ) : isDemoEmailLockedUser ? null : (
                            <div className="flex items-center gap-1.5 translate-y-[1px]">
                              <Chip
                                startContent={
                                  <AlertCircle
                                    size={16}
                                    className="text-warning"
                                  />
                                }
                                color="warning"
                                variant="light"
                                size="sm"
                                className="border-none h-7 px-1 text-[11px] font-bold"
                              >
                                <span>
                                  {t("pages.myAccount.labels.notVerified")}
                                </span>
                              </Chip>
                              <Button
                                size="sm"
                                variant="bordered"
                                color="primary"
                                className="h-8 min-w-8 sm:min-w-unit-20 px-2 sm:px-4 text-[11px] font-medium border-1"
                                onPress={handleResendVerification}
                                isLoading={isResending}
                              >
                                <Mail size={14} className="sm:hidden" />
                                <span className="hidden sm:inline">
                                  {t(
                                    "pages.myAccount.labels.resendVerification",
                                  )}
                                </span>
                                <span className="sm:hidden ml-1">Resend</span>
                              </Button>
                            </div>
                          )}
                        </div>
                      }
                    />
                    <PhoneInput
                      isReadOnly={isDemoPhoneLockedUser}
                      label={t("pages.myAccount.labels.phone")}
                      labelPlacement="outside"
                      defaultValue={formData.mobile}
                      defaultCountry={formData.iso_2 || "US"}
                      onPhoneChange={(
                        countryCode,
                        phoneNumber,
                        dialCode,
                        name,
                      ) => {
                        setFormData((prev) => ({
                          ...prev,
                          mobile: phoneNumber,
                          iso_2: countryCode,
                          country: name,
                        }));
                        handlePhoneValidation(phoneNumber);
                      }}
                      variant="flat"
                      endContent={
                        <div className="flex items-center gap-2 mr-1">
                          {(formData.mobile !== user?.mobile ||
                            formData.iso_2 !== user?.iso_2) &&
                          !isDemoPhoneLockedUser ? (
                            <Button
                              size="sm"
                              color="primary"
                              variant="solid"
                              className="h-8 px-4 text-xs font-semibold shadow-sm"
                              onPress={handleUpdatePhone}
                              isLoading={isPhoneUpdating || isCheckingPhone}
                              isDisabled={!!fieldErrors.phone}
                            >
                              {t("pages.myAccount.labels.updatePhone") ||
                                "Update"}
                            </Button>
                          ) : user?.mobile_verified_at ? (
                            <Chip
                              startContent={<CheckCircle2 size={16} />}
                              color="success"
                              variant="flat"
                              size="md"
                              className="border-none h-8 px-2 sm:px-3 text-xs font-bold"
                            >
                              <span className="hidden sm:inline">
                                {t("pages.myAccount.labels.verified")}
                              </span>
                            </Chip>
                          ) : isDemoPhoneLockedUser ? null : (
                            <div className="flex items-center gap-1.5 translate-y-[1px]">
                              <Chip
                                startContent={
                                  <AlertCircle
                                    size={16}
                                    className="text-warning"
                                  />
                                }
                                color="warning"
                                variant="light"
                                size="sm"
                                className="border-none h-7 px-1 text-[11px] font-bold"
                              >
                                <span>
                                  {t("pages.myAccount.labels.notVerified")}
                                </span>
                              </Chip>
                              <Button
                                size="sm"
                                variant="bordered"
                                color="primary"
                                className="h-8 min-w-8 sm:min-w-unit-20 px-2 sm:px-4 text-[11px] font-medium border-1"
                                onPress={handleUpdatePhone}
                                isLoading={isPhoneUpdating}
                              >
                                <Smartphone size={14} className="sm:hidden" />
                                <span className="hidden sm:inline">
                                  {t("pages.myAccount.labels.verify") ||
                                    "Verify"}
                                </span>
                                <span className="sm:hidden ml-1">Verify</span>
                              </Button>
                            </div>
                          )}
                        </div>
                      }
                    />
                    {(fieldErrors.phone || isCheckingPhone) && (
                      <div className="-mt-3 text-xs text-danger flex items-center gap-2">
                        {isCheckingPhone && (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-danger"></div>
                        )}
                        {fieldErrors.phone}
                      </div>
                    )}

                    <input type="hidden" name="iso2" value={formData.iso_2} />
                    <input
                      type="hidden"
                      name="country"
                      value={formData.country}
                    />
                  </div>
                </div>
              </CardBody>
              <CardFooter className="w-full flex justify-start">
                <Button
                  type="submit"
                  color="primary"
                  className="max-w-xs"
                  isLoading={isLoading}
                >
                  {t("pages.myAccount.saveChanges")}
                </Button>
              </CardFooter>
            </Form>
          </Card>
        </div>
      </UserLayout>

      <ConfirmationModal
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={handleDelete}
        title={t("pages.myAccount.deleteAccount")}
        description={t("pages.myAccount.deleteDesc")}
        alertTitle={t("pages.myAccount.alertTitle")}
        alertDescription={t("pages.myAccount.alertDesc")}
        confirmText={t("pages.myAccount.confirmText")}
        variant="danger"
      />

      {/* OTP Verification Modal */}
      <Modal
        isOpen={isOtpModalOpen}
        onClose={onOtpModalClose}
        placement="center"
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {t("pages.myAccount.labels.enterOtp") || "Verify Mobile"}
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-4 py-2">
                  <p className="text-sm text-default-500">
                    {t("pages.myAccount.labels.otpSentTo") ||
                      "Enter the OTP sent to"}{" "}
                    {formData.mobile}
                  </p>
                  <Input
                    label="Verification Code"
                    placeholder="Enter 6-digit OTP"
                    variant="bordered"
                    value={otpValue}
                    onValueChange={setOtpValue}
                    maxLength={6}
                    autoFocus
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  {t("common.cancel") || "Cancel"}
                </Button>
                <Button
                  color="primary"
                  onPress={handleVerifyPhoneOtp}
                  isLoading={isPhoneVerifying}
                  isDisabled={otpValue.length < 4}
                >
                  {t("pages.myAccount.labels.verify") || "Verify"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export const getServerSideProps: GetServerSideProps | undefined = isSSR()
  ? async (context) => {
      try {
        const access_token = (await getAccessTokenFromContext(context)) || "";
        if (!access_token) {
          return {
            redirect: {
              destination: "/",
              permanent: false,
            },
          };
        }
        const response = await getUserData({ access_token });
        const res = await getSettings();
        await loadTranslations(context);

        return {
          props: {
            initialData: response.success ? response.data : {},
            initialSettings: res?.success ? res.data : [],
          },
        };
      } catch (error) {
        console.error("Error fetching Settings:", error);
        return {
          props: {
            initialSettings: null,
            initialData: {},
          },
        };
      }
    }
  : undefined;

export default MyAccount;
