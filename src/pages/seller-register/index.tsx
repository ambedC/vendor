import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/router";
import { useEffect } from "react";
import PageHeader from "@/components/custom/PageHeader";
import { getSettings } from "@/routes/api";
import { isSSR } from "@/helpers/getters";
import { GetServerSideProps } from "next";
import { loadTranslations } from "../../../i18n";
import { useSettings } from "@/contexts/SettingsContext";
import SellerRegisterForm from "@/components/Seller/SellerRegisterForm";
import PageHead from "@/SEO/PageHead";
import EnhancedSellerMarketing from "@/components/Seller/EnhancedSellerMarketing";

export default function SellerRegistration() {
  const { t } = useTranslation();
  const { webSettings, isSingleVendor } = useSettings();
  const router = useRouter();

  useEffect(() => {
    if (isSingleVendor) {
      router.replace("/");
    }
  }, [isSingleVendor, router]);

  if (isSingleVendor) return null;

  return (
    <div className="min-h-screen w-full">
      <div className="w-full flex flex-col items-start">
        <PageHead pageTitle={t("pages.sellerRegister.pageTitle")} />

        <MyBreadcrumbs
          breadcrumbs={[
            {
              href: "/seller-register",
              label: t("pages.sellerRegister.pageTitle"),
            },
          ]}
        />

        <PageHeader
          title={t("pages.sellerRegister.pageTitle")}
          subtitle={t("pages.sellerRegister.pageSubtitle")}
          highlightText={webSettings?.siteName || ""}
        />

        {/* Marketing content comes first */}
        {/* <SellerMarketingContent /> */}
        <EnhancedSellerMarketing />

        <SellerRegisterForm />
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps | undefined = isSSR()
  ? async (context) => {
      try {
        const settings = await getSettings();

        // Server-side redirect for single vendor mode
        const systemSettings = settings?.data?.find(
          (s: { variable: string }) => s.variable === "system",
        )?.value as { systemVendorType?: string } | undefined;
        if (systemSettings?.systemVendorType === "single") {
          return { redirect: { destination: "/", permanent: false } };
        }

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
