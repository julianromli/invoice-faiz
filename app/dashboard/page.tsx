"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInvoiceHistory } from "@/app/hooks/useInvoiceHistory";
import {
  buildRevenueCsv,
  computeMetrics,
  filterInvoices,
  getClientNames,
  inferCurrency,
  type RevenueFilters,
} from "@/lib/analytics";
import {
  type InvoicePaymentStatus,
  setInvoiceStatus,
} from "@/lib/history";

const statusOptions: InvoicePaymentStatus[] = ["pending", "overdue", "paid"];

const formatStatus = (status: InvoicePaymentStatus) => {
  switch (status) {
    case "paid":
      return "Paid";
    case "overdue":
      return "Overdue";
    default:
      return "Pending";
  }
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(parsed);
};

const DashboardPage = () => {
  const { history, refresh } = useInvoiceHistory();
  const [filters, setFilters] = useState<RevenueFilters>({
    client: "all",
    status: "all",
  });

  const clientOptions = useMemo(() => getClientNames(history), [history]);

  useEffect(() => {
    if (
      filters.client !== "all" &&
      !clientOptions.includes(filters.client)
    ) {
      setFilters((current) => ({ ...current, client: "all" }));
    }
  }, [clientOptions, filters.client]);

  const filteredInvoices = useMemo(
    () => filterInvoices(history, filters),
    [history, filters]
  );

  const metrics = useMemo(() => computeMetrics(filteredInvoices), [filteredInvoices]);

  const displayCurrency = useMemo(
    () => inferCurrency(filteredInvoices.length ? filteredInvoices : history),
    [filteredInvoices, history]
  );

  const currencyFormatter = useMemo(() => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: displayCurrency || "INR",
        maximumFractionDigits: 2,
      });
    } catch (error) {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      });
    }
  }, [displayCurrency]);

  const formatAmount = (value: number) => currencyFormatter.format(value);

  const handleExport = () => {
    const csv = buildRevenueCsv(filteredInvoices);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "revenue-analytics.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleStatusUpdate = (id: string, status: InvoicePaymentStatus) => {
    setInvoiceStatus(id, status);
    refresh();
  };

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-neutral-900">
              Revenue Analytics
            </h1>
            <p className="text-sm text-neutral-600">
              Review invoice performance, filter by client or period, and export
              filtered results for quick reporting.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => refresh()}
              className="flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              onClick={handleExport}
              disabled={filteredInvoices.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </header>

        <section className="grid gap-3 rounded-xl border border-dashed border-neutral-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Total Revenue
            </p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">
              {formatAmount(metrics.totalRevenue)}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Outstanding
            </p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">
              {formatAmount(metrics.outstanding)}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Overdue
            </p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">
              {formatAmount(metrics.overdue)}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Paid
            </p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">
              {formatAmount(metrics.paid)}
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-dashed border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Filters</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-neutral-700">
                Client
              </label>
              <Select
                value={filters.client}
                onValueChange={(value) =>
                  setFilters((current) => ({ ...current, client: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All clients</SelectItem>
                  {clientOptions.map((client) => (
                    <SelectItem key={client} value={client}>
                      {client}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-neutral-700">
                Payment status
              </label>
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    status: value as RevenueFilters["status"],
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {formatStatus(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-neutral-700">
                Start date
              </label>
              <input
                type="date"
                value={filters.startDate ?? ""}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    startDate: event.target.value || undefined,
                  }))
                }
                className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-neutral-400 focus:outline-none focus:ring-0"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-neutral-700">
                End date
              </label>
              <input
                type="date"
                value={filters.endDate ?? ""}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    endDate: event.target.value || undefined,
                  }))
                }
                className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-neutral-400 focus:outline-none focus:ring-0"
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-dashed border-neutral-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900">
              Invoice breakdown
            </h2>
            <p className="text-xs text-neutral-500">
              {filteredInvoices.length} invoice
              {filteredInvoices.length === 1 ? "" : "s"} selected
            </p>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-neutral-600">
                    Invoice
                  </th>
                  <th className="px-4 py-3 font-medium text-neutral-600">
                    Client
                  </th>
                  <th className="px-4 py-3 font-medium text-neutral-600">
                    Total
                  </th>
                  <th className="px-4 py-3 font-medium text-neutral-600">
                    Status
                  </th>
                  <th className="px-4 py-3 font-medium text-neutral-600">
                    Issue
                  </th>
                  <th className="px-4 py-3 font-medium text-neutral-600">
                    Due
                  </th>
                  <th className="px-4 py-3 font-medium text-neutral-600">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-neutral-500"
                    >
                      No invoices meet the selected filters yet.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-neutral-50/75">
                      <td className="px-4 py-3 text-neutral-800">
                        <div className="font-medium">{invoice.title}</div>
                        <div className="text-xs text-neutral-500">
                          #{invoice.id}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-800">
                        {invoice.data.companyDetails.companyName || "-"}
                      </td>
                      <td className="px-4 py-3 text-neutral-800">
                        {formatAmount(invoice.total)}
                      </td>
                      <td className="px-4 py-3 text-neutral-800">
                        <Select
                          value={invoice.status}
                          onValueChange={(value) =>
                            handleStatusUpdate(
                              invoice.id,
                              value as InvoicePaymentStatus
                            )
                          }
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((status) => (
                              <SelectItem key={status} value={status}>
                                {formatStatus(status)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 text-neutral-800">
                        {formatDate(invoice.data.invoiceTerms.issueDate)}
                      </td>
                      <td className="px-4 py-3 text-neutral-800">
                        {formatDate(invoice.data.invoiceTerms.dueDate)}
                      </td>
                      <td className="px-4 py-3 text-neutral-800">
                        {formatDate(invoice.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
};

export default DashboardPage;
