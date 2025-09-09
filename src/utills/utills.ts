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
    console.log("Decryption error:", error.message || error);
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

export const downloadVisitingCardPDF = (data: any) => {
  const doc: any = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [105, 148],
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Draw page border
  doc.setLineWidth(0.5);
  doc.setDrawColor("#252626ff");
  doc.roundedRect(2, 2, pageWidth - 4, pageHeight - 4, 3, 3, "S");

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

  // define rows
  const allRows = [
    [" OD. No", getColumn(data.odNo), " Size", getColumn(data.size), " Date", getColumn(data.date)],
    [" Quantity", getColumn(data.quantity), " Binding", getColumn(data.binding), " Col", getColumn(data.col)],
  ];
  const rows2 = [[" Printer", getColumn(data.printer), " Remark", getColumn(data.remark)]];
  const rows3 = [[" Rate", getColumn(data.rate), " Haste", getColumn(`${data.createdBy?.firstName} ${data.createdBy?.lastName}`), " Date", getColumn(data.date)]];
  const rows4 = [[" Party Name", getColumn(data.partyName)], [" Add", getColumn(data.add || "")]];

  // column configs
  const col6 = {
    0: { cellWidth: 15, fontStyle: "bold" },
    1: { cellWidth: 20 },
    2: { cellWidth: 15, fontStyle: "bold" },
    3: { cellWidth: 20 },
    4: { cellWidth: 10, fontStyle: "bold" },
    5: { cellWidth: 18 },
  };
  const col4 = {
    0: { cellWidth: 15, fontStyle: "bold" },
    1: { cellWidth: 20 },
    2: { cellWidth: 15, fontStyle: "bold" },
    3: { cellWidth: 48 },
  };
  const col2 = {
    0: { cellWidth: 20, fontStyle: "bold" },
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

  let currentY = 2;
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


export const downloadBookletPDF = (data: any) => {
  const doc: any = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [105, 148],
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const borderRadius = 3;
  const borderMargin = 2;

  doc.setLineWidth(0.5);
  doc.setDrawColor("#252626ff");
  doc.roundedRect(
    borderMargin,
    borderMargin,
    pageWidth - borderMargin * 2,
    pageHeight - borderMargin * 2,
    borderRadius,
    borderRadius,
    "S"
  );

  const lineColor = "#1F2020";
  const textColor = "#3a3737ff"
  const commonStyle = {
    lineColor: lineColor,
    lineWidth: {
      right: 0,
      bottom: 0.1,
      top: 0,
      left: 0,
    },
  };

  const commonStyle2 = {
    fontStyle: "bold",
    textColor: "#302e2eff",
    font: "helvetica",
  };
  const getColumn = (label: any) => {
    return {
      content: label,
      styles: commonStyle,
    };
  };

  const label = (label: any) => {
    return {
      content: ` ${label.trim()}`,
      styles: commonStyle2,
    };
  }

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");

  // rows
  const row1 = [[label("Ord No."), getColumn(data.odNo), label("Date:"), getColumn(data.date)]];
  const row2 = [[label("Party Name"), getColumn(data.partyName)]];
  const row3 = [[label("Address"), getColumn(data.address), label("GST"), getColumn(data.isGst ? "Yes" : "No")]];
  const row4 = [[label("Item"), getColumn(data.productItem?.itemName), label("Size"), getColumn(data.size), label("Qty"), getColumn(data.qty)]];
  const row5 = [[label("Rate"), getColumn(data.rate), label("Printer"), getColumn(data.printer)]];
  const row6 = [[label("Lamination"), getColumn(data.lamination), label("Glossy Matt UV")]];
  const row7 = [
    [label(`${data.isPasting ? "Pasting /" : ""} ${data.isCutting ? "Cutting /" : ""} ${data.isCreasing ? "Creasing /" : ""}`), ""],
  ];
  const row14 = [
    [label("Foil:"), getColumn(data.isFoil ? "Yes" : "No"), label("Punching:"), getColumn(data.isPunching ? "Yes" : "No")],
  ];
  const row8 = [[label("Binding"), getColumn(data.binding)]];
  const row9 = [[label("Vendor"), getColumn(""), label("Paper"), getColumn(data.pType)]];
  const row15 = [[label("Purchase 1")]];
  const row16 = [[label("Purchase 2")]];
  const row10 = [[label("Date"), getColumn(""), label("GSM"), getColumn(""), label("Size"), getColumn(""), label("Qty"), getColumn("")]];
  const row11 = [[label("Vendor"), getColumn(""), label("Paper"), getColumn("")]];
  const row12 = [[label("Date"), getColumn(""), label("GSM"), getColumn(""), label("Size"), getColumn(""), label("Qty"), getColumn("")]];
  const row13 = [[label("Remarks"), getColumn("")]];

  // column style sets
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

  const col3 = {
    0: { cellWidth: 15, fontStyle: "bold" },
    1: { cellWidth: 20 },
    2: { cellWidth: 15, fontStyle: "bold" },
    3: { cellWidth: 20 },
    4: { cellWidth: 10, fontStyle: "bold" },
    5: { cellWidth: 18 },
  };

  const col2 = {
    0: { cellWidth: 16, fontStyle: "bold" },
    1: { cellWidth: 34 },
    2: { cellWidth: 16, fontStyle: "bold" },
    3: { cellWidth: 32 },
  };

  const col1 = {
    0: { cellWidth: 18, fontStyle: "bold" },
    1: { cellWidth: 80 },
  };

  const col5 = {
    0: { cellWidth: 50, fontStyle: "bold" },
    1: { cellWidth: 48 },
  };
  const col6 = {
    0: { cellWidth: 25, fontStyle: "bold" },
    1: { cellWidth: 25 },
    2: { cellWidth: 48, fontStyle: "bold" },
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
    head: [],
    body: rows,
    columnStyles: col,
    didParseCell: (dataCell: any) => {
      // Add top margin only for body cells
      if (dataCell.section === "body") {
        dataCell.cell.styles.cellPadding = {
          ...dataCell.cell.styles.cellPadding,
          top: 4, // adjust top margin here
        };
      }
    },
  });

  // sequentially render all rows
  let currentY = 2;
  const renderRow = (rows: any, col: any) => {
    autoTable(doc, tableOptions(currentY, rows, col) as any);
    currentY = doc.lastAutoTable.finalY; // update Y for next row
  };

  renderRow(row1, col2);
  renderRow(row2, col1);
  renderRow(row3, col2);
  renderRow(row4, col3);
  renderRow(row5, col2);
  renderRow(row6, col6);
  renderRow(row7, col5);
  renderRow(row14, col2);
  renderRow(row8, col1);
  renderRow(row9, col2);
  renderRow(row15, col1);
  renderRow(row10, col4);
  renderRow(row11, col2);
  renderRow(row16, col1);
  renderRow(row12, col4);
  renderRow(row13, col1);

  doc.save("binder-job-card.pdf");
};
