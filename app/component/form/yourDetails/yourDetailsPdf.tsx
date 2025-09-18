/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import { Image, Text, View, pdf } from "@react-pdf/renderer";
import { pdfContainers, pdfTypography } from "@/lib/pdfStyles";

export const YourDetailsPDF: React.FC<YourDetails> = ({
  yourEmail,
  yourName,
  yourAddress,
  yourCity,
  yourState,
  yourCountry,
  yourLogo,
  yourTaxId,
  yourZip,
}) => {
  // Ensure safe values for all props
  const safeYourEmail = yourEmail || "";
  const safeYourName = yourName || "";
  const safeYourAddress = yourAddress || "";
  const safeYourCity = yourCity || "";
  const safeYourState = yourState || "";
  const safeYourCountry = yourCountry || "";
  const safeYourLogo = yourLogo || "";
  const safeYourTaxId = yourTaxId || "";
  const safeYourZip = yourZip || "";
  
  return (
  <View style={pdfContainers.YourDetails}>
    <Text style={{ ...pdfTypography.title, marginBottom: 14 }}>From</Text>

    <View style={pdfContainers.imageContainer}>
      {safeYourLogo && (
        <Image style={{ height: 40, borderRadius: 6 }} src={safeYourLogo} />
      )}
    </View>
    {safeYourName && <Text style={pdfTypography.text2xl}>{safeYourName}</Text>}
    {safeYourEmail && (
      <Text style={{ ...pdfTypography.description, marginBottom: 12 }}>
        {safeYourEmail}
      </Text>
    )}
    <View style={pdfTypography.description}>
      {safeYourAddress && <Text>{safeYourAddress}</Text>}
      {(safeYourCity || safeYourState || safeYourZip) && (
        <Text style={{ marginBottom: 2 }}>
          {safeYourCity}, {safeYourState} {safeYourZip}
        </Text>
      )}
      {safeYourCountry && <Text style={{ marginBottom: 4 }}>{safeYourCountry}</Text>}
      {safeYourTaxId && <Text>Tax ID: {safeYourTaxId}</Text>}
    </View>
  </View>
);
};
