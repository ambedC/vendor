import { useState, FC, useEffect, useRef, useCallback } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  addToast,
  InputOtp,
} from "@heroui/react";
import { TruckElectric, CheckCircle2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { sendOtp, verifyOtp } from "@/routes/api";
import { useSettings } from "@/contexts/SettingsContext";
import { setUserDataRedux } from "@/lib/redux/slices/authSlice";
import { getCookie } from "@/lib/cookies";
import { FirebaseInstance } from "@/lib/firebase";
import {
  handleSignUp,
  handleResendOtp,
  checkPhoneExists,
  handlePhoneLogin,
} from "@/helpers/auth";
import { ConfirmationResult } from "firebase/auth";

const PhoneInput = dynamic(() => import("@/components/Functional/PhoneInput"), {
  ssr: false,
});

type Step = "phone" | "otp" | "success";

export const CompleteProfileModal: FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>("phone");
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [friendsCode, setFriendsCode] = useState("");
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ phone: "" });
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);

  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { authSettings, demoMode } = useSettings();

  const smsGateway =
    authSettings?.smsGateway ||
    (authSettings?.firebase ? "firebase" : "custom");
  const isFirebaseGateway = smsGateway === "firebase";

  useEffect(() => {
    // Listen for custom event to open this modal
    const handleOpen = () => {
      setIsOpen(true);
      setStep("phone");
      // Check for friend code in cookie
      const cookieCode = getCookie("friend_code");
      if (cookieCode) setFriendsCode(cookieCode as string);
    };

    window.addEventListener("open-complete-profile", handleOpen);
    return () =>
      window.removeEventListener("open-complete-profile", handleOpen);
  }, []);

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

  const debouncedPhoneCheck = useDebounce(async (phone: string) => {
    if (!phone || phone.length < 8) return;
    await checkPhoneExists(phone, setIsCheckingPhone, (callback: any) => {
      const newErrors = callback({ phone: "" });
      setFieldErrors(newErrors);
    });
  }, 1000);

  const handlePhoneChange = (
    countryCode: string,
    phoneNumber: string,
    dialCode: string,
  ) => {
    const formattedNumber = `${dialCode}${phoneNumber}`;
    setPhoneNumber(formattedNumber);
    if (phoneNumber.length >= 8) {
      debouncedPhoneCheck(phoneNumber);
    } else {
      setFieldErrors({ phone: "" });
    }
  };

  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 8) {
      addToast({
        title: t("login_modal.errors.invalid_phone_title"),
        color: "danger",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (isFirebaseGateway) {
        const firebaseInstance = window.firebaseInstance as
          | FirebaseInstance
          | undefined;
        if (!firebaseInstance) throw new Error("Firebase not initialized");

        const success = await handleSignUp(phoneNumber, firebaseInstance);
        if (success) setStep("otp");
      } else {
        const res = await sendOtp({ mobile: phoneNumber });
        if (res.success) {
          addToast({
            title: t("signup_toast.otp_sent_title"),
            color: "success",
          });
          setStep("otp");
        } else {
          throw new Error(res.message);
        }
      }
    } catch (error: any) {
      addToast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (val: string) => {
    if (val.length !== 6) return;
    setIsLoading(true);

    try {
      let response;
      if (isFirebaseGateway) {
        const confirmationResult = window.confirmationResult as
          | ConfirmationResult
          | undefined;
        if (!confirmationResult)
          throw new Error("Verification session expired");

        const userCredential = await confirmationResult.confirm(val);
        const idToken = await userCredential.user.getIdToken();

        response = await handlePhoneLogin({
          idToken,
          dispatch,
          friends_code: friendsCode || undefined,
          renderToast: false,
        });
      } else {
        response = await verifyOtp({
          mobile: phoneNumber,
          otp: val,
          friends_code: friendsCode || undefined,
        });
      }

      if (response && response.success) {
        // Phone is verified. Success!
        dispatch(setUserDataRedux(response.data || {}));
        setStep("success");
        setTimeout(() => setIsOpen(false), 2000);
      } else {
        throw new Error(response?.message || "Invalid OTP");
      }
    } catch (error: any) {
      addToast({
        title: "Verification Failed",
        description: error.message,
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResendingOtp(true);
    try {
      if (isFirebaseGateway) {
        const firebaseInstance = window.firebaseInstance as
          | FirebaseInstance
          | undefined;
        if (firebaseInstance)
          await handleResendOtp(phoneNumber, firebaseInstance);
      } else {
        await sendOtp({ mobile: phoneNumber });
      }
      addToast({
        title: t("resend_otp_toast.otp_resent_title"),
        color: "success",
      });
    } finally {
      setIsResendingOtp(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      isDismissable={true}
      isKeyboardDismissDisabled={false}
      hideCloseButton={false}
      backdrop="blur"
      placement="center"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <TruckElectric className="text-primary" size={24} />
            <span className="font-bold">
              {step === "phone" && "Finish Your Profile"}
              {step === "otp" && "Verify Your Number"}
              {step === "success" && "Profile Completed!"}
            </span>
          </div>
        </ModalHeader>
        <ModalBody className="py-6">
          {step === "phone" && (
            <div className="space-y-4">
              <p className="text-sm text-default-500">
                Please provide your phone number to continue.
              </p>
              <PhoneInput
                onPhoneChange={handlePhoneChange}
                defaultCountry={demoMode ? "in" : undefined}
                className="w-full"
              />
              {(fieldErrors.phone || isCheckingPhone) && (
                <div className="text-xs text-danger flex items-center gap-2">
                  {isCheckingPhone && (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-danger"></div>
                  )}
                  {fieldErrors.phone}
                </div>
              )}
              <Input
                label="Friend Code (Optional)"
                placeholder="Enter referral code if any"
                value={friendsCode}
                onValueChange={setFriendsCode}
                variant="flat"
              />
            </div>
          )}

          {step === "otp" && (
            <div className="flex flex-col items-center gap-6">
              <p className="text-sm text-center text-default-500">
                Enter the 6-digit code sent to <br />
                <span className="font-bold text-foreground">{phoneNumber}</span>
              </p>
              <InputOtp
                length={6}
                onValueChange={handleVerify}
                isDisabled={isLoading}
                autoFocus
                variant="bordered"
              />
              <Button
                variant="light"
                size="sm"
                onPress={handleResend}
                isLoading={isResendingOtp}
              >
                Resend Code
              </Button>
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center py-4 gap-3 animate-in zoom-in duration-300">
              <div className="h-16 w-16 bg-success/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="text-success" size={32} />
              </div>
              <h3 className="text-xl font-bold">You&apos;re all set!</h3>
              <p className="text-sm text-default-500">Welcome to Hypermart.</p>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          {step === "phone" && (
            <Button
              color="primary"
              className="w-full"
              isLoading={isLoading || isCheckingPhone}
              onPress={handleSendOtp}
              isDisabled={
                !phoneNumber || phoneNumber.length < 8 || !!fieldErrors.phone
              }
            >
              Send OTP
            </Button>
          )}
          {step === "otp" && (
            <div className="flex gap-2 w-full">
              <Button
                variant="flat"
                onPress={() => setStep("phone")}
                isDisabled={isLoading}
                className="flex-1"
              >
                Edit Number
              </Button>
            </div>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
