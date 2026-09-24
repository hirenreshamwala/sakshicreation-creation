"use client";

import { useEffect, useState } from "react";
import { Box, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import ThemeButton from "@/component/common_component/themebutton";
import type { Material } from "@/services/material.service";

type PrinterJobCardDialogProps = {
  open: boolean;
  onClose: () => void;
  order: any;
  materials: Material[];
};

const TEMPLATE_WIDTH = 1102;
const TEMPLATE_HEIGHT = 1427;
const PAPER_TABLE_Y = 1220;
const PAPER_HEADER_HEIGHT = 44;
const PAPER_ROW_HEIGHT = 76;
const BOTTOM_PADDING = 47;

const displayValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "N/A";
  return String(value);
};

const formatDate = (value: unknown) => {
  if (!value) return "N/A";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const drawFitText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  preferredSize = 25,
  minimumSize = 12,
) => {
  let fontSize = preferredSize;
  do {
    ctx.font = `600 ${fontSize}px Arial, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth || fontSize === minimumSize) break;
    fontSize -= 1;
  } while (fontSize >= minimumSize);
  ctx.fillText(text, x, y, maxWidth);
};

const drawWrappedText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
  fontSize = 22,
) => {
  ctx.font = `600 ${fontSize}px Arial, sans-serif`;
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  });
  if (line) lines.push(line);

  const visibleLines = lines.slice(0, maxLines);
  if (lines.length > maxLines && visibleLines.length) {
    let lastLine = `${visibleLines[visibleLines.length - 1]}...`;
    while (ctx.measureText(lastLine).width > maxWidth && lastLine.length > 3) {
      lastLine = `${lastLine.slice(0, -4)}...`;
    }
    visibleLines[visibleLines.length - 1] = lastLine;
  }

  visibleLines.forEach((value, index) => ctx.fillText(value, x, y + index * lineHeight, maxWidth));
};

const splitTextToFit = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
) => {
  const lines: string[] = [];
  let words = text.split(/\s+/).filter(Boolean);

  while (words.length && lines.length < maxLines) {
    let line = "";
    while (words.length) {
      const word = words[0];
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        line = candidate;
        words = words.slice(1);
        continue;
      }

      if (!line) {
        let splitAt = word.length;
        while (splitAt > 1 && ctx.measureText(word.slice(0, splitAt)).width > maxWidth) splitAt -= 1;
        line = word.slice(0, splitAt);
        words[0] = word.slice(splitAt);
        if (!words[0]) words = words.slice(1);
      }
      break;
    }
    if (line) lines.push(line);
  }

  if (words.length && lines.length) {
    let lastLine = `${lines[lines.length - 1]}...`;
    while (ctx.measureText(lastLine).width > maxWidth && lastLine.length > 3) {
      lastLine = `${lastLine.slice(0, -4)}...`;
    }
    lines[lines.length - 1] = lastLine;
  }
  return lines;
};

const drawPaperCell = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  top: number,
  width: number,
  height: number,
) => {
  const fontSize = Math.min(24, Math.max(15, Math.floor(height / 2.4)));
  const lineHeight = fontSize + 3;
  const maxLines = Math.max(1, Math.min(3, Math.floor(height / lineHeight)));
  ctx.font = `700 ${fontSize}px Arial, sans-serif`;
  const lines = splitTextToFit(ctx, text, width, maxLines);
  const contentHeight = lines.length * lineHeight;
  const firstBaseline = top + Math.max(fontSize, (height - contentHeight) / 2 + fontSize);
  lines.forEach((line, index) => ctx.fillText(line, x, firstBaseline + index * lineHeight, width));
};

const resolveMaterialValue = (
  value: any,
  field: "materialName" | "materialSize" | "materialGSM",
  materials: Material[],
) => {
  if (!value) return "N/A";
  if (typeof value === "object") return displayValue(value[field] ?? value.label ?? value.name);
  const material = materials.find((item) => item._id === value);
  return displayValue(material?.[field] ?? value);
};

const buildJobCard = async (order: any, materials: Material[]) => {
  const template = new Image();
  template.src = "/printer_job_card.png";
  await new Promise<void>((resolve, reject) => {
    template.onload = () => resolve();
    template.onerror = () => reject(new Error("Unable to load printer job card template"));
  });

  const papers = Array.isArray(order?.printerPapers) && order.printerPapers.length
    ? order.printerPapers
    : [{}];
  const tableHeight = PAPER_HEADER_HEIGHT + PAPER_ROW_HEIGHT * papers.length;
  const canvasHeight = Math.max(
    TEMPLATE_HEIGHT,
    PAPER_TABLE_Y + tableHeight + BOTTOM_PADDING,
  );

  const canvas = document.createElement("canvas");
  canvas.width = TEMPLATE_WIDTH;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Unable to create printer job card preview");

  if (canvasHeight === TEMPLATE_HEIGHT) {
    ctx.drawImage(template, 0, 0, TEMPLATE_WIDTH, TEMPLATE_HEIGHT);
  } else {
    const stretchStartY = 1150;
    ctx.drawImage(
      template,
      0,
      0,
      TEMPLATE_WIDTH,
      stretchStartY,
      0,
      0,
      TEMPLATE_WIDTH,
      stretchStartY,
    );
    ctx.drawImage(
      template,
      0,
      stretchStartY,
      TEMPLATE_WIDTH,
      TEMPLATE_HEIGHT - stretchStartY,
      0,
      stretchStartY,
      TEMPLATE_WIDTH,
      canvasHeight - stretchStartY,
    );
  }
  ctx.fillStyle = "#111";
  ctx.textBaseline = "alphabetic";

  drawFitText(ctx, displayValue(order?.orderNumber), 300, 466, 390, 32);
  drawFitText(ctx, formatDate(order?.printerAssignedAt), 807, 466, 240, 30);
  drawFitText(ctx, displayValue(order?.party?.partyName), 305, 627, 740, 30);
  drawFitText(ctx, displayValue(order?.jobName), 262, 786, 785, 30);
  drawFitText(ctx, displayValue(order?.productItem?.itemName), 158, 948, 230, 22);
  drawFitText(ctx, displayValue(order?.size), 482, 948, 285, 30);
  drawFitText(ctx, displayValue(order?.qty), 855, 948, 190, 30);

  drawWrappedText(ctx, displayValue(order?.printerRemarks), 262, 1098, 780, 30, 3, 22);

  const tableX = 54;
  const tableY = PAPER_TABLE_Y;
  const tableWidth = 994;
  const headerHeight = PAPER_HEADER_HEIGHT;
  const columnWidths = [380, 240, 170, 204];
  const columnTitles = ["PAPER", "SIZE", "GSM", "QTY"];
  const paperRowHeight = PAPER_ROW_HEIGHT;

  ctx.save();
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 2.5;
  ctx.strokeRect(tableX, tableY, tableWidth, tableHeight);

  ctx.beginPath();
  ctx.moveTo(tableX, tableY + headerHeight);
  ctx.lineTo(tableX + tableWidth, tableY + headerHeight);
  ctx.stroke();

  let dividerX = tableX;
  columnWidths.slice(0, -1).forEach((width) => {
    dividerX += width;
    ctx.beginPath();
    ctx.moveTo(dividerX, tableY);
    ctx.lineTo(dividerX, tableY + tableHeight);
    ctx.stroke();
  });

  for (let index = 1; index < papers.length; index += 1) {
    const rowY = tableY + headerHeight + paperRowHeight * index;
    ctx.beginPath();
    ctx.moveTo(tableX, rowY);
    ctx.lineTo(tableX + tableWidth, rowY);
    ctx.stroke();
  }

  ctx.fillStyle = "#111";
  ctx.font = "700 22px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let headerX = tableX;
  columnTitles.forEach((title, index) => {
    const width = columnWidths[index];
    ctx.fillText(title, headerX + width / 2, tableY + headerHeight / 2, width - 16);
    headerX += width;
  });
  ctx.restore();

  ctx.fillStyle = "#111";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  papers.forEach((paper: any, index: number) => {
    const rowTop = tableY + headerHeight + index * paperRowHeight;
    let cellX = tableX;
    drawPaperCell(
      ctx,
      resolveMaterialValue(paper?.paperType, "materialName", materials),
      cellX + 10,
      rowTop,
      columnWidths[0] - 20,
      paperRowHeight,
    );
    cellX += columnWidths[0];
    drawPaperCell(
      ctx,
      resolveMaterialValue(paper?.materialSize || paper?.sheetSize, "materialSize", materials),
      cellX + 10,
      rowTop,
      columnWidths[1] - 20,
      paperRowHeight,
    );
    cellX += columnWidths[1];
    drawPaperCell(
      ctx,
      resolveMaterialValue(paper?.gsm, "materialGSM", materials),
      cellX + 10,
      rowTop,
      columnWidths[2] - 20,
      paperRowHeight,
    );
    cellX += columnWidths[2];
    drawPaperCell(
      ctx,
      displayValue(paper?.numberOfSheetsUsed),
      cellX + 10,
      rowTop,
      columnWidths[3] - 20,
      paperRowHeight,
    );
  });
  return {
    url: canvas.toDataURL("image/png", 1),
    height: canvasHeight,
  };
};

const PrinterJobCardDialog = ({ open, onClose, order, materials }: PrinterJobCardDialogProps) => {
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewHeight, setPreviewHeight] = useState(TEMPLATE_HEIGHT);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    if (!open || !order) return;

    setPreviewUrl("");
    setError("");
    buildJobCard(order, materials)
      .then((preview) => {
        if (active) {
          setPreviewUrl(preview.url);
          setPreviewHeight(preview.height);
        }
      })
      .catch((previewError) => {
        if (active) setError(previewError?.message || "Unable to generate job card preview");
      });

    return () => {
      active = false;
    };
  }, [open, order, materials]);

  const handlePrint = () => {
    if (!previewUrl) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setError("Please allow pop-ups to print the job card.");
      return;
    }
    printWindow.opener = null;
    printWindow.document.title = `Printer Job Card - ${displayValue(order?.orderNumber)}`;
    const printHeightInches = (8.5 * previewHeight) / TEMPLATE_WIDTH;

    const style = printWindow.document.createElement("style");
    style.textContent = `
      @page { size: 8.5in ${printHeightInches}in; margin: 0; }
      html, body { width: 8.5in; height: ${printHeightInches}in; margin: 0; padding: 0; }
      img { display: block; width: 8.5in; height: auto; }
    `;
    printWindow.document.head.appendChild(style);

    const image = printWindow.document.createElement("img");
    image.alt = "Printer Job Card";
    image.onload = () => {
      printWindow.onafterprint = () => printWindow.close();
      printWindow.focus();
      printWindow.print();
    };
    image.src = previewUrl;
    printWindow.document.body.appendChild(image);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Printer Job Card Preview</DialogTitle>
      <DialogContent dividers>
        <Box minHeight={400} display="flex" justifyContent="center" alignItems="center">
          {!previewUrl && !error && <CircularProgress />}
          {error && <Box color="error.main">{error}</Box>}
          {previewUrl && (
            <Box
              component="img"
              src={previewUrl}
              alt="Completed printer job card"
              sx={{ width: "100%", maxWidth: 650, height: "auto", boxShadow: 3 }}
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <ThemeButton variant="outlined" onClick={onClose}>Close</ThemeButton>
        <ThemeButton onClick={handlePrint} disabled={!previewUrl}>Print</ThemeButton>
      </DialogActions>
    </Dialog>
  );
};

export default PrinterJobCardDialog;
