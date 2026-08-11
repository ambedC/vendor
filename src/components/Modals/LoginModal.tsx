import { useState, FormEvent, useCallback, useRef, FC, useEffect } from "react";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Divider,
  useDisclosure,
  Link,
  Form,
  ModalFooter,
  Tabs,
  Tab,
  InputOtp,
  addToast,
} from "@heroui/react";
import {
  LogIn,
  TruckElectric,
  Eye,
  EyeOff,
  User,
  Mail,
  Smartphone,
  Phone,
} from "lucide-react";
import { MyButton } from "../custom/MyButton";
import RegisterModal from "./RegisterModal";
import GoogleLoginBtn from "../Functional/GoogleLoginBtn";
import {
  checkEmailExists,
  checkPhoneExists,
  handleLoginUser,
  handleSignUp,
  handleResendOtp,
  handlePhoneLogin,
} from "@/helpers/auth";
import { sendOtp, verifyOtp } from "@/routes/api";
import { login as ReduxLogin } from "@/lib/redux/slices/authSlice";
import { clearRecentlyViewed } from "@/lib/redux/slices/recentlyViewedSlice";
import {
  syncOfflineCartToServer,
  updateCartData,
  updateDataOnAuth,
} from "@/helpers/updators";
import {
  setAnalyticsUserId,
  setAnalyticsUserProperties,
  trackLogin,
} from "@/lib/analytics";
import { setCookie } from "@/lib/cookies";
import { useDispatch } from "react-redux";
import {
  looksLikeEmail,
  looksLikeMobile,
  validateEmail,
  validateMobile,
  validatePassword,
} from "@/helpers/validator";
import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation } from "react-i18next";
import { demoEmail, demoNumber, demoPassword } from "@/config/constants";
import dynamic from "next/dynamic";
import { clearRecaptchaVerifier, FirebaseInstance } from "@/lib/firebase";
import { ConfirmationResult } from "firebase/auth";

const PhoneInput = dynamic(() => import("@/components/Functional/PhoneInput"), {
  ssr: false,
});

type ValidationErrors = {
  email?: string;
  mobile?: string;
  password?: string;
  phone?: string;
  [key: string]: string | undefined;
};
interface LoginModalProps {
  triggerView?: "btn" | "link" | "icon";
}
type LoginMode = "email" | "mobile" | "otp";
type OtpStep = "phone" | "verify";

