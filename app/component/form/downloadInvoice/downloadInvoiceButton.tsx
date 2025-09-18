"use client";

import { Button } from "@/components/ui/button";
import { Document, Font, Page, pdf } from "@react-pdf/renderer";
import {
  CheckCircle2,
  ClipboardCopy,
  Download,
  LoaderIcon,
} from "lucide-react";
import { PdfDetails } from "../pdfDetails";
import { useData } from "@/app/hooks/useData";
import { pdfContainers } from "@/lib/pdfStyles";
import { saveAs } from "file-saver";
import { saveInvoiceSnapshot } from "@/lib/history";
import { svgToDataUri } from "@/lib/svgToDataUri";
import { useEffect, useState } from "react";
import { currencyList } from "@/lib/currency";
import { toCanvas } from "html-to-image";
import * as UTIF from "utif";

type DownloadStatus = "downloaded" | "downloading" | "not-downloaded";
type CopyStatus = "idle" | "copying" | "copied" | "copiedFallback" | "error";

const COPY_RESET_DELAY = 1500;

export const DownloadInvoiceButton = () => {
  const [status, setStatus] = useState<DownloadStatus>("not-downloaded");
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const {
    companyDetails,
    invoiceDetails,
    invoiceTerms,
    paymentDetails,
    yourDetails,
  } = useData();

  useEffect(() => {
    if (status === "downloaded") {
      const timer = setTimeout(() => {
        setStatus("not-downloaded");
      }, 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [status]);

  useEffect(() => {
    if (
      copyStatus === "copied" ||
      copyStatus === "copiedFallback" ||
      copyStatus === "error"
    ) {
      const timer = setTimeout(() => {
        setCopyStatus("idle");
      }, COPY_RESET_DELAY);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [copyStatus]);

  const generatePdfBlob = async () => {
    // Validate and provide default values for all required props
    const safeInvoiceDetails = {
      note: invoiceDetails?.note || "",
      discount: invoiceDetails?.discount || "",
      taxRate: invoiceDetails?.taxRate || "",
      items: Array.isArray(invoiceDetails?.items) ? invoiceDetails.items : [],
      currency: invoiceDetails?.currency || "INR",
    };

    const safeCompanyDetails = {
      email: companyDetails?.email || "",
      companyName: companyDetails?.companyName || "",
      companyAddress: companyDetails?.companyAddress || "",
      companyCity: companyDetails?.companyCity || "",
      companyState: companyDetails?.companyState || "",
      companyCountry: companyDetails?.companyCountry || "",
      companyLogo: companyDetails?.companyLogo || "",
      companyTaxId: companyDetails?.companyTaxId || "",
      companyZip: companyDetails?.companyZip || "",
    };

    const safeYourDetails = {
      yourEmail: yourDetails?.yourEmail || "",
      yourName: yourDetails?.yourName || "",
      yourAddress: yourDetails?.yourAddress || "",
      yourCity: yourDetails?.yourCity || "",
      yourState: yourDetails?.yourState || "",
      yourCountry: yourDetails?.yourCountry || "",
      yourLogo: yourDetails?.yourLogo || "",
      yourTaxId: yourDetails?.yourTaxId || "",
      yourZip: yourDetails?.yourZip || "",
    };

    const safePaymentDetails = {
      bankName: paymentDetails?.bankName || "",
      accountNumber: paymentDetails?.accountNumber || "",
      accountName: paymentDetails?.accountName || "",
      routingCode: paymentDetails?.routingCode || "",
      swiftCode: paymentDetails?.swiftCode || "",
      ifscCode: paymentDetails?.ifscCode || "",
      currency: paymentDetails?.currency || safeInvoiceDetails.currency,
    };

    const safeInvoiceTerms = {
      invoiceNumber: invoiceTerms?.invoiceNumber || "",
      issueDate: invoiceTerms?.issueDate || "",
      dueDate: invoiceTerms?.dueDate || "",
    };

    const currencyDetails = currencyList.find(
      (currencyDetail) =>
        currencyDetail.value.toLowerCase() ===
        safeInvoiceDetails.currency.toLowerCase()
    )?.details;

    const defaultCurrency = currencyList.find(
      (currencyDetail) => currencyDetail.value.toLowerCase() === "inr"
    )?.details;

    const iconName =
      currencyDetails?.iconName || defaultCurrency?.iconName || "inr";

    const data = await fetch(`/flag/1x1/${iconName}.svg`);
    const svgFlag = await data.text();
    const countryImageUrl = await svgToDataUri(svgFlag);
    if (!countryImageUrl) {
      throw new Error("Unable to derive country flag");
    }

    return pdf(
      <Document>
        <Page size="A4" style={pdfContainers.page}>
          <PdfDetails
            companyDetails={safeCompanyDetails}
            invoiceDetails={safeInvoiceDetails}
            invoiceTerms={safeInvoiceTerms}
            paymentDetails={safePaymentDetails}
            yourDetails={safeYourDetails}
            countryImageUrl={countryImageUrl}
          />
        </Page>
      </Document>
    ).toBlob();
  };

  const handleDownload = async () => {
    try {
      setStatus("downloading");
      const blob = await generatePdfBlob();
      saveAs(blob, "invoice.pdf");
      saveInvoiceSnapshot({
        companyDetails,
        invoiceDetails,
        invoiceTerms,
        paymentDetails,
        yourDetails,
      });
      setStatus("downloaded");
    } catch (error) {
      console.error(error);
      setStatus("not-downloaded");
    }
  };

  const clipboardSupports = (type: string): boolean => {
    if (typeof window === "undefined") {
      return false;
    }

    const item = (window as unknown as {
      ClipboardItem?: typeof ClipboardItem & {
        supports?: (value: string) => boolean;
      };
    }).ClipboardItem;

    if (!item || typeof item.supports !== "function") {
      return false;
    }

    try {
      return item.supports(type);
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const canvasToPng = (canvas: HTMLCanvasElement): Promise<Blob> =>
    new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Unable to encode PNG"));
            return;
          }
          resolve(blob);
        },
        "image/png"
      );
    });

  const handleCopy = async () => {
    if (!navigator?.clipboard?.write || typeof ClipboardItem === "undefined") {
      setCopyStatus("error");
      return;
    }

    const previewNode = document.querySelector(
      "[data-invoice-preview=\"interactive\"]"
    ) as HTMLElement | null;

    if (!previewNode) {
      setCopyStatus("error");
      return;
    }

    try {
      setCopyStatus("copying");
      const canvas = await toCanvas(previewNode, {
        cacheBust: true,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        width: previewNode.scrollWidth,
        height: previewNode.scrollHeight,
      });

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Unable to acquire rendering context");
      }

      const imageData = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );

      const clipboardData: Record<string, Blob> = {};
      const supportsTiff = clipboardSupports("image/tiff");

      if (supportsTiff) {
        const rgba = new Uint8Array(imageData.data.buffer.slice(0));
        const encoded = UTIF.encodeImage(
          rgba,
          imageData.width,
          imageData.height,
          4
        );
        clipboardData["image/tiff"] = new Blob([encoded], {
          type: "image/tiff",
        });
      }

      const pngBlob = await canvasToPng(canvas);
      clipboardData["image/png"] = pngBlob;

      await navigator.clipboard.write([new ClipboardItem(clipboardData)]);

      saveInvoiceSnapshot({
        companyDetails,
        invoiceDetails,
        invoiceTerms,
        paymentDetails,
        yourDetails,
      });

      setCopyStatus(supportsTiff ? "copied" : "copiedFallback");
    } catch (error) {
      console.error(error);
      setCopyStatus("error");
    }
  };

  return (
    <div className="flex h-[calc(100vh-208px)] justify-center items-center">
      <div>
        <h1 className="text-5xl font-semibold pb-6">Your invoice is ready</h1>
        <p className="text-neutral-500 text-xl pb-7">
          Please review the details carefully before downloading your invoice.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            disabled={status === "downloading"}
            onClick={handleDownload}
            type="button"
            className="w-full h-12 rounded-lg text-lg"
          >
            {status === "not-downloaded" && (
              <>
                <Download className="mr-2 h-6 w-6" /> Download Invoice
              </>
            )}
            {status === "downloading" && (
              <>
                <LoaderIcon className="mr-2 h-6 w-6 animate-spin" /> Downloading...
              </>
            )}
            {status === "downloaded" && (
              <>
                <CheckCircle2 className="mr-2 h-6 w-6" /> Downloaded
              </>
            )}
          </Button>
          <Button
            variant="outline"
            disabled={copyStatus === "copying"}
            onClick={handleCopy}
            type="button"
            className="w-full h-12 rounded-lg text-lg"
          >
            {copyStatus === "idle" && (
              <>
                <ClipboardCopy className="mr-2 h-6 w-6" /> Copy to Clipboard
              </>
            )}
            {copyStatus === "copying" && (
              <>
                <LoaderIcon className="mr-2 h-6 w-6 animate-spin" /> Copying...
              </>
            )}
            {copyStatus === "copied" && (
              <>
                <CheckCircle2 className="mr-2 h-6 w-6" /> Copied
              </>
            )}
            {copyStatus === "copiedFallback" && (
              <>
                <CheckCircle2 className="mr-2 h-6 w-6" /> Copied (PNG)
              </>
            )}
            {copyStatus === "error" && (
              <>
                <ClipboardCopy className="mr-2 h-6 w-6" /> Retry Copy
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

Font.register({
  family: "Geist",
  fonts: [
    {
      src: "/font/Geist-Thin.ttf",
      fontWeight: "thin",
    },
    {
      src: "/font/Geist-Ultralight.ttf",
      fontWeight: "ultralight",
    },
    {
      src: "/font/Geist-Light.ttf",
      fontWeight: "light",
    },
    {
      src: "/font/Geist-Regular.ttf",
      fontWeight: "normal",
    },
    {
      src: "/font/Geist-Medium.ttf",
      fontWeight: "medium",
    },
    {
      src: "/font/Geist-SemiBold.ttf",
      fontWeight: "semibold",
    },
    {
      src: "/font/Geist-Bold.ttf",
      fontWeight: "bold",
    },
    {
      src: "/font/Geist-UltraBlack.ttf",
      fontWeight: "ultrabold",
    },
  ],
});

