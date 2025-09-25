import jsPDF from "jspdf";
import CryptoJS from "crypto-js";
import autoTable from "jspdf-autotable";

const actionsMap = {
  view_own: "View ( Own )",
  view_global: "View ( Global )",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
};

export const toTitleCase = (str: string) =>
  str
    .replace(/_/g, " ")
    .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());

function convertPermissionsToDisplay(dbPermissions: any) {
  return Object.entries(dbPermissions).map(([moduleKey, actions]: [string, any]) => {
    const capabilities = Object.entries(actions)
      .filter(([key, value]) => value === true)
      .map(([key]) => ({
        type: actionsMap[key as keyof typeof actionsMap],
        label: actionsMap[key as keyof typeof actionsMap],
      }));

    return {
      feature: toTitleCase(moduleKey),
      capabilities,
    };
  });
}

const labelToKeyMap: Record<string, string> = {
  "View ( Own )": "view_own",
  "View ( Global )": "view_global",
  "Create": "create",
  "Edit": "edit",
  "Delete": "delete",
};

function convertPermissionsToDb(displayPermissions: any[]) {
  const dbPermissions: Record<string, Record<string, boolean>> = {};

  displayPermissions.forEach(({ feature, capabilities }) => {
    const featureKey = feature.toLowerCase().replace(/\s+/g, "_");

    const actions: Record<string, boolean> = {
      view_own: false,
      view_global: false,
      create: false,
      edit: false,
      delete: false,
    };

    capabilities.forEach((cap: any) => {
      const key = labelToKeyMap[cap.type];
      if (key) {
        actions[key] = true;
      }
    });

    dbPermissions[featureKey] = actions;
  });

  return dbPermissions;
}

const SECRET_KEY = process.env.NEXT_PUBLIC_CRYPTO_SECRET || "xghvyusdvf";

export const decryptData = (ciphertext: any) => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);

    if (!originalText) {
      throw new Error("Invalid decryption or empty result");
    }

    return originalText;
  } catch (error: any) {
    // console.log("Decryption error:", error.message || error);
    return "Decryption failed";
  }
};

export const getDisplayStatus = (row: OrderRow): { text: string; isHold: boolean } => {
  const { status, designerStatus, printerStatus, binderStatus, bookletBinderStatus, designer, binder, bookletBinder } = row;
  const staffMap = {
    designer: designer,
    binder: binder,
    bookletBinder: bookletBinder,
  };

  if (status === "Hold") {
    const { designer, printer, binder, bookletBinder } = row;
    let holdStage = "Order";
    if (bookletBinder) holdStage = "Booklet Binding";
    else if (binder) holdStage = "Binding";
    else if (printer) holdStage = "Printing";
    else if (designer) holdStage = "Designing";
    return { text: holdStage, isHold: true };
  }

  let mainStatusText = status || "Order Received";
  let subStatusText = "";
  let staffName = "";

  switch (status) {
    case "Designer":
      mainStatusText = "Designing";
      subStatusText = designerStatus || "Pending";
      staffName = designer && designer.firstName && designer.lastName
        ? `${designer.firstName} ${designer.lastName}`
        : "Unknown Designer";
      break;
    case "Printer":
      mainStatusText = "Printing";
      subStatusText = printerStatus || "Pending";
      break;
    case "Binder":
      mainStatusText = "Binding";
      subStatusText = binderStatus || "Pending";
      staffName = binder && binder.firstName && binder.lastName
        ? `${binder.firstName} ${binder.lastName}`
        : "Unknown Binder";
      break;
    case "Booklet & Folder Binder":
      mainStatusText = "Booklet Binding";
      subStatusText = bookletBinderStatus || "Pending";
      staffName = bookletBinder && bookletBinder.firstName && bookletBinder.lastName
        ? `${bookletBinder.firstName} ${bookletBinder.lastName}`
        : "Unknown Booklet Binder";
      break;
    case "Delivery":
      mainStatusText = "Ready for Delivery";
      break;
    case "Received":
      mainStatusText = "Order Received";
      break;
    default:
      break;
  }

  const displayText = staffName ? `${mainStatusText} (${subStatusText}) by ${staffName}` : subStatusText ? `${mainStatusText} (${subStatusText})` : mainStatusText;
  return { text: displayText, isHold: false };
};

