import { siteConfig } from "@/config/site";
import { useSettings } from "@/contexts/SettingsContext";
import NextHead from "next/head";
import React, { ReactNode } from "react";
interface PageHeadProps {
  pageTitle: string;
  children?: ReactNode;
}

const PageHead = ({ pageTitle = "", children }: PageHeadProps) => {
  const { webSettings } = useSettings();

  const siteName =
    webSettings?.siteName || siteConfig?.name || "Default Site Name";

  const fullTitle = pageTitle ? `${pageTitle} | ${siteName}` : siteName;

  return (
    <NextHead>
      <title>{fullTitle}</title>
      {children}
    </NextHead>
  );
};

export default PageHead;
