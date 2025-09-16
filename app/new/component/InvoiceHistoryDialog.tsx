"use client";

import { useMemo, useState } from "react";
import { Clock3, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useInvoiceHistory,
  useInvoiceHistoryActions,
} from "@/app/hooks/useInvoiceHistory";
import type { InvoiceSnapshot } from "@/lib/history";

const formatDateTime = (value: string) => {
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
};

const formatAmount = (snapshot: InvoiceSnapshot) => {
  const currency = snapshot.data.invoiceDetails.currency || "INR";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(snapshot.total);
  } catch {
    return snapshot.total.toFixed(2) + " " + currency;
  }
};

const itemSummary = (snapshot: InvoiceSnapshot) => {
  const count = snapshot.data.invoiceDetails.items?.length ?? 0;
  const label = count === 1 ? "item" : "items";
  return count + " " + label;
};

const HistoryRow = ({
  snapshot,
  onSelect,
}: {
  snapshot: InvoiceSnapshot;
  onSelect: (snapshot: InvoiceSnapshot) => void;
}) => (
  <button
    type="button"
    onClick={() => onSelect(snapshot)}
    className="w-full rounded-lg border border-slate-200 p-4 text-left transition hover:border-orange-200 hover:bg-orange-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
  >
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-medium text-slate-900">{snapshot.title}</p>
        <p className="text-xs text-slate-500">
          Last updated {formatDateTime(snapshot.updatedAt)}
          <span aria-hidden="true"> &bull; </span>
          {itemSummary(snapshot)}
        </p>
      </div>
      <div className="text-right text-sm font-semibold text-slate-900">
        {formatAmount(snapshot)}
        <p className="text-xs font-normal text-slate-500">
          {snapshot.data.invoiceDetails.currency || "INR"}
        </p>
      </div>
    </div>
  </button>
);

export const InvoiceHistoryDialog = () => {
  const [open, setOpen] = useState(false);
  const { history, latest } = useInvoiceHistory();
  const { loadSnapshot } = useInvoiceHistoryActions();

  const handleSelect = (snapshot: InvoiceSnapshot) => {
    const shouldLoad = window.confirm(
      "Loading this invoice will replace the current form data. Continue?"
    );
    if (!shouldLoad) {
      return;
    }
    loadSnapshot(snapshot);
    setOpen(false);
  };

  const emptyState = useMemo(
    () => (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
        You have not saved any invoices yet. Generate an invoice to add it to your history.
      </div>
    ),
    []
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 px-3">
          <History className="mr-2 h-4 w-4" /> History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Invoice history</DialogTitle>
          <DialogDescription>
            Restore a previous invoice to keep iterating without re-entering data.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {history.length === 0 && emptyState}
          {history.length > 0 && (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {history.map((snapshot) => (
                <HistoryRow
                  key={snapshot.id}
                  snapshot={snapshot}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <div className="flex w-full items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              New invoices are stored automatically after download.
            </p>
            <Button
              variant="secondary"
              size="sm"
              disabled={!latest}
              onClick={() => latest && handleSelect(latest)}
            >
              <Clock3 className="mr-2 h-4 w-4" /> Load last invoice
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
