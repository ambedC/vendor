import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import { getSettings } from "@/routes/api";
import { GetServerSideProps } from "next";
import { isSSR } from "@/helpers/getters";
import { NextPageWithLayout } from "@/types";
import dynamic from "next/dynamic";
import { updateCartData } from "@/helpers/updators";
import { withAuth } from "@/guards/withAuth";
import { loadTranslations } from "../../../i18n";
import PageHead from "@/SEO/PageHead";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setRusDelivery } from "@/lib/redux/slices/checkoutSlice";

const CartPageView = dynamic(() => import("@/views/CartPageView"), {
  ssr: false,
});

interface CartPageProps {
  error?: string;
}

const CartPage: NextPageWithLayout<CartPageProps> = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(setRusDelivery(false));
    updateCartData(false, false, 0, false);
  }, [dispatch]);

  return (
    <>
      <PageHead pageTitle={t("pageTitle.cart")} />

      <button
        id="refetch-cart-page"
        onClick={() => updateCartData(true, false)}
        className="hidden"
      />

      <div className="min-h-screen">
        <MyBreadcrumbs
          breadcrumbs={[{ href: "/cart", label: "Shopping Cart" }]}
        />
        <CartPageView />
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps | undefined = isSSR()
  ? async (context) => {
      try {
        const settingsRes = await getSettings();
        await loadTranslations(context);

        return {
          props: {
            initialSettings: settingsRes.data ?? null,
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

export default withAuth(CartPage);
