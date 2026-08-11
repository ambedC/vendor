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

interface PrivacyPolicyPageProps {
  initialSettings?: Settings | null;
  error?: string;
}

const PrivacyPolicyPage: NextPage<PrivacyPolicyPageProps> = ({}) => {
  const { webSettings } = useSettings();
  const { t } = useTranslation();

  const policyContent = {
    title: t("pages.privacyPolicy.title"),
    description: t("pages.privacyPolicy.description"),
    content:
      webSettings?.privacyPolicy || t("pages.privacyPolicy.notAvailable"),
  };

  const metaDescription = generateMetaDescription(
    stripHtmlTags(policyContent.content),
    160
  );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: t("pageTitle.privacy-policy"), url: "/privacy-policy" },
  ]);

  return (
    <>
      <DynamicSEO
        title={t("pageTitle.privacy-policy")}
        description={metaDescription}
        keywords="privacy policy, data protection, privacy terms, user privacy"
        canonical="/privacy-policy"
        ogType="article"
        jsonLd={breadcrumbSchema}
      />

      <div className="min-h-screen">
        <MyBreadcrumbs
          breadcrumbs={[
            { href: "/privacy-policy", label: t("pageTitle.privacy-policy") },
          ]}
        />
        <div className="w-full mb-2">
          <h1 className="text-xl font-bold">{policyContent.title}</h1>
          <p className="text-foreground/50 text-xs">
            {policyContent.description}
          </p>
        </div>
        <HTMLRenderer html={policyContent.content} />
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

export default PrivacyPolicyPage;
