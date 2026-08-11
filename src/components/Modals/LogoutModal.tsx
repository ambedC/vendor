import { FC, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  User as HeroUser,
  Divider,
  Alert,
} from "@heroui/react";
import { LogOut } from "lucide-react";
import { handleLogout } from "@/helpers/auth";
import { staticProfileImage } from "@/config/constants";
import { useTranslation } from "react-i18next";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userEmail?: string;
  profileImg?: string;
}

const LogoutModal: FC<LogoutModalProps> = ({
  isOpen,
  onClose,
  userName = "John Doe",
  userEmail = "john.doe@example.com",
  profileImg = staticProfileImage,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const Logout = async () => {
    setIsLoading(true);
    await handleLogout(true);
    onClose();
    setIsLoading(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isDismissable={false}
      placement="center"
      backdrop="blur"
      classNames={{ base: "border-none", wrapper: "w-full" }}
      size="sm"
      scrollBehavior="inside"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 pb-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger-100 dark:bg-none">
                  <LogOut className="h-5 w-5 text-danger-600 dark:text-danger-400" />
                </div>
                <div>
                  <h3 className="text-medium font-semibold text-foreground">
                    {t("logout_title")}
                  </h3>
                  <p className="text-xs text-default-500">
                    {t("logout_subtitle")}
                  </p>
                </div>
              </div>
            </ModalHeader>

            <Divider />

            <ModalBody className="py-6">
              {/* User Info Section */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-default-50 dark:bg-default-100/50">
                <HeroUser
                  classNames={{
                    name: "text-medium font-semibold",
                    description: "text-xs text-blue-500",
                  }}
                  avatarProps={{ src: profileImg, size: "md" }}
                  description={userEmail}
                  name={userName}
                />
              </div>

              {/* Warning Message */}
              <Alert
                classNames={{ description: "text-xxs" }}
                color="warning"
                description={t("logout_alert_description")}
                title={t("logout_alert_title")}
                variant="faded"
              />
            </ModalBody>

            <Divider />

            <ModalFooter>
              <Button
                size="sm"
                color="default"
                variant="bordered"
                onPress={onClose}
                className="font-medium text-sm"
                isDisabled={isLoading}
              >
                {t("cancel")}
              </Button>
              <Button
                size="sm"
                color="danger"
                onPress={Logout}
                className="font-medium text-sm"
                isLoading={isLoading}
                startContent={<LogOut className="h-4 w-4" />}
              >
                {t("logout_confirm")}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default LogoutModal;
