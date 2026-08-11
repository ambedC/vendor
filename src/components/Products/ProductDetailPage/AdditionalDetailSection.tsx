import { useEffect, useRef, useState } from "react";
import PageHeader from "@/components/custom/PageHeader";
import HTMLRenderer from "@/components/Functional/HTMLRenderer";
import { Product } from "@/types/ApiResponse";
import { useTranslation } from "react-i18next";

interface AdditionalDetailSectionProps {
  initialProduct: Product;
}

const COLLAPSED_LINES = 16;

const AdditionalDetailSection: React.FC<AdditionalDetailSectionProps> = ({
  initialProduct,
}) => {
  const { description = "" } = initialProduct || {};
  const { t } = useTranslation();

  const customFields = initialProduct?.custom_fields || {};
  const contentRef = useRef<HTMLDivElement | null>(null);

  const [expanded, setExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);

  useEffect(() => {
    if (!contentRef.current) return;

    const el = contentRef.current;

    // Allow DOM to paint before measuring
    requestAnimationFrame(() => {
      const isOverflowing = el.scrollHeight > el.clientHeight;
      setShowToggle(isOverflowing);
    });
  }, [description]);

  const shouldClamp = !expanded;

  return (
    <section className="mt-4">
      <PageHeader
        title="Additional Details"
        subtitle="Find the additional info of the Product"
      />

      {/* Custom fields Table */}
      {customFields && Object.keys(customFields).length > 0 ? (
        <div className="mb-6 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left text-sm font-semibold text-foreground">
                  {t("attribute")}
                </th>
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-left text-sm font-semibold text-foreground">
                  {t("value")}
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(customFields).map(([key, value], index) => (
                <tr
                  key={key}
                  className={
                    index % 2 === 0
                      ? "bg-white dark:bg-gray-900"
                      : "bg-gray-50 dark:bg-gray-800/50"
                  }
                >
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm font-medium text-foreground/80 capitalize">
                    {key.replace(/_/g, " ")}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm text-foreground">
                    {String(value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Content */}
      <div
        ref={contentRef}
        className={shouldClamp ? "overflow-hidden" : undefined}
        style={
          shouldClamp
            ? {
                display: "-webkit-box",
                WebkitLineClamp: COLLAPSED_LINES,
                WebkitBoxOrient: "vertical",
              }
            : undefined
        }
      >
        <HTMLRenderer html={description} />
      </div>

      {/* Show More / Less (ONLY if needed) */}
      {showToggle && (
        <button
          type="button"
          title={expanded ? t("see_less") : t("see_more")}
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-2 text-sm font-medium text-primary cursor-pointer"
        >
          {expanded ? t("see_less") : t("see_more")}
        </button>
      )}
    </section>
  );
};

export default AdditionalDetailSection;
