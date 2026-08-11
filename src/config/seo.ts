// SEO Configuration for the entire website
// This file contains default SEO settings and page-specific configurations

import { siteConfig } from "./site";

export type PageSEOConfig = {
  title: string;
  description: string;
  keywords: string;
  ogType?: "website" | "article" | "product" | "profile";
  canonical?: string;
};

export const pageSEOConfigs: Record<string, PageSEOConfig> = {
  // Homepage
  home: {
    title: siteConfig.name,
    description: siteConfig.metaDescription,
    keywords: siteConfig.metaKeywords,
    ogType: "website",
    canonical: "/",
  },



  // Category Pages
  categories: {
    title: "Shop by Category",
    description:
      "Explore products organized by categories. Find exactly what you need.",
    keywords: "categories, product categories, shop by category, browse",
    ogType: "website",
    canonical: "/categories",
  },

  // Brand Pages
  brands: {
    title: "Shop by Brand",
    description: "Discover products from top brands. Quality you can trust.",
    keywords: "brands, top brands, popular brands, brand products",
    ogType: "website",
    canonical: "/brands",
  },

  // Store Pages
  stores: {
    title: "Stores Near You",
    description:
      "Find local stores offering products with fast delivery in your area.",
    keywords: "stores, local stores, nearby stores, shop local",
    ogType: "website",
    canonical: "/stores",
  },

  // Static Pages
  aboutUs: {
    title: "About Us",
    description: "Learn more about our company, mission, and values.",
    keywords: "about us, our story, company information, who we are",
    ogType: "website",
    canonical: "/about-us",
  },

  privacyPolicy: {
    title: "Privacy Policy",
    description:
      "Read our privacy policy to understand how we protect your data.",
    keywords: "privacy policy, data protection, privacy terms, user privacy",
    ogType: "article",
    canonical: "/privacy-policy",
  },

  termsAndConditions: {
    title: "Terms and Conditions",
    description: "Read our terms and conditions for using our services.",
    keywords: "terms, conditions, terms of service, legal terms",
    ogType: "article",
    canonical: "/terms-and-conditions",
  },

  shippingPolicy: {
    title: "Shipping Policy",
    description: "Learn about our shipping methods, delivery times, and costs.",
    keywords: "shipping, delivery, shipping policy, delivery policy",
    ogType: "article",
    canonical: "/shipping-policy",
  },

  returnRefundPolicy: {
    title: "Return & Refund Policy",
    description:
      "Understand our return and refund policy for a hassle-free experience.",
    keywords: "returns, refunds, return policy, refund policy",
    ogType: "article",
    canonical: "/return-refund-policy",
  },

  faqs: {
    title: "Frequently Asked Questions",
    description: "Find answers to commonly asked questions about our services.",
    keywords: "faq, frequently asked questions, help, support, questions",
    ogType: "website",
    canonical: "/faqs",
  },

  cart: {
    title: "Shopping Cart",
    description: "Review items in your cart and proceed to checkout.",
    keywords: "cart, shopping cart, checkout, buy",
    ogType: "website",
    canonical: "/cart",
  },

  sellerRegister: {
    title: "Become a Seller",
    description:
      "Join our platform as a seller and reach thousands of customers.",
    keywords:
      "become a seller, register, seller registration, sell online, vendor",
    ogType: "website",
    canonical: "/seller-register",
  },
};

// Helper function to get SEO config for a page
export const getPageSEOConfig = (pageKey: string): PageSEOConfig => {
  return (
    pageSEOConfigs[pageKey] || {
      title: siteConfig.name,
      description: siteConfig.metaDescription,
      keywords: siteConfig.metaKeywords,
      ogType: "website",
    }
  );
};

// Additional SEO best practices
export const seoConfig = {
  // Default image for social sharing
  defaultOgImage: "/og-image.png",

  // Twitter handle
  twitterHandle: "@yourbrand",

  // Language
  language: "en",

  // Locale
  locale: "en_US",

  // Site URL (should be set via environment variable)
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://yourdomain.com",

  // Open Graph defaults
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: siteConfig.name,
  },

  // Twitter defaults
  twitter: {
    cardType: "summary_large_image",
    handle: "@yourbrand",
  },

  // Additional meta tags
  additionalMetaTags: [
    {
      name: "application-name",
      content: siteConfig.name,
    },
    {
      name: "apple-mobile-web-app-capable",
      content: "yes",
    },
    {
      name: "apple-mobile-web-app-status-bar-style",
      content: "default",
    },
    {
      name: "apple-mobile-web-app-title",
      content: siteConfig.name,
    },
    {
      name: "format-detection",
      content: "telephone=no",
    },
    {
      name: "mobile-web-app-capable",
      content: "yes",
    },
    {
      name: "theme-color",
      content: "#ffffff",
    },
  ],
};
