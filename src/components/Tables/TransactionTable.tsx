import { FC, useState, ReactNode } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Chip,
  Select,
  SelectItem,
  Input,
  Spinner,
  Tooltip,
} from "@heroui/react";
import { TransactionQueryArgs, Transaction } from "@/types/ApiResponse";
import { getTransactions } from "@/routes/api";
import useSWR from "swr";
import { Copy, Search } from "lucide-react";
import {
  getFormattedDate,
  getPageFromUrl,
  getQueryParamFromUrl,
  isSSR,
} from "@/helpers/getters";
import { debounce } from "lodash";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";

interface TransactionTableProps {
  initialTransactions?: Transaction[];
  initialTotal?: number;
  initialQuery: TransactionQueryArgs;
  per_page: number;
  tableTitle?: string;
}

const fetcher = async (params: {
  page: number | string;
  per_page: number | string;
  payment_status?: string;
  transaction_type?: string;
  search?: string;
}) => {
  // Map params to getTransactions API
  const apiParams = {
    payment_status: params.payment_status,
    page: params.page,
    per_page: params.per_page,
    type: params.transaction_type,
    search: params.search,
  };

  const response = await getTransactions(apiParams);
  return response;
};

const TransactionTable: FC<TransactionTableProps> = ({
  initialTransactions = [],
  initialTotal = 0,
  initialQuery,
  per_page = 10,
}) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(initialQuery?.page ?? getPageFromUrl());
  const [statusFilter, setStatusFilter] = useState(
    initialQuery?.payment_status || getQueryParamFromUrl("payment_status") || ""
  );
  const [transactionTypeFilter, setTransactionTypeFilter] = useState(
    initialQuery?.transaction_type ||
      getQueryParamFromUrl("transaction_type") ||
      ""
  );
  const [searchQuery, setSearchQuery] = useState(
    getQueryParamFromUrl("search") || ""
  );
  const router = useRouter();

  const { data, isLoading } = useSWR(
    [
      {
        page,
        per_page,
        payment_status: statusFilter,
        transaction_type: transactionTypeFilter,
        search: searchQuery,
      },
    ],
    ([params]) => fetcher(params),
    {
      fallbackData: {
        success: true,
        message: "",
        data: {
          data: initialTransactions,
          total: initialTotal,
          current_page: 1,
          per_page,
          last_page: Math.ceil(initialTotal / per_page),
          from: 1,
          to: Math.min(per_page, initialTotal),
          first_page_url: "",
          last_page_url: "",
          next_page_url: null,
          prev_page_url: null,
          path: "",
          links: [],
        },
      },
      revalidateOnFocus: false,
      revalidateOnMount: !isSSR(),
      keepPreviousData: true,
    }
  );

  const transactions = data?.data?.data || [];
  const total = data?.data?.total || 0;
  const totalPages = Math.ceil(total / per_page);

  const columns = [
    { key: "id", label: t("transaction_id") },
    { key: "transaction_id", label: t("payment_id") },
    { key: "order_id", label: t("order_id") },
    { key: "payment_method", label: t("payment_method") },
    { key: "payment_status", label: t("payment_status") },
    { key: "amount", label: t("amount") },
    { key: "currency", label: t("currency") },
    { key: "created_at", label: t("date") },
  ];

  const renderCell = (transaction: Transaction, columnKey: string) => {
    switch (columnKey) {
      case "transaction_id":
        return (
          <div className="flex items-center gap-2 text-xxs md:text-xs">
            <Tooltip
              content={
                <div className="text-xs max-w-xs wrap-break-word">
                  <div className="font-medium">{t("details")}</div>
                  <div className="mt-1">{transaction.message || "-"}</div>
                  {transaction.payment_details && (
                    <div className="mt-2 text-[11px] text-foreground/70">
                      {transaction.payment_details.method ||
                        transaction.payment_details.description}
                    </div>
                  )}
                </div>
              }
              showArrow
              classNames={{ content: "text-xs" }}
            >
              <span className="font-medium">
                {transaction.transaction_id || "-"}
              </span>
            </Tooltip>
            {transaction.transaction_id && (
              <button
                onClick={() =>
                  navigator.clipboard.writeText(
                    transaction.transaction_id || ""
                  )
                }
                title={t("copy_to_clipboard")}
                className="p-1 rounded cursor-pointer"
              >
                <Copy className="h-3 w-3" />
              </button>
            )}
          </div>
        );
      case "order_id":
        return (
          <div className="flex items-center gap-2 text-xxs md:text-xs">
            <span className="font-medium">{transaction.order_id || "-"}</span>
            {transaction.order_id && (
              <button
                onClick={() =>
                  navigator.clipboard.writeText(
                    transaction.order_id?.toString() || ""
                  )
                }
                title={t("copy_to_clipboard")}
                className="p-1 rounded cursor-pointer"
              >
                <Copy className="h-3 w-3" />
              </button>
            )}
          </div>
        );
      case "payment_status":
        return (
          <Chip
            color={
              transaction.payment_status === "completed"
                ? "success"
                : transaction.payment_status === "pending"
                  ? "warning"
                  : "danger"
            }
            variant="flat"
            size="sm"
            classNames={{ content: "text-xxs md:text-xs" }}
          >
            {t(transaction.payment_status)}
          </Chip>
        );
      case "payment_status":
        return (
          <Chip
            color={
              transaction.payment_status === "completed"
                ? "success"
                : transaction.payment_status === "pending"
                  ? "warning"
                  : "danger"
            }
            variant="flat"
            size="sm"
            classNames={{ content: "text-xxs md:text-xs" }}
          >
            {t(transaction.payment_status)}
          </Chip>
        );
      case "amount":
        return (
          <span className="text-xxs md:text-xs">
            {transaction.currency || ""}{" "}
            {parseFloat(transaction.amount).toFixed(2)}
          </span>
        );
      case "payment_method":
        return (
          <span className="text-xxs md:text-xs">
            {transaction.payment_method || "-"}
          </span>
        );
      case "created_at":
        return (
          <span className="text-xxs md:text-xs">
            {getFormattedDate(transaction.created_at)}
          </span>
        );
      case "message":
        return (
          <span className="text-xxs md:text-xs">
            {transaction.message || "-"}
          </span>
        );
      default:
        // Access dynamically; fall back to '-' when undefined
        return (
          (transaction as unknown as Record<string, unknown>)[
            columnKey as string
          ] ?? "-"
        );
    }
  };

  const statusOptions = [
    { value: "", label: t("all_statuses") },
    { value: "completed", label: t("completed") },
    { value: "pending", label: t("pending") },
    { value: "failed", label: t("failed") },
    { value: "refunded", label: t("refunded") },
    { value: "partially_refunded", label: t("partially_refunded") },
  ];

  const typeOptions = [
    { value: "", label: t("all_types") },
    { value: "deposit", label: t("deposit_title") },
    { value: "payment", label: t("payment") },
  ];

  const handleSearchDebounced = debounce((value: string) => {
    setSearchQuery(value);
    handlePageChange({ page: 1, search: value });
  }, 500);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleSearchDebounced(e.target.value);
  };

  const handlePageChange = (args: TransactionQueryArgs) => {
    setPage(args?.page || 1);
    const filteredArgs = Object.fromEntries(
      Object.entries({ ...router.query, ...args }).filter(
        ([, value]) => value !== 0 && value !== "" && value != null
      )
    );
    router.push({ pathname: router.pathname, query: filteredArgs }, undefined, {
      shallow: true,
    });
  };

  const topContent = (
    <div className="flex sm:justify-between w-full sm:items-center flex-col sm:flex-row items-start gap-4">
      <div className="gap-4 w-full flex justify-between">
        <Input
          classNames={{
            base: "max-w-xs min-h-8 h-8",
            inputWrapper: "text-xs min-h-8 h-8",
          }}
          size="sm"
          placeholder={t("search")}
          startContent={
            <Search
              className="text-base text-default-400 pointer-events-none shrink-0"
              size={16}
            />
          }
          type="search"
          onChange={handleSearchChange}
          defaultValue={searchQuery}
        />

        <Select
          aria-label={t("select_status")}
          placeholder={t("select_status")}
          selectedKeys={[statusFilter]}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            handlePageChange({ page: 1, payment_status: e.target.value });
          }}
          classNames={{
            base: "max-w-36",
            trigger: "text-xs min-h-8 h-8",
            value: "text-xs",
          }}
        >
          {statusOptions.map((option) => (
            <SelectItem
              classNames={{ title: "text-xs" }}
              key={option.value}
              textValue={option.label}
            >
              {option.label}
            </SelectItem>
          ))}
        </Select>
        <Select
          className="hidden"
          aria-label={t("select_type")}
          placeholder={t("select_type")}
          selectedKeys={[transactionTypeFilter]}
          onChange={(e) => {
            setTransactionTypeFilter(e.target.value);
            handlePageChange({ page: 1, transaction_type: e.target.value });
          }}
          classNames={{
            base: "max-w-28",
            trigger: "text-xs min-h-8 h-8",
            value: "text-xs",
          }}
        >
          {typeOptions.map((option) => (
            <SelectItem
              classNames={{ title: "text-xs" }}
              key={option.value}
              textValue={option.label}
            >
              {option.label}
            </SelectItem>
          ))}
        </Select>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <Table
        aria-label={t("wallet_transactions_table")}
        topContent={topContent}
        classNames={{
          th: "text-xs font-semibold",
          loadingWrapper: "mt-[12vh] sm:mt-[8vh]",
        }}
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.key}>{column.label}</TableColumn>
          )}
        </TableHeader>
        <TableBody
          items={transactions}
          loadingContent={<Spinner />}
          isLoading={isLoading}
          emptyContent={t("no_transactions_found")}
        >
          {(item: Transaction) => (
            <TableRow key={item.id}>
              {(columnKey: string | number | symbol) => (
                <TableCell>
                  {renderCell(item, String(columnKey)) as ReactNode}
                </TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <Pagination
            total={totalPages}
            page={page}
            onChange={(page) => handlePageChange({ page })}
            showControls
            isCompact
            size="sm"
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
  );
};

export default TransactionTable;
