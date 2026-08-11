import { useRouter } from "next/router";
import useSWR from "swr";
import { getFaqs, getSettings } from "@/routes/api";
import { FAQ, PaginatedResponse, Settings } from "@/types/ApiResponse";
import {
  Input,
  Pagination,
  Accordion,
  AccordionItem,
  Skeleton,
} from "@heroui/react";
import { GetServerSideProps } from "next";
import { isSSR } from "@/helpers/getters";
import { ChevronRight, Search } from "lucide-react";
import { NextPageWithLayout } from "@/types";
import PageHeader from "@/components/custom/PageHeader";
import { useCallback, useState, useMemo } from "react";
import { debounce } from "lodash";
import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import { loadTranslations } from "../../../i18n";
import DynamicSEO from "@/SEO/DynamicSEO";
import { generateFAQSchema, generateBreadcrumbSchema } from "@/helpers/seo";
import { useTranslation } from "react-i18next";

interface FAQsPageProps {
  fallbackFaqs: PaginatedResponse<FAQ[]>;
  initialSettings?: Settings | null;
}

const PER_PAGE = 8;

const fetcher = async (url: string) => {
  const params = new URLSearchParams(url.split("?")[1]);
  const res = await getFaqs({
    search: params.get("search") || "",
    page: params.get("page") || "1",
    per_page: PER_PAGE.toString(),
  });
  return res;
};

const FAQsPage: NextPageWithLayout<FAQsPageProps> = ({
  fallbackFaqs,
}: FAQsPageProps) => {
  const router = useRouter();
  const { t } = useTranslation();

  const currentPage = parseInt((router.query.page as string) || "1", 10);
  const [searchValue, setSearchValue] = useState(
    (router.query.search as string) || ""
  );
  const searchTerm = (router.query.search as string) || "";

  const { data: faqsData, isLoading } = useSWR(
    `/faqs?search=${searchTerm}&page=${currentPage}`,
    fetcher,
    {
      fallbackData: fallbackFaqs,
      revalidateOnFocus: false,
      revalidateOnMount: !isSSR(),
    }
  );

  const totalPages = Math.ceil((faqsData?.data?.total || 0) / PER_PAGE);

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        router.push(
          { pathname: router.pathname, query: { search: value, page: 1 } },
          undefined,
          { shallow: true }
        );
      }, 500),
    [router]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      debouncedSearch(value);
      setSearchValue(value);
    },
    [debouncedSearch]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      router.push(
        { pathname: router.pathname, query: { search: searchTerm, page } },
        undefined,
        { shallow: true }
      );
    },
    [router, searchTerm]
  );

  // Generate FAQ schema for SEO
  const faqSchema = faqsData?.data?.data?.length
    ? generateFAQSchema(
        faqsData.data.data.map((faq) => ({
          question: faq.question,
          answer: faq.answer,
        }))
      )
    : null;

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: t("pageTitle.faqs"), url: "/faqs" },
  ]);

  return (
    <>
      <DynamicSEO
        title={t("pageTitle.faqs")}
        description={t("pages.faqs.subtitle")}
        keywords="faq, frequently asked questions, help, support, customer service"
        canonical="/faqs"
        ogType="website"
        jsonLd={[faqSchema, breadcrumbSchema].filter(Boolean)}
      />

      <div>
        <MyBreadcrumbs
          breadcrumbs={[{ href: "/faqs", label: t("pageTitle.faqs") }]}
        />
        <PageHeader
          title={t("pages.faqs.title")}
          subtitle={t("pages.faqs.subtitle")}
        />

        <div className="max-w-xl mx-auto mb-4 sm:mb-8">
          <Input
            type="search"
            placeholder={t("pages.faqs.searchPlaceholder")}
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full"
            startContent={
              <Search
                className="text-base text-default-400 pointer-events-none shrink-0"
                size={20}
              />
            }
          />
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: PER_PAGE }).map((_, i) => (
                <div key={i} className="w-full">
                  <Skeleton className="h-14 w-full rounded-lg" />
                </div>
              ))}
            </div>
          ) : (
            <Accordion
              variant="splitted"
              selectionMode="multiple"
              className="p-2 flex flex-col gap-4"
            >
              {faqsData?.data?.data?.map((faq: FAQ) => (
                <AccordionItem
                  indicator={<ChevronRight />}
                  key={faq.id}
                  aria-label={faq.question}
                  title={faq.question}
                  classNames={{
                    content: "text-foreground/50 text-sm",
                  }}
                >
                  {faq.answer}
                </AccordionItem>
              ))}
            </Accordion>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination
                total={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                showControls
                isCompact
                size="sm"
                isDisabled={isLoading}
                classNames={{
                  item: "text-sm",
                  cursor: "text-sm",
                  next: "text-sm",
                  prev: "text-sm",
                }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps | undefined = isSSR()
  ? async (context) => {
      try {
        const { page = "1", search = "" } = context.query;

        const [faqsResult, settingsResult] = await Promise.allSettled([
          getFaqs({
            search: Array.isArray(search) ? search[0] : search,
            page: Array.isArray(page) ? page[0] : page,
            per_page: PER_PAGE.toString(),
          }),
          getSettings(),
        ]);

        await loadTranslations(context);

        return {
          props: {
            fallbackFaqs:
              faqsResult.status === "fulfilled" ? faqsResult.value : null,
            initialSettings:
              settingsResult.status === "fulfilled"
                ? settingsResult.value.data
                : null,
            error:
              faqsResult.status === "rejected" ||
              settingsResult.status === "rejected"
                ? "Some data failed to load"
                : null,
          },
        };
      } catch (error) {
        console.error("Unexpected error fetching FAQs:", error);
        return {
          props: {
            fallbackFaqs: null,
            initialSettings: null,
            error: "Unexpected failure",
          },
        };
      }
    }
  : undefined;

export default FAQsPage;
