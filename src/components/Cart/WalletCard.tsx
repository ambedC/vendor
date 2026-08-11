import React, { FC } from "react";
import { Card, CardBody, CardFooter, CardHeader, Image } from "@heroui/react";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import { userData } from "@/types/ApiResponse";
import DepositModal from "../Modals/DepositModal";
import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation } from "react-i18next";

type WalletCardPageProps = {
  loading: boolean;
};

const WalletCard: FC<WalletCardPageProps> = ({ loading = true }) => {
  const userData = (useSelector((state: RootState) => state.auth.user) ||
    {}) as userData;

  const { webSettings, currencySymbol } = useSettings();
  const { siteHeaderDarkLogo = "", siteName = "" } = webSettings || {};

  const { t } = useTranslation();

  const formattedId =
    userData?.id
      ?.toString()
      .padStart(16, "X")
      .match(/.{1,4}/g)
      ?.join(" ") || "";

  return (
    <>
      <Card
        as="div"
        disableRipple
        className="w-full h-44 p-1 relative bg-linear-to-br from-gray-800 to-gray-900 dark:bg-content1 dark:from-transparent dark:to-transparent"
      >
        <CardHeader className="flex justify-between pb-0">
          <div className="font-semibold text-white uppercase tracking-wider text-lg">
            {t("wallet")}
          </div>
          <div className="flex gap-2">
            <DepositModal />
          </div>
        </CardHeader>
        <CardBody className="text-white overflow-hidden flex flex-col justify-between pb-0">
          <div className="flex justify-between items-start">
            {!loading && (
              <div className="font-mono text-xl md:text-xl tracking-wider">
                {currencySymbol}
                <span className="ml-1">{userData?.wallet_balance}</span>
              </div>
            )}
          </div>

          {!loading && (
            <div className="font-mono text-medium  tracking-wider mt-auto w-full flex justify-start  h-full">
              {formattedId}
            </div>
          )}
        </CardBody>

        <CardFooter className="w-full grid grid-cols-2 py-0">
          <div className="flex items-end justify-start">
            {!loading && (
              <h1 className="text-white text-medium font-semibold">
                {userData?.name || ""}
              </h1>
            )}
          </div>
          <div className="flex items-end justify-end h-full">
            <div className="max-w-full flex items-center">
              <div className="flex justify-start items-center text-primary-400 gap-1">
                <Image
                  loading="eager"
                  className="object-contain"
                  src={siteHeaderDarkLogo}
                  radius="none"
                  alt={siteName}
                  classNames={{
                    img: "h-10 md:h-12 w-full",
                    wrapper: "cursor-pointer",
                  }}
                />
              </div>
            </div>
          </div>
        </CardFooter>
      </Card>
    </>
  );
};

export default WalletCard;
