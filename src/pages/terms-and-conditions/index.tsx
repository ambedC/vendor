import { GetServerSideProps, NextPage } from "next";
import { getSettings } from "@/routes/api";
import { Settings } from "@/types/ApiResponse";
import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import { useSettings } from "@/contexts/SettingsContext";
import { isSSR } from "@/helpers/getters";
import HTMLRenderer from "@/components/Functional/HTMLRenderer";
import { loadTranslations } from "../../../i18n";
import DynamicSEO from "@/SEO/DynamicSEO";
import {
  generateBreadcrumbSchema,
  generateMetaDescription,
  stripHtmlTags,
} from "@/helpers/seo";
import { useTranslation } from "react-i18next";

interface TermsPageProps {
  initialSettings?: Settings | null;
  error?: string;
}

const TermsPage: NextPage<TermsPageProps> = () => {
  const { webSettings } = useSettings();
  const { t } = useTranslation();

  const termsContent = {
    title: t("pages.termsAndConditions.title"),
    description: t("pages.termsAndConditions.description"),
    content:
      webSettings?.termsCondition || t("pages.termsAndConditions.notAvailable"),
  };

  const metaDescription = generateMetaDescription(
    stripHtmlTags(termsContent.content),
    160
  );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: t("pageTitle.terms-and-conditions"), url: "/terms-and-conditions" },
  ]);

  return (
    <>
      <DynamicSEO
        title={t("pageTitle.terms-and-conditions")}
        description={metaDescription}
        keywords="terms and conditions, terms of service, legal terms, user agreement"
        canonical="/terms-and-conditions"
        ogType="article"
        jsonLd={breadcrumbSchema}
      />

      <div className="min-h-screen">
        <MyBreadcrumbs
          breadcrumbs={[
            {
              href: "/terms-and-conditions",
              label: t("pages.termsAndConditions.breadcrumb"),
            },
          ]}
        />

        <div className="w-full mb-2">
          <h1 className="text-xl font-bold">{termsContent.title}</h1>
          <p className="text-foreground/50 text-xs">
            {termsContent.description}
          </p>
        </div>

        <HTMLRenderer html={termsContent.content} />
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps | undefined = isSSR()
  ? async (context) => {
      try {
        const settings = await getSettings();
        await loadTranslations(context);

        return {
          props: {
            initialSettings: settings.data,
          },
        };
      } catch (err) {
        console.error("Error in getServerSideProps:", err);
        return {
          props: {
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

export default TermsPage;
