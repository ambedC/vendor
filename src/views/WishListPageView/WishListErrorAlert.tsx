import { Button, Card, CardBody } from "@heroui/react";
import { AlertCircle, X } from "lucide-react";
import React from "react";

interface ErrorState {
  message: string;
  type: "error" | "warning" | "info";
}

interface WishListErrorAlertProps {
  error: ErrorState | null;
  setError?: (error: ErrorState | null) => void;
}

const WishListErrorAlert: React.FC<WishListErrorAlertProps> = ({
  error,
  setError,
}) => {
  if (!error) return null;

  const colorMap = {
    error: "danger",
    warning: "warning",
    info: "success",
  } as const;

  return (
    <Card className={`mb-4 border-l-4 border-l-${colorMap[error.type]}`}>
      <CardBody className="py-3">
        <div className="flex items-center gap-3">
          <AlertCircle
            className={`w-4 h-4 text-${colorMap[error.type]}-500 shrink-0`}
          />
          <span className={`text-${colorMap[error.type]}-700 text-sm flex-1`}>
            {error.message}
          </span>
          {setError && (
            <Button
              isIconOnly
              variant="light"
              size="sm"
              onPress={() => setError(null)}
              className={`text-${colorMap[error.type]}-500 hover:bg-${colorMap[error.type]}-100 min-w-6 w-6 h-6`}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default WishListErrorAlert;
