import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { format } from "date-fns";
import { pdfTypography, pdfContainers, pdfUtils } from "@/lib/pdfStyles";

export const InvoiceTermsPdf: React.FC<InvoiceTerms> = ({
  invoiceNumber,
  issueDate,
  dueDate,
}) => {
  // Ensure safe values for all props
  const safeInvoiceNumber = invoiceNumber || "";
  const safeIssueDate = issueDate || "";
  const safeDueDate = dueDate || "";
  
  return (
  <View style={pdfContainers.invoiceTerms}>
    <View style={{ flex: 1 }}>
      <Text style={pdfTypography.title}>Invoice NO</Text>
      <Text style={pdfTypography.subTitle}>{safeInvoiceNumber}</Text>
    </View>
    <View
      style={{
        ...pdfUtils.flexRowBetween,
        paddingRight: 20,
        paddingLeft: 100,
        flex: 1,
      }}
    >
      <View>
        <Text style={pdfTypography.title}>Issued</Text>
        <Text style={pdfTypography.subTitle}>
          {safeIssueDate ? format(new Date(safeIssueDate), "do MMM yyyy") : ""}
        </Text>
      </View>
      <View>
        <Text style={pdfTypography.title}>Due Date</Text>
        <Text style={pdfTypography.subTitle}>
          {safeDueDate ? format(new Date(safeDueDate), "do MMM yyyy") : ""}
        </Text>
      </View>
    </View>
  </View>
);
};
