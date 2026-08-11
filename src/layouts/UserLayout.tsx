import React, { FC, ReactNode, useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Divider,
  User as HeroUser,
  Listbox,
  ListboxItem,
  Tabs,
  Tab,
} from "@heroui/react";
import {
  User,
  ShoppingCart,
  MapPin,
  CreditCard,
  ChevronRight,
  Bookmark,
  Banknote,
  Gift,
  Bell,
} from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import dynamic from "next/dynamic";
import { staticProfileImage } from "@/config/constants";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/router";
import Lightbox from "yet-another-react-lightbox";
import { useSettings } from "@/contexts/SettingsContext";

interface UserLayoutProps {
  children: ReactNode;
  activeTab: string;
}

const cn = (...classes: string[]) => classes.filter(Boolean).join(" ");

const IconWrapper = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      className,
      "flex items-center rounded-full justify-center w-7 h-7 p-1 ml-0",
    )}
  >
    {children}
  </div>
);

const HeroUserClient = dynamic(
  () => import("@heroui/react").then((mod) => mod.User),
  {
    ssr: false,
    loading: () => (
      <HeroUser
        classNames={{
          name: "text-medium font-semibold",
          description: "text-xs text-blue-500",
        }}
        avatarProps={{
          src: "https://images.unsplash.com/broken",
          size: "lg",
        }}
        description={""}
        name={""}
      />
    ),
  },
);

const UserLayout: FC<UserLayoutProps> = ({ children, activeTab }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const [isLightboxOpen, setLightboxOpen] = useState(false);
  const { systemSettings } = useSettings();

  const menuItems = [
    {
      label: t("userLayout.myAccount"),
      icon: User,
      href: "/my-account",
      key: "my-account",
      count: 1,
      isActive: "my-account" === activeTab,
    },
    {
      label: t("userLayout.myWishlists"),
      icon: Bookmark,
      href: "/my-account/wishlists",
      key: "wishlists",
      count: 0,
      isActive: "wishlists" === activeTab,
    },
    {
      label: t("userLayout.myOrders"),
      icon: ShoppingCart,
      href: "/my-account/orders",
      key: "orders",
      count: 5,
      isActive: "orders" === activeTab,
    },
    {
      label: t("userLayout.addresses"),
      icon: MapPin,
      href: "/my-account/addresses",
      key: "addresses",
      count: 3,
      isActive: "addresses" === activeTab,
    },
    {
      label: t("userLayout.wallet"),
      icon: CreditCard,
      href: "/my-account/wallet",
      key: "wallet",
      count: 100,
      isActive: "wallet" === activeTab,
    },
    {
      label: t("userLayout.transactions"),
      icon: Banknote,
      href: "/my-account/transactions",
      key: "transactions",
      count: 12,
      isActive: "transactions" === activeTab,
    },
    {
      label: t("userLayout.referAndEarn"),
      icon: Gift,
      href: "/my-account/refer-and-earn",
      key: "refer-and-earn",
      count: 0,
      isActive: "refer-and-earn" === activeTab,
      hidden: systemSettings?.referEarnStatus === false,
    },
    {
      label: "Notifications",
      icon: Bell,
      href: "/my-account/notifications",
      key: "notifications",
      count: 0,
      isActive: "notifications" === activeTab,
    },
  ].filter((item) => !item.hidden);

  const userData = useSelector((state: RootState) => state.auth.user);

  const handleTabChange = (key: React.Key) => {
    const selectedItem = menuItems.find((item) => item.key === key);
    if (selectedItem) {
      router.push(selectedItem.href);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className="hidden md:block md:max-w-[280px] w-full">
        <Card shadow="sm" radius="sm">
          <CardHeader className="flex flex-col text-start items-start w-full">
            <HeroUserClient
              classNames={{
                name: "text-medium font-semibold",
                description: "text-xs text-blue-500",
              }}
              avatarProps={{
                src: userData?.profile_image || staticProfileImage,
                size: "lg",
                isBordered: true,
              }}
              description={t("userLayout.online")}
              name={userData?.name || ""}
              onClick={() => setLightboxOpen(true)}
              className="cursor-pointer"
              title={userData?.name || ""}
            />
            {isLightboxOpen && (
              <Lightbox
                open={isLightboxOpen}
                close={() => setLightboxOpen(false)}
                slides={[
                  { src: userData?.profile_image || staticProfileImage },
                ]}
              />
            )}
          </CardHeader>
          <div className="px-4">
            <Divider />
          </div>
          <CardBody className="p-0">
            <Listbox
              aria-label="User Menu"
              className="p-2 gap-0 divide-y divide-default-300/50 dark:divide-default-100/80 bg-content1 max-w-[280px] overflow-visible shadow-none rounded-medium"
              itemClasses={{
                base: "px-1 rounded-md gap-2 h-10 data-[hover=true]:bg-default-100",
              }}
            >
              {menuItems.map((item) => (
                <ListboxItem
                  key={item.key}
                  onPress={() => {
                    if (router.asPath !== item.href) {
                      router.push(item.href);
                    }
                  }}
                  className={`my-0.5 ${item.isActive ? "bg-default-100" : ""}`}
                  title={item.label}
                  textValue={item.label}
                  endContent={
                    <div className="flex items-center gap-1 text-default-400">
                      <ChevronRight size={16} />
                    </div>
                  }
                  startContent={
                    <IconWrapper className={cn("text-xs")}>
                      {React.createElement(item.icon, {
                        className: "text-foreground/50",
                      })}
                    </IconWrapper>
                  }
                >
                  {item.label}
                </ListboxItem>
              ))}
            </Listbox>
          </CardBody>
        </Card>
      </aside>

      {/* Mobile Header with User Info - Visible only on mobile */}
      <div className="md:hidden">
        <Card shadow="sm" radius="sm">
          <CardHeader className="flex flex-row items-center justify-start w-full p-4">
            <HeroUserClient
              classNames={{
                name: "text-medium font-semibold",
                description: "text-xs text-blue-500",
              }}
              avatarProps={{
                src: userData?.profile_image || staticProfileImage,
                size: "md",
                isBordered: true,
              }}
              description={t("userLayout.online")}
              name={userData?.name || ""}
              onClick={() => setLightboxOpen(true)}
            />
          </CardHeader>
        </Card>
      </div>

      {/* Mobile Navigation Tabs - Visible only on mobile */}
      <div className="md:hidden">
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={handleTabChange}
          variant="underlined"
          classNames={{
            base: "w-full",
            tabList:
              "gap-2 w-full relative rounded-none p-0 border-b border-divider overflow-x-auto",
            cursor: "w-full bg-primary",
            tab: "max-w-14 px-2 h-12 min-w-0 shrink-0",
            tabContent:
              "group-data-[selected=true]:text-primary text-xs font-medium flex flex-col items-center gap-1",
          }}
        >
          {menuItems.map((item) => (
            <Tab
              key={item.key}
              textValue={item.label}
              title={
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center justify-center w-5 h-5">
                    {React.createElement(item.icon, {
                      size: 18,
                      className: "group-data-[selected=true]:text-primary",
                    })}
                  </div>
                  <span className="text-xxs leading-tight whitespace-nowrap">
                    {item.label}
                  </span>
                </div>
              }
            />
          ))}
        </Tabs>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full">{children}</div>
    </div>
  );
};

export default UserLayout;
