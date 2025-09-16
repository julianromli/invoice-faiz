import {
  type InvoicePaymentStatus,
  type InvoiceSnapshot,
} from "./history";

export type RevenueFilters = {
  client: string;
  status: InvoicePaymentStatus | "all";
  startDate?: string;
  endDate?: string;
};

export type RevenueMetrics = {
  totalRevenue: number;
  outstanding: number;
  overdue: number;
  paid: number;
};

const parseDate = (value?: string | null): Date | null => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const withinRange = (
  invoice: InvoiceSnapshot,
  start?: string,
  end?: string
): boolean => {
  const fallback =
    invoice.data.invoiceTerms.issueDate ?? invoice.data.invoiceTerms.dueDate;
  const createdDate =
    parseDate(invoice.createdAt) ?? parseDate(fallback) ?? null;
  if (!createdDate) {
    return !(start || end);
  }

  const startDate = parseDate(start) ?? null;
  const endDate = parseDate(end) ?? null;

  if (startDate && createdDate.getTime() < startDate.getTime()) {
    return false;
  }

  if (endDate && createdDate.getTime() > endDate.getTime()) {
    return false;
  }

  return true;
};

const clientNameFor = (invoice: InvoiceSnapshot): string =>
  invoice.data.companyDetails.companyName?.trim() || "Unknown client";

export const filterInvoices = (
  invoices: InvoiceSnapshot[],
  filters: RevenueFilters
): InvoiceSnapshot[] =>
  invoices.filter((invoice) => {
    const matchesClient =
      filters.client === "all" || clientNameFor(invoice) === filters.client;
    const matchesStatus =
      filters.status === "all" || invoice.status === filters.status;
    const matchesDate = withinRange(
      invoice,
      filters.startDate,
      filters.endDate
    );

    return matchesClient && matchesStatus && matchesDate;
  });

export const computeMetrics = (
  invoices: InvoiceSnapshot[]
): RevenueMetrics =>
  invoices.reduce<RevenueMetrics>(
    (metrics, invoice) => {
      const value = invoice.total;

      metrics.totalRevenue += value;
      if (invoice.status === "paid") {
        metrics.paid += value;
      } else {
        metrics.outstanding += value;
        if (invoice.status === "overdue") {
          metrics.overdue += value;
        }
      }

      return metrics;
    },
    { totalRevenue: 0, outstanding: 0, overdue: 0, paid: 0 }
  );

export const getClientNames = (invoices: InvoiceSnapshot[]): string[] => {
  const unique = new Set<string>();
  invoices.forEach((invoice) => {
    unique.add(clientNameFor(invoice));
  });
  return Array.from(unique.values()).sort((a, b) => a.localeCompare(b));
};

export const inferCurrency = (
  invoices: InvoiceSnapshot[],
  fallback = "INR"
): string => {
  for (const invoice of invoices) {
    const currency = invoice.data.invoiceDetails.currency;
    if (currency) {
      return currency;
    }
  }
  return fallback;
};

const escapeCsvValue = (value: string) => {
  if (value.includes(",") || value.includes("\"")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export const buildRevenueCsv = (invoices: InvoiceSnapshot[]): string => {
  const headers = [
    "Invoice",
    "Client",
    "Total",
    "Status",
    "Currency",
    "Issue Date",
    "Due Date",
    "Created At",
    "Updated At",
  ];

  const rows = invoices.map((invoice) => {
    const details = invoice.data.invoiceDetails;
    const terms = invoice.data.invoiceTerms;

    return [
      invoice.title,
      clientNameFor(invoice),
      invoice.total.toString(),
      invoice.status,
      details.currency ?? "INR",
      terms.issueDate ?? "",
      terms.dueDate ?? "",
      invoice.createdAt,
      invoice.updatedAt,
    ];
  });

  return [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n");
};
