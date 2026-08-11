import { GetServerSideProps } from "next";
import { getSections, getSettings } from "@/routes/api";
import React from "react";
import { isSSR } from "@/helpers/getters";
import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import PageHeader from "@/components/custom/PageHeader";
import { FeaturedSection, PaginatedResponse } from "@/types/ApiResponse";
import { NextPageWithLayout } from "@/types";
import { getAccessTokenFromContext } from "@/helpers/auth";
import InfiniteScroll from "@/components/Functional/InfiniteScroll";
import { useInfiniteData } from "@/hooks/useInfiniteData";
import SectionCard from "@/components/Cards/SectionCard";
import SectionCardSkeleton from "@/components/Skeletons/SectionCardSkeleton";
import InfiniteScrollStatus from "@/components/Functional/InfiniteScrollStatus";
import { loadTranslations } from "../../../i18n";
import PageHead from "@/SEO/PageHead";
import { useTranslation } from "react-i18next";

interface FeatureSectionsPageProps {
  initialSections: PaginatedResponse<FeaturedSection[]> | null;
  error?: string;
}

const PER_PAGE = 12;

const FeatureSectionsPage: NextPageWithLayout<FeatureSectionsPageProps> = ({
  initialSections,
}) => {
  const { t } = useTranslation();

  const {
    data: sections,
    isLoading,
    isLoadingMore,
    hasMore,
    total,
    loadMore,
    refetch,
  } = useInfiniteData<FeaturedSection>({
    fetcher: (params) => getSections(params),
    perPage: PER_PAGE,
    initialData: initialSections?.data?.data || [],
    initialTotal: initialSections?.data?.total || 0,
    dataKey: "feature-sections",
    passLocation: true,
  });
  console.log(sections);
  return (
    <>
      <PageHead pageTitle={t("pageTitle.feature-sections")} />

      <button
        id="refetch-sections-page"
        className="hidden"
        onClick={() => {
          refetch();
        }}
      />

      <div className="min-h-screen">
        <MyBreadcrumbs
          breadcrumbs={[
            {
              href: "/feature-sections",
              label: t("pageTitle.feature-sections"),
            },
          ]}
        />

        <PageHeader
          title={t("pages.featureSections.title")}
          subtitle={t("pages.featureSections.subtitle")}
          highlightText={
            total ? `${total} ${t("pages.featureSections.sections")}` : ""
          }
        />

        <div className="w-full">
          <InfiniteScroll
            hasMore={hasMore}
            isLoading={isLoadingMore}
            onLoadMore={loadMore}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <SectionCardSkeleton key={i} />
                  ))
                : sections.map((section) => (
                    <SectionCard key={section.id} section={section} />
                  ))}
            </div>

            {isLoadingMore && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SectionCardSkeleton key={`loading-${i}`} />
                ))}
              </div>
            )}

            {sections.length > 0 && (
              <InfiniteScrollStatus
                entityType="section"
                total={total}
                hasMore={hasMore}
              />
            )}
          </InfiniteScroll>

          {sections.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <p className="text-foreground/50">
                {t("pages.featureSections.noSections")}
              </p>
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
        const access_token = (await getAccessTokenFromContext(context)) || "";
        await loadTranslations(context);
        const sections = await getSections({
          page: 1,
          per_page: PER_PAGE,
          access_token,
        });
        const settings = await getSettings();

        return {
          props: {
            initialSections: sections,
            initialSettings: settings.data ?? null,
          },
        };
      } catch (err) {
        console.error("Error in getServerSideProps:", err);
        return {
          props: {
            initialSections: null,
            initialSettings: null,
            error:
              err instanceof Error
                ? err.message
                : "An error occurred during SSR",
          },
        };
      }
    }
  : undefined;

export default FeatureSectionsPage;