export const LoginModal: FC<LoginModalProps> = ({ triggerView = "btn" }) => {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isCheckingMobile, setIsCheckingMobile] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const { authSettings, demoMode } = useSettings();
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [emailValue, setEmailValue] = useState(demoMode ? demoEmail : "");
  const [mobileValue, setMobileValue] = useState(demoMode ? demoNumber : "");
  const [passwordValue, setPasswordValue] = useState(
    demoMode ? demoPassword : "",
  );

  const [loginMode, setLoginMode] = useState<LoginMode>("mobile");
  const [isEmailReadOnly, setIsEmailReadOnly] = useState(true);
  const [isMobileReadOnly, setIsMobileReadOnly] = useState(true);

  // OTP login states
  const [otpStep, setOtpStep] = useState<OtpStep>("phone");
  const [otpPhoneNumber, setOtpPhoneNumber] = useState("");
  const [friendsCode] = useState("");

  const smsGateway =
    authSettings?.smsGateway ||
    (authSettings?.firebase
      ? "firebase"
      : authSettings?.customSms
        ? "custom"
        : "firebase");
  const isFirebaseGateway = smsGateway === "firebase";
  const isCustomGateway = smsGateway === "custom";

  const { t } = useTranslation();
  const dispatch = useDispatch();

  const emailInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Debounce hook
  const useDebounce = <T extends unknown[]>(
    callback: (...args: T) => void,
    delay: number,
  ) => {
    const timer = useRef<NodeJS.Timeout | null>(null);
    return useCallback(
      (...args: T) => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => callback(...args), delay);
      },
      [callback, delay],
    );
  };

  // Debounced email existence check
  const debouncedEmailCheck = useDebounce(async (email: string) => {
    if (!email.trim()) {
      setErrors((prev) => ({ ...prev, email: undefined }));
      return;
    }

    const emailError = validateEmail(email);
    if (emailError) {
      setErrors((prev) => ({ ...prev, email: emailError }));
      return;
    }

    try {
      setIsCheckingEmail(true);
      const exists = await checkEmailExists(
        email,
        setIsCheckingEmail,
        () => {},
      );
      if (!exists) {
        setErrors((prev) => ({
          ...prev,
          email: t("login_modal.errors.email_not_registered"),
        }));
      } else {
        setErrors((prev) => ({ ...prev, email: undefined }));
      }
    } finally {
      setIsCheckingEmail(false);
    }
  }, 1000);

  // Handle email input change
  const handleEmailChange = useCallback(
    (value: string) => {
      setEmailValue(value);
      setErrors((prev) => ({ ...prev, email: undefined }));

      if (value && looksLikeMobile(value) && !looksLikeEmail(value)) {
        setErrors((prev) => ({
          ...prev,
          email: "Please enter a valid email address, not a mobile number",
        }));
        return;
      }

      debouncedEmailCheck(value);
    },
    [setEmailValue, setErrors, debouncedEmailCheck], // dependencies
  );

  const debouncedMobileCheck = useDebounce(async (mobile: string) => {
    if (!mobile.trim()) {
      setErrors((prev) => ({ ...prev, mobile: undefined }));
      return;
    }

    try {
      setIsCheckingMobile(true);
      const exists = await checkPhoneExists(
        mobile,
        setIsCheckingMobile,
        () => {},
      );
      if (!exists) {
        setErrors((prev) => ({
          ...prev,
          mobile: t("login_modal.errors.mobile_not_registered"),
        }));
      } else {
        setErrors((prev) => ({ ...prev, mobile: undefined }));
      }
    } finally {
      setIsCheckingMobile(false);
    }
  }, 1000);

  // Handle mobile input change
  const handleMobileChange = useCallback(
    (value: string) => {
      const digitsOnly = value.replace(/\D/g, "");
      setMobileValue(digitsOnly);
      setErrors((prev) => ({ ...prev, mobile: undefined }));

      if (value && looksLikeEmail(value)) {
        setErrors((prev) => ({
          ...prev,
          mobile: "Please enter a mobile number, not an email address",
        }));
        return;
      }

      debouncedMobileCheck(digitsOnly);
    },
    [setMobileValue, setErrors, debouncedMobileCheck],
  );

  // Handle OTP phone input change
  const handleOtpPhoneChange = (
    countryCode: string,
    phoneNumber: string,
    dialCode: string,
  ) => {
    const normalizedDialCode = dialCode.startsWith("+")
      ? dialCode
      : `+${dialCode}`;
    const formattedNumber = `${normalizedDialCode}${phoneNumber}`;
    setOtpPhoneNumber(formattedNumber);

    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: undefined }));
    }

    if (phoneNumber && phoneNumber.length >= 8) {
      debouncedOtpPhoneCheck(phoneNumber);
    } else if (phoneNumber && phoneNumber.length < 8) {
      setErrors((prev) => ({ ...prev, phone: undefined }));
    }
  };

  // Debounced OTP phone check
  const debouncedOtpPhoneCheck = useDebounce(async (phone: string) => {
    if (!phone.trim() || phone.length < 8) {
      setErrors((prev) => ({ ...prev, phone: undefined }));
      return;
    }

    try {
      setIsCheckingMobile(true);
      const exists = await checkPhoneExists(
        phone,
        setIsCheckingMobile,
        () => {},
      );
      if (!exists) {
        setErrors((prev) => ({
          ...prev,
          phone: t("login_modal.errors.mobile_not_registered"),
        }));
      } else {
        setErrors((prev) => ({ ...prev, phone: undefined }));
      }
    } finally {
      setIsCheckingMobile(false);
    }
  }, 1000);

  // Send OTP for login
  const handleSendOtpForLogin = async () => {
    setIsLoading(true);

    if (!otpPhoneNumber || otpPhoneNumber.length < 8) {
      addToast({
        title: t("login_modal.errors.invalid_phone_title"),
        description: t("login_modal.errors.invalid_phone_desc"),
        color: "danger",
      });
      setIsLoading(false);
      return;
    }

    // If there's already an error (number not registered), don't proceed
    if (errors.phone) {
      setIsLoading(false);
      return;
    }

    if (isFirebaseGateway) {
      const firebaseInstance = window.firebaseInstance as
        | FirebaseInstance
        | undefined;
      if (!firebaseInstance) {
        addToast({
          title: t("login_modal.errors.firebase_error_title"),
          description: t("login_modal.errors.firebase_error_desc"),
          color: "danger",
        });
        setIsLoading(false);
        return;
      }

      const success = await handleSignUp(otpPhoneNumber, firebaseInstance);
      if (success) {
        setOtpStep("verify");
      }
    } else if (isCustomGateway) {
      try {
        const response = await sendOtp({
          mobile: otpPhoneNumber,
          expires_in: 600,
        });

        if (response.success) {
          addToast({
            title: t("signup_toast.otp_sent_title"),
            description: t("signup_toast.otp_sent_desc"),
            color: "success",
          });
          setOtpStep("verify");
        } else {
          addToast({
            title: t("login_modal.errors.verification_failed_title"),
            description:
              response.message || "Failed to send OTP. Please try again.",
            color: "danger",
          });
        }
      } catch (error) {
        console.error("Custom SMS send OTP error:", error);
        addToast({
          title: t("login_modal.errors.verification_failed_title"),
          description: "Failed to send OTP. Please try again.",
          color: "danger",
        });
      }
    }
    setIsLoading(false);
  };

  // Verify OTP and login
  const handleVerifyOtpAndLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const data = Object.fromEntries(new FormData(e.currentTarget));
    const otp = data.otp as string;

    if (!otp || otp.length !== 6) {
      addToast({
        title: t("login_modal.errors.invalid_otp_title"),
        description: t("login_modal.errors.invalid_otp_desc"),
        color: "danger",
      });
      setIsLoading(false);
      return;
    }

    try {
      let response;

      if (isFirebaseGateway) {
        const confirmationResult = window.confirmationResult as
          | ConfirmationResult
          | undefined;
        if (!confirmationResult) {
          addToast({
            title: t("login_modal.errors.verification_error_title"),
            description: t("login_modal.errors.verification_error_desc"),
            color: "danger",
          });
          setIsLoading(false);
          setOtpStep("phone");
          return;
        }

        const userCredential = await confirmationResult.confirm(otp);
        const idToken = await userCredential.user.getIdToken();

        response = await handlePhoneLogin({
          idToken,
          dispatch,
          friends_code: friendsCode || undefined,
          renderToast: true,
        });

        if (response && response.success) {
          setErrors({});
          setOtpPhoneNumber("");
          setOtpStep("phone");
          onOpenChange();
        }
        setIsLoading(false);
        return;
      } else if (isCustomGateway) {
        response = await verifyOtp({
          mobile: otpPhoneNumber,
          otp,
          friends_code: (friendsCode as string) || undefined,
        });
      }

      if (response && response.success && response.data) {
        setCookie("user", response.data);
        setCookie("access_token", response.access_token || "");

        dispatch(
          ReduxLogin({
            user: response.data,
            access_token: response.access_token || "",
          }),
        );

        // Clear recently viewed products for new users
        if (response.data.new_user) {
          dispatch(clearRecentlyViewed());
        }

        await syncOfflineCartToServer();

        updateDataOnAuth();
        updateCartData(false, false, 0);

        setAnalyticsUserId(response.data.id.toString());
        setAnalyticsUserProperties({
          login_method: "phone_otp",
          user_type: "customer",
        });
        trackLogin("phone_otp");

        addToast({
          title: t("login_modal.welcome_title"),
          description: t("login_modal.login_success_toast"),
          color: "success",
        });

        setErrors({});
        setOtpPhoneNumber("");
        setOtpStep("phone");
        onOpenChange();
      } else if (response) {
        addToast({
          title: t("login_modal.errors.verification_failed_title"),
          description: response.message || "Login failed. Please try again.",
          color: "danger",
        });
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to verify OTP";
      console.error("OTP verification error:", errorMsg);
      addToast({
        title: t("login_modal.errors.verification_failed_title"),
        description: errorMsg,
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtpForLogin = async () => {
    setIsResendingOtp(true);

    if (isFirebaseGateway) {
      const firebaseInstance = window.firebaseInstance as
        | FirebaseInstance
        | undefined;
      if (!firebaseInstance) {
        addToast({
          title: t("login_modal.errors.firebase_error_title"),
          description: t("login_modal.errors.firebase_error_desc"),
          color: "danger",
        });
        setIsResendingOtp(false);
        return;
      }

      await handleResendOtp(otpPhoneNumber, firebaseInstance);
    } else if (isCustomGateway) {
      try {
        const response = await sendOtp({
          mobile: otpPhoneNumber,
          expires_in: 600,
        });

        if (response.success) {
          addToast({
            title: t("resend_otp_toast.otp_resent_title"),
            description: t("resend_otp_toast.otp_resent_desc"),
            color: "success",
          });
        } else {
          addToast({
            title: t("login_modal.errors.verification_failed_title"),
            description:
              response.message || "Failed to resend OTP. Please try again.",
            color: "danger",
          });
        }
      } catch (error) {
        console.error("Custom SMS resend OTP error:", error);
        addToast({
          title: t("login_modal.errors.verification_failed_title"),
          description: "Failed to resend OTP. Please try again.",
          color: "danger",
        });
      }
    }
    setIsResendingOtp(false);
  };

  // Handle tab change - clear errors and values for inactive tab
  const handleTabChange = (key: string | number) => {
    const newMode = key as LoginMode;
    setLoginMode(newMode);
    setErrors({});

    if (newMode === "email") {
      setMobileValue("");
      setIsMobileReadOnly(true); // Reset readonly for inactive tab
      setOtpPhoneNumber("");
      setOtpStep("phone");
    } else if (newMode === "mobile") {
      setEmailValue("");
      setIsEmailReadOnly(true); // Reset readonly for inactive tab
      setOtpPhoneNumber("");
      setOtpStep("phone");
    } else if (newMode === "otp") {
      setEmailValue("");
      setMobileValue("");
      setIsEmailReadOnly(true);
      setIsMobileReadOnly(true);
      setOtpStep("phone");
    }
  };

  // Handle form submission
  const handleLoginSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = passwordValue;
    const validationErrors: ValidationErrors = {};

    if (loginMode === "email") {
      const email = formData.get("email") as string;

      if (looksLikeMobile(email) && !looksLikeEmail(email)) {
        validationErrors.email =
          "Please use the Mobile tab to login with a mobile number";
      } else {
        const emailError = validateEmail(email);
        if (emailError) validationErrors.email = emailError;
      }
    } else {
      const mobile = formData.get("mobile") as string;

      if (looksLikeEmail(mobile)) {
        validationErrors.mobile =
          "Please use the Email tab to login with an email address";
      } else {
        const mobileError = validateMobile(mobile);
        if (mobileError) validationErrors.mobile = mobileError;
      }
    }

    const passwordError = validatePassword(password);
    if (passwordError) validationErrors.password = passwordError;

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsLoading(false);
      return;
    }

    try {
      const loginData = {
        email:
          loginMode === "email" ? (formData.get("email") as string) : undefined,
        mobile:
          loginMode === "mobile"
            ? (formData.get("mobile") as string)
            : undefined,
        password,
      };

      await handleLoginUser(loginData, dispatch);

      setErrors({});
      setEmailValue("");
      setMobileValue("");
      onOpenChange();
    } catch (error) {
      console.error("Login failed:", error);
      setErrors((prev) => ({
        ...prev,
        password: "Login failed. Please check your credentials.",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form when modal closes
  const handleModalClose = () => {
    setErrors({});
    setEmailValue("");
    setMobileValue("");
    setPasswordValue("");
    setShowPassword(false);
    setLoginMode("email");
    setIsEmailReadOnly(true);
    setIsMobileReadOnly(true);

    // Reset OTP states
    setOtpPhoneNumber("");
    setOtpStep("phone");

    // Cleanup Firebase
    if (window.confirmationResult) {
      window.confirmationResult = undefined;
    }
    if (window.firebaseInstance) {
      clearRecaptchaVerifier(window.firebaseInstance);
    }

    // Force clear all inputs
    if (emailInputRef.current) emailInputRef.current.value = "";
    if (mobileInputRef.current) mobileInputRef.current.value = "";
  };

  useEffect(() => {
    if (isOpen && demoMode) {
      setMobileValue(demoNumber);
      setEmailValue(demoEmail);
      setPasswordValue(demoPassword);
    }
  }, [isOpen, loginMode, demoMode]);
  return (
    <>
      {/* Trigger Button */}
      {triggerView === "btn" ? (
        <MyButton
          id="login-btn"
          color="primary"
          onPress={onOpen}
          startContent={<LogIn size={16} />}
          size="responsive"
          variant="flat"
          className="p-0 text-xs"
        >
          {t("login_modal.button")}
        </MyButton>
      ) : triggerView === "icon" ? (
        <Button
          id="login-btn"
          size="sm"
          onPress={onOpen}
          isIconOnly
          className="p-0 rounded-full bg-transparent text-foreground/50 hover:text-foreground/70"
        >
          <User size={20} />
        </Button>
      ) : (
        <div
          className="text-primary-600 text-md underline cursor-pointer"
          onClick={onOpen}
          id="login-btn"
        >
          {t("login_modal.button")}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) handleModalClose();
          onOpenChange();
        }}
        placement="center"
        scrollBehavior="inside"
        backdrop="blur"
        size="md"
        classNames={{
          base: "rounded-lg",
          header: "border-b border-divider",
          footer: "border-t border-divider",
        }}
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <TruckElectric className="text-primary" size={24} />
                  <h2 className="font-semibold">
                    {t("login_modal.welcome_title")}
                  </h2>
                </div>
                <p className="text-sm text-default-500">
                  {t("login_modal.welcome_subtitle")}
                </p>
              </ModalHeader>

              <ModalBody className="py-6">
                {/* Tabs - Always visible */}
                <div className="w-full flex justify-center mb-6">
                  <Tabs
                    selectedKey={loginMode}
                    onSelectionChange={handleTabChange}
                    classNames={{
                      cursor: "w-full bg-primary",
                      tab: "max-w-fit",
                      tabContent:
                        "group-data-[selected=true]:text-primary-foreground",
                    }}
                  >
                    <Tab
                      key="mobile"
                      textValue={t("login_modal.mobile_tab")}
                      title={
                        <div className="flex items-center gap-2">
                          <Smartphone size={16} />
                          <span>{t("login_modal.mobile_tab")}</span>
                        </div>
                      }
                    />
                    <Tab
                      key="email"
                      textValue={t("login_modal.email_tab")}
                      title={
                        <div className="flex items-center gap-2">
                          <Mail size={16} />
                          <span>{t("login_modal.email_tab")}</span>
                        </div>
                      }
                    />
                    <Tab
                      key="otp"
                      textValue={t("login_modal.otp_tab")}
                      title={
                        <div className="flex items-center gap-2">
                          <Phone size={16} />
                          <span>{t("login_modal.otp_tab")}</span>
                        </div>
                      }
                    />
                  </Tabs>
                </div>

                {loginMode === "otp" ? (
                  // OTP Login Flow
                  otpStep === "phone" ? (
                    <Form
                      className="w-full space-y-6"
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendOtpForLogin();
                      }}
                      autoComplete="off"
                    >
                      <div className="flex flex-col gap-6 w-full">
                        <PhoneInput
                          defaultCountry={demoMode ? "in" : undefined}
                          defaultValue={demoMode ? demoNumber : undefined}
                          onPhoneChange={handleOtpPhoneChange}
                          className="w-full"
                          label={t("login_modal.phone_label")}
                          placeholder={t("login_modal.phone_placeholder")}
                        />
                        {(errors.phone || isCheckingMobile) && (
                          <div className="mt-1 text-xs text-danger flex items-center gap-2">
                            {isCheckingMobile && (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-danger"></div>
                            )}
                            {errors.phone}
                          </div>
                        )}
                      </div>

                      <Button
                        color="primary"
                        className="w-full font-medium"
                        type="submit"
                        isLoading={isLoading}
                        isDisabled={
                          !otpPhoneNumber || isCheckingMobile || !!errors.phone
                        }
                      >
                        {t("login_modal.send_verification")}
                      </Button>
                    </Form>
                  ) : (
                    // OTP Verification Step
                    <Form
                      className="w-full space-y-6"
                      onSubmit={handleVerifyOtpAndLogin}
                      autoComplete="off"
                    >
                      <div className="flex flex-col gap-6 w-full items-center">
                        <InputOtp
                          isRequired
                          length={6}
                          placeholder={t("login_modal.otp_placeholder")}
                          variant="bordered"
                          name="otp"
                          color="primary"
                          size="lg"
                          radius="md"
                          classNames={{
                            wrapper: "flex gap-2 justify-center",
                            errorMessage: "sm:text-xs text-center",
                          }}
                        />
                        <div className="text-center">
                          <p className="text-sm text-default-500 mb-2">
                            {t("login_modal.did_not_receive_code")}
                          </p>
                          <Button
                            variant="light"
                            color="primary"
                            size="sm"
                            type="button"
                            onPress={handleResendOtpForLogin}
                            isLoading={isResendingOtp}
                            isDisabled={isLoading}
                            className="text-sm"
                          >
                            {t("login_modal.resend_code")}
                          </Button>
                        </div>
                      </div>
                      <Button
                        color="primary"
                        className="w-full font-medium"
                        type="submit"
                        isLoading={isLoading}
                        isDisabled={isResendingOtp}
                      >
                        {t("login_modal.verify_and_login")}
                      </Button>
                      <Button
                        variant="light"
                        className="w-full"
                        onPress={() => {
                          if (window.firebaseInstance) {
                            clearRecaptchaVerifier(window.firebaseInstance);
                          }
                          if (window.confirmationResult) {
                            window.confirmationResult = undefined;
                          }
                          setOtpStep("phone");
                        }}
                        isDisabled={isLoading}
                      >
                        {t("login_modal.back_to_phone")}
                      </Button>
                    </Form>
                  )
                ) : (
                  // Email/Mobile with Password Login
                  <Form
                    ref={formRef}
                    className="w-full space-y-6"
                    onSubmit={handleLoginSubmit}
                    autoComplete="off"
                  >
                    {/* Input Fields */}
                    <div className="flex flex-col gap-6 w-full">
                      {loginMode === "email" ? (
                        <Input
                          ref={emailInputRef}
                          key="email-input" // Force remount on tab change
                          isRequired
                          autoComplete="email"
                          label={t("login_modal.email_label")}
                          labelPlacement="outside"
                          placeholder={t("login_modal.email_placeholder")}
                          name="email"
                          type="email"
                          value={emailValue}
                          isInvalid={!!errors.email}
                          errorMessage={errors.email}
                          onChange={(e) => handleEmailChange(e.target.value)}
                          isReadOnly={isEmailReadOnly}
                          onFocus={() => setIsEmailReadOnly(false)}
                          classNames={{ errorMessage: "text-xs" }}
                          endContent={
                            isCheckingEmail ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                            ) : (
                              <Mail size={18} className="text-default-400" />
                            )
                          }
                        />
                      ) : (
                        <Input
                          ref={mobileInputRef}
                          key="mobile-input" // Force remount on tab change
                          isRequired
                          autoComplete="tel"
                          label={t("login_modal.mobile_label")}
                          labelPlacement="outside"
                          placeholder={t("login_modal.mobile_placeholder")}
                          name="mobile"
                          type="tel"
                          value={mobileValue}
                          onChange={(e) => handleMobileChange(e.target.value)}
                          isReadOnly={isMobileReadOnly}
                          onFocus={() => setIsMobileReadOnly(false)}
                          isInvalid={!!errors.mobile}
                          errorMessage={errors.mobile}
                          classNames={{ errorMessage: "text-xs" }}
                          endContent={
                            isCheckingMobile ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                            ) : (
                              <Phone size={18} className="text-default-400" />
                            )
                          }
                        />
                      )}

                      <Input
                        key={`password-${loginMode}`}
                        isRequired
                        autoComplete="current-password"
                        label={t("login_modal.password_label")}
                        labelPlacement="outside"
                        placeholder={t("login_modal.password_placeholder")}
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={passwordValue}
                        onChange={(e) => setPasswordValue(e.target.value)}
                        errorMessage={errors.password}
                        classNames={{ errorMessage: "text-xs" }}
                        endContent={
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="focus:outline-none"
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff size={18} className="text-default-400" />
                            ) : (
                              <Eye size={18} className="text-default-400" />
                            )}
                          </button>
                        }
                      />

                      <div className="flex justify-end w-full items-center">
                        <Link color="primary" href="/forgot-password" size="sm">
                          {t("login_modal.forgot_password")}
                        </Link>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                      color="primary"
                      className="w-full font-medium"
                      type="submit"
                      isLoading={isLoading}
                      isDisabled={isCheckingEmail || isCheckingMobile}
                    >
                      {t("login_modal.sign_in")}
                    </Button>
                  </Form>
                )}

                {/* Social Login */}

                <div className="flex items-center gap-4 mt-6">
                  <Divider className="flex-1" />
                  <span className="text-default-500 text-sm">
                    {t("login_modal.or")}
                  </span>
                  <Divider className="flex-1" />
                </div>

                <div className="flex flex-col gap-3 mt-4">
                  {authSettings?.googleLogin && (
                    <GoogleLoginBtn
                      isLoading={isLoading}
                      onOpenChange={onOpenChange}
                      setIsLoading={setIsLoading}
                      context="login"
                    />
                  )}
                  {/* <AppleLoginBtn
                    isLoading={isLoading}
                    onOpenChange={onOpenChange}
                    setIsLoading={setIsLoading}
                    context="login"
                  /> */}
                </div>
              </ModalBody>

              <ModalFooter className="flex items-center justify-center gap-2">
                <p className="text-center text-sm text-default-500">
                  {t("login_modal.no_account")}
                </p>
                <Link
                  color="primary"
                  size="sm"
                  onClick={() => {
                    document.getElementById("register-btn")?.click();
                    handleModalClose();
                    onClose();
                  }}
                  className="cursor-pointer"
                >
                  {t("login_modal.create_account")}
                </Link>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <RegisterModal />
    </>
  );
};

export default LoginModal;
