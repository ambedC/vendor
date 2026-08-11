import { FC, useEffect } from "react";
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaXTwitter,
} from "react-icons/fa6";
import { Phone, Mail, Shield, Package, Leaf } from "lucide-react";
import { Chip, Image } from "@heroui/react";
import { useSettings } from "@/contexts/SettingsContext";
import Link from "next/link";
import { useTranslation } from "react-i18next";

const Footer: FC = () => {
  const { webSettings, isSingleVendor } = useSettings();
  const { t } = useTranslation();
  const version = process.env.NEXT_PUBLIC_APP_VERSION || "0";

  const {
    siteName = "",
    shortDescription = "",
    siteCopyright = "",
    supportEmail = "",
    supportNumber = "",
    siteFooterLogo = "https://placehold.co/160x40?text=Logo",
    facebookLink = null,
    instagramLink = null,
    xLink = null,
    youtubeLink = null,
  } = webSettings || {};

  useEffect(() => {
    if (webSettings?.footerScript) {
      const temp = document.createElement("div");
      temp.innerHTML = webSettings.footerScript;

      // Append each <script> dynamically to body (footer scripts typically go at end of body)
      Array.from(temp.querySelectorAll("script")).forEach((oldScript) => {
        const newScript = document.createElement("script");
        if (oldScript.src) {
          newScript.src = oldScript.src;
        }
        if (oldScript.textContent) {
          newScript.textContent = oldScript.textContent;
        }
        document.head.appendChild(newScript);
      });
    }
  }, [webSettings?.footerScript]);

  return (
    <footer className="bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white w-full">
      <div className="w-full max-w-[1536px] mx-auto px-2 sm:px-6 pt-6 sm:pt-12 pb-3 sm:pb-5">
        {/* Mobile Compact Layout */}
        <div className="block sm:hidden space-y-6">
          {/* Mobile Company Info - Compact */}
          <div className="text-center space-y-3">
            <div className="w-full flex justify-center">
              <Link href="/" title={t("nav.home")}>
                <Image
                  src={siteFooterLogo}
                  alt={siteName}
                  radius="none"
                  classNames={{ img: "h-16 w-full", wrapper: "cursor-pointer" }}
                />
              </Link>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto">
              {shortDescription}
            </p>

            {/* Mobile Features - Horizontal */}
            <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <Package className="w-3 h-3 text-purple-400" />
                <span>{t("footer.company_info.quality")}</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-green-400" />
                <span>{t("footer.company_info.secure")}</span>
              </div>
              <div className="flex items-center gap-1">
                <Leaf className="w-3 h-3 text-teal-400" />
                <span>{t("footer.company_info.trusted")}</span>
              </div>
            </div>
          </div>

          {/* Mobile Links - Two Column Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h2 className="text-white font-medium mb-2 text-center">
                {t("footer.quick_links.header")}
              </h2>
              <div className="space-y-1">
{[
                  {
                    label: t("footer.quick_links.about_us"),
                    href: "/about-us",
                  },
                  { label: t("footer.quick_links.faqs"), href: "/faqs" },
                   {
                    label: t("footer.quick_links.delivery_zones"),
                    href: "/delivery-zones",
                  },
                  ...(!isSingleVendor
                    ? [
                        {
                          label: t("footer.quick_links.stores"),
                          href: "/stores",
                        },
                        {
                          label: "Become a Seller",
                          href: "/seller-register",
                        },
                      ]
                    : []),
                ].map(({ label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    className="block text-slate-300 hover:text-primary-400 transition-colors text-center text-xs py-1"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-white font-medium mb-2 text-center">
                {t("footer.policies.header")}
              </h2>
              <div className="space-y-1">
                {[
                  {
                    label: t("footer.policies.privacy_policy"),
                    href: "/privacy-policy",
                  },
                  {
                    label: t("footer.policies.terms_conditions"),
                    href: "/terms-and-conditions",
                  },
                  {
                    label: t("footer.policies.shipping_policy"),
                    href: "/shipping-policy",
                  },
                  {
                    label: t("footer.policies.return_refund_policy"),
                    href: "/return-refund-policy",
                  },
                ].map(({ label, href }) => (
                  <Link
                    title={label}
                    key={label}
                    href={href}
                    className="block text-slate-300 hover:text-primary-400 transition-colors text-center text-xs py-1"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Contact - Compact Horizontal */}
          <div className="space-y-3">
            <h2 className="text-white font-medium text-center text-sm">
              {t("footer.contact_info.header")}
            </h2>
            <div className="flex items-center justify-center gap-4 text-xs">
              <a
                href={`tel:${supportNumber}`}
                className="flex items-center gap-1 hover:scale-[1.05] transition-transform"
              >
                <Phone className="w-3 h-3 text-blue-400" />
                <span className="text-slate-300">{supportNumber}</span>
              </a>
              <a
                href={`mailto:${supportEmail}`}
                className="flex items-center gap-1 hover:scale-[1.05] transition-transform"
              >
                <Mail className="w-3 h-3 text-green-400" />
                <span className="text-slate-300">{supportEmail}</span>
              </a>
            </div>
          </div>

          {/* Mobile Social - Compact */}
          <div className="text-center">
            <h2 className="text-white font-medium mb-2 text-sm">
              {t("footer.social.follow_us")}
            </h2>
            <div className="flex items-center justify-center gap-3">
              {facebookLink && (
                <a
                  href={facebookLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit our Facebook page"
                  className="p-2 bg-blue-600/20 hover:bg-blue-600 rounded-full transition-all"
                >
                  <FaFacebookF className="w-3 h-3 text-white" />
                </a>
              )}
              {instagramLink && (
                <a
                  href={instagramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow us on Instagram"
                  className="p-2 bg-pink-600/20 hover:bg-pink-600 rounded-full transition-all"
                >
                  <FaInstagram className="w-3 h-3 text-white" />
                </a>
              )}
              {youtubeLink && (
                <a
                  href={youtubeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Subscribe to our YouTube channel"
                  className="p-2 bg-red-600/20 hover:bg-red-600 rounded-full transition-all"
                >
                  <FaYoutube className="w-3 h-3 text-white" />
                </a>
              )}
              {xLink && (
                <a
                  href={xLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow us on X (formerly Twitter)"
                  className="p-2 bg-slate-700/20 hover:bg-slate-700 rounded-full transition-all"
                >
                  <FaXTwitter className="w-3 h-3 text-white" />
                </a>
              )}
            </div>
          </div>

          {/* Mobile Bottom Bar - Compact */}
          <div className="pt-3 border-t border-slate-700 text-center space-y-1">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <span>
                &copy; {new Date().getFullYear()} {siteCopyright}
              </span>
              <Chip size="sm" radius="sm" className="h-4 text-xs px-1">
                {`V ${version}`}
              </Chip>
            </div>
            <div className="text-xs text-slate-400">
              <span>{t("footer.bottom_bar.powered_by")} </span>
              <a
                href="https://infinitietech.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300 font-medium"
              >
                Infinitietech
              </a>
            </div>
          </div>
        </div>

        {/* Desktop Layout - Unchanged */}
        <div className="hidden sm:block">
          {/* Main Footer Content */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 mb-12 mt-4 text-left">
            {/* Company Info */}
            <div className="space-y-6">
              <Link href="/" title={t("nav.home")}>
                <Image
                  src={siteFooterLogo}
                  alt={siteName}
                  radius="none"
                  classNames={{
                    img: "h-12 md:h-16 lg:h-20 w-full",
                    wrapper: "cursor-pointer",
                  }}
                />
              </Link>
              <p className="text-slate-300 leading-relaxed max-w-xs mt-3">
                {shortDescription}
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <Package className="w-4 h-4 text-purple-400" />
                  <span>{t("footer.company_info.wide_range")}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span>{t("footer.company_info.secure_payments")}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-300">
                  <Leaf className="w-4 h-4 text-teal-400" />
                  <span>{t("footer.company_info.trusted_customers")}</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">
                {t("footer.quick_links.header")}
              </h2>
              <div className="space-y-3">
{[
                  {
                    label: t("footer.quick_links.about_us"),
                    href: "/about-us",
                  },
                  { label: t("footer.quick_links.faqs"), href: "/faqs" },
                   {
                    label: t("footer.quick_links.delivery_zones"),
                    href: "/delivery-zones",
                  },
                  ...(!isSingleVendor
                    ? [
                        {
                          label: t("footer.quick_links.stores"),
                          href: "/stores",
                        },  
                        {
                          label: "Become a Seller",
                          href: "/seller-register",
                        },
                      ]
                    : []),
                ].map(({ label, href }) => (
                  <Link
                    title={label}
                    key={label}
                    href={href}
                    className="block text-slate-300 hover:text-primary-400 transition-all transform hover:translate-x-1"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Policies */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">
                {t("footer.policies.header")}
              </h2>
              <div className="space-y-3">
                {[
                  {
                    label: t("footer.policies.privacy_policy"),
                    href: "/privacy-policy",
                  },
                  {
                    label: t("footer.policies.terms_conditions"),
                    href: "/terms-and-conditions",
                  },
                  {
                    label: t("footer.policies.shipping_policy"),
                    href: "/shipping-policy",
                  },
                  {
                    label: t("footer.policies.return_refund_policy"),
                    href: "/return-refund-policy",
                  },
                ].map(({ label, href }) => (
                  <Link
                    title={label}
                    key={label}
                    href={href}
                    className="block text-slate-300 hover:text-primary-400 transition-all transform hover:translate-x-1"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white text-start w-full">
                {t("footer.contact_info.header")}
              </h2>
              <div className="space-y-4">
                {[
                  {
                    Icon: Phone,
                    bg: "bg-blue-500/20",
                    color: "text-blue-400",
                    title: t("footer.contact_info.call_us"),
                    content: supportNumber,
                    href: `tel:${supportNumber}`,
                  },
                  {
                    Icon: Mail,
                    bg: "bg-green-500/20",
                    color: "text-green-400",
                    title: t("footer.contact_info.email_us"),
                    content: supportEmail,
                    href: `mailto:${supportEmail}`,
                  },
                ].map(({ Icon, bg, color, title, content, href }, index) => (
                  <a
                    key={index}
                    href={href}
                    className="flex items-center gap-3 text-slate-300 hover:scale-[1.02] transition-transform"
                  >
                    <div className={`p-2 ${bg} rounded-lg`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{title}</p>
                      <p className="text-xs">{content}</p>
                    </div>
                  </a>
                ))}
              </div>

              {/* Social Media Icons */}
              <div className="pt-4 border-t border-slate-700">
                <h3 className="text-sm font-medium text-white mb-4 text-start">
                  {t("footer.social.follow_us")}
                </h3>
                <div className="flex items-center gap-3">
                  {facebookLink && (
                    <a
                      href={facebookLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Visit our Facebook page"
                      className="p-2.5 bg-blue-600/20 hover:bg-blue-600 rounded-full transition-all hover:scale-110"
                    >
                      <FaFacebookF className="w-4 h-4 text-white" />
                    </a>
                  )}
                  {instagramLink && (
                    <a
                      href={instagramLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Follow us on Instagram"
                      className="p-2.5 bg-pink-600/20 hover:bg-pink-600 rounded-full transition-all hover:scale-110"
                    >
                      <FaInstagram className="w-4 h-4 text-white" />
                    </a>
                  )}
                  {youtubeLink && (
                    <a
                      href={youtubeLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Subscribe to our YouTube channel"
                      className="p-2.5 bg-red-600/20 hover:bg-red-600 rounded-full transition-all hover:scale-110"
                    >
                      <FaYoutube className="w-4 h-4 text-white" />
                    </a>
                  )}
                  {xLink && (
                    <a
                      href={xLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Follow us on X (formerly Twitter)"
                      className="p-2.5 bg-slate-700/20 hover:bg-slate-700 rounded-full transition-all hover:scale-110"
                    >
                      <FaXTwitter className="w-4 h-4 text-white" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-700">
            <div className="flex items-center gap-2 text-sm text-slate-400 text-center sm:text-left">
              <span>
                &copy; {new Date().getFullYear()} {siteCopyright}
              </span>
              <Chip
                size="sm"
                radius="sm"
                className="h-5 text-xs px-0.5"
              >{`V ${version}`}</Chip>
            </div>

            <div className="flex items-center justify-center sm:justify-end gap-2 text-sm text-slate-400">
              <span>{t("footer.bottom_bar.powered_by")}</span>
              <a
                href="https://infinitietech.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300 font-semibold transition-transform hover:scale-105"
              >
                Infinitietech
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
