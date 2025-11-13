  // utils/generateInvoicePDF.ts
  import { jsPDF } from "jspdf";
  import autoTable from "jspdf-autotable";
  import logoImage1 from "../../public/images/centerlogo.png"; // Center logo
  import logoImage2 from "../../public/images/leftlogo.png"; // Left logo
  import watermark from "../../public/images/watermark.png"; // Left logo

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
    quotation?: boolean;
  }

  export const generateInvoicePDF = async (formData: InvoiceFormData) => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Utility: compress image (reduce size, keep transparency)
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

    // === Step 1: Add Watermark ===
    const applyWatermark = async () => {
      const imgWidth = 140;
      const imgHeight = 140;
      const imgX = (pageWidth - imgWidth) / 2;
      const imgY = (pageHeight - imgHeight) / 2;

      try {
        // Compress logo before adding
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

    // Compress logos
    const compressedLogo1 = await compressImage(logoImage1.src, 400);
    const compressedLogo2 = await compressImage(logoImage2.src, 500);

    // === HEADER ===
    const leftLogoWidth = 65; // increased size
    const leftLogoHeight = 60;
    const centerLogoWidth = 50;
    const centerLogoHeight = 50;

    // Left logo
    doc.addImage(compressedLogo2, "PNG", 10, 5, leftLogoWidth, leftLogoHeight, undefined, "FAST");

    // Center logo
    const centerX = pageWidth / 2 - centerLogoWidth / 2;
    doc.addImage(compressedLogo1, "PNG", centerX, 6, centerLogoWidth, centerLogoHeight, undefined, "FAST");

    // Right section (right aligned)
    const rightMargin = 10;
    let y = 12;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text("GSTIN NO. 24ABSPJ7399E1Z4", pageWidth - rightMargin, y + 3, { align: "right" });

    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("110, 1st Floor, Shree Krishna Market,", pageWidth - rightMargin, y + 3, { align: "right" });
    doc.text("Ring Road, Surat - 2.", pageWidth - rightMargin, y + 8, { align: "right" });
    doc.text("sakshicreation3600@gmail.com", pageWidth - rightMargin, y + 13, { align: "right" });

    y += 16;
    doc.setFont("helvetica", "bold");
    doc.text("ANY QUERY : Ph.: 0261-4017971", pageWidth - rightMargin, y + 3, { align: "right" });

    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text("FOR FOLDER & BOOKLET : 93775 03600", pageWidth - rightMargin, y + 3, { align: "right" });

    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text("FOR STATIONARY : 93750 47330", pageWidth - rightMargin, y + 3, { align: "right" });

    // Header Text (Centered below logos)
    const HEADER_Y = 55;
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(`${formData.quotation ? "QUOTATION" : "PROFORMA INVOICE"}`, pageWidth / 2, HEADER_Y, { align: "center" });
    doc.setLineWidth(0.5);
    doc.line(10, HEADER_Y + 2, 200, HEADER_Y + 2);

    // Define dynamic height constants
    const LINE_HEIGHT = 6; // Height of each line of text
    const INVOICE_DETAILS_Y = HEADER_Y + 12; // Y position for invoice details
    const ADDRESS_Y = INVOICE_DETAILS_Y + 6; // Y position for address
    const SPACING_BEFORE_TABLE = 5; // Extra spacing before the table

    const splitAddressIntoLines = (address: string, maxLength: number = 40): string[] => {
      if (!address) return [];
      const words = address?.split(" ");
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

    // Invoice Details (Left)
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`${formData.quotation ? "Quotation" : "Proforma Invoice"} No: ${formData.orderNumber || "N/A"}`, 20, INVOICE_DETAILS_Y);
    doc.text(`Invoice Date: ${new Date().toLocaleDateString("en-GB")}`, 20, INVOICE_DETAILS_Y + LINE_HEIGHT);

    // Party Details (Right)
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
    let tableStartY = daysY + SPACING_BEFORE_TABLE;
    if (formData.daysAfterConfirmation !== undefined) {
      doc.text(`Delivery date - ${formData.daysAfterConfirmation} Days After Confirmation`, 120, daysY);
      tableStartY += LINE_HEIGHT;
    }


    // Calculate amounts correctly for both quotation and proforma invoice
    const quantity = Number(formData.quantity) || 0;
    const unitPrice = Number(formData.unitPrice) || 0;
    
    // Calculate total based on quantity and unitPrice
    const calculatedTotal = quantity * unitPrice;
    
    // Use provided total if available and valid, otherwise use calculated total
    const subtotal = (formData.total && formData.total > 0) ? formData.total : calculatedTotal;
    
    // Calculate GST values
    const gstPercentage = formData.applyGST ? (Number(formData.gstPercentage) || 18) : 0;
    const gstAmount = formData.applyGST ? subtotal * (gstPercentage / 100) : 0;
    
    // Use provided finalAmount if available and valid, otherwise calculate it
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
        formData.remarks || "N/A",
        formData.quantity || 0,
        formData.unitPrice ? Number(formData.unitPrice).toFixed(2) : "0.00",
        formData.total ? formData.total.toFixed(2) : "0.00",
      ],
    ];

    // // Calculate GST values
    // const gstPercentage = formData.applyGST ? formData.gstPercentage || 18 : 0;
    // console.log("DEBUG : generateInvoicePDF : formData:", formData);

    // const gstAmount = formData.applyGST ? formData.total * (gstPercentage / 100) : 0;
    // const subtotal = formData.total || 0;
    // const totalAmount = formData.finalAmount || 0;
    // console.log("DEBUG : generateInvoicePDF : totalAmount:", totalAmount);


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
        fillColor: false // ✅ Yeh line add karein - data cells ka background transparent hoga
      },
      headStyles: {
        fillColor: [74, 102, 117], // ✅ Header green rahega
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      bodyStyles: {
        fillColor: false, // ✅ Body cells ka background transparent hoga
      },
      alternateRowStyles: {
        fillColor: false, // ✅ Alternate rows ka bhi background transparent hoga
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

    const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : tableStartY + 40;

    // === Signature Block (perfected: both elements right-aligned, perfectly stacked with tight spacing for a cohesive unit) ===
    const signRightX = pageWidth - 10; // Right-aligned position
    const signatureGap = 8; // Tight spacing between signature and label
    const signatureY = finalY + 15; // Start signature block higher for better flow
    doc.setFont("times", "italic");
    doc.setFontSize(13); // Elegant size
    doc.setTextColor(0, 0, 0); // Solid black
    const signatureText = "Sakshi";
    doc.text(signatureText, signRightX, signatureY, { align: "right" }); // Right-aligned for consistency

    // Label directly below, same alignment
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    const labelY = signatureY + signatureGap;
    doc.text("Authorised By", signRightX, labelY, { align: "right" });

    // Add a horizontal line above the "Authorised By" label
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0);
    const lineY = labelY - 5; // Position the line just above the label
    const lineLength = 25; // Length of the line (adjust as needed)
    doc.line(signRightX - lineLength, lineY, signRightX, lineY);

    // === Terms & Conditions block (adjusted to start after the tight signature block) ===
    const termsX = 10;
    const termsY = labelY + 8; // Minimal space after label
    const termsWidth = pageWidth - 20;
    const termsPadding = 4;
    const termsInnerWidth = termsWidth - termsPadding * 2;
    const termsBoxHeight = 50;

    // Box border for terms
    doc.setDrawColor(120);
    doc.setLineWidth(0.3);
    doc.rect(termsX, termsY, termsWidth, termsBoxHeight, "S");

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("Terms & Conditions:", termsX + termsPadding, termsY + termsPadding);

    // Terms content
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);

    const termsList = [
      "1. Goods once sold will not be taken back unless agreed in writing.",
      "2. Delivery dates are approximate and commence from the date of confirmation of order.",
      "3. Any discrepancy in the invoice should be reported within 7 days from the date of receipt.",
      "4. Payment should be made as per agreed terms; late payments may attract interest.",
      "5. Goods remain the property of Sakshi Creations until payment is received in full.",
      "6. Any disputes will be subject to Surat jurisdiction only.",
    ];

    const lineHeightTerms = 4.5;
    let currentTermY = termsY + termsPadding + 8;
    let totalLinesUsed = 0;
    const availableHeight = termsBoxHeight - (termsPadding * 2 + 8);
    const maxTotalLines = Math.floor(availableHeight / lineHeightTerms);

    for (const term of termsList) {
      const wrappedTerm = doc?.splitTextToSize(term, termsInnerWidth);
      const linesForThisTerm = wrappedTerm.length;

      if (totalLinesUsed + linesForThisTerm > maxTotalLines) {
        break;
      }

      for (let j = 0; j < linesForThisTerm; j++) {
        if (totalLinesUsed < maxTotalLines) {
          doc.text(wrappedTerm[j], termsX + termsPadding, currentTermY);
          currentTermY += lineHeightTerms;
          totalLinesUsed++;
        }
      }
    }

    if (totalLinesUsed >= maxTotalLines) {
      doc.setFont("helvetica", "italic");
      doc.text("... (continued on next page)", termsX + termsPadding, currentTermY);
    }

    // Reset colors
    doc.setDrawColor(0);
    doc.setTextColor(0, 0, 0);

    // === TOP & BOTTOM LINES (unchanged) ===
    const topBlueHeight = 6;
    const topPinkHeight = 2;
    const topGap = 1.5;
    const bottomBlueHeight = 6;
    const bottomPinkHeight = 2;
    const bottomGap = 1.5;

    // Top bars
    doc.setFillColor("#4a6775");
    doc.rect(0, 0, pageWidth, topBlueHeight, "F");
    doc.setFillColor("#e22b88");
    doc.rect(0, topBlueHeight + topGap, pageWidth, topPinkHeight, "F");

    // Bottom bars
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