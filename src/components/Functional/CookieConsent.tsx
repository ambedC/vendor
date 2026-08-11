import { Button } from "@heroui/react";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

const COOKIE_KEY = "cookie_consent_choice";

const CookieConsent = () => {
  const [showModal, setShowModal] = useState(false);
  const pathname = usePathname();
  const { t } = useTranslation();

  useEffect(() => {
    // ✅ Don't show consent modal on Privacy Policy page or its sub-routes
    if (pathname && pathname.startsWith("/privacy-policy")) return;

    // ✅ Check if user already made a choice
    const consent = localStorage.getItem(COOKIE_KEY);

    if (!consent) {
      setTimeout(() => {
        setShowModal(true);
      }, 0);
    }
  }, [pathname]);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setShowModal(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_KEY, "declined");
    setShowModal(false);
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-end justify-center">
      {/* 🔹 Blurred, dimmed background */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-all duration-300 pointer-events-auto" />

      {/* 🔹 Cookie modal */}
      <div className="relative z-10 bg-white rounded-xl shadow-2xl max-w-full md:max-w-[80vw] mx-4 sm:mx-auto p-6 border border-gray-100 mb-6">
        <div className="flex items-center flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <h2 className="text-medium sm:text-lg font-bold text-gray-900 mb-2">
              {t("cookieConsent.title")}
            </h2>
            <p className="text-gray-600 text-xxs sm:text-sm leading-relaxed mb-2 ml-2">
              {t("cookieConsent.description")}
            </p>

            <p className="text-xxs sm:text-xs text-gray-500 ml-2">
              {t("cookieConsent.learnMore")}{" "}
              <a
                href="/privacy-policy"
                className="text-blue-600 hover:text-blue-700 underline"
                target="_blank"
              >
                {t("cookieConsent.privacyPolicyLink")}
              </a>
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 shrink-0">
            <Button
              onPress={handleDecline}
              className="bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-300 transition-colors duration-200"
            >
              {t("cookieConsent.decline")}
            </Button>
            <Button
              onPress={handleAccept}
              className="bg-gray-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors duration-200"
            >
              {t("cookieConsent.accept")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
