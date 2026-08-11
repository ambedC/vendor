import React, { useState, useEffect } from "react";
import { WifiOff, RefreshCw, AlertCircle } from "lucide-react";
import { Card, CardBody, CardFooter, Button, Spinner } from "@heroui/react";
import { useTranslation } from "react-i18next";

const OfflinePage = () => {
  const { t } = useTranslation();
  const [isRetrying, setIsRetrying] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseAnimation((prev) => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      setIsRetrying(false);
      window.location.reload();
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 transition-colors duration-300">
      <Card className="relative max-w-md w-full p-8 md:p-12" shadow="sm">
        <CardBody className="p-0">
          {/* Floating wifi icon with pulse animation */}
          <div className="flex justify-center mb-8 relative">
            <div
              className={`relative ${pulseAnimation ? "animate-pulse" : ""}`}
            >
              <div className="absolute inset-0 bg-red-400/20 rounded-full animate-ping z-50"></div>
              <div className="relative bg-linear-to-br from-red-400 to-red-600 rounded-full p-6 shadow-lg">
                <WifiOff className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
              </div>
            </div>
          </div>

          {/* Main heading */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-slate-700 to-slate-900 dark:from-slate-200 dark:to-white bg-clip-text text-transparent mb-3 animate-fadeIn">
              {t("offline.no_internet")}
            </h1>
            <div className="flex items-center justify-center text-foreground/50 gap-2 mb-4">
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs sm:text-sm">
                {t("offline.connection_lost")}
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-foreground/50 text-center mb-8 leading-relaxed">
            {t("offline.description")}
          </p>
        </CardBody>

        <CardFooter className="flex flex-col gap-4 p-0">
          <Button
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full"
            color="primary"
            variant="solid"
            size="lg"
            startContent={
              isRetrying ? (
                <Spinner size="sm" color="white" />
              ) : (
                <RefreshCw className="h-5 w-5" />
              )
            }
          >
            {isRetrying ? t("offline.retrying") : t("offline.try_again")}
          </Button>

          {/* Help text */}
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 w-full">
            <p className="text-xs text-foreground/50 text-center">
              {t("offline.help_text")}
            </p>
          </div>
        </CardFooter>
      </Card>

      {/* Floating particles animation */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-blue-400/30 rounded-full animate-ping delay-300"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-indigo-400/30 rounded-full animate-ping delay-700"></div>
        <div className="absolute bottom-1/4 left-3/4 w-1 h-1 bg-slate-400/30 rounded-full animate-ping delay-1000"></div>
      </div>
    </div>
  );
};

export default OfflinePage;
