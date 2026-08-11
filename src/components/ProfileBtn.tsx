import {
  Avatar,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  useDisclosure,
} from "@heroui/react";
import { useRouter } from "next/router";
import { FC, Key, ReactNode } from "react";
import LogoutModal from "./Modals/LogoutModal";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { staticProfileImage } from "@/config/constants";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";
import {
  User,
  Package,
  MapPin,
  Wallet,
  Receipt,
  LogOut,
  Settings,
  Gift,
  Bell,
} from "lucide-react";

type ProfileMenuItem = {
  key: string;
  icon: ReactNode;
  text: string;
  className?: string;
  color?: "danger";
  isProfile?: boolean;
};

const ProfileBtn: FC = () => {
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const userData = useSelector((state: RootState) => state.auth.user);
  const { t } = useTranslation();
  const { systemSettings } = useSettings();

  const handleAction = (key: Key) => {
    const route = key.toString();
    if (route === "logout") {
      onOpen();
    } else {
      router.push(route);
    }
  };

  const profileMenuItems: ProfileMenuItem[] = [
    {
      key: "/my-account/",
      icon: <User size={16} />,
      text: `${t("profileBtn.signedInAs")} ${userData?.email || ""}`,
      isProfile: true,
    },
    {
      key: "/my-account",
      icon: <Settings size={16} />,
      text: t("profileBtn.myAccount"),
    },
    {
      key: "/my-account/orders",
      icon: <Package size={16} />,
      text: t("profileBtn.myOrders"),
    },
    ...(systemSettings?.referEarnStatus !== false
      ? [
          {
            key: "/my-account/refer-and-earn",
            icon: <Gift size={16} />,
            text: t("profileBtn.referAndEarn"),
          },
        ]
      : []),
    {
      key: "/my-account/addresses",
      icon: <MapPin size={16} />,
      text: t("profileBtn.addresses"),
    },
    {
      key: "/my-account/wallet",
      icon: <Wallet size={16} />,
      text: t("profileBtn.wallet"),
    },
    {
      key: "/my-account/transactions",
      icon: <Receipt size={16} />,
      text: t("profileBtn.transactions"),
    },
    {
      key: "/my-account/notifications",
      icon: <Bell size={16} />,
      text: t("profileBtn.notifications"),
    },
    {
      key: "logout",
      icon: <LogOut size={16} className="text-danger-400" />,
      text: t("profileBtn.logout"),
      className: "text-xs text-danger-400",
      color: "danger",
    },
  ];

  return (
    <div className="flex items-center gap-4">
      <Dropdown placement="bottom-end">
        <DropdownTrigger>
          <Avatar
            isBordered
            as="button"
            size="sm"
            src={userData?.profile_image || staticProfileImage}
            className="transition-transform cursor-pointer"
            classNames={{ base: "w-7 h-7" }}
            alt={userData?.name || "User Avatar"}
          />
        </DropdownTrigger>

        <DropdownMenu
          aria-label="Profile Actions"
          variant="flat"
          onAction={handleAction}
          classNames={{ list: "text-xs" }}
          items={profileMenuItems}
        >
          {(item) =>
            <DropdownItem
              key={item.key}
              startContent={item.icon}
              textValue={item.text}
              className={item.isProfile ? "h-14 gap-2" : undefined}
              color={item.color}
              classNames={{ title: item.className || "text-xs" }}
            >
              {item.isProfile ? (
                <>
                  <p className="font-semibold">{t("profileBtn.signedInAs")}</p>
                  <p className="font-semibold truncate">{userData?.name}</p>
                </>
              ) : (
                item.text
              )}
            </DropdownItem>
          }
        </DropdownMenu>
      </Dropdown>

      <LogoutModal
        isOpen={isOpen}
        onClose={onClose}
        userName={userData?.name}
        userEmail={userData?.email}
        profileImg={userData?.profile_image || staticProfileImage}
      />
    </div>
  );
};

export default ProfileBtn;