// ✅ Reusable border drawer
const drawBorder = (
  doc: any,
  type: "simple" | "rounded" | "double" | "dashed" | "thick" | "none" = "simple"
) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setDrawColor("#343436");
  doc.setLineWidth(0.5);

  switch (type) {
    case "simple":
      doc.rect(2, 2, pageWidth - 4, pageHeight - 4, "S");
      break;

    case "rounded":
      doc.roundedRect(2, 2, pageWidth - 4, pageHeight - 4, 3, 3, "S");
      break;

    case "double":
      doc.rect(2, 2, pageWidth - 4, pageHeight - 4, "S");
      doc.rect(4, 4, pageWidth - 8, pageHeight - 8, "S");
      break;

    case "dashed":
      doc.setLineDash([2, 2]); // dash length, gap
      doc.rect(2, 2, pageWidth - 4, pageHeight - 4, "S");
      doc.setLineDash(); // reset
      break;

    case "thick":
      doc.setLineWidth(2);
      doc.rect(2, 2, pageWidth - 4, pageHeight - 4, "S");
      break;

    case "none":
    default:
      // no border
      break;
  }
};


export const downloadVisitingCardPDF = (data: any) => {
  const doc: any = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [105, 148],
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

    // 🔥 Choose border type here
  drawBorder(doc, "rounded"); // simple | rounded | double | dashed | thick | none
  // Draw page border
  // doc.setLineWidth(0.5);
  // doc.setDrawColor("#343436");
  // doc.roundedRect(2, 2, pageWidth - 4, pageHeight - 4, 3, 3, "S");

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(15, 15, 43);
  doc.text("BINDER JOB CARD", pageWidth / 2, 10, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  const lineColor = "#1F2020";
  const commonStyle = {
    lineColor,
    lineWidth: { right: 0, bottom: 0.1, top: 0, left: 0 },
  };

  const getColumn = (label: any) => ({
    content: label,
    styles: commonStyle,
  });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");


  const commonStyle2 = {
    fontStyle: "bold",
    textColor: "#13132e",
    font: "helvetica",
  };

  const label = (label: any) => {
    return {
      content: ` ${label.trim()}`,
      styles: commonStyle2,
    };
  }

  // define rows
  const allRows = [
    [label("OD. No"), getColumn(data.odNo), label("Party Name"), getColumn(data.partyName), label("Date"), getColumn(data.date)],
    [label("Quantity"), getColumn(data.quantity), label("Binding"), getColumn(data.binding), label("Col"), getColumn(data.col)],
  ];
  const rows2 = [[label("Printer"), getColumn(data.printer), label("Remark"), getColumn(data.remark)]];
  const rows3 = [[label("Rate"), getColumn(`${data.rate} /-`), label("Haste"), getColumn(`${data.createdBy?.firstName} ${data.createdBy?.lastName}`), label("GSTIN"), getColumn(data.gst ? "Yes" : "No")]];
  const rows4 = [[label("Size"), getColumn(data.size)], [label("Add"), getColumn(data.add || "")]];

  // column configs
  const col6 = {
    0: { cellWidth: 13, fontStyle: "bold" },
    1: { cellWidth: 20 },
    2: { cellWidth: 15, fontStyle: "bold" },
    3: { cellWidth: 20 },
    4: { cellWidth: 10, fontStyle: "bold" },
    5: { cellWidth: 18 },
  };
  const col4 = {
    0: { cellWidth: 13, fontStyle: "bold" },
    1: { cellWidth: 20 },
    2: { cellWidth: 15, fontStyle: "bold" },
    3: { cellWidth: 48 },
  };
  const col2 = {
    0: { cellWidth: 13, fontStyle: "bold" },
    1: { cellWidth: 78 },
  };

  const tableOptions = (startY: any, rows: any, col: any) => ({
    startY,
    margin: { left: 3, right: 3 },
    theme: "plain",
    styles: {
      fontSize: 8,
      cellPadding: 1,
      valign: "middle",
      halign: "left",
      lineWidth: 0,
      textColor: "#1E1F1F",
      lineColor: [255, 255, 255],
    },
    body: rows,
    columnStyles: col,
    didParseCell: (dataCell: any) => {
      if (dataCell.section === "body") {
        dataCell.cell.styles.cellPadding = {
          ...dataCell.cell.styles.cellPadding,
          top: 4,
        };
      }
    },
  });

  let currentY = 10;
  const renderRow = (rows: any, col: any) => {
    autoTable(doc, tableOptions(currentY, rows, col) as any);
    currentY = doc.lastAutoTable.finalY;
  };

  renderRow(allRows, col6);
  renderRow(rows2, col4);
  renderRow(rows3, col6);
  renderRow(rows4, col2);

  doc.save("binder-job-card.pdf");
};

// export const downloadBookletPDF = (data: any, materials: any, inventory: any) => {
//   console.log(data, 'data', materials, inventory)
//   const doc: any = new jsPDF({
//     orientation: "portrait",
//     unit: "mm",
//     format: [105, 148], // A6 size
//   });

//   const pageWidth = doc.internal.pageSize.getWidth();
//   const pageHeight = doc.internal.pageSize.getHeight();
//   const borderRadius = 3;
//   const borderMargin = 2;

//   // Border
//   doc.setLineWidth(0.3);
//   doc.setDrawColor("#343436");
//   doc.roundedRect(
//     borderMargin,
//     borderMargin,
//     pageWidth - borderMargin * 2,
//     pageHeight - borderMargin * 2,
//     borderRadius,
//     borderRadius,
//     "S"
//   );

//   // Title
//   doc.setFont("helvetica", "bold");
//   doc.setFontSize(12);
//   doc.setTextColor(15, 15, 43);
//   doc.text("BOOKLET & FOLDER BINDER JOB CARD", pageWidth / 2, 10, { align: "center" });

//   doc.setFont("helvetica", "normal");
//   doc.setFontSize(8);

//   const lineColor = "#2b2b2e";
//   const textColor = "#3a3737ff";

//   const commonStyle = {
//     lineColor: lineColor,
//     lineWidth: {
//       right: 0,
//       bottom: 0.1,
//       top: 0,
//       left: 0,
//     },
//   };

//   const commonStyle2 = {
//     fontStyle: "bold",
//     textColor: "#13132e",
//     font: "helvetica",
//   };

//   const getColumn = (label: any) => {
//     return {
//       content: label,
//       styles: commonStyle,
//     };
//   };

//   const label = (label: any) => {
//     return {
//       content: ` ${label.trim()}`,
//       styles: commonStyle2,
//     };
//   };

//   // rows
//   const row1 = [[label("Ord No."), getColumn(data.odNo), label("Date:"), getColumn(data.date)]];
//   const row2 = [[label("Party Name"), getColumn(data.partyName)]];
//   const row3 = [[label("Address"), getColumn(data.address), label("GST"), getColumn(data.isGst ? "Yes" : "No")]];
//   const row4 = [[label("Item"), getColumn(data.productItem?.itemName), label("Size"), getColumn(data.size), label("Qty"), getColumn(data.qty)]];
//   const row5 = [[label("Rate"), getColumn(data.rate), label("Printer"), getColumn(data.printer)]];
//   const row6 = [[label("Lamination"), getColumn(data.lamination), label("Glossy Matt UV")]];
//   const row7 = [
//     [label(`${data.isPasting ? "Pasting /" : ""} ${data.isCutting ? "Cutting /" : ""} ${data.isCreasing ? "Creasing /" : ""}`), ""],
//   ];
//   const row14 = [
//     [label("Foil:"), getColumn(data.isFoil ? "Yes" : "No"), label("Punching:"), getColumn(data.isPunching ? "Yes" : "No")],
//   ];
//   const row8 = [[label("Binding"), getColumn(data.binding)]];
//   const row9 = [[label("Vendor"), getColumn(""), label("Paper"), getColumn(data.pType)]];
//   const row13 = [[label("Remarks"), getColumn("")]];

//   // column style sets
//   const col4 = {
//     0: { cellWidth: 8, fontStyle: "bold" },
//     1: { cellWidth: 17 },
//     2: { cellWidth: 10, fontStyle: "bold" },
//     3: { cellWidth: 17 },
//     4: { cellWidth: 8, fontStyle: "bold" },
//     5: { cellWidth: 17 },
//     6: { cellWidth: 7, fontStyle: "bold" },
//     7: { cellWidth: 14 },
//   };

//   const col3 = {
//     0: { cellWidth: 15, fontStyle: "bold" },
//     1: { cellWidth: 20 },
//     2: { cellWidth: 15, fontStyle: "bold" },
//     3: { cellWidth: 20 },
//     4: { cellWidth: 10, fontStyle: "bold" },
//     5: { cellWidth: 18 },
//   };

//   const col2 = {
//     0: { cellWidth: 16, fontStyle: "bold" },
//     1: { cellWidth: 34 },
//     2: { cellWidth: 16, fontStyle: "bold" },
//     3: { cellWidth: 32 },
//   };

//   const col1 = {
//     0: { cellWidth: 18, fontStyle: "bold" },
//     1: { cellWidth: 80 },
//   };

//   const col5 = {
//     0: { cellWidth: 50, fontStyle: "bold" },
//     1: { cellWidth: 48 },
//   };

//   const col6 = {
//     0: { cellWidth: 25, fontStyle: "bold" },
//     1: { cellWidth: 25 },
//     2: { cellWidth: 48, fontStyle: "bold" },
//   };

//   const tableOptions = (startY: any, rows: any, col: any) => ({
//     startY,
//     margin: { left: 3, right: 3 },
//     theme: "plain",
//     styles: {
//       fontSize: 8,
//       cellPadding: 1,
//       valign: "middle",
//       halign: "left",
//       lineWidth: 0,
//       lineColor: [255, 255, 255],
//     },
//     head: [],
//     body: rows,
//     columnStyles: col,
//     didParseCell: (dataCell: any) => {
//       if (dataCell.section === "body") {
//         dataCell.cell.styles.cellPadding = {
//           ...dataCell.cell.styles.cellPadding,
//           top: 4,
//         };
//       }
//     },
//   });

//   // sequentially render all rows
//   let currentY = 10;
//   const renderRow = (rows: any, col: any) => {
//     autoTable(doc, tableOptions(currentY, rows, col) as any);
//     currentY = doc.lastAutoTable.finalY; // update Y for next row
//   };

//   // Fixed part
//   renderRow(row1, col2);
//   renderRow(row2, col1);
//   renderRow(row3, col2);
//   renderRow(row4, col3);
//   renderRow(row5, col2);
//   renderRow(row6, col6);
//   renderRow(row7, col5);
//   renderRow(row14, col2);
//   renderRow(row8, col1);
//   // renderRow(row9, col2);

//   // Dynamic part: all printer papers
//   // Dynamic part: all printer papers
//   if (data.printerPapers && data.printerPapers.length > 0) {
//     data.printerPapers.forEach((paper: any, idx: number) => {
//       // Find matching inventory record for this paper
//       const paperInventory = inventory.find(
//         (inv: any) =>
//           inv.material._id === paper?.paperType &&
//           inv.companyName?._id === data?.companyName?._id
//       );

//       console.log(paperInventory, 'paperInventory')

//       // Section title
//       const purchaseRow = [[label(`Paper ${idx + 1}`)]];
//       renderRow(purchaseRow, col1);

//       // Vendor + Paper name row
//       const vendorRow = [
//         [
//           label("Vendor"),
//           getColumn(paperInventory?.vendor?.name || ""), // if vendor is populated
//           label("Paper"),
//           getColumn(materials?.find((item) => item?._id === paper?.paperType)?.materialName || ""),
//         ],
//       ];
//       renderRow(vendorRow, col2);

//       // Date + GSM + Size + Qty row
//       const detailRow = [
//         [
//           label("Date"),
//           getColumn(paperInventory?.date ? new Date(paperInventory.date).toLocaleDateString() : ""),
//           label("GSM"),
//           getColumn(
//             materials?.find((item) => item._id === paper.gsm)?.materialGSM || ""
//           ),
//           label("Size"),
//           getColumn(
//             materials?.find((item) => item._id === paper.sheetSize)?.materialSize || ""
//           ),
//           label("Qty"),
//           getColumn(paper?.numberOfSheetsUsed || ""),
//         ],
//       ];
//       renderRow(detailRow, col4);
//     });
//   }


//   // Remarks row at the end
//   renderRow(row13, col1);

//   doc.save("binder-job-card.pdf");
// };


export const downloadBookletPDF = (data: any, materials: any, inventory: any) => {
  const doc: any = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [105, 148], // A6 size
  });


  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const borderRadius = 3;
  const borderMargin = 2;
  const drawBorderAndHeader = () => {
    // Border
    doc.setLineWidth(0.3);
    doc.setDrawColor("#343436");
    doc.roundedRect(
      borderMargin,
      borderMargin,
      pageWidth - borderMargin * 2,
      pageHeight - borderMargin * 2,
      borderRadius,
      borderRadius,
      "S"
    );

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 15, 43);
    doc.text("BOOKLET & FOLDER BINDER JOB CARD", pageWidth / 2, 8, { align: "center" });
  };

  drawBorderAndHeader();
  // Border
  // doc.setLineWidth(0.3);
  // doc.setDrawColor("#343436");
  // doc.roundedRect(
  //   borderMargin,
  //   borderMargin,
  //   pageWidth - borderMargin * 2,
  //   pageHeight - borderMargin * 2,
  //   borderRadius,
  //   borderRadius,
  //   "S"
  // );

  // // Title
  // doc.setFont("helvetica", "bold");
  // doc.setFontSize(11); // shrink a bit
  // doc.setTextColor(15, 15, 43);
  // doc.text("BOOKLET & FOLDER BINDER JOB CARD", pageWidth / 2, 8, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5); // smaller font for more fit

  const lineColor = "#2b2b2e";

  const commonStyle = {
    lineColor: lineColor,
    lineWidth: { right: 0, bottom: 0.1, top: 0, left: 0 },
  };

  const commonStyle2 = {
    fontStyle: "bold",
    textColor: "#13132e",
    font: "helvetica",
  };

  const getColumn = (label: any) => ({ content: label || "", styles: commonStyle });
  const label = (label: any) => ({ content: ` ${label.trim()}`, styles: commonStyle2 });

  // table column styles
  const col1 = { 0: { cellWidth: 18, fontStyle: "bold" }, 1: { cellWidth: 80 } };
  const col2 = {
    0: { cellWidth: 16, fontStyle: "bold" },
    1: { cellWidth: 34 },
    2: { cellWidth: 16, fontStyle: "bold" },
    3: { cellWidth: 32 },
  };
  const col3 = {
    0: { cellWidth: 15, fontStyle: "bold" },
    1: { cellWidth: 20 },
    2: { cellWidth: 15, fontStyle: "bold" },
    3: { cellWidth: 20 },
    4: { cellWidth: 10, fontStyle: "bold" },
    5: { cellWidth: 18 },
  };
  const col4 = {
    0: { cellWidth: 8, fontStyle: "bold" },
    1: { cellWidth: 17 },
    2: { cellWidth: 10, fontStyle: "bold" },
    3: { cellWidth: 17 },
    4: { cellWidth: 8, fontStyle: "bold" },
    5: { cellWidth: 17 },
    6: { cellWidth: 7, fontStyle: "bold" },
    7: { cellWidth: 14 },
  };

  const tableOptions = (startY: any, rows: any, col: any) => ({
    startY,
    margin: { left: 3, right: 3 },
    theme: "plain",
    styles: {
      fontSize: 7.5,
      cellPadding: { top: 2, bottom: 1, left: 1, right: 1 },
      valign: "middle",
      halign: "left",
      lineWidth: 0,
    },
    head: [],
    body: rows,
    columnStyles: col,
    didDrawPage: () => {
      drawBorderAndHeader(); // ✅ redraw on every page
    },
  });

  let currentY = 10;
  const renderRow = (rows: any, col: any) => {
    autoTable(doc, tableOptions(currentY, rows, col) as any);
    currentY = doc.lastAutoTable.finalY;
  };

  // Fixed part
  renderRow([[label("Ord No."), getColumn(data.odNo), label("Date:"), getColumn(data.date)]], col2);
  renderRow([[label("Party Name"), getColumn(data.partyName)]], col1);
  renderRow([[label("Address"), getColumn(data.address), label("GST"), getColumn(data.isGst ? "Yes" : "No")]], col2);
  renderRow([[label("Item"), getColumn(data.productItem?.itemName), label("Size"), getColumn(data.size), label("Qty"), getColumn(data.qty)]], col3);
  renderRow([[label("Rate"), getColumn(data.rate), label("Printer"), getColumn(data.printer)]], col2);

  // Printer Papers
  if (data.printerPapers?.length) {
    data.printerPapers.forEach((paper: any, idx: number) => {
      const paperInventory = inventory.find(
        (inv: any) =>
          inv.material._id === paper?.paperType && inv.category === "printer" &&
          inv.companyName?._id === data?.companyName?._id
      );

      renderRow([[label(`Printer Paper ${idx + 1}`)]], col1);

      renderRow(
        [
          [
            label("Vendor"),
            getColumn(paperInventory?.vendor?.name || ""),
            label("Paper"),
            getColumn(materials?.find((m) => m._id === paper?.paperType)?.materialName || ""),
          ],
        ],
        col2
      );

      renderRow(
        [
          [
            label("Date"),
            getColumn(paperInventory?.date ? new Date(paperInventory.date).toLocaleDateString() : ""),
            label("GSM"),
            getColumn(materials?.find((m) => m._id === paper.gsm)?.materialGSM || ""),
            label("Size"),
            getColumn(materials?.find((m) => m._id === paper.sheetSize)?.materialSize || ""),
            label("Qty"),
            getColumn(paper?.numberOfSheetsUsed || ""),
          ],
        ],
        col4
      );
    });
  }

  // Lamination / Glossy
  renderRow([[label("Lamination"), getColumn(data.lamination), label("Glossy Matt UV")]], col2);
  renderRow([[label(`${data.isPasting ? "Pasting /" : ""} ${data.isCutting ? "Cutting /" : ""} ${data.isCreasing ? "Creasing /" : ""}`), ""]], col1);
  renderRow([[label("Foil:"), getColumn(data.isFoil ? "Yes" : "No"), label("Punching:"), getColumn(data.isPunching ? "Yes" : "No")]], col2);

  // Binding
  renderRow([[label("Binding"), getColumn(data.binding)]], col1);

  // Binder Papers
  if (data.binderPapers?.length) {
    data.binderPapers.forEach((paper: any, idx: number) => {
      const binderInventory = inventory.find(
        (inv: any) =>
          inv.material._id === paper?.paperType && inv.category === "binder" &&
          inv.companyName?._id === data?.companyName?._id
      );

      renderRow([[label(`Binder Paper ${idx + 1}`)]], col1);

      renderRow(
        [
          [
            label("Vendor"),
            getColumn(binderInventory?.vendor?.name || ""),
            label("Paper"),
            getColumn(materials?.find((m) => m._id === paper?.paperType)?.materialName || ""),
          ],
        ],
        col2
      );

      renderRow(
        [
          [
            label("Date"),
            getColumn(binderInventory?.date ? new Date(binderInventory.date).toLocaleDateString() : ""),
            label("GSM"),
            getColumn(materials?.find((m) => m._id === paper.gsm)?.materialGSM || ""),
            label("Size"),
            getColumn(materials?.find((m) => m._id === paper.sheetSize)?.materialSize || ""),
            label("Qty"),
            getColumn(paper?.numberOfSheetsUsed || ""),
          ],
        ],
        col4
      );
    });
  }

  // Remarks
  renderRow([[label("Remarks"), getColumn("")]], col1);

  doc.save("binder-job-card.pdf");
};

