/* eslint-disable jsx-a11y/alt-text */
"use client";
import React from "react";
import { Text, View, Image } from "@react-pdf/renderer";
import { pdfContainers, pdfTypography } from "@/lib/pdfStyles";

export const CompanyDetailsPdf: React.FC<CompanyDetails> = ({
  email,
  companyName,
  companyAddress,
  companyCity,
  companyState,
  companyCountry,
  companyLogo,
  companyTaxId,
  companyZip,
}) => {
  // Ensure safe values for all props
  const safeEmail = email || "";
  const safeCompanyName = companyName || "";
  const safeCompanyAddress = companyAddress || "";
  const safeCompanyCity = companyCity || "";
  const safeCompanyState = companyState || "";
  const safeCompanyCountry = companyCountry || "";
  const safeCompanyLogo = companyLogo || "";
  const safeCompanyTaxId = companyTaxId || "";
  const safeCompanyZip = companyZip || "";
  
  return (
  <View style={pdfContainers.CompanyDetails}>
    <Text style={{ ...pdfTypography.title, marginBottom: 14 }}>To</Text>
    <View style={pdfContainers.imageContainer}>
      {safeCompanyLogo && (
        <Image src={safeCompanyLogo} style={{ height: 40, borderRadius: 6 }} />
      )}
    </View>
    {safeCompanyName && (
      <Text style={{ ...pdfTypography.text2xl, flexWrap: "wrap" }}>
        {safeCompanyName}
      </Text>
    )}
    {safeEmail && (
      <Text style={{ ...pdfTypography.description, marginBottom: 12 }}>
        {safeEmail}
      </Text>
    )}
    <View style={pdfTypography.description}>
      {safeCompanyAddress && <Text>{safeCompanyAddress}</Text>}
      {(safeCompanyCity || safeCompanyState || safeCompanyZip) && (
        <Text style={{ marginBottom: 2 }}>
          {safeCompanyCity}, {safeCompanyState} {safeCompanyZip}
        </Text>
      )}
      {safeCompanyCountry && (
        <Text style={{ marginBottom: 4 }}>{safeCompanyCountry}</Text>
      )}
      {safeCompanyTaxId && <Text>Tax ID: {safeCompanyTaxId}</Text>}
    </View>
  </View>
);
};
