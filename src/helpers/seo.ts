import { Product, Store } from "@/types/ApiResponse";

/**
 * Generates canonical URL for a page
 */
export const getCanonicalUrl = (path: string, baseUrl?: string): string => {
  const base = (baseUrl || process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  // Ensure we don't have double slashes if base ends with a slash or cleanPath starts with one
  const fullUrl = `${base.replace(/\/$/, "")}${cleanPath}`;
  return fullUrl.replace(/\/$/, ""); // Remove trailing slash from the final URL
};

/**
 * Ensures a URL is absolute by prepending the base URL if needed.
 */
export const ensureAbsoluteUrl = (url: string, baseUrl?: string): string => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const base = (baseUrl || process.env.NEXT_PUBLIC_SITE_URL || "").trim().replace(/\/$/, "");
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${base}${cleanPath}`;
};

/**
 * Generates Product structured data (JSON-LD)
 */
export const generateProductSchema = (
  product: Product,
  baseUrl?: string
): object => {
  const url = getCanonicalUrl(`/products/${product.slug}`, baseUrl);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description:
      (typeof product.metadata === "object" && product.metadata?.seo_description) ||
      product.short_description ||
      product.description,
    image: product.main_image,
    sku: product.uuid,
    brand: product.brand_name
      ? {
          "@type": "Brand",
          name: product.brand_name,
        }
      : undefined,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD", // TODO: Get from settings
      lowPrice:
        product.variants?.[0]?.special_price ||
        product.variants?.[0]?.price ||
        0,
      highPrice: product.variants?.[(product.variants?.length || 1) - 1]?.price || 0,
      availability: product.variants?.some((v) => v.stock > 0)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: url,
    },
    aggregateRating:
      product.rating_count > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.ratings,
            reviewCount: product.rating_count,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
    url: url,
    category: product.category_name,
  };
};

/**
 * Generates BreadcrumbList structured data
 */
export const generateBreadcrumbSchema = (
  items: Array<{ name: string; url: string }>,
  baseUrl?: string
): object => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: getCanonicalUrl(item.url, baseUrl),
    })),
  };
};

/**
 * Generates LocalBusiness structured data for stores
 */
export const generateStoreSchema = (store: Store, baseUrl?: string): object => {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: store.name,
    description: store.description,
    image: store.logo,
    url: getCanonicalUrl(`/stores/${store.slug}`, baseUrl),
    telephone: store.contact_number,
    email: store.contact_email,
    address: store.address
      ? {
          "@type": "PostalAddress",
          streetAddress: store.address,
        }
      : undefined,
  };
};

/**
 * Generates Organization structured data
 */
export const generateOrganizationSchema = (
  siteName: string,
  siteDescription: string,
  logo: string,
  baseUrl?: string
): object => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    description: siteDescription,
    url: getCanonicalUrl("/", baseUrl),
    logo: logo,
    sameAs: [
      // Add social media links if available
    ],
  };
};

/**
 * Generates WebSite structured data with search action
 */
export const generateWebsiteSchema = (
  siteName: string,
  baseUrl?: string
): object => {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: getCanonicalUrl("/", baseUrl),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${getCanonicalUrl("/products/search", baseUrl)}?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
};

/**
 * Generates CollectionPage structured data for category/brand pages
 */
export const generateCollectionSchema = (
  name: string,
  description: string,
  url: string,
  baseUrl?: string
): object => {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: name,
    description: description,
    url: getCanonicalUrl(url, baseUrl),
  };
};

/**
 * Generates FAQ structured data
 */
export const generateFAQSchema = (
  faqs: Array<{ question: string; answer: string }>
): object => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
};

/**
 * Truncates text to specified length with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
};

/**
 * Strips HTML tags from text
 */
export const stripHtmlTags = (html: string): string => {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "");
};

/**
 * Generates meta description from content
 */
export const generateMetaDescription = (
  content: string | undefined | null,
  maxLength: number = 160
): string => {
  if (!content) return "";
  const cleanContent = stripHtmlTags(content);
  return truncateText(cleanContent, maxLength);
};

/**
 * Generate keywords from text
 */
export const generateKeywords = (text: string | undefined | null, limit: number = 10): string => {
  if (!text) return "";

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 3);

  // Get unique words
  const uniqueWords = [...new Set(words)];

  return uniqueWords.slice(0, limit).join(", ");
};

/**
 * Generate product meta tags
 */
/**
 * Parses metadata string or object into SEOMetadata
 */
export const parseMetadata = (metadata: any): any => {
  if (!metadata) return {};
  if (typeof metadata === "string") {
    try {
      return JSON.parse(metadata);
    } catch (e) {
      console.error("Failed to parse metadata", e);
      return {};
    }
  }
  return metadata;
};

/**
 * Generate product meta tags
 */
export const generateProductMeta = (product: Product) => {
  const seoData = parseMetadata(product.metadata);

  const title = seoData.seo_title || product.title;
  const description = seoData.seo_description
    ? generateMetaDescription(seoData.seo_description, 160)
    : generateMetaDescription(product.short_description || product.description, 160);

  const keywords =
    Array.isArray(seoData.seo_keywords) && seoData.seo_keywords.length > 0
      ? seoData.seo_keywords.join(", ")
      : [
          product.title,
          product.category_name,
          product.brand_name,
          ...(Array.isArray(product.tags) ? product.tags : []),
        ]
          .filter(Boolean)
          .join(", ");

  return {
    title,
    description,
    keywords,
    image: ensureAbsoluteUrl(product.main_image),
  };
};

/**
 * Generate store meta tags
 */
export const generateStoreMeta = (store: Store, extraKeywords?: string[]) => {
  const seoData = parseMetadata(store.metadata);

  const title = seoData.seo_title || store.name;
  const description = seoData.seo_description
    ? generateMetaDescription(seoData.seo_description, 160)
    : generateMetaDescription(store.description, 160);

  const keywords =
    Array.isArray(seoData.seo_keywords) && seoData.seo_keywords.length > 0
      ? seoData.seo_keywords.join(", ")
      : [
          ...(Array.isArray(extraKeywords) ? extraKeywords : []),
          store.name,
          ...(store.description ? [store.description] : []),
        ]
          .filter(Boolean)
          .join(", ");

  return {
    title,
    description,
    keywords,
    image: store.logo ? ensureAbsoluteUrl(store.logo) : undefined,
  };
};

/**
 * Generate collection meta tags
 */
export const generateCollectionMeta = (
  name: string,
  description: string,
  image?: string,
  metadata?: any,
  extraKeywords?: string[]
) => {
  const seoData = parseMetadata(metadata);

  const title = seoData.seo_title || name;
  const descriptionText = seoData.seo_description
    ? generateMetaDescription(seoData.seo_description, 160)
    : generateMetaDescription(description, 160);

  const keywords =
    Array.isArray(seoData.seo_keywords) && seoData.seo_keywords.length > 0
      ? seoData.seo_keywords.join(", ")
      : [
          ...(Array.isArray(extraKeywords) ? extraKeywords : []),
          name,
          ...(description ? [description] : []),
        ]
          .filter(Boolean)
          .join(", ");

  return {
    title,
    description: descriptionText,
    keywords,
    image: image ? ensureAbsoluteUrl(image) : undefined,
  };
};
