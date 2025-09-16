"use client";

import type { UseFormReturn } from "react-hook-form";

export type InvoicePaymentStatus = "paid" | "pending" | "overdue";

const HISTORY_KEY = "invoiceHistory";
export const HISTORY_STORAGE_KEY = HISTORY_KEY;
const HISTORY_LIMIT = 10;
export const HISTORY_UPDATED_EVENT = "invoice-history-updated";

export type InvoiceSnapshotData = {
  yourDetails: YourDetails;
  companyDetails: CompanyDetails;
  paymentDetails: PaymentDetails;
  invoiceDetails: InvoiceItemDetails;
  invoiceTerms: InvoiceTerms;
};

export type InvoiceSnapshot = {
  id: string;
  title: string;
  total: number;
  createdAt: string;
  updatedAt: string;
  status: InvoicePaymentStatus;
  data: InvoiceSnapshotData;
};

type StoredSnapshot = InvoiceSnapshot & { signature: string };

type StoredSnapshotLike = Omit<StoredSnapshot, "status"> &
  Partial<Pick<StoredSnapshot, "status">>;

type FormValues = Record<string, unknown>;

const toDate = (value?: string | null): Date | null => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const deriveStatus = (
  data: InvoiceSnapshotData,
  status?: InvoicePaymentStatus
): InvoicePaymentStatus => {
  if (status === "paid") {
    return "paid";
  }

  const dueDate = toDate(data.invoiceTerms.dueDate ?? null);
  if (!dueDate) {
    return "pending";
  }

  const now = new Date();
  if (dueDate.getTime() < now.getTime()) {
    return "overdue";
  }

  return "pending";
};

const normaliseStoredSnapshot = (
  snapshot: StoredSnapshotLike
): StoredSnapshot => ({
  ...snapshot,
  status: deriveStatus(snapshot.data, snapshot.status),
});

const safeParse = (value: string | null): StoredSnapshot[] => {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value) as StoredSnapshotLike[];
    if (Array.isArray(parsed)) {
      return parsed.map(normaliseStoredSnapshot);
    }
    return [];
  } catch (error) {
    console.error("Unable to parse invoice history:", error);
    return [];
  }
};

const writeHistory = (history: StoredSnapshot[]) => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("Unable to persist invoice history:", error);
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(HISTORY_UPDATED_EVENT));
  }
};

const normaliseItems = (items?: Item[]): Item[] => {
  if (!items || items.length === 0) {
    return [
      {
        itemDescription: "",
      },
    ];
  }
  return items.map((item) => ({
    itemDescription: item.itemDescription ?? "",
    qty: item.qty ?? undefined,
    amount: item.amount ?? undefined,
  }));
};

const sanitiseSnapshot = (data: InvoiceSnapshotData): InvoiceSnapshotData => ({
  yourDetails: { ...data.yourDetails },
  companyDetails: { ...data.companyDetails },
  paymentDetails: { ...data.paymentDetails },
  invoiceDetails: {
    ...data.invoiceDetails,
    items: normaliseItems(data.invoiceDetails.items),
  },
  invoiceTerms: { ...data.invoiceTerms },
});

const signatureFor = (data: InvoiceSnapshotData): string =>
  JSON.stringify({
    ...data,
    invoiceDetails: {
      ...data.invoiceDetails,
      items: normaliseItems(data.invoiceDetails.items),
    },
  });

