import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { currencyList } from "@/lib/currency";
import { pdfTypography, pdfUtils } from "@/lib/pdfStyles";

export const InvoiceDetailsPdf: React.FC<InvoiceItemDetails> = ({
  note,
  discount,
  taxRate,
  items,
  currency = "INR",
}) => {
  // Ensure safe values for all calculations
  const safeNote = note || "";
  const safeDiscount = discount || "0";
  const safeTaxRate = taxRate || "0";
  const safeItems = Array.isArray(items) ? items : [];
  const safeCurrency = currency || "INR";
  
  const currencyType = safeCurrency;
  const currencyDetails = currencyList.find(
    (currency) => currency.value.toLowerCase() === currencyType.toLowerCase()
  )?.details;
  const subtotal = calculateTotalAmount(safeItems);
  const discountAmount = subtotal - (safeDiscount ? +safeDiscount : 0);
  const taxAmount = discountAmount * ((safeTaxRate ? +safeTaxRate : 0) / 100);
  const totalAmount = discountAmount + taxAmount;

  return (
    <View>
      <View style={pdfUtils.flexRowItemCenter}>
        <View style={{ flex: 1, paddingHorizontal: 40, paddingVertical: 16 }}>
          <Text style={pdfTypography.title}>Description</Text>
        </View>
        <View
          style={{
            flex: 1,
            ...pdfUtils.flexRowItemCenter,
            paddingHorizontal: 40,
            paddingVertical: 16,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={pdfTypography.title}>QTY</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={pdfTypography.title}>Price</Text>
          </View>
          <View style={{ flex: 1, textAlign: "right" }}>
            <Text style={pdfTypography.title}>Amount</Text>
          </View>
        </View>
      </View>
      {safeItems.map(({ itemDescription, amount, qty }, index) => {
        const containerStyle = {
          marginHorizontal: 40,
          paddingVertical: 14,
          ...pdfUtils.borderBottom,
          ...pdfUtils.flexRowItemCenter,
        };
        const borderStyle = index === 0 ? pdfUtils.borderTop : {};

        return (
          <View
            key={index}
            style={{
              ...containerStyle,
              ...borderStyle,
            }}
          >
            <Text style={{ flex: 1, ...pdfTypography.itemDescription }}>
              {itemDescription}
            </Text>
            <View
              style={{
                flex: 1,
                ...pdfUtils.flexRowItemCenter,
                paddingLeft: 80,
              }}
            >
              <Text style={{ flex: 1, ...pdfTypography.itemDescription }}>
                {qty ? qty : "-"}
              </Text>
              <Text style={{ flex: 1, ...pdfTypography.itemDescription }}>
                {amount ? addCommasToNumber(amount) : ""}
              </Text>
              <Text
                style={{
                  flex: 1,
                  ...pdfTypography.itemDescription,
                  textAlign: "right",
                }}
              >
                {currencyDetails?.currencySymbol}
                {amount ? addCommasToNumber((qty ? qty : 1) * amount) : ""}
              </Text>
            </View>
          </View>
        );
      })}
      <View style={pdfUtils.flexRowItemCenter}>
        <View style={{ flex: 1, paddingTop: 24 }}>
          {safeNote && (
            <View style={{ paddingHorizontal: 40 }}>
              <Text style={pdfTypography.title}>Note</Text>
              <Text style={pdfTypography.itemDescription}>{safeNote}</Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View
            style={{
              marginHorizontal: 40,
              paddingVertical: 14,
              ...pdfUtils.flexRowItemCenter,
              ...pdfUtils.borderBottom,
            }}
          >
            <Text style={{ ...pdfTypography.itemDescription, flex: 1 }}>
              Subtotal
            </Text>
            <Text
              style={{
                ...pdfTypography.itemDescription,
                flex: 1,
                textAlign: "right",
              }}
            >
              {currencyDetails?.currencySymbol}
              {addCommasToNumber(subtotal)}
            </Text>
          </View>
          {safeDiscount && safeDiscount !== "0" && (
            <View
              style={{
                marginHorizontal: 40,
                paddingVertical: 14,
                ...pdfUtils.flexRowItemCenter,
                ...pdfUtils.borderBottom,
              }}
            >
              <Text style={{ ...pdfTypography.itemDescription, flex: 1 }}>
                Discount
              </Text>
              <Text
                style={{
                  ...pdfTypography.itemDescription,
                  flex: 1,
                  textAlign: "right",
                }}
              >
                {currencyDetails?.currencySymbol}
                {safeDiscount ? addCommasToNumber(+safeDiscount) : ""}
              </Text>
            </View>
          )}
          {safeTaxRate && safeTaxRate !== "0" && (
            <View
              style={{
                marginHorizontal: 40,
                paddingVertical: 14,
                ...pdfUtils.flexRowItemCenter,
                ...pdfUtils.borderBottom,
              }}
            >
              <Text style={{ ...pdfTypography.itemDescription, flex: 1 }}>
                Tax ({safeTaxRate})%
              </Text>
              <Text
                style={{
                  ...pdfTypography.itemDescription,
                  flex: 1,
                  textAlign: "right",
                }}
              >
                {currencyDetails?.currencySymbol}
                {addCommasToNumber(+taxAmount.toFixed(2))}
              </Text>
            </View>
          )}
          <View
            style={{
              marginHorizontal: 40,
              paddingVertical: 14,
              ...pdfUtils.flexRowItemCenter,
            }}
          >
            <Text style={{ ...pdfTypography.itemDescription, flex: 1 }}>
              Amount
            </Text>
            <Text
              style={{ ...pdfTypography.amount, textAlign: "right", flex: 1 }}
            >
              {currencyDetails?.currencySymbol}
              {addCommasToNumber(totalAmount)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const calculateTotalAmount = (items: Item[]): number => {
  if (!Array.isArray(items) || items.length === 0) {
    return 0;
  }
  
  return items.reduce((total, item) => {
    if (!item || typeof item !== 'object') {
      return total;
    }
    
    const quantity = item.qty && !isNaN(+item.qty) ? +item.qty : 1;
    const amount = item.amount && !isNaN(+item.amount) ? +item.amount : 0;
    return total + quantity * amount;
  }, 0);
};

const addCommasToNumber = (number: number): string => {
  let numberString = number.toString();
  const parts = numberString.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
};
