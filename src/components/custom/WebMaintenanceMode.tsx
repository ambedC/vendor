import { Settings, Clock } from "lucide-react";
import { Button, Card } from "@heroui/react";
import { motion, Variants } from "framer-motion";
import { ReactNode } from "react";
import { NextPageWithLayout } from "@/types";
import Head from "next/head";
import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation } from "react-i18next";

interface WebMaintenanceModeProps {
  customMessage?: string | null;
}

const WebMaintenanceMode: NextPageWithLayout<WebMaintenanceModeProps> = ({
  customMessage,
}: WebMaintenanceModeProps = {}) => {
  const { t } = useTranslation();
  const { systemSettings } = useSettings();

  const headingVariants: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
  };

  const subheadingVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.8 } },
  };

  const maintenanceVariants: Variants = {
    hidden: { scale: 0 },
    visible: {
      scale: 1,
      transition: { delay: 0.5, duration: 1, type: "spring" },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { delay: 1, duration: 0.8 } },
  };

  return (
    <>
      <Head>
        <title>{t("maintenance.pageTitle")}</title>
        <meta name="description" content={t("maintenance.metaDescription")} />
      </Head>

      <div className="dark:bg-gray-900 min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-background">
        <div className="absolute w-[149vh] h-screen border border-gray-300 dark:border-gray-700 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute w-[120vh] h-screen border border-gray-300 dark:border-gray-700 rounded-full opacity-20 animate-pulse"></div>

        <div className="relative z-10 max-w-lg w-full px-4 py-8 text-center">
          {/* Maintenance clouds */}
          <motion.div
            className="flex justify-between mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <span className="text-3xl animate-bounce">🔧</span>
            <span className="text-3xl animate-bounce [animation-delay:0.5s]">
              ⚡
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl font-bold mb-6"
            variants={headingVariants}
            initial="hidden"
            animate="visible"
          >
            {t("maintenance.heading")}
          </motion.h1>

          <motion.p
            className="mb-8 text-foreground/50"
            variants={subheadingVariants}
            initial="hidden"
            animate="visible"
          >
            {customMessage ??
              systemSettings?.webMaintenanceMessage ??
              t("maintenance.subheading")}
          </motion.p>

          {/* Maintenance Illustration */}
          <motion.div
            className="relative w-48 h-48 mx-auto mb-8"
            variants={maintenanceVariants}
            initial="hidden"
            animate="visible"
          >
            {/* ...illustration code remains unchanged */}
          </motion.div>

          {/* Information cards */}
          <motion.div
            className="space-y-4"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <Card isHoverable classNames={{ base: "p-4 w-full" }}>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-3 bg-blue-100 dark:bg-blue-900">
                    <Clock className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">
                      {t("maintenance.estimatedTimeTitle")}
                    </p>
                    <p className="text-sm text-foreground/50">
                      {t("maintenance.estimatedTimeDescription")}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card isHoverable classNames={{ base: "p-4 w-full" }}>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-3 bg-green-100 dark:bg-green-900">
                    <Settings className="text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">{t("maintenance.workTitle")}</p>
                    <p className="text-sm text-foreground/50">
                      {t("maintenance.workDescription")}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Footer message */}
          <motion.div
            className="mt-8 text-sm text-gray-500 dark:text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.8 }}
          >
            {t("maintenance.footerMessage")}
          </motion.div>

          <Button
            variant="light"
            color="danger"
            className="mt-8 text-xs hidden"
            size="sm"
            onPress={() => window.location.reload()}
          >
            {t("refresh")}
          </Button>
        </div>
      </div>
    </>
  );
};

WebMaintenanceMode.getLayout = (page: ReactNode) => page;

export default WebMaintenanceMode;
