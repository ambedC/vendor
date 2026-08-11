import React, { FC, useEffect, useState } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  useDisclosure,
} from "@heroui/react";
import { useSettings } from "@/contexts/SettingsContext";
import { useRouter } from "next/router";
import { getCookie } from "@/lib/cookies";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";

const DeepLinkModal: FC = () => {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { appSettings, webSettings } = useSettings();
  const router = useRouter();
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const [isMobile, setIsMobile] = useState(false);
  const [appInteracted, setAppInteracted] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("app_link_interacted") === "true" ||
        localStorage.getItem("app_installed_confirmed") === "true"
      );
    }
    return false;
  });

  const hasAppHint = appInteracted || isLoggedIn;

  const [manuallyClosed, setManuallyClosed] = useState(false);

  const scheme = (
    appSettings?.customerAppScheme || appSettings?.appScheme
  )?.trim()?.replace(/:\/\/$/, "");

  const playUrl =
    appSettings?.customerPlaystoreLink ||
    appSettings?.playstoreLink ||
    webSettings?.appSectionPlaystoreLink;

  const storeUrl =
    appSettings?.customerAppstoreLink ||
    appSettings?.appstoreLink ||
    webSettings?.appSectionAppstoreLink;

  const hasRequiredConfig = !!scheme && (!!playUrl || !!storeUrl);

  useEffect(() => {
    const checkMobile = () => {
      const mobile =
        window.innerWidth <= 768 ||
        (typeof window.matchMedia === "function" &&
          window.matchMedia("(max-width: 768px)").matches);
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isMobile || manuallyClosed || !hasRequiredConfig) return;

    const checkAndOpen = () => {
      if (manuallyClosed || !hasRequiredConfig) return;

      const dismissed = localStorage.getItem("deepLinkModalDismissed");

      // /share/products/[slug] is the unified share link (from web & app)
      const isSharePage = router.pathname === "/share/products/[slug]";

      const isSharedLink =
        isSharePage ||
        router.query.utm_medium === "share" ||
        router.query.invited === "true" ||
        router.query.open_app === "1";

      if ((dismissed && !isSharedLink) || isOpen) return;

      // For share pages: skip location & cookie gates — recipient is a new visitor
      if (!isSharePage) {
        const userLocation = getCookie("userLocation");
        if (!userLocation) return;

        const cookieConsent = localStorage.getItem("cookie_consent_choice");
        if (!cookieConsent) return;
      }

      const allowedPaths = ["/", "/products/search"];
      const isProductDetail = router.pathname === "/products/[slug]";

      if (
        allowedPaths.includes(router.pathname) ||
        isProductDetail ||
        isSharePage
      ) {
        onOpen();
      }
    };

    checkAndOpen();

    const interval = setInterval(checkAndOpen, 1000);
    return () => clearInterval(interval);
  }, [isMobile, router.pathname, router.query, onOpen, isOpen, manuallyClosed, hasRequiredConfig]);

  const handleDismiss = () => {
    localStorage.setItem("deepLinkModalDismissed", "true");
    setManuallyClosed(true);
    onClose();
  };

  const tryDeepLink = () => {
    if (!scheme) return;

    const ua =
      navigator.userAgent || navigator.vendor || (window as any).opera || "";
    const isAndroid = /Android/i.test(ua);
    const isIOS =
      /iPhone|iPad|iPod/i.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    localStorage.setItem("app_link_interacted", "true");
    setAppInteracted(true);

    const path = router.asPath;
    let target = `${scheme}://home`;

    const pathWithoutQueryOrHash = path.split("#")[0].split("?")[0];
    const normalizedPath = pathWithoutQueryOrHash.replace(/\/+$/, "");
    const segments = normalizedPath.split("/").filter((s) => s.length > 0);

    // Matches: /products/[slug]  OR  /share/products/[slug]
    const isProductDetail =
      router.pathname === "/products/[slug]" ||
      router.pathname === "/share/products/[slug]" ||
      (segments.length === 2 && segments[0] === "products") ||
      (segments.length === 3 &&
        segments[0] === "share" &&
        segments[1] === "products");

    if (isProductDetail) {
      // slug is last segment regardless of /share/products/ or /products/
      const slug = segments[segments.length - 1];
      if (slug) {
        target = `${scheme}://products?slug=${encodeURIComponent(slug)}`;
      } else {
        target = `${scheme}://products`;
      }
    } else if (segments[0] === "products") {
      target = `${scheme}://products`;
    }

    const fallback = isAndroid ? playUrl || storeUrl : storeUrl || playUrl;
    const timeout = isIOS ? 2500 : 1200;

    if (isIOS) {
      // Safari-safe approach: 
      // 1. Try to use Universal Link if domain is available (best practice)
      // 2. Fallback to window.location for scheme (if iframe is being blocked or failing)
      
      const start = Date.now();
      
      // Use window.location instead of iframe for modern Safari if iframe is failing
      // Many modern iOS versions show the "invalid address" even for iframes,
      // but window.location is more direct.
      window.location.href = target;

      setTimeout(() => {
        // If still visible after timeout, something failed (app not installed)
        if (
          document.visibilityState === "visible" &&
          Date.now() - start < timeout + 500
        ) {
          if (fallback) window.location.href = fallback;
        } else {
          localStorage.setItem("app_installed_confirmed", "true");
          setAppInteracted(true);
        }
      }, timeout);
    } else {
      // Android/Chrome — original logic works fine
      window.location.href = target;

      const start = Date.now();
      setTimeout(() => {
        const elapsed = Date.now() - start;
        if (
          document.visibilityState === "visible" &&
          elapsed >= timeout - 100
        ) {
          if (fallback) window.location.href = fallback;
        } else if (document.visibilityState === "hidden") {
          localStorage.setItem("app_installed_confirmed", "true");
          setAppInteracted(true);
        }
      }, timeout);
    }
  };

  if (!isMobile) return null;

  // Get first letter of site name for the icon
  const siteName = webSettings?.siteName || "HyperLocal";
  const iconLetter = siteName.charAt(0).toUpperCase();

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      onClose={handleDismiss}
      placement="bottom"
      hideCloseButton
      backdrop="transparent"
      size="sm"
      className="m-0"
      motionProps={{
        variants: {
          enter: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.25, ease: "easeOut" },
          },
          exit: {
            y: "100%",
            opacity: 0,
            transition: { duration: 0.2, ease: "easeIn" },
          },
        },
      }}
    >
      <ModalContent className="rounded-2xl bg-white shadow-xl overflow-hidden">
        <ModalBody className="p-5">
          {/* App info row */}
          <div className="flex items-center gap-3 mb-4">
            {/* App icon */}
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-focus">
              <span className="text-white text-xl font-bold">{iconLetter}</span>
            </div>

            {/* App name & subtitle */}
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-900 leading-tight">
                {siteName}
              </span>
              <span className="text-xs text-gray-500 leading-tight mt-0.5">
                Get a better experience in our mobile app
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              color="primary"
              className="flex-1 h-11 font-semibold text-sm rounded-xl"
              onPress={tryDeepLink}
            >
              {hasAppHint ? "Open in App" : "Open in App"}
            </Button>
            <Button
              variant="flat"
              className="flex-1 h-11 font-semibold text-sm rounded-xl bg-gray-100 text-gray-700"
              onPress={handleDismiss}
            >
              Cancel
            </Button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default DeepLinkModal;
