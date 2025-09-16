"use client";

import { useCallback, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  applySnapshotToForm,
  getInvoiceHistory,
  HISTORY_STORAGE_KEY,
  HISTORY_UPDATED_EVENT,
  InvoiceSnapshot,
} from "@/lib/history";

export const useInvoiceHistory = () => {
  const [history, setHistory] = useState<InvoiceSnapshot[]>([]);

  const refresh = useCallback(() => {
    try {
      setHistory(getInvoiceHistory());
    } catch (error) {
      console.error("Unable to read invoice history:", error);
    }
  }, []);

  useEffect(() => {
    refresh();

    const handleUpdate = () => refresh();
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === HISTORY_STORAGE_KEY) {
        refresh();
      }
    };

    window.addEventListener(HISTORY_UPDATED_EVENT, handleUpdate);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(HISTORY_UPDATED_EVENT, handleUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, [refresh]);

  const latest = history[0] ?? null;

  return {
    history,
    latest,
    refresh,
  };
};

export const useInvoiceHistoryActions = () => {
  const form = useFormContext();

  const loadSnapshot = useCallback(
    (snapshot: InvoiceSnapshot) => {
      applySnapshotToForm(snapshot, form);
    },
    [form]
  );

  const loadById = useCallback(
    (id: string) => {
      const snapshot = getInvoiceHistory().find((item) => item.id === id);
      if (snapshot) {
        applySnapshotToForm(snapshot, form);
      }
    },
    [form]
  );

  return {
    loadSnapshot,
    loadById,
  };
};
