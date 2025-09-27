// utils/generateInvoicePDF.ts
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logoImage1 from "../../public/images/sakshilogo2.png"; // Adjust path
import logoImage2 from "../../public/images/sakshilogo1.png"; // Adjust path

interface InvoiceFormData {
  orderNumber: string;
  companyName: string;
  remarks: string;
  ownerMobileNo: string;
  partyName: string;
  addressName: string;
  GSTNo: string;
  servicePerformance: string;
  quantity: number;
  unitPrice: number;
  total: number;
  finalAmount: number;
  color?: string;
  size?: string;
  pType?: string;
  applyGST: boolean;
  gstPercentage?: number;
  daysAfterConfirmation?: number;
}

export const generateInvoicePDF = (formData: InvoiceFormData) => {
  const doc = new jsPDF();

  // Define dynamic height constants
  const PAGE_WIDTH = 210; // A4 page width in mm
  const LOGO_Y = 10; // Y position for logos
  const LOGO_X_LEFT = 10; // X position for first logo (left)
  const LOGO_WIDTH = 30; // Width of logos
  const LOGO_HEIGHT = 30; // Height of logos
  const LOGO_WIDTH1 = 60; // Width of second logo
  const LOGO_HEIGHT1 = 25; // Height of second logo
  const HEADER_Y = LOGO_Y + LOGO_HEIGHT  + 10; // Y position for "PERFORMA INVOICE"
  const LINE_HEIGHT = 6; // Height of each line of text
  const INVOICE_DETAILS_Y = HEADER_Y + 12; // Y position for invoice details
  const ADDRESS_Y = INVOICE_DETAILS_Y + 6; // Y position for address
  const SPACING_BEFORE_TABLE = 5; // Extra spacing before the table

  const splitAddressIntoLines = (address: string, maxLength: number = 40): string[] => {
    if (!address) return [];
    const words = address.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    words.forEach((word) => {
      if (currentLine.length + word.length + 1 <= maxLength) {
        currentLine += (currentLine ? " " : "") + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  };

  const formatAmountInWords = (amount: number): string => {
    const words = [
      "Zero",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    if (amount === 0) return "Zero Only";

    const roundedAmount = Math.round(amount * 100) / 100;
    const integerPart = Math.floor(roundedAmount);
    const decimalPart = Math.round((roundedAmount - integerPart) * 100);

    const convertNumber = (num: number): string => {
      if (num === 0) return "";
      if (num < 20) return words[num];
      const tensPart = Math.floor(num / 10);
      const onesPart = num % 10;
      return `${words[20 + tensPart - 2]}${onesPart > 0 ? ` ${words[onesPart]}` : ""}`;
    };

    const lakhs = Math.floor(integerPart / 100000);
    const thousands = Math.floor((integerPart % 100000) / 1000);
    const hundreds = Math.floor((integerPart % 1000) / 100);
    const tensAndOnes = integerPart % 100;

    let result = [];

    if (lakhs > 0) result.push(`${convertNumber(lakhs)} Lakh`);
    if (thousands > 0) result.push(`${convertNumber(thousands)} Thousand`);
    if (hundreds > 0) result.push(`${words[hundreds]} Hundred`);
    if (tensAndOnes > 0) result.push(convertNumber(tensAndOnes));

    let integerWords = result.join(" ");
    if (!integerWords) integerWords = "Zero";

    let finalResult = integerWords;
    if (decimalPart > 0) {
      finalResult += ` and ${convertNumber(decimalPart)} Paise`;
    }

    return finalResult.trim() + " Only";
  };

  // Add Logos to PDF
  try {
    // First logo (left side)
    doc.addImage(logoImage1.src, "JPEG", LOGO_X_LEFT, LOGO_Y , LOGO_WIDTH, LOGO_HEIGHT, undefined,
      "FAST");
    // Second logo (centered)
    const LOGO_X_CENTER = (PAGE_WIDTH - LOGO_WIDTH - 35) / 2;
    doc.addImage(logoImage2.src, "JPEG", LOGO_X_CENTER, LOGO_Y, LOGO_WIDTH1, LOGO_HEIGHT1, undefined,
      "FAST");
  } catch (error) {
    console.error("Error loading logos:", error);
  }

  // Header Section
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(`${formData.quotation ? "QUOTATION" : "PERFORMA INVOICE"}`, PAGE_WIDTH / 2, HEADER_Y, { align: "center" });
  doc.setLineWidth(0.5);
  doc.line(10, HEADER_Y + 2, 200, HEADER_Y + 2);

  // Add company details on the right side
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("M : 93750 47330", 200, 10, { align: "right" });

  doc.setFont("helvetica", "normal");
  const companyAddress = [
    "109-110, Shree Krishna Market,",
    "Nr. Rajhans Imperia, Ring Road,",
    "Surat - 395 002.",
    "Ph.: 0261-4017971",
    "sakshicreation3600@gmail.com",
  ];

  let companyAddressY = 20;
  companyAddress.forEach((line) => {
    doc.text(line, 200, companyAddressY, { align: "right" });
    companyAddressY += 5;
  });

  // Invoice Details (Left)
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`${formData.quotation ? "Quotation" : "Proforma Invoice"} No: ${formData.orderNumber || "N/A"}`, 20, INVOICE_DETAILS_Y);
  doc.text(`Invoice Date: ${new Date().toLocaleDateString("en-GB")}`, 20, INVOICE_DETAILS_Y + LINE_HEIGHT);
  doc.text(`Party Name: ${formData.partyName || "N/A"}`, 120, INVOICE_DETAILS_Y);

  // Address
  const addressLines = splitAddressIntoLines(formData.addressName || "N/A");
  doc.text(`Address: ${addressLines[0] || "N/A"}`, 120, ADDRESS_Y);
  for (let i = 1; i < addressLines.length; i++) {
    doc.text(addressLines[i], 135.5, ADDRESS_Y + i * LINE_HEIGHT);
  }

  // GST and Mobile
  const addressHeight = addressLines.length * LINE_HEIGHT;
  const gstY = ADDRESS_Y + addressHeight;
  doc.text(`GSTIN: ${formData.GSTNo || "N/A"}`, 120, gstY);
  const mobileY = gstY + LINE_HEIGHT;
  doc.text(`Mobile No: ${formData.ownerMobileNo || "N/A"}`, 120, mobileY);

  // Days After Confirmation
  const daysY = mobileY + LINE_HEIGHT;
  if (formData.daysAfterConfirmation !== undefined) {
    doc.text(`Delivery date - ${formData.daysAfterConfirmation} Days After Confirmation`, 120, daysY);
  }

  // Item Table
  const tableStartY = daysY + (formData.daysAfterConfirmation !== undefined ? LINE_HEIGHT : 0) + SPACING_BEFORE_TABLE;
  const tableColumn = [
    "Sr. No.",
    "Item Name",
    "Description",
    "Qty",
    "Unit Price",
    "Value",
  ];
  const tableRows = [
    [
      1,
      formData.servicePerformance || "N/A",
      formData.remarks || "N/A",
      formData.quantity || 0,
      formData.unitPrice ? Number(formData.unitPrice).toFixed(2) : "0.00",
      formData.total ? formData.total.toFixed(2) : "0.00",
    ],
  ];

  // Calculate GST values
  const gstPercentage = formData.applyGST ? formData.gstPercentage || 18 : 0;
  const gstAmount = formData.applyGST ? formData.total * (gstPercentage / 100) : 0;
  const subtotal = formData.total || 0;
  const totalAmount = formData.finalAmount || 0;

  const additionalRows = [
    [
      { content: "", colSpan: 4, styles: { fillColor: false } },
      "Subtotal",
      subtotal.toFixed(2),
    ],
    [
      { content: "", colSpan: 4, styles: { fillColor: false } },
      `GST (${gstPercentage}%)`,
      formData.applyGST ? gstAmount.toFixed(2) : "-",
    ],
    [
      {
        content: `Total Invoice Value (in Words): INR ${formatAmountInWords(totalAmount)}`,
        colSpan: 4,
        styles: { fillColor: [220, 220, 220], fontStyle: "bold" },
      },
      {
        content: "Total",
        styles: { fillColor: [220, 220, 220], fontStyle: "bold" },
      },
      {
        content: totalAmount.toFixed(2),
        styles: { fillColor: [220, 220, 220], fontStyle: "bold" },
      },
    ],
  ];

  autoTable(doc, {
    startY: tableStartY,
    head: [tableColumn],
    body: [...tableRows, ...additionalRows],
    theme: "grid",
    margin: { left: 10, right: 10 },
    styles: { fontSize: 9, halign: "center", cellPadding: 3 },
    headStyles: {
      fillColor: [22, 160, 133],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 45 },
      2: { cellWidth: 55 },
      3: { cellWidth: 15 },
      4: { cellWidth: 25 },
      5: { cellWidth: 35 },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Authorised By", 190, finalY + 40, { align: "right" });
  doc.setLineWidth(0.5);
  doc.line(165, finalY + 35, 190, finalY + 35);

  // Save PDF
  doc.save(
    `Proforma_Invoice_${formData.orderNumber || "N/A"}_${new Date().toISOString().split("T")[0]}.pdf`
  );
};
