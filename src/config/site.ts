export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Hyper Local 222",
  description: "Make beautiful websites regardless of your design experience.",
  metaKeywords:
    "local delivery, ecommerce, hyperlocal services, online shopping, delivery app, nearby stores, fast delivery, next-day delivery, local groceries, quick commerce",
  metaDescription:
    "Hyper Local is your go-to platform for fast and reliable local delivery services. Shop from nearby stores and get your items delivered quickly and hassle-free.",
  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Categories",
      href: "/categories",
    },

    {
      label: "Blogs",
      href: "/blogs",
    },
    {
      label: "About",
      href: "/about",
    },
  ],
  navMenuItems: [
    {
      label: "Profile",
      href: "/my-account",
    },
    {
      label: "Dashboard",
      href: "/",
    },

    {
      label: "Logout",
      href: "/logout",
    },
  ],
  links: {
    github: "https://github.com/heroui-inc/heroui",
    twitter: "https://twitter.com/hero_ui",
    docs: "https://heroui.com",
    discord: "https://discord.gg/9b6yyZKmH4",
    sponsor: "https://patreon.com/jrgarciadev",
  },
};
