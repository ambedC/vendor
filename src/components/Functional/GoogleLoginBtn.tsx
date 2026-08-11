import { handleGoogleLogin } from "@/helpers/auth";
import { Button } from "@heroui/react";
import Image from "next/image";
import { FC } from "react";
import { useTranslation } from "react-i18next";

interface GoogleLoginBtnProps {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onOpenChange: () => void;
  context?: "login" | "register";
}

const GoogleLoginBtn: FC<GoogleLoginBtnProps> = ({
  isLoading,
  setIsLoading,
  onOpenChange,
  context = "login",
}) => {
  const { t } = useTranslation();

  return (
    <Button
      isDisabled={isLoading}
      variant="bordered"
      className="w-full font-medium h-11"
      onPress={() => handleGoogleLogin({ setIsLoading, onOpenChange, context })}
      startContent={
        <div className="w-6 h-6 object-cover">
          <Image
            src="/logos/google-logo.png"
            className="w-full h-full"
            alt="Google logo"
            width={50}
            height={50}
          />
        </div>
      }
    >
      {t("continue_with_google")}
    </Button>
  );
};

export default GoogleLoginBtn;
