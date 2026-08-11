import MyBreadcrumbs from "@/components/custom/MyBreadcrumbs";
import PageHeader from "@/components/custom/PageHeader";
import TransactionTable from "@/components/Tables/TransactionTable";
import { getAccessTokenFromContext } from "@/helpers/auth";
import { isSSR } from "@/helpers/getters";
import UserLayout from "@/layouts/UserLayout";
import { getSettings, getTransactions, getUserData } from "@/routes/api";
import { NextPageWithLayout } from "@/types";
import {
  PaginatedResponse,
  Transaction,
  TransactionQueryArgs,
  userData,
} from "@/types/ApiResponse";
import { GetServerSideProps } from "next";
import { loadTranslations } from "../../../../i18n";
import { useTranslation } from "react-i18next";
import PageHead from "@/SEO/PageHead";

type TransactionsPageProps = {
  initialUserData: userData;
  transactions: Transaction[];
  total: number;
  initialQuery: TransactionQueryArgs;
  error?: string;
};

const perPage = 8;

const TransactionsPage: NextPageWithLayout<TransactionsPageProps> = ({
  transactions,
  total,
  initialQuery,
  error,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <PageHead pageTitle={t("pageTitle.transactions")} />

      <MyBreadcrumbs
        breadcrumbs={[
          {
            href: "/my-account/transactions",
            label: t("pageTitle.transactions"),
          },
        ]}
      />

      <UserLayout activeTab="transactions">
        <div className="w-full">
          {/* Header */}
          <div className="flex items-center justify-between">
            <PageHeader
              title={t("pages.transactionsPage.header.title")}
              subtitle={t("pages.transactionsPage.header.subtitle")}
            />
          </div>

          {/* Error Message */}
          {error && <div className="mt-4 text-red-500">{error}</div>}

          {/* Table */}
          <TransactionTable
            initialTransactions={transactions}
            initialTotal={total}
            per_page={perPage}
            initialQuery={initialQuery}
          />
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
          payment_status = "",
          page = "1",
          transaction_type = "",
          search = "",
        } = context.query;

        const response: PaginatedResponse<Transaction[]> =
          await getTransactions({
            payment_status:
              typeof payment_status === "string" ? payment_status : "",
            page: typeof page === "string" ? page : "1",
            search: typeof search === "string" ? search : "",
            per_page: perPage,
            access_token,
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
                payment_status,
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
            },
          };
        }
      } catch (error) {
        console.error("Error fetching wallet transactions:", error);

        return {
          props: {
            transactions: [],
            initialSettings: null,
            total: 0,
          },
        };
      }
    }
  : undefined;

export default TransactionsPage;
