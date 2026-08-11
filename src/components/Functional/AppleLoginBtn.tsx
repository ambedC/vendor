import { handleAppleLogin } from "@/helpers/auth";
import { Button } from "@heroui/react";
import { SiApple } from "react-icons/si";
import { FC } from "react";
import { useTranslation } from "react-i18next";

interface AppleLoginBtnProps {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onOpenChange: () => void;
  context?: "login" | "register";
}

const AppleLoginBtn: FC<AppleLoginBtnProps> = ({
  isLoading,
  setIsLoading,
  onOpenChange,
  context = "login",
}) => {
  const { t } = useTranslation();

  return (
    <Button
      isDisabled={isLoading}
      variant="solid"
      className="w-full font-semibold bg-black text-white hover:bg-zinc-800 transition-colors h-11"
      onPress={() => handleAppleLogin({ setIsLoading, onOpenChange, context })}
      startContent={<SiApple size={18} className="text-white" />}
    >
      {t("continue_with_apple")}
    </Button>
  );
};

export default AppleLoginBtn;
