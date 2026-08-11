import React from "react";
import NextHead from "next/head";
import Script from "next/script";
import { Settings } from "@/types/ApiResponse";
import { getWebSettings } from "@/helpers/getters";
import { siteConfig } from "@/config/site";
import { ensureAbsoluteUrl } from "@/helpers/seo";

interface HeadProps {
  settings: Settings;
}

export const SEOHead = ({ settings }: HeadProps) => {
  const webSettings = getWebSettings(settings as Settings);
  const siteName =
    webSettings?.siteName || siteConfig.name || "Default Site Name";
  const fullTitle = siteName;
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  const siteLogo = ensureAbsoluteUrl(webSettings?.siteHeaderLogo || "/logo.png", baseUrl);

  if (!webSettings) {
    return (
      <NextHead>
        <title>{fullTitle}</title>
        <meta name="description" content={siteConfig.description} />
        <meta name="keywords" content={siteConfig.description} />
      </NextHead>
    );
  }
  return (
    <NextHead>
      <title>{fullTitle}</title>
      <link
        rel="icon"
        href={webSettings?.siteFavicon || "/default-favicon.ico"}
        type="image/x-icon"
        key="favicon"
      />
      <meta
        name="description"
        content={webSettings.metaDescription || "Default meta description"}
        key="description"
      />

      <meta
        name="keywords"
        content={webSettings.metaKeywords || "default, keywords"}
        key="keywords"
      />
      <meta name="copyright" content={webSettings.siteCopyright} />
      <meta name="author" content={webSettings.supportEmail} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" key="viewport" />
      <meta name="robots" content="index, follow" key="robots" />
      <meta property="og:title" content={webSettings.siteName} key="og:title" />
      <meta
        property="og:description"
        content={webSettings.metaDescription || "Default meta description"}
        key="og:description"
      />
      <meta property="og:image" content={siteLogo} key="og:image" />
      <meta
        property="og:url"
        content={typeof window !== "undefined" ? window.location.href : ""}
        key="og:url"
      />
      <meta name="twitter:card" content="summary_large_image" key="twitter:card" />
      <meta
        name="twitter:title"
        content={webSettings.siteName || "Default Site Name"}
        key="twitter:title"
      />
      <meta
        name="twitter:description"
        content={webSettings.metaDescription || "Default meta description"}
        key="twitter:description"
      />
      <meta
        name="twitter:image"
        content={siteLogo}
        key="twitter:image"
      />

      {webSettings?.headerScript && (
        <Script
          id="global-header-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: webSettings.headerScript }}
          key="global-header-script"
        />
      )}
      {webSettings?.footerScript && (
        <Script
          id="global-footer-script"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{ __html: webSettings.footerScript }}
          key="global-footer-script"
        />
      )}
    </NextHead>
  );
};
