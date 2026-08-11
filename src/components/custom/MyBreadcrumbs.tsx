import React from "react";
import { Breadcrumbs, BreadcrumbItem } from "@heroui/react";
import { Home } from "lucide-react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";

interface Breadcrumb {
  href?: string;
  label: string | React.ReactNode;
  startContent?: React.ReactNode;
}

interface MyBreadcrumbsProps {
  breadcrumbs: Breadcrumb[];
  maxItems?: number;
  itemsBeforeCollapse?: number;
  itemsAfterCollapse?: number;
  separator?: React.ReactNode | undefined;
}

const MyBreadcrumbs: React.FC<MyBreadcrumbsProps> = ({
  breadcrumbs,
  maxItems = 4,
  itemsBeforeCollapse = 1,
  itemsAfterCollapse = 2,
  separator = undefined,
}) => {
  const router = useRouter();
  const { t } = useTranslation();

  const defaultBreadcrumb = {
    href: "/",
    label: t("home_title"),
    startContent: <Home size={12} />,
  };

  const allBreadcrumbs = [defaultBreadcrumb, ...breadcrumbs];

  return (
    <Breadcrumbs
      size="md"
      itemsBeforeCollapse={itemsBeforeCollapse}
      itemsAfterCollapse={itemsAfterCollapse}
      maxItems={maxItems}
      separator={separator}
      classNames={{ base: "my-3 sm:my-4" }}
    >
      {allBreadcrumbs.map((breadcrumb, index) => (
        <BreadcrumbItem
          key={index}
          href={breadcrumb.href}
          onClick={(event) => {
            if (!breadcrumb.href) return;
            event.preventDefault();
            router.push(breadcrumb.href);
          }}
          startContent={breadcrumb.startContent}
          title={breadcrumb?.label?.toString?.() || ""}
          classNames={{
            item: "min-w-0 max-w-full",
          }}
          className={
            router.asPath === breadcrumb.href
              ? "text-primary font-semibold"
              : "text-foreground hover:text-primary-600"
          }
        >
          <span className="block truncate max-w-[95vw] min-w-0">
            {breadcrumb.label}
          </span>
        </BreadcrumbItem>
      ))}
    </Breadcrumbs>
  );
};

export default MyBreadcrumbs;
