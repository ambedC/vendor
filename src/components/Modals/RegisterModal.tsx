import { useState, useEffect, FormEvent, FC, useCallback, useRef } from "react";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Divider,
  useDisclosure,
  Link,
  InputOtp,
  addToast,
  Form,
} from "@heroui/react";
import { TruckElectric, Eye, EyeOff } from "lucide-react";
import {
  checkEmailExists,
  checkPhoneExists,
  handleSignUp,
  handleResendOtp,
  handleRegisterUser,
} from "@/helpers/auth";
import GoogleLoginBtn from "../Functional/GoogleLoginBtn";
import { clearRecaptchaVerifier, FirebaseInstance } from "@/lib/firebase";
import { ConfirmationResult } from "firebase/auth";
import { useDispatch } from "react-redux";
import {
  validateConfirmPassword,
  validateEmail,
  validateName,
  validatePassword,
} from "@/helpers/validator";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import { demoNumber } from "@/config/constants";
import { useSettings } from "@/contexts/SettingsContext";
import { sendOtp, verifyOtp } from "@/routes/api";
const PhoneInput = dynamic(() => import("@/components/Functional/PhoneInput"), {
  ssr: false,
});

type FieldErrors = {
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
};

export const RegisterModal: FC = () => {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { demoMode, authSettings, systemSettings } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [numberDetails, setNumberDetails] = useState({
    countryCode: "",
    phoneNumber: "",
    dialCode: "",
    name: "",
  });
  const [step, setStep] = useState<"details" | "otp" | "complete">("details");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    friends_code: "",
  });
  const [isEmailPrefilled, setIsEmailPrefilled] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    name: "",
  });
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);

  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [isOtpRequested, setIsOtpRequested] = useState(false);

  const smsGateway =
    authSettings?.smsGateway ||
    (authSettings?.firebase
      ? "firebase"
      : authSettings?.customSms
        ? "custom"
        : "firebase");
  const isFirebaseGateway = smsGateway === "firebase";
  const isCustomGateway = smsGateway === "custom";

  // Clean up function
  const cleanupModalState = useCallback(() => {
    setStep("details");
    setPhoneNumber("");
    setFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      friends_code: "",
    });
    setFieldErrors({
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      name: "",
    });
    setIsLoading(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsCheckingEmail(false);
    setIsCheckingPhone(false);
    setIsEmailPrefilled(false);
    setIsPhoneVerified(false);
    setIsSendingOtp(false);
    setIsVerifyingOtp(false);
    setOtpValue("");
    setIsOtpRequested(false);

    if (window.confirmationResult) {
      window.confirmationResult = undefined;
    }

    if (window.firebaseInstance) {
      clearRecaptchaVerifier(window.firebaseInstance);
    }

    // cleanup any prefill flags set by Google login flow
    if (window.prefillRegisterEmail) window.prefillRegisterEmail = undefined;
    if (window.prefillUserName) window.prefillUserName = undefined;
    if (window.prefillRegisterFromGoogle)
      window.prefillRegisterFromGoogle = undefined;
  }, []);

  // Handle modal state changes
  useEffect(() => {
    if (!isOpen) {
      cleanupModalState();
    }
    // when modal opens, check for google prefill
    if (isOpen) {
      const prefEmail = window.prefillRegisterEmail as string | undefined;
      const prefUserName = window.prefillUserName as string | undefined;
      const prefFromGoogle = window.prefillRegisterFromGoogle as
        | boolean
        | undefined;
      if (prefFromGoogle && prefEmail) {
        setFormData((prev) => ({
          ...prev,
          email: prefEmail,
          name: prefUserName || "",
        }));
        setIsEmailPrefilled(true);
      }
    }
  }, [isOpen, cleanupModalState]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail =
        (e as CustomEvent<{ email?: string; name?: string }>).detail || {};
      setFormData((prev) => ({
        ...prev,
        email: detail.email || "",
        name: detail.name || "",
      }));
      setIsEmailPrefilled(!!detail.email);
    };
    window.addEventListener("register-prefill", handler as EventListener);
    return () => {
      window.removeEventListener("register-prefill", handler as EventListener);
    };
  }, []);

  // Enhanced debounce function
  const useDebounce = <T extends unknown[]>(
    callback: (...args: T) => void,
    delay: number,
  ) => {
    const timer = useRef<NodeJS.Timeout | null>(null);

    return useCallback(
      (...args: T) => {
        if (timer.current) {
          clearTimeout(timer.current);
        }
        timer.current = setTimeout(() => {
          callback(...args);
        }, delay);
      },
      [callback, delay],
    );
  };

  const debouncedEmailCheck = useDebounce((email: string) => {
    // First validate email format
    const emailError = validateEmail(email);
    if (emailError) {
      setFieldErrors((prev) => ({ ...prev, email: emailError }));
      return;
    }

    // If format is valid, check if email exists
    checkEmailExists(email, setIsCheckingEmail, setFieldErrors);
  }, 1000);

  const debouncedPhoneCheck = useDebounce(
    (phone: string) =>
      checkPhoneExists(phone, setIsCheckingPhone, setFieldErrors),
    1000,
  );

  // Handle real-time validation
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const nameError = validateName(name);
    setFieldErrors((prev) => ({ ...prev, name: nameError }));
    setFormData((prev) => ({ ...prev, name }));
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isEmailPrefilled) return; // ignore changes when email is prefilling from Google

    const email = e.target.value;
    setFormData((prev) => ({ ...prev, email }));
    if (email) {
      debouncedEmailCheck(email);
    } else {
      setFieldErrors((prev) => ({ ...prev, email: "" }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    const passwordError = validatePassword(password);
    setFieldErrors((prev) => ({ ...prev, password: passwordError }));

    // Also revalidate confirm password if it exists
    if (formData.confirmPassword) {
      const confirmPasswordError = validateConfirmPassword(
        password,
        formData.confirmPassword,
      );
      setFieldErrors((prev) => ({
        ...prev,
        confirmPassword: confirmPasswordError,
      }));
    }

    setFormData((prev) => ({ ...prev, password }));
  };

  const handleReferralCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const friends_code = e.target.value;
    setFormData((prev) => ({ ...prev, friends_code }));
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const confirmPassword = e.target.value;
    const confirmPasswordError = validateConfirmPassword(
      formData.password,
      confirmPassword,
    );
    setFieldErrors((prev) => ({
      ...prev,
      confirmPassword: confirmPasswordError,
    }));
    setFormData((prev) => ({ ...prev, confirmPassword }));
  };

  const handleDetailsSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const data = Object.fromEntries(new FormData(e.currentTarget));

    const { name, email, password, confirmPassword, friends_code } = data;

    // Final validation before submission
    const nameError = validateName(name as string);
    const emailError = validateEmail(email as string);
    const passwordError = validatePassword(password as string);
    const confirmPasswordError = validateConfirmPassword(
      password as string,
      confirmPassword as string,
    );

    // Update all field errors
    setFieldErrors({
      name: nameError,
      email: emailError || fieldErrors.email, // Keep existing email error if it's about email existence
      password: passwordError,
      confirmPassword: confirmPasswordError,
      phone: fieldErrors.phone,
    });

    // Check if there are any validation errors
    if (
      nameError ||
      emailError ||
      passwordError ||
      confirmPasswordError ||
      fieldErrors.email ||
      fieldErrors.phone
    ) {
      addToast({
        title: t("register_modal.toasts.validation_error.title"),
        description: t("register_modal.toasts.validation_error.description"),
        color: "danger",
      });
      setIsLoading(false);
      return;
    }

    if (!phoneNumber || phoneNumber.length < 10) {
      addToast({
        title: t("register_modal.toasts.invalid_phone.title"),
        description: t("register_modal.toasts.invalid_phone.description"),
        color: "danger",
      });
      setIsLoading(false);
      return;
    }

    if (isCheckingEmail || isCheckingPhone) {
      addToast({
        title: t("register_modal.toasts.validating_info.title"),
        description: t("register_modal.toasts.validating_info.description"),
        color: "warning",
      });
      setIsLoading(false);
      return;
    }

    if (isFirebaseGateway) {
      const firebaseInstance = window.firebaseInstance as
        | FirebaseInstance
        | undefined;
      if (!firebaseInstance) {
        addToast({
          title: t("register_modal.toasts.firebase_error.title"),
          description: t("register_modal.toasts.firebase_error.description"),
          color: "danger",
        });
        setIsLoading(false);
        return;
      }

      setFormData({
        name: name as string,
        email: email as string,
        password: password as string,
        confirmPassword: confirmPassword as string,
        friends_code: (friends_code as string) || "",
      });

      const success = await handleSignUp(phoneNumber, firebaseInstance);
      if (success) {
        setStep("otp");
      }
      setIsLoading(false);
      return;
    }

    if (isCustomGateway && !isPhoneVerified) {
      addToast({
        title: t("register_modal.toasts.invalid_phone.title"),
        description: t("register_modal.toasts.invalid_phone.description"),
        color: "danger",
      });
      setIsLoading(false);
      return;
    }

    setFormData({
      name: name as string,
      email: email as string,
      password: password as string,
      confirmPassword: confirmPassword as string,
      friends_code: (friends_code as string) || "",
    });

    const res = await handleRegisterUser(
      {
        email: email as string,
        iso_2: numberDetails.countryCode,
        mobile: numberDetails.phoneNumber,
        name: name as string,
        country: numberDetails.name,
        password: password as string,
        password_confirmation: confirmPassword as string,
        friends_code: (friends_code as string) || undefined,
      },
      dispatch,
    );

    if (res.success) {
      setStep("complete");
    } else {
      onClose();
    }

    setIsLoading(false);
  };

  const handleOtpSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const data = Object.fromEntries(new FormData(e.currentTarget));
    const otp = data.otp as string;

    if (!otp || otp.length !== 6) {
      addToast({
        title: t("register_modal.toasts.invalid_otp.title"),
        description: t("register_modal.toasts.invalid_otp.description"),
        color: "danger",
      });

      setIsLoading(false);
      return;
    }

    // Get confirmation result
    const confirmationResult = window.confirmationResult as
      | ConfirmationResult
      | undefined;
    if (!confirmationResult) {
      addToast({
        title: t("register_modal.toasts.validating_info.title"),
        description: t("register_modal.toasts.validating_info.description"),
        color: "danger",
      });
      setIsLoading(false);
      setStep("details");
      return;
    }

    try {
      // Verify OTP
      const userCredential = await confirmationResult.confirm(otp);
      const idToken = await userCredential.user.getIdToken();

      const res = await handleRegisterUser(
        {
          email: formData.email,
          iso_2: numberDetails.countryCode,
          mobile: numberDetails.phoneNumber,
          name: formData.name,
          country: numberDetails.name,
          password: formData.password,
          password_confirmation: formData.confirmPassword,
          friends_code: formData.friends_code || undefined,
        },
        dispatch,
        idToken,
      );

      if (res.success) {
        setStep("complete");
      } else {
        onClose();
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to verify OTP";
      console.error("OTP verification error:", errorMsg);
      addToast({
        title: t("register_modal.toasts.verification_error.title"),
        description: errorMsg,
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);

    if (isFirebaseGateway) {
      const firebaseInstance = window.firebaseInstance as
        | FirebaseInstance
        | undefined;
      if (!firebaseInstance) {
        addToast({
          title: t("register_modal.toasts.firebase_error.title"),
          description: t("register_modal.toasts.firebase_error.description"),
          color: "danger",
        });
        setIsLoading(false);
        return;
      }

      await handleResendOtp(phoneNumber, firebaseInstance);
    } else if (isCustomGateway) {
      try {
        const response = await sendOtp({
          mobile: phoneNumber,
          expires_in: 600,
        });

        if (response.success) {
          addToast({
            title: t("register_modal.toasts.otp_sent.title"),
            description: t("register_modal.toasts.otp_sent.description"),
            color: "success",
          });
        } else {
          addToast({
            title: t("register_modal.toasts.verification_error.title"),
            description:
              response.message || "Failed to resend OTP. Please try again.",
            color: "danger",
          });
        }
      } catch (error) {
        console.error("Custom SMS resend OTP error (register):", error);
        addToast({
          title: t("register_modal.toasts.verification_error.title"),
          description: "Failed to resend OTP. Please try again.",
          color: "danger",
        });
      }
    }
    setIsLoading(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handlePhoneChange = (
    countryCode: string,
    phoneNumber: string,
    dialCode: string,
    name: string,
  ) => {
    const formattedNumber = `${dialCode}${phoneNumber}`;
    setPhoneNumber(formattedNumber);
    setNumberDetails({ countryCode, dialCode, phoneNumber, name });

    if (isCustomGateway) {
      setIsPhoneVerified(false);
      setOtpValue("");
      setIsOtpRequested(false);
    }

    if (formattedNumber && formattedNumber.length >= 10) {
      debouncedPhoneCheck(phoneNumber);
    } else {
      setFieldErrors((prev) => ({ ...prev, phone: "" }));
    }
  };

  const isFormValid = () => {
    return (
      !fieldErrors.name &&
      !fieldErrors.email &&
      !fieldErrors.password &&
      !fieldErrors.confirmPassword &&
      !fieldErrors.phone &&
      phoneNumber &&
      (!isCustomGateway || isPhoneVerified) &&
      formData.name &&
      formData.email &&
      formData.password &&
      formData.confirmPassword &&
      !isCheckingEmail &&
      !isCheckingPhone
    );
  };

  return (
    <>
      <button id="register-btn" onClick={onOpen} className="hidden">
        Register
      </button>

      <Modal
        isOpen={isOpen}
        isDismissable={false}
        onOpenChange={onOpenChange}
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
                    {t(`register_modal.steps.${step}.title`)}
                  </h2>
                </div>
                <p className="text-xs text-foreground/50">
                  {t(`register_modal.steps.${step}.subtitle`, { phoneNumber })}
                </p>
              </ModalHeader>

              <ModalBody className="py-6 flex">
                <div className="w-full">
                  <div className={`${step === "details" ? "block" : "hidden"}`}>
                    <Form
                      className="w-full space-y-6"
                      onSubmit={handleDetailsSubmit}
                      validationBehavior="native"
                    >
                      <div className="flex flex-col gap-6 w-full">
                        <Input
                          isRequired
                          autoComplete="name"
                          label={t("register_modal.fields.name.label")}
                          placeholder={t(
                            "register_modal.fields.name.placeholder",
                          )}
                          labelPlacement="outside"
                          variant="flat"
                          name="name"
                          type="text"
                          value={formData.name}
                          minLength={2}
                          onChange={handleNameChange}
                          color={fieldErrors.name ? "danger" : "default"}
                          classNames={{ errorMessage: "sm:text-xs" }}
                          errorMessage={fieldErrors.name}
                        />

                        <Input
                          isRequired
                          autoComplete="email"
                          labelPlacement="outside"
                          label={t("register_modal.fields.email.label")}
                          placeholder={t(
                            "register_modal.fields.email.placeholder",
                          )}
                          variant="flat"
                          name="email"
                          type="email"
                          onChange={handleEmailChange}
                          value={formData.email}
                          isReadOnly={isEmailPrefilled}
                          color={fieldErrors.email ? "danger" : "default"}
                          classNames={{ errorMessage: "sm:text-xs" }}
                          errorMessage={fieldErrors.email}
                          endContent={
                            isCheckingEmail ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            ) : null
                          }
                        />

                        {systemSettings?.referEarnStatus !== false && (
                          <Input
                            autoComplete="off"
                            labelPlacement="outside"
                            label={
                              t("register_modal.fields.referralCode.label") ||
                              "Referral Code (Optional)"
                            }
                            placeholder={
                              t(
                                "register_modal.fields.referralCode.placeholder",
                              ) || "Enter referral code"
                            }
                            variant="flat"
                            name="friends_code"
                            type="text"
                            onChange={handleReferralCodeChange}
                            value={formData.friends_code}
                            color="default"
                            classNames={{ errorMessage: "sm:text-xs" }}
                          />
                        )}

                        <div className="w-full">
                          <div className="flex items-end gap-2">
                            <div className="flex-1">
                              <PhoneInput
                                defaultCountry={demoMode ? "in" : undefined}
                                defaultValue={demoMode ? demoNumber : undefined}
                                onPhoneChange={handlePhoneChange}
                                className="w-full"
                                label={t("register_modal.fields.phone.label")}
                                placeholder={t(
                                  "register_modal.fields.phone.placeholder",
                                )}
                              />
                            </div>
                            {isCustomGateway && (
                              <Button
                                color="primary"
                                variant={isPhoneVerified ? "flat" : "solid"}
                                className="min-w-[88px]"
                                type="button"
                                isLoading={isSendingOtp}
                                isDisabled={
                                  !phoneNumber ||
                                  isCheckingPhone ||
                                  !!fieldErrors.phone ||
                                  isPhoneVerified
                                }
                                onPress={async () => {
                                  setIsSendingOtp(true);
                                  try {
                                    const response = await sendOtp({
                                      mobile: phoneNumber,
                                      expires_in: 600,
                                    });

                                    if (response.success) {
                                      addToast({
                                        title: t("signup_toast.otp_sent_title"),
                                        description: t(
                                          "signup_toast.otp_sent_desc",
                                        ),
                                        color: "success",
                                      });
                                      setIsOtpRequested(true);
                                    } else {
                                      addToast({
                                        title:
                                          t(
                                            "register_modal.toasts.verification_error.title",
                                          ) || "Failed",
                                        description:
                                          response.message ||
                                          "Failed to send OTP. Please try again.",
                                        color: "danger",
                                      });
                                    }
                                  } catch (error) {
                                    console.error(
                                      "Custom SMS send OTP error (register):",
                                      error,
                                    );
                                    addToast({
                                      title:
                                        t(
                                          "register_modal.toasts.verification_error.title",
                                        ) || "Failed",
                                      description:
                                        "Failed to send OTP. Please try again.",
                                      color: "danger",
                                    });
                                  } finally {
                                    setIsSendingOtp(false);
                                  }
                                }}
                              >
                                {isPhoneVerified
                                  ? t("register_modal.buttons.verified") ||
                                    "Verified"
                                  : t("register_modal.buttons.verify") ||
                                    "Verify"}
                              </Button>
                            )}
                          </div>
                          {(fieldErrors.phone || isCheckingPhone) && (
                            <div className="mt-1 text-xs text-danger flex items-center gap-2">
                              {isCheckingPhone && (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-danger"></div>
                              )}
                              {fieldErrors.phone}
                            </div>
                          )}
                          {isCustomGateway &&
                            isOtpRequested &&
                            !isPhoneVerified && (
                              <div className="mt-4">
                                <div className="flex w-full justify-center">
                                  <InputOtp
                                    length={6}
                                    placeholder={t(
                                      "register_modal.fields.otp.placeholder",
                                    )}
                                    variant="flat"
                                    name="customOtp"
                                    color="primary"
                                    size="lg"
                                    radius="md"
                                    value={otpValue}
                                    onValueChange={setOtpValue}
                                    classNames={{
                                      wrapper: "flex gap-2 justify-center",
                                      errorMessage: "sm:text-xs text-center",
                                    }}
                                  />
                                </div>
                                <Button
                                  color="primary"
                                  className="w-full font-medium mt-3"
                                  type="button"
                                  isLoading={isVerifyingOtp}
                                  isDisabled={
                                    !otpValue || otpValue.length !== 6
                                  }
                                  onPress={async () => {
                                    setIsVerifyingOtp(true);
                                    try {
                                      const response = await verifyOtp({
                                        mobile: phoneNumber,
                                        otp: otpValue,
                                      });

                                      if (response.success) {
                                        setIsPhoneVerified(true);
                                        addToast({
                                          title:
                                            t(
                                              "register_modal.toasts.otp_verified.title",
                                            ) || "Verified",
                                          description:
                                            t(
                                              "register_modal.toasts.otp_verified.description",
                                            ) ||
                                            "Phone number verified successfully.",
                                          color: "success",
                                        });
                                      } else {
                                        addToast({
                                          title:
                                            t(
                                              "register_modal.toasts.verification_error.title",
                                            ) || "Verification failed",
                                          description:
                                            response.message ||
                                            "Invalid or expired OTP. Please try again.",
                                          color: "danger",
                                        });
                                      }
                                    } catch (error) {
                                      console.error(
                                        "Custom SMS verify OTP error (register):",
                                        error,
                                      );
                                      addToast({
                                        title:
                                          t(
                                            "register_modal.toasts.verification_error.title",
                                          ) || "Verification failed",
                                        description:
                                          "Failed to verify OTP. Please try again.",
                                        color: "danger",
                                      });
                                    } finally {
                                      setIsVerifyingOtp(false);
                                    }
                                  }}
                                >
                                  {t("register_modal.buttons.verify_code") ||
                                    "Verify Code"}
                                </Button>
                              </div>
                            )}
                        </div>

                        <Input
                          isRequired
                          autoComplete="new-password"
                          label={t("register_modal.fields.password.label")}
                          placeholder={t(
                            "register_modal.fields.password.placeholder",
                          )}
                          description={t(
                            "register_modal.fields.password.description",
                          )}
                          labelPlacement="outside"
                          variant="flat"
                          name="password"
                          minLength={8}
                          onChange={handlePasswordChange}
                          isInvalid={!!fieldErrors.password}
                          color={fieldErrors.password ? "danger" : "default"}
                          classNames={{
                            errorMessage: "sm:text-xs",
                            description: "text-xs",
                          }}
                          errorMessage={fieldErrors.password}
                          endContent={
                            <button
                              className="focus:outline-none"
                              type="button"
                              onClick={togglePasswordVisibility}
                            >
                              {showPassword ? (
                                <EyeOff
                                  className="text-default-400"
                                  size={18}
                                />
                              ) : (
                                <Eye className="text-default-400" size={18} />
                              )}
                            </button>
                          }
                          type={showPassword ? "text" : "password"}
                        />

                        <Input
                          isRequired
                          autoComplete="new-password"
                          labelPlacement="outside"
                          label={t(
                            "register_modal.fields.confirmPassword.label",
                          )}
                          placeholder={t(
                            "register_modal.fields.confirmPassword.placeholder",
                          )}
                          variant="flat"
                          name="confirmPassword"
                          onChange={handleConfirmPasswordChange}
                          isInvalid={!!fieldErrors.confirmPassword}
                          color={
                            fieldErrors.confirmPassword ? "danger" : "default"
                          }
                          classNames={{ errorMessage: "sm:text-xs" }}
                          errorMessage={fieldErrors.confirmPassword}
                          endContent={
                            <button
                              className="focus:outline-none"
                              type="button"
                              onClick={toggleConfirmPasswordVisibility}
                            >
                              {showConfirmPassword ? (
                                <EyeOff
                                  className="text-default-400"
                                  size={18}
                                />
                              ) : (
                                <Eye className="text-default-400" size={18} />
                              )}
                            </button>
                          }
                          type={showConfirmPassword ? "text" : "password"}
                        />
                      </div>

                      <Button
                        color="primary"
                        className="w-full font-medium"
                        type="submit"
                        isLoading={isLoading}
                        isDisabled={!isFormValid()}
                      >
                        {isCustomGateway
                          ? t("register_modal.buttons.register")
                          : t("register_modal.buttons.send_verification")}
                      </Button>
                    </Form>

                    <div className="flex items-center gap-4 mt-6">
                      <Divider className="flex-1" />
                      <span className="text-default-500 text-sm">OR</span>
                      <Divider className="flex-1" />
                    </div>

                    <div className="flex flex-col gap-3">
                      <GoogleLoginBtn
                        isLoading={isLoading}
                        onOpenChange={onOpenChange}
                        setIsLoading={setIsLoading}
                        context="register"
                      />
                      {/* <AppleLoginBtn
                        isLoading={isLoading}
                        onOpenChange={onOpenChange}
                        setIsLoading={setIsLoading}
                        context="register"
                      /> */}
                    </div>
                  </div>

                  <div className={`${step === "otp" ? "block" : "hidden"}`}>
                    <Form
                      className="w-full space-y-6"
                      onSubmit={handleOtpSubmit}
                      validationBehavior="native"
                    >
                      <div className="flex flex-col gap-6 w-full items-center">
                        <InputOtp
                          isRequired
                          length={6}
                          placeholder={t(
                            "register_modal.fields.otp.placeholder",
                          )}
                          variant="flat"
                          name="otp"
                          color="primary"
                          size="lg"
                          radius="md"
                          classNames={{
                            wrapper: "flex gap-2 justify-center",
                            errorMessage: "sm:text-xs text-center",
                          }}
                          errorMessage={({ validationDetails }) => {
                            if (validationDetails.valueMissing) {
                              return "Please enter the verification code";
                            }
                          }}
                        />
                        <div className="text-center">
                          <p className="text-sm text-default-500 mb-2">
                            {t("register_modal.messages.did_not_receive_code")}
                          </p>
                          <Button
                            variant="light"
                            color="primary"
                            size="sm"
                            onPress={handleResendCode}
                            isLoading={isLoading}
                            className="text-sm"
                          >
                            {t("register_modal.buttons.resend_code")}
                          </Button>
                        </div>
                      </div>
                      <Button
                        color="primary"
                        className="w-full font-medium"
                        type="submit"
                        isLoading={isLoading}
                      >
                        {t("register_modal.buttons.verify_create")}
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

                          setStep("details");
                        }}
                        isDisabled={isLoading}
                      >
                        {t("register_modal.buttons.back_to_details")}
                      </Button>
                    </Form>
                  </div>

                  <div
                    className={`${step === "complete" ? "block" : "hidden"}`}
                  >
                    <div className="text-center space-y-4">
                      <div className="text-6xl">🎉</div>
                      <p className="text-lg font-medium">
                        {t("register_modal.messages.account_created")}
                      </p>
                      <p className="text-default-500">
                        {t("register_modal.messages.start_using")}
                      </p>
                      <Button
                        color="primary"
                        className="w-full font-medium"
                        onPress={() => onOpenChange()}
                      >
                        {t("register_modal.buttons.get_started")}
                      </Button>
                    </div>
                  </div>
                </div>
              </ModalBody>

              {step === "details" && (
                <ModalFooter className="flex items-center justify-center">
                  <p className="text-center text-sm text-default-500">
                    {t("register_modal.messages.already_account")}
                  </p>
                  <Link
                    color="primary"
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => {
                      const btn = document.getElementById("login-btn");
                      btn?.click();
                      onClose();
                    }}
                  >
                    {t("register_modal.links.login")}
                  </Link>
                </ModalFooter>
              )}
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

export default RegisterModal;
