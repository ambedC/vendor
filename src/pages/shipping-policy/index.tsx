import { GetServerSideProps, NextPage } from "next";
import { getSettings } from "@/routes/api";
import { Settings } from "@/types/ApiResponse";
import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import { useSettings } from "@/contexts/SettingsContext";
import { isSSR } from "@/helpers/getters";
import HTMLRenderer from "@/components/Functional/HTMLRenderer";
import { loadTranslations } from "../../../i18n";
import PageHead from "@/SEO/PageHead";
import { useTranslation } from "react-i18next";

interface ShippingPolicyPageProps {
  initialSettings?: Settings | null;
  error?: string;
}

const ShippingPolicyPage: NextPage<ShippingPolicyPageProps> = () => {
  const { webSettings } = useSettings();
  const { t } = useTranslation();

  const policyContent = {
    title: t("pages.shippingPolicy.title", "Shipping Policy"),
    description: t(
      "pages.shippingPolicy.description",
      "Learn about our shipping methods, delivery times, and costs."
    ),
    content: webSettings?.shippingPolicy || t("notAvailable", "Not Available"),
  };

  return (
    <>
      <PageHead pageTitle={t("pageTitle.shipping-policy")} />

      <div className="min-h-screen">
        <MyBreadcrumbs
          breadcrumbs={[
            { href: "/shipping-policy", label: t("pageTitle.shipping-policy") },
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

export default ShippingPolicyPage;