const resolveTitle = (data: InvoiceSnapshotData): string => {
  const company = data.companyDetails.companyName?.trim();
  if (company) {
    return company;
  }
  const clientEmail = data.companyDetails.email?.trim();
  if (clientEmail) {
    return clientEmail;
  }
  const owner = data.yourDetails.yourName?.trim();
  if (owner) {
    return owner;
  }
  return "Invoice";
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const calculateTotal = (items: Item[]): number =>
  items.reduce((sum, { amount, qty }) => {
    const price = toNumber(amount) ?? 0;
    const quantity = toNumber(qty);
    const count = quantity === null ? 1 : quantity;
    return sum + price * count;
  }, 0);

const enrichSnapshot = (
  data: InvoiceSnapshotData,
  signature: string
): StoredSnapshot => {
  const now = new Date().toISOString();
  const title = resolveTitle(data);
  const total = calculateTotal(data.invoiceDetails.items ?? []);

  return {
    id: Date.now().toString(),
    title,
    total,
    createdAt: now,
    updatedAt: now,
    status: deriveStatus(data),
    data,
    signature,
  };
};

const readHistory = (): StoredSnapshot[] =>
  safeParse(localStorage.getItem(HISTORY_KEY));

export const getInvoiceHistory = (): InvoiceSnapshot[] =>
  readHistory().map(({ signature: _signature, ...snapshot }) => snapshot);

export const getLatestInvoiceSnapshot = (): InvoiceSnapshot | null => {
  const [latest] = readHistory();
  if (!latest) {
    return null;
  }
  const { signature: _signature, ...rest } = latest;
  return rest;
};

export const saveInvoiceSnapshot = (rawData: InvoiceSnapshotData) => {
  const data = sanitiseSnapshot(rawData);
  const signature = signatureFor(data);
  const history = readHistory();
  const [head, ...tail] = history;

  if (head && head.signature === signature) {
    const updated: StoredSnapshot = {
      ...head,
      data,
      total: calculateTotal(data.invoiceDetails.items ?? []),
      title: resolveTitle(data),
      updatedAt: new Date().toISOString(),
      status: deriveStatus(data, head.status),
    };
    writeHistory([updated, ...tail]);
    return;
  }

  const snapshot = enrichSnapshot(data, signature);
  const nextHistory = [snapshot, ...history].slice(0, HISTORY_LIMIT);
  writeHistory(nextHistory);
};

const toStringValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
};

export const applySnapshotToForm = (
  snapshot: InvoiceSnapshot,
  form: UseFormReturn<FormValues>
) => {
  const { data } = snapshot;
  const { reset } = form;
  const items = normaliseItems(data.invoiceDetails.items);

  const values: FormValues = {
    yourEmail: toStringValue(data.yourDetails.yourEmail),
    yourName: toStringValue(data.yourDetails.yourName),
    yourAddress: toStringValue(data.yourDetails.yourAddress),
    yourCity: toStringValue(data.yourDetails.yourCity),
    yourState: toStringValue(data.yourDetails.yourState),
    yourCountry: toStringValue(data.yourDetails.yourCountry),
    yourLogo: toStringValue(data.yourDetails.yourLogo),
    yourTaxId: toStringValue(data.yourDetails.yourTaxId),
    yourZip: toStringValue(data.yourDetails.yourZip),
    email: toStringValue(data.companyDetails.email),
    companyName: toStringValue(data.companyDetails.companyName),
    companyAddress: toStringValue(data.companyDetails.companyAddress),
    companyCity: toStringValue(data.companyDetails.companyCity),
    companyState: toStringValue(data.companyDetails.companyState),
    companyCountry: toStringValue(data.companyDetails.companyCountry),
    companyLogo: toStringValue(data.companyDetails.companyLogo),
    companyTaxId: toStringValue(data.companyDetails.companyTaxId),
    companyZip: toStringValue(data.companyDetails.companyZip),
    note: toStringValue(data.invoiceDetails.note),
    discount: toStringValue(data.invoiceDetails.discount),
    tax: toStringValue(data.invoiceDetails.taxRate),
    currency: toStringValue(data.invoiceDetails.currency || "INR"),
    bankName: toStringValue(data.paymentDetails.bankName),
    accountNumber: toStringValue(data.paymentDetails.accountNumber),
    accountName: toStringValue(data.paymentDetails.accountName),
    routingCode: toStringValue(data.paymentDetails.routingCode),
    swiftCode: toStringValue(data.paymentDetails.swiftCode),
    ifscCode: toStringValue(data.paymentDetails.ifscCode),
    invoiceNo: toStringValue(data.invoiceTerms.invoiceNumber),
    issueDate: toStringValue(data.invoiceTerms.issueDate),
    dueDate: toStringValue(data.invoiceTerms.dueDate),
    items,
  };

  reset(values, { keepDefaultValues: false });

  Object.entries(values).forEach(([key, value]) => {
    if (key === "items") {
      localStorage.setItem("items", JSON.stringify(value));
      return;
    }
    localStorage.setItem(key, toStringValue(value));
  });
  localStorage.setItem("step", "6");
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"));
  }
};

export const setInvoiceStatus = (
  id: string,
  status: InvoicePaymentStatus
) => {
  const history = readHistory();
  const updated = history.map((snapshot) => {
    if (snapshot.id !== id) {
      return snapshot;
    }
    return {
      ...snapshot,
      status,
      updatedAt: new Date().toISOString(),
    };
  });
  writeHistory(updated);
};

