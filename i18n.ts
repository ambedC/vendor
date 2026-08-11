import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getCookieFromContext } from "@/helpers/getters";
import { GetServerSidePropsContext } from "next";
import { getCookie, setCookie } from "@/lib/cookies";

// Languages
import enTranslation from "./public/locales/en.json";
import hiTranslation from "./public/locales/hi.json";
import arTranslation from "./public/locales/ar.json";

const LANGUAGE_KEY = "i18nextLng";

const DEFAULT_LANG = "en";

const languages = {
  en: {
    translation: enTranslation,
  },
  hi: {
    translation: hiTranslation,
  },
  ar: {
    translation: arTranslation,
  },
};

// Initialize i18n with static defaults. Client-specific detection will run later.
i18n.use(initReactI18next).init({
  resources: languages,
  // Default language on server - client will override if a cookie is present
  lng: getCookie<string>(LANGUAGE_KEY) || DEFAULT_LANG,
  fallbackLng: DEFAULT_LANG,
  interpolation: {
    escapeValue: false,
  },
});

// Function to change language and persist in cookie
export const changeLanguage = (lng: string) => {
  // Persist cookie only in browser
  if (typeof window !== "undefined") {
    setCookie(LANGUAGE_KEY, lng, { expires: 365 });
  }
  i18n.changeLanguage(lng);

  // Ensure this code runs only in the browser
  if (typeof document !== "undefined") {
    if (lng === "ar") {
      document.documentElement.setAttribute("dir", "rtl");
    } else {
      document.documentElement.setAttribute("dir", "ltr");
    }
  }
};

export const loadTranslations = async (context: GetServerSidePropsContext) => {
  const lang =
    (getCookieFromContext(context, LANGUAGE_KEY) as string) || DEFAULT_LANG;

  // Initialize i18next with the loaded resources
  i18n.init({
    resources: languages,
    lng: lang,
    fallbackLng: DEFAULT_LANG,
    interpolation: {
      escapeValue: false,
    },
  });
};

export default i18n;
