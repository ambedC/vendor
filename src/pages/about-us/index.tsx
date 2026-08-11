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

interface AboutUsPageProps {
  initialSettings?: Settings | null;
  error?: string;
}

const AboutUsPage: NextPage<AboutUsPageProps> = ({}) => {
  const { webSettings } = useSettings();
  const { t } = useTranslation();

  const pageContent = {
    title: t("pages.aboutUs.title"),
    description: t("pages.aboutUs.description"),
    content: webSettings?.aboutUs || t("pages.aboutUs.notAvailable"),
  };

  // Generate SEO meta description from content
  const metaDescription = generateMetaDescription(
    stripHtmlTags(pageContent.content),
    160
  );

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: t("pageTitle.about-us"), url: "/about-us" },
  ]);

  return (
    <>
      <DynamicSEO
        title={t("pageTitle.about-us")}
        description={metaDescription}
        keywords="about us, about our company, who we are, our story"
        canonical="/about-us"
        ogType="website"
        jsonLd={breadcrumbSchema}
      />

      <div className="min-h-screen">
        <MyBreadcrumbs
          breadcrumbs={[
            { href: "/about-us", label: t("pages.aboutUs.breadcrumb") },
          ]}
        />
        <div className="w-full mb-2">
          <h1 className="text-xl font-bold">{pageContent.title}</h1>
          <p className="text-foreground/50 text-xs">
            {pageContent.description}
          </p>
        </div>
        <HTMLRenderer html={pageContent.content} />
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

export default AboutUsPage;
