import { Home, MoveRight } from "lucide-react";
import { Card } from "@heroui/react";
import { useRouter } from "next/router";
import { motion, Variants } from "framer-motion";
import { ReactNode } from "react";
import { NextPageWithLayout } from "@/types";
import PageHead from "@/SEO/PageHead";
import { useTranslation } from "react-i18next";

const Custom404: NextPageWithLayout = () => {
  const router = useRouter();
  const { t } = useTranslation();

  // Animation Variants
  const headingVariants: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } },
  };

  const subheadingVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.8 } },
  };

  const ufoVariants: Variants = {
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
      <PageHead pageTitle={t("pageTitle.404")} />
      <div className="dark:bg-gray-900 min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-background">
        {/* Background circle */}
        <div className="absolute w-[149vh] h-screen border border-gray-300 dark:border-gray-700 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute w-[120vh] h-screen border border-gray-300 dark:border-gray-700 rounded-full opacity-20 animate-pulse"></div>

        <div className="relative z-10 max-w-lg w-full px-4 py-8 text-center">
          {/* Purple emoji clouds */}
          <motion.div
            className="flex justify-between mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <span className="text-3xl animate-bounce">☁️</span>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            className="text-4xl md:text-5xl font-bold mb-6"
            variants={headingVariants}
            initial="hidden"
            animate="visible"
          >
            {t("pages.notFound.heading")}
          </motion.h1>

          {/* Subheading text */}
          <motion.p
            className="mb-8"
            variants={subheadingVariants}
            initial="hidden"
            animate="visible"
          >
            {t("pages.notFound.subheading")}
          </motion.p>

          {/* UFO Illustration */}
          <motion.div
            className="relative w-48 h-48 mx-auto mb-8"
            variants={ufoVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="absolute inset-0 bg-blue-100 dark:bg-blue-800 rounded-full opacity-50 blur-md"></div>
            <div className="relative h-full flex items-center justify-center">
              {/* UFO */}
              <div className="relative">
                {/* UFO Top */}
                <div className="w-16 h-8 bg-gray-700 dark:bg-gray-300 rounded-full mx-auto relative">
                  <div className="absolute top-1 left-2 w-2 h-2 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                  <div className="absolute top-1 left-6 w-2 h-2 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                  <div className="absolute top-1 left-10 w-2 h-2 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                </div>

                {/* UFO Bottom */}
                <div className="w-24 h-8 bg-gray-400 dark:bg-gray-500 rounded-full mx-auto -mt-1 relative">
                  <div className="w-28 h-1 bg-gray-300 dark:bg-gray-700 rounded-full absolute -bottom-1 -left-2"></div>
                </div>
              </div>

              {/* Lightning bolt */}
              <div className="absolute top-0 right-16">
                <div className="text-purple-500 dark:text-purple-400 text-4xl animate-pulse">
                  ⚡
                </div>
              </div>
            </div>
          </motion.div>

          {/* Navigation cards */}
          <motion.div
            className="space-y-4"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <Card
              isHoverable
              classNames={{ base: "p-4 w-full" }}
              isPressable
              onPress={() => router.push("/")}
            >
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-3">
                    <Home />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">
                      {t("pages.notFound.home.title")}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      {t("pages.notFound.home.subtitle")}
                    </p>
                  </div>
                </div>
                <div>
                  <MoveRight />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
};

Custom404.getLayout = (page: ReactNode) => page;

export default Custom404;
