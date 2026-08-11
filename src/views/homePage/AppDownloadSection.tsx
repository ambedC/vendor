import React from "react";
import { Button, Image } from "@heroui/react";
import { useSettings } from "@/contexts/SettingsContext";
import Link from "next/link";

const AppDownloadSection: React.FC = () => {
  const { webSettings } = useSettings();
  const appSection = webSettings?.appDownloadSection || false;

  if (!appSection) {
    return null;
  }

  return (
    <section className="relative rounded-xl py-12 px-4 overflow-hidden bg-linear-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-pink-200 rounded-full opacity-10 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-200 rounded-full opacity-10 blur-3xl"></div>

      <div className="max-w-6xl mx-auto relative rounded-lg z-10">
        <div className="grid sm:grid-cols-2 gap-8 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <div className="space-y-3">
              <span className="text-xs font-semibold text-pink-600 bg-pink-50 px-3 py-1.5 rounded-full inline-block">
                {webSettings?.appSectionTitle}
              </span>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                {webSettings?.appSectionTagline}
              </h2>

              <p className="text-xxs sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                {webSettings?.appSectionShortDescription}
              </p>
            </div>

            {/* Download Buttons */}
            <div className="flex gap-3 pt-2">
              {webSettings?.appSectionAppstoreLink && (
                <Button
                  as={Link}
                  href={webSettings.appSectionAppstoreLink}
                  target="_blank"
                  className="bg-black text-white font-medium px-3 py-6 sm:px-5  hover:bg-gray-800 transition-all"
                  startContent={
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                  }
                >
                  <div className="text-left">
                    <div className="text-xs opacity-70">Download on</div>
                    <div className="text-sm font-semibold">App Store</div>
                  </div>
                </Button>
              )}

              {webSettings?.appSectionPlaystoreLink && (
                <Button
                  as={Link}
                  href={webSettings.appSectionPlaystoreLink}
                  target="_blank"
                  className="bg-black text-white font-medium px-3 py-6 sm:px-5 hover:bg-gray-800 transition-all"
                  startContent={
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                    </svg>
                  }
                >
                  <div className="text-left">
                    <div className="text-xs opacity-70">Get it on</div>
                    <div className="text-sm font-semibold">Google Play</div>
                  </div>
                </Button>
              )}
            </div>
          </div>

          {/* Right — App Image instead of Phone Mockup */}
          <div className="relative flex justify-center lg:justify-end">
            <Image
              src="/images/app-image.png"
              alt="App Preview"
              className="rounded-2xl object-contain w-80 h-60 sm:w-72 sm:h-80 lg:w-[400px] lg:h-96"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppDownloadSection;