export function downloadSkippedRecordsAsCSV(skippedRecords) {
  if (!skippedRecords || skippedRecords.length === 0) return;

  // 1. Get CSV headers from the keys of the first object
  const headers = Object.keys(skippedRecords[0]);
  const csvRows = [];

  // 2. Add header row
  csvRows.push(headers.join(','));

  // 3. Add data rows
  skippedRecords.forEach(record => {
    const values = headers.map(header => {
      let val = record[header] ?? ''; // handle null/undefined
      val = typeof val === 'string' ? val.replace(/"/g, '""') : val; // escape quotes
      return `"${val}"`; // wrap in quotes
    });
    csvRows.push(values.join(','));
  });

  // 4. Combine rows into CSV string
  const csvString = csvRows.join('\n');

  // 5. Create a blob and trigger download
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'skipped_records.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const getUserData = () => {
  const user = localStorage.getItem('user')
  return JSON.parse(user)
}

export const getCompanyWisePermission = (company) => {
  const user = localStorage.getItem('user')

  if (![null, undefined, 'null', 'undefined', ""].includes(user)) {
    const userData = JSON.parse(user)
    if (company === 0) return userData?.sakshi && userData?.qp
    if (company === 1) return userData?.sakshi
    if (company === 2) return userData?.qp
    if (company === 3) return userData?.sakshi && !userData?.qp;
    if (company === 4) return !userData?.sakshi && userData?.qp;
    if (company === 5) return userData?.sakshiCompanyId
    if (company === 6) return userData?.qpCompanyId
  }
}