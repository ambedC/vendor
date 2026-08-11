import { default as WalletCardLoading } from "@/components/Cart/WalletCard";
import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import PageHeader from "@/components/custom/PageHeader";
import { getAccessTokenFromContext } from "@/helpers/auth";
import { isSSR } from "@/helpers/getters";
import UserLayout from "@/layouts/UserLayout";
import { setUserDataRedux } from "@/lib/redux/slices/authSlice";
import { getSettings, getUserData, getWalletTransactions } from "@/routes/api";
import {
  WalletTransaction,
  userData,
  PaginatedResponse,
  TransactionQueryArgs,
} from "@/types/ApiResponse";
import { GetServerSideProps } from "next";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import dynamic from "next/dynamic";
import useSWR from "swr";
import { NextPageWithLayout } from "@/types";
import { loadTranslations } from "../../../../i18n";
import PageHead from "@/SEO/PageHead";
import { useTranslation } from "react-i18next";
import WalletTransactionTable from "@/components/Tables/WalletTransactionTable";

type WalletPageProps = {
  initialUserData: userData;
  transactions: WalletTransaction[];
  total: number;
  initialQuery: TransactionQueryArgs;
  error?: string;
};

const perPage = 5;

const WalletCard = dynamic(() => import("@/components/Cart/WalletCard"), {
  ssr: false,
  loading: () => <WalletCardLoading loading={true} />,
});

const fetchUserData = async () => {
  const access_token = localStorage.getItem("access_token");
  if (!access_token) console.error("No access token");
  const response = await getUserData();
  return response.data;
};

const WalletPage: NextPageWithLayout<WalletPageProps> = ({
  transactions,
  total,
  initialUserData,
  initialQuery,
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const { data: userData } = useSWR(
    !isSSR() ? "user-data" : null,
    fetchUserData,
    {
      fallbackData: initialUserData || {},
    }
  );

  useEffect(() => {
    if (userData) {
      dispatch(setUserDataRedux(userData));
    }
  }, [userData, dispatch]);

  return (
    <>
      <MyBreadcrumbs
        breadcrumbs={[
          { href: "/my-account/wallet", label: t("pageTitle.wallet") },
        ]}
      />
      <PageHead pageTitle={t("pageTitle.wallet")} />

      <UserLayout activeTab="wallet">
        <div className="w-full">
          {/* Header */}
          <div className="flex items-center gap-4 justify-between">
            <PageHeader
              title={t("pages.walletPage.header.title")}
              subtitle={t("pages.walletPage.header.subtitle")}
            />
            {isSSR() && (
              <div className="text-xs sm:text-sm text-gray-500">
                {t("pages.walletPage.totalFound", { total })}
              </div>
            )}
          </div>

          <div className="w-full flex flex-col gap-2">
            <WalletCard loading={false} />

            {/* Table */}
            <WalletTransactionTable
              initialTransactions={transactions}
              initialTotal={total}
              per_page={perPage}
              tableTitle={t("pages.walletPage.table.title")}
              initialQuery={initialQuery}
            />
          </div>
        </div>
      </UserLayout>
    </>
  );
};

export const getServerSideProps: GetServerSideProps | undefined = isSSR()
  ? async (context) => {
      try {
        const access_token = (await getAccessTokenFromContext(context)) || "";
        if (!access_token) {
          return {
            redirect: {
              destination: "/",
              permanent: false,
            },
          };
        }
        const res = await getUserData({ access_token });
        await loadTranslations(context);

        const {
          status = "",
          page = "1",
          transaction_type = "",
          query = "",
        } = context.query;

        const response: PaginatedResponse<WalletTransaction[]> =
          await getWalletTransactions({
            status: typeof status === "string" ? status : "",
            transaction_type:
              typeof transaction_type === "string" ? transaction_type : "",
            page: typeof page === "string" ? page : "1",
            per_page: perPage,
            access_token,
            query: typeof query === "string" ? query : "",
          });

        const settings = await getSettings();

        if (response.success) {
          return {
            props: {
              initialUserData: res.data,
              transactions: response.data.data || [],
              initialSettings: settings.data,
              total: response.data.total || 0,
              initialQuery: {
                status,
                page: parseInt(typeof page === "string" ? page : "1"),
                transaction_type,
              },
            },
          };
        } else {
          return {
            props: {
              transactions: [],
              initialSettings: settings.data,
              total: 0,
              error: response.message || "Failed to fetch wallet transactions",
              initialQuery: {},
            },
          };
        }
      } catch (error) {
        console.error("Error fetching wallet transactions:", error);

        return {
          props: {
            transactions: [],
            initialSettings: null,
            initialQuery: {},
            total: 0,
          },
        };
      }
    }
  : undefined;

export default WalletPage;
