import { useState, useEffect, useMemo } from "react";
import { Home, ShoppingCart, User, Package, Store } from "lucide-react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { addToast, useDisclosure } from "@heroui/react";
import { useTranslation } from "react-i18next";
import dynamic from "next/dynamic";
import { useSettings } from "@/contexts/SettingsContext";

const OfflineCartDrawer = dynamic(() => import("../Cart/OfflineCartDrawer"), {
  ssr: false,
});

const BottomNavigation = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const router = useRouter();
  const { t } = useTranslation();
  const { isSingleVendor } = useSettings();
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const cartCount =
    useSelector((state: RootState) => state.cart.cartData?.items_count) ||
    undefined;

  const offLineCartCount =
    useSelector((state: RootState) => state.offlineCart.items)?.length || 0;

  const {
    isOpen: isOfflineCartOpen,
    onOpen: openOfflineCart,
    onClose: closeOfflineCart,
  } = useDisclosure();

  const activeTab = useMemo(() => {
    const pathToTabMap: Record<string, string> = {
      "/": "home",
      "/cart": "cart",
      "/categories": "categories",
      "/my-account": "profile",
    };
    return pathToTabMap[router.pathname] || "";
  }, [router.pathname]);

  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== "undefined") {
        const currentScrollY = window.scrollY;

        if (currentScrollY < lastScrollY || currentScrollY < 10) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }

        setLastScrollY(currentScrollY);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("scroll", controlNavbar);
      return () => window.removeEventListener("scroll", controlNavbar);
    }
  }, [lastScrollY]);

  useEffect(() => {
    if (isLoggedIn && isOfflineCartOpen) {
      closeOfflineCart();
    }
  }, [isLoggedIn, isOfflineCartOpen, closeOfflineCart]);

  const navItems = [
    { id: "home", label: t("home_title"), icon: Home, path: "/" },
    {
      id: "categories",
      label: t("categories"),
      icon: Package,
      path: "/categories",
    },
    {
      id: "cart",
      label: t("cart_title"),
      icon: ShoppingCart,
      path: "/cart",
      protected: true,
    },
    {
      id: "stores",
      label: t("pageTitle.stores"),
      icon: Store,
      path: "/stores",
      protected: false,
    },
    {
      id: "profile",
      label: t("profile"),
      icon: User,
      path: "/my-account",
      protected: true,
    },
  ].filter((item) => !(isSingleVendor && item.id === "stores"));

  const handleTabClick = (
    itemId: string,
    path?: string,
    protectedTab?: boolean,
  ) => {
    if (itemId === "cart" && !isLoggedIn) {
      openOfflineCart();
      return;
    }
    if (protectedTab && !isLoggedIn) {
      document.getElementById("login-btn")?.click();
      addToast({ title: "Please Login to Continue !", color: "warning" });
      return;
    }
    if (path) router.push(path);
  };

  return (
    <div
      className={`md:hidden fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
        isVisible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="shadow-lg bg-background">
        <div className="max-w-md mx-auto">
          <nav className="flex justify-around items-center py-2 px-1 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() =>
                    handleTabClick(item.id, item.path, item.protected)
                  }
                  className={`relative flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 min-w-0 flex-1 ${
                    isActive
                      ? "text-green-600 bg-green-50"
                      : "text-foreground/50 hover:text-foreground/70"
                  }`}
                >
                  <Icon
                    size={20}
                    className={`mb-1 transition-all duration-200 ${
                      isActive ? "scale-110" : "scale-100"
                    }`}
                  />
                  {item.id === "cart" &&
                  (isLoggedIn ? cartCount : offLineCartCount) ? (
                    <span className="absolute top-0 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                      {isLoggedIn ? cartCount : offLineCartCount}
                    </span>
                  ) : null}
                  <span
                    className={`text-xs font-medium transition-all duration-200 ${
                      isActive ? "scale-105" : "scale-100"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
      <OfflineCartDrawer
        isOpen={isOfflineCartOpen}
        onClose={closeOfflineCart}
      />
    </div>
  );
};

export default BottomNavigation;
