import CryptoJS from "crypto-js";
// function convertToPermissionsData(modules: string[]) {
//   return modules.map((module) => ({
//     feature: toTitleCase(module.replace(/_/g, " ")),
//     capabilities: defaultActions.map((action) => ({
//       type: action.label,
//       label: action.label,
//     })),
//   }));
// }

// function toTitleCase(str: string): string {
//   return str
//     .toLowerCase()
//     .split(" ")
//     .map((word) => word[0].toUpperCase() + word.slice(1))
//     .join(" ");
// }

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