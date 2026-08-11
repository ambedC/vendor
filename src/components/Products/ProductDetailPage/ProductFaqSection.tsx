import PageHeader from "@/components/custom/PageHeader";
import { getProductFAQs } from "@/routes/api";
import {
  Accordion,
  AccordionItem,
  Pagination,
  Input,
  Card,
} from "@heroui/react";
import { Search, HelpCircle } from "lucide-react";
import { FC, useState, useMemo } from "react";
import useSWR from "swr";
import debounce from "lodash/debounce";
import ProductFaqSectionSkeleton from "@/components/Skeletons/ProductFaqSectionSkeleton";
import { useTranslation } from "react-i18next";

interface ProductFaqSectionProps {
  productSlug: string;
}

const ProductFaqSection: FC<ProductFaqSectionProps> = ({ productSlug }) => {
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const perPage = 5;

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setPage(1);
        setSearch(value);
      }, 500),
    [setPage, setSearch]
  );

  const fetcher = async () => {
    const response = await getProductFAQs({
      slug: productSlug,
      page,
      per_page: perPage,
      search,
    });

    if (response.success && response.data) {
      return response.data;
    }
    console.error("Failed to fetch product FAQs");
  };

  const {
    data: faqsData,
    error,
    isLoading,
  } = useSWR(
    productSlug ? ["product-faqs", productSlug, page, search] : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const totalFAQs = faqsData?.total || 0;
  const faqs = faqsData?.data || [];
  const totalPages = faqsData ? Math.ceil(totalFAQs / perPage) : 1;

  return (
    <div className="w-full h-full flex flex-col text-medium mt-4">
      {/* Header + Search */}
      <div className="grid grid-cols-2 w-full gap-2 justify-between p-0">
        <PageHeader
          title={t("productFaqs.title")}
          subtitle={t("productFaqs.subtitle", {
            count: isLoading ? 0 : faqs.length,
            total: isLoading ? 0 : totalFAQs,
          })}
        />
        <div className="w-full flex items-start justify-end">
          <Input
            placeholder={t("productFaqs.searchPlaceholder")}
            aria-label={t("productFaqs.searchAriaLabel")}
            size="sm"
            startContent={<Search className="w-4 h-4 text-foreground/50" />}
            onChange={(e) => debouncedSearch(e.target.value)}
            className="max-w-48"
          />
        </div>
      </div>

      {/* Error UI */}
      {error && (
        <div className="w-full text-center py-10">
          <p>{t("productFaqs.error")}</p>
        </div>
      )}

      {/* Loading UI */}
      {isLoading && !faqsData ? (
        <ProductFaqSectionSkeleton itemsCount={perPage} />
      ) : faqs.length > 0 ? (
        <>
          <div className="h-full w-full">
            {isLoading ? (
              <ProductFaqSectionSkeleton itemsCount={perPage} />
            ) : (
              <Accordion variant="splitted" className="px-0">
                {faqs.map((faq) => (
                  <AccordionItem
                    key={faq.id}
                    aria-label={`${t("productFaqs.faqAriaLabel")} ${faq.id}`}
                    title={faq.question}
                    classNames={{
                      base: "mx-0",
                      titleWrapper: "p-0",
                      title: "text-xs sm:text-medium",
                      content: "text-xs sm:text-medium text-foreground/50",
                    }}
                  >
                    {faq.answer}
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination
                total={totalPages}
                initialPage={page}
                onChange={setPage}
                showControls
                isCompact
                size="sm"
                classNames={{
                  item: "text-sm",
                  cursor: "text-sm",
                  next: "text-sm",
                  prev: "text-sm",
                }}
              />
            </div>
          )}
        </>
      ) : (
        /* ❌ Empty State UI */
        <Card
          className="w-full flex flex-col items-center justify-center py-10"
          shadow="sm"
        >
          <div className="p-4 bg-white dark:bg-gray-600 shadow-sm rounded-full mb-4">
            <HelpCircle className="w-12 h-12 text-gray-400" />
          </div>

          <h3 className="text-xl font-semibold text-foreground/70">
            {t("productFaqs.noFaqsYet") || "No FAQs Available"}
          </h3>

          <p className="text-foreground/50 mt-2 text-center max-w-md">
            {search
              ? t("productFaqs.noSearchResults") ||
                "No FAQ matches your search. Try different keywords."
              : t("productFaqs.noFaqsDescription") ||
                "There are currently no questions asked for this product."}
          </p>
        </Card>
      )}
    </div>
  );
};

export default ProductFaqSection;
