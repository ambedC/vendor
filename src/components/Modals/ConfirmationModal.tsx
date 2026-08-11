import { FC, ReactNode, useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Divider,
  Alert,
} from "@heroui/react";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  HelpCircle,
} from "lucide-react";

type ConfirmationVariant =
  | "danger"
  | "warning"
  | "success"
  | "primary"
  | "default";

type AlertVariant = "danger" | "warning" | "success" | "primary" | "default";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  alertTitle?: string;
  alertDescription?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmationVariant;
  showAlert?: boolean;
  alertVariant?: AlertVariant;
  icon?: ReactNode;
  isDismissable?: boolean;
  size?:
    | "xs"
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "2xl"
    | "3xl"
    | "4xl"
    | "5xl"
    | "full";
}

const ConfirmationModal: FC<ConfirmationModalProps> = ({
  isOpen,
  onClose = () => {},
  onConfirm = () => {},
  title,
  description,
  alertTitle,
  alertDescription,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  showAlert = true,
  alertVariant,
  icon,
  isDismissable = false,
  size = "sm",
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Default icons based on variant
  const getDefaultIcon = () => {
    switch (variant) {
      case "danger":
        return <XCircle className="h-5 w-5" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5" />;
      case "success":
        return <CheckCircle className="h-5 w-5" />;
      case "primary":
        return <Info className="h-5 w-5" />;
      default:
        return <HelpCircle className="h-5 w-5" />;
    }
  };

  // Color classes based on variant
  const getVariantClasses = (): {
    iconBg: string;
    iconColor: string;
    confirmButton:
      | "danger"
      | "warning"
      | "success"
      | "primary"
      | "default"
      | "secondary";
  } => {
    switch (variant) {
      case "danger":
        return {
          iconBg: "bg-danger-100 dark:bg-danger-100/20",
          iconColor: "text-danger-600 dark:text-danger-400",
          confirmButton: "danger",
        };
      case "warning":
        return {
          iconBg: "bg-warning-100 dark:bg-warning-100/20",
          iconColor: "text-warning-600 dark:text-warning-400",
          confirmButton: "warning",
        };
      case "success":
        return {
          iconBg: "bg-success-100 dark:bg-success-100/20",
          iconColor: "text-success-600 dark:text-success-400",
          confirmButton: "success",
        };
      case "primary":
        return {
          iconBg: "bg-primary-100 dark:bg-primary-100/20",
          iconColor: "text-primary-600 dark:text-primary-400",
          confirmButton: "primary",
        };
      default:
        return {
          iconBg: "bg-default-100 dark:bg-default-100/20",
          iconColor: "text-default-600 dark:text-default-400",
          confirmButton: "default",
        };
    }
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Confirmation action failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const variantClasses = getVariantClasses();
  const displayIcon = icon || getDefaultIcon();
  const finalAlertVariant = alertVariant || variant;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isDismissable={isDismissable}
      placement="center"
      backdrop="blur"
      classNames={{
        base: "border-none",
        wrapper: "w-full",
      }}
      size={size}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 pb-2">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${variantClasses.iconBg}`}
                >
                  <div className={variantClasses.iconColor}>{displayIcon}</div>
                </div>
                <div>
                  <h3 className="text-medium font-semibold text-foreground">
                    {title}
                  </h3>
                  {description && (
                    <p className="text-xs text-default-500">{description}</p>
                  )}
                </div>
              </div>
            </ModalHeader>

            <Divider />

            <ModalBody className="py-6">
              {showAlert && (alertTitle || alertDescription) && (
                <Alert
                  classNames={{
                    description: "text-xs",
                  }}
                  color={finalAlertVariant}
                  title={alertTitle}
                  description={alertDescription}
                  variant="faded"
                />
              )}
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
                {cancelText}
              </Button>
              <Button
                size="sm"
                color={variantClasses?.confirmButton || ""}
                onPress={handleConfirm}
                className="font-medium text-sm"
                isLoading={isLoading}
                startContent={!isLoading ? displayIcon : undefined}
              >
                {confirmText}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ConfirmationModal;
