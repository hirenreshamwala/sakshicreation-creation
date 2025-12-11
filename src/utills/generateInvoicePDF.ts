// utils/generateInvoicePDF.ts
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import letterpad from "../../public/images/letterpad.jpg";
import watermark from "../../public/images/watermark.png";

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
  paymentDate?: number;
  quotation?: boolean;
  description?: string;
}

export const generateInvoicePDF = async (formData: InvoiceFormData) => {
  console.log("DEBUG : generateInvoicePDF : formData:", formData);

  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Set helvetica font for clean modern look (similar to Roboto)
  const mainFont = "helvetica";
  const signatureFont = "times"; // For signature (italic)

  // Utility: compress image
  const compressImage = async (imgSrc: string, maxWidth = 600): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("No canvas context");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL("image/png");
        resolve(compressed);
      };
      img.onerror = reject;
      img.src = imgSrc;
    });
  };

  // === Step 1: Add colored top bars ===
  const topBlueHeight = 6;
  const topPinkHeight = 2;
  const topGap = 1.5;

  // Top bars
  doc.setFillColor("#4a6675");
  doc.rect(0, 0, pageWidth, topBlueHeight, "F");
  doc.setFillColor("#e22b88");
  doc.rect(0, topBlueHeight + topGap, pageWidth, topPinkHeight, "F");

  // === Step 2: Add Watermark ===
  const applyWatermark = async () => {
    const imgWidth = 140;
    const imgHeight = 140;
    const imgX = (pageWidth - imgWidth) / 2;
    const imgY = (pageHeight - imgHeight) / 2;

    try {
      const compressedLogo = await compressImage(watermark.src, 600);

      const gState = doc.GState ? new doc.GState({ opacity: 0.08 }) : null;
      if (gState) doc.setGState(gState);

      doc.addImage(compressedLogo, "JPEG", imgX, imgY, imgWidth, imgHeight, undefined, "FAST");

      if (gState) {
        const reset = new doc.GState({ opacity: 1 });
        doc.setGState(reset);
      }
    } catch (error) {
      console.error("Watermark error:", error);
    }
  };

  await applyWatermark();

  // === Step 3: Add Letterpad image ===
  const compressedLetterpad = await compressImage(letterpad.src, 800);

  const letterpadStartY = topBlueHeight + topGap + topPinkHeight;
  const letterpadHeight = 45;

  doc.addImage(letterpad.src, "PNG", 0, letterpadStartY, pageWidth, letterpadHeight, undefined, "FAST");

  // Header Text (Centered below letterpad)
  const HEADER_Y = letterpadStartY + letterpadHeight;
  // doc.setFont(mainFont, "bold");
  // doc.setFontSize(18);
  // doc.text(`${formData.quotation ? "QUOTATION" : "PROFORMA INVOICE"}`, pageWidth / 2, HEADER_Y, { align: "center" });
  // doc.setLineWidth(0.5);
  doc.line(10, HEADER_Y, 200, HEADER_Y);

  // Define constants
  const LINE_HEIGHT = 5;
  const INVOICE_DETAILS_Y = HEADER_Y + 12;
  const LEFT_SECTION_X = 15;
  const RIGHT_SECTION_X = 135; // More balanced spacing
  const MAX_WIDTH = 70; // Same width for both sections

  // Function to split text into multiple lines
  const splitTextIntoLines = (text: string, maxWidth: number): string[] => {
    if (!text || text.trim() === "") return [];

    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = doc.getStringUnitWidth(testLine) * doc.getFontSize() / doc.internal.scaleFactor;

      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  };

  const formatAmountInWords = (amount: number): string => {
    const words = [
      "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
      "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen", "Twenty",
      "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
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

  // === LEFT SECTION: Party Details ===
  let leftY = INVOICE_DETAILS_Y;
  const LABEL_WIDTH = 20;
  const SECTION_LINE_HEIGHT = 4; // Fixed line height for both sections
  const VERTICAL_GAP = 2; // Fixed vertical gap between fields

  // Party Name
  doc.setFont(mainFont, "bold");
  doc.setFontSize(9);
  doc.text("Party Name:", LEFT_SECTION_X, leftY);
  doc.setFont(mainFont, "normal");
  const partyNameLines = splitTextIntoLines(formData.partyName || "N/A", MAX_WIDTH);
  partyNameLines.forEach((line, index) => {
    doc.text(line, LEFT_SECTION_X + LABEL_WIDTH, leftY + (index * SECTION_LINE_HEIGHT));
  });
  leftY += Math.max(partyNameLines.length * SECTION_LINE_HEIGHT, SECTION_LINE_HEIGHT) + VERTICAL_GAP;

  // Address
  doc.setFont(mainFont, "bold");
  doc.text("Address:", LEFT_SECTION_X, leftY);
  doc.setFont(mainFont, "normal");
  const addressLines = splitTextIntoLines(formData.addressName || "N/A", MAX_WIDTH);
  addressLines.forEach((line, index) => {
    doc.text(line, LEFT_SECTION_X + LABEL_WIDTH, leftY + (index * SECTION_LINE_HEIGHT));
  });
  leftY += Math.max(addressLines.length * SECTION_LINE_HEIGHT, SECTION_LINE_HEIGHT) + VERTICAL_GAP;

  // Mobile No
  doc.setFont(mainFont, "bold");
  doc.text("Mobile No:", LEFT_SECTION_X, leftY);
  doc.setFont(mainFont, "normal");
  doc.text(formData.ownerMobileNo || "N/A", LEFT_SECTION_X + LABEL_WIDTH, leftY);
  leftY += SECTION_LINE_HEIGHT + VERTICAL_GAP;

  // GST (if exists)
  if (formData.GSTNo && formData.GSTNo.trim() !== "") {
    doc.setFont(mainFont, "bold");
    doc.text("GSTIN:", LEFT_SECTION_X, leftY);
    doc.setFont(mainFont, "normal");
    const gstLines = splitTextIntoLines(formData.GSTNo, MAX_WIDTH);
    gstLines.forEach((line, index) => {
      doc.text(line, LEFT_SECTION_X + LABEL_WIDTH, leftY + (index * SECTION_LINE_HEIGHT));
    });
    leftY += Math.max(gstLines.length * SECTION_LINE_HEIGHT, SECTION_LINE_HEIGHT) + VERTICAL_GAP;
  }

  // === RIGHT SECTION: Quotation/Invoice Details ===
  let rightY = INVOICE_DETAILS_Y;
  const RIGHT_LABEL_WIDTH = 26; // Adjust label width for right section

  // Quotation/Invoice No
  doc.setFont(mainFont, "bold");
  doc.setFontSize(9);
  doc.text(`${formData.quotation ? "Quotation" : "Proforma Invoice"} No:`, RIGHT_SECTION_X, rightY);
  doc.setFont(mainFont, "normal");
  const orderNoLines = splitTextIntoLines(formData.orderNumber || "N/A", MAX_WIDTH);
  orderNoLines.forEach((line, index) => {
    doc.text(line, RIGHT_SECTION_X + RIGHT_LABEL_WIDTH, rightY + (index * SECTION_LINE_HEIGHT));
  });
  rightY += Math.max(orderNoLines.length * SECTION_LINE_HEIGHT, SECTION_LINE_HEIGHT) + VERTICAL_GAP;

  // Date
  doc.setFont(mainFont, "bold");
  doc.text(`${formData.quotation ? "Quotation" : "Invoice"} Date:`, RIGHT_SECTION_X, rightY);
  doc.setFont(mainFont, "normal");
  const currentDate = new Date().toLocaleDateString("en-GB");
  const dateLines = splitTextIntoLines(currentDate, MAX_WIDTH);
  dateLines.forEach((line, index) => {
    doc.text(line, RIGHT_SECTION_X + RIGHT_LABEL_WIDTH, rightY + (index * SECTION_LINE_HEIGHT));
  });
  rightY += Math.max(dateLines.length * SECTION_LINE_HEIGHT, SECTION_LINE_HEIGHT) + VERTICAL_GAP;

  // Calculate table start Y based on which section is longer
  const tableStartY = Math.max(leftY, rightY) + 5;

  // Calculate amounts
  const quantity = Number(formData.quantity) || 0;
  const unitPrice = Number(formData.unitPrice) || 0;
  const calculatedTotal = quantity * unitPrice;
  const subtotal = (formData.total && formData.total > 0) ? formData.total : calculatedTotal;
  const gstPercentage = formData.applyGST ? (Number(formData.gstPercentage) || 18) : 0;
  const gstAmount = formData.applyGST ? subtotal * (gstPercentage / 100) : 0;
  const totalAmount = (formData.finalAmount && formData.finalAmount > 0)
    ? formData.finalAmount
    : subtotal + gstAmount;

  // Item Table
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
      formData.description || "N/A",
      formData.quantity || 0,
      formData.unitPrice ? Number(formData.unitPrice).toFixed(2) : "0.00",
      formData.total ? formData.total.toFixed(2) : "0.00",
    ],
  ];

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
        styles: { fillColor: false, fontStyle: "bold" },
      },
      {
        content: "Total",
        styles: { fillColor: false, fontStyle: "bold" },
      },
      {
        content: totalAmount.toFixed(2),
        styles: { fillColor: false, fontStyle: "bold" },
      },
    ],
  ];

  autoTable(doc, {
    startY: tableStartY,
    head: [tableColumn],
    body: [...tableRows, ...additionalRows],
    theme: "grid",
    margin: { left: 10, right: 10 },
    styles: {
      fontSize: 9,
      halign: "center",
      cellPadding: 3,
      fillColor: false,
      font: mainFont
    },
    headStyles: {
      fillColor: [190, 191, 194],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      font: mainFont
    },
    bodyStyles: {
      fillColor: false,
      font: mainFont
    },
    alternateRowStyles: {
      fillColor: false,
    },
    columnStyles: {
      0: { cellWidth: 15, halign: "center" },
      1: { cellWidth: 45, halign: "center" },
      2: { cellWidth: 55, halign: "left" },
      3: { cellWidth: 15, halign: "center" },
      4: { cellWidth: 25, halign: "center" },
      5: { cellWidth: 35, halign: "center" },
    },
  });

  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : tableStartY + 40;

  // === LEFT SECTION BELOW TABLE: Delivery and Payment Days ===
  const leftBelowY = finalY + 10;
  let leftBelowCurrentY = leftBelowY;

  if (formData.daysAfterConfirmation !== undefined) {
    doc.setFont(mainFont, "bold");
    doc.setFontSize(10);
    doc.text("Delivery Days:", LEFT_SECTION_X, leftBelowCurrentY);
    doc.setFont(mainFont, "normal");
    doc.text(`${formData.daysAfterConfirmation} Days After Confirmation`, LEFT_SECTION_X + 30, leftBelowCurrentY);
    leftBelowCurrentY += LINE_HEIGHT + 2;
  }

  if (formData.paymentDate !== undefined) {
    doc.setFont(mainFont, "bold");
    doc.setFontSize(10);
    doc.text("Payment Days:", LEFT_SECTION_X, leftBelowCurrentY);
    doc.setFont(mainFont, "normal");
    doc.text(`${formData.paymentDate} Days After Delivery
      
      `, LEFT_SECTION_X + 30, leftBelowCurrentY);
    leftBelowCurrentY += LINE_HEIGHT + 3;
  }

  // === RIGHT SECTION: Signature ===
  const signRightX = pageWidth - 20;
  const signatureY = finalY + 30; // Moved down for proper spacing

  // Signature name
  doc.setFont(signatureFont, "italic");
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  const signatureText = "";
  doc.text(signatureText, signRightX, signatureY, { align: "right" });

  // Signature line
  doc.setLineWidth(0.5);
  doc.setDrawColor(0, 0, 0);
  const lineY = signatureY + 5;
  const lineLength = 50;
  doc.line(signRightX - lineLength, lineY, signRightX, lineY);

  // Authorised By text
  const labelY = lineY + 5;
  doc.setFont(mainFont, "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("Authorised By", signRightX - lineLength / 2, labelY, { align: "center" });

  // === Terms & Conditions at the bottom ===
  const termsStartY = Math.max(leftBelowCurrentY, labelY + 10);

  // Terms & Conditions box
  const termsBoxHeight = 38;
  const termsY = termsStartY;
  const termsWidth = pageWidth - 30;
  const termsPadding = 5;
  const termsX = LEFT_SECTION_X;

  // Box border
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.rect(termsX, termsY, termsWidth, termsBoxHeight, "S");

  // Title
  doc.setFont(mainFont, "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("Terms & Conditions:", termsX + termsPadding, termsY + termsPadding + 2);

  // Terms content
  doc.setFont(mainFont, "normal");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);

  const termsList = [
    "1) Any claim or dispute arising from charge in quantity or shortage in quantity or any cause",
    "    whatsoever will not be entertained once the goods are delivered",
    "2) We are not responsible for any loss or damage during transit",
    "3) Subject to SURAT Jurisdiction only",
    "4) Payment to be made by Payee A/c Cheque, Draft for NEFT, RTGS, IMPS UPI Or Cash only",
  ];

  const lineHeightTerms = 3.8;
  let currentTermY = termsY + termsPadding + 8;
  const maxWidth = termsWidth - (termsPadding * 2);

  for (const term of termsList) {
    const wrappedTerm = doc.splitTextToSize(term, maxWidth);

    for (let j = 0; j < wrappedTerm.length; j++) {
      // Add indentation for second and subsequent lines of first term
      if (term === termsList[0] && j > 0) {
        doc.text("   " + wrappedTerm[j], termsX + termsPadding, currentTermY);
      } else {
        doc.text(wrappedTerm[j], termsX + termsPadding, currentTermY);
      }
      currentTermY += lineHeightTerms;
    }

    // Add small gap between terms
    currentTermY += 1;
  }

  // === BOTTOM LINES ===
  const bottomBlueHeight = 6;
  const bottomPinkHeight = 2;
  const bottomGap = 1.5;

  const blueY = pageHeight - bottomBlueHeight;
  doc.setFillColor("#4a6775");
  doc.rect(0, blueY, pageWidth, bottomBlueHeight, "F");
  const pinkY = blueY - bottomGap - bottomPinkHeight;
  doc.setFillColor("#e22b88");
  doc.rect(0, pinkY, pageWidth, bottomPinkHeight, "F");

  // Save PDF
  const invoiceType = formData.quotation ? "Quotation" : "Proforma_Invoice";
  doc.save(
    `${invoiceType}_${formData.orderNumber || "N_A"}_${new Date().toISOString()?.split("T")[0]}.pdf`
  );
};