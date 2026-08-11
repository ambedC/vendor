// src/contexts/SettingsContext.tsx
import React, { createContext, useContext } from "react";
import {
  AppSettings,
  AuthenticationSettings,
  HomeGeneralSettings,
  PaymentSettings,
  Settings,
  SystemSettings,
  AdvertisementSettings,
} from "@/types/ApiResponse";
import { getSpecificSettings, getWebSettings } from "@/helpers/getters";
import { staticLat, staticLng } from "@/config/constants";

type LatLng = {
  lat: number;
  lng: number;
};

type SettingsContextType = {
  settings: Settings | null;
  webSettings: ReturnType<typeof getWebSettings> | null;
  paymentSettings: PaymentSettings | null;
  authSettings: AuthenticationSettings | null;
  homeGeneralSettings: HomeGeneralSettings | null;
  systemSettings: SystemSettings | null;
  appSettings: AppSettings | null;
  advertisementSettings: AdvertisementSettings | null;

  systemVendorType: "single" | "multiple";
  isSingleVendor: boolean;
  currencySymbol: string;
  currency: string;
  defaultLocation: LatLng | null;
  demoMode: boolean;
};

const SettingsContext = createContext<SettingsContextType>({
  settings: null,
  webSettings: null,
  paymentSettings: null,
  authSettings: null,
  homeGeneralSettings: null,
  systemSettings: null,
  appSettings: null,
  advertisementSettings: null,
  systemVendorType: "multiple",
  isSingleVendor: false,
  currencySymbol: "",
  currency: "",
  defaultLocation: null,
  demoMode: false,
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({
  settings,
  children,
}: {
  settings: Settings | null;
  children: React.ReactNode;
}) => {
  const webSettings = settings ? getWebSettings(settings) : null;
  const systemSettings = settings
    ? (getSpecificSettings(settings, "system") as SystemSettings)
    : null;

  const paymentSettings = settings
    ? (getSpecificSettings(settings, "payment") as PaymentSettings)
    : null;

  const authSettings = settings
    ? (getSpecificSettings(
        settings,
        "authentication",
      ) as AuthenticationSettings)
    : null;

  const homeGeneralSettings = settings
    ? (getSpecificSettings(
        settings,
        "home_general_settings",
      ) as HomeGeneralSettings)
    : null;

  const appSettings = settings
    ? (getSpecificSettings(settings, "app") as AppSettings)
    : null;

  const advertisementSettings = settings
    ? (getSpecificSettings(settings, "advertisement") as AdvertisementSettings)
    : null;

  const systemVendorType = systemSettings?.systemVendorType || "multiple";
  const isSingleVendor = systemVendorType === "single";
  const currencySymbol = systemSettings?.currencySymbol || "";
  const currency = systemSettings?.currency || "";
  const demoMode = systemSettings?.demoMode || false;

  const defaultLocation =
    webSettings?.defaultLatitude && webSettings?.defaultLongitude
      ? {
          lat: parseFloat(webSettings.defaultLatitude),
          lng: parseFloat(webSettings.defaultLongitude),
        }
      : {
          lat: staticLat,
          lng: staticLng,
        };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        webSettings,
        defaultLocation,
        currencySymbol,
        currency,
        paymentSettings,
        authSettings,
        homeGeneralSettings,
        systemSettings,
        appSettings,
        advertisementSettings,
        systemVendorType,
        isSingleVendor,
        demoMode,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
