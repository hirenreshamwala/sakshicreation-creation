"use client";

import { useEffect, useState } from "react";
import { Box, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import ThemeButton from "@/component/common_component/themebutton";
import type { Material } from "@/services/material.service";

type Props = {
  open: boolean;
  onClose: () => void;
  order: any;
  materials: Material[];
};

const TEMPLATE_WIDTH = 1102;
const TEMPLATE_HEIGHT = 1427;
const PAPER_TABLE_Y = 1220;
const HEADER_HEIGHT = 44;
const ROW_HEIGHT = 76;
const BOTTOM_PADDING = 47;

const displayValue = (value: unknown) =>
  value === null || value === undefined || value === "" ? "N/A" : String(value);

const formatDate = (value: unknown) => {
  if (!value) return "N/A";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
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
) => {
  ctx.font = "600 22px Arial, sans-serif";
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) line = candidate;
    else {
      if (line) lines.push(line);
      line = word;
    }
  });
  if (line) lines.push(line);

  const visible = lines.slice(0, maxLines);
  if (lines.length > maxLines && visible.length) {
    let last = `${visible[visible.length - 1]}...`;
    while (ctx.measureText(last).width > maxWidth && last.length > 3) last = `${last.slice(0, -4)}...`;
    visible[visible.length - 1] = last;
  }
  visible.forEach((value, index) => ctx.fillText(value, x, y + index * lineHeight, maxWidth));
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
    let last = `${lines[lines.length - 1]}...`;
    while (ctx.measureText(last).width > maxWidth && last.length > 3) last = `${last.slice(0, -4)}...`;
    lines[lines.length - 1] = last;
  }
  return lines;
};

const drawPaperCell = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  top: number,
  width: number,
) => {
  const fontSize = 24;
  const lineHeight = 27;
  ctx.font = `700 ${fontSize}px Arial, sans-serif`;
  const lines = splitTextToFit(ctx, text, width, 3);
  const firstBaseline = top + Math.max(fontSize, (ROW_HEIGHT - lines.length * lineHeight) / 2 + fontSize);
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

const drawCheck = (ctx: CanvasRenderingContext2D, checked: boolean, x: number, y: number) => {
  if (!checked) return;
  ctx.save();
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - 10, y);
  ctx.lineTo(x - 2, y + 9);
  ctx.lineTo(x + 13, y - 11);
  ctx.stroke();
  ctx.restore();
};

const buildJobCard = async (order: any, materials: Material[]) => {
  const template = new Image();
  template.src = "/booklet_binder_job_card.png";
  await new Promise<void>((resolve, reject) => {
    template.onload = () => resolve();
    template.onerror = () => reject(new Error("Unable to load booklet binder job card template"));
  });

  const papers = Array.isArray(order?.bookletPapers) && order.bookletPapers.length
    ? order.bookletPapers
    : [{}];
  const tableHeight = HEADER_HEIGHT + ROW_HEIGHT * papers.length;
  const canvasHeight = Math.max(TEMPLATE_HEIGHT, PAPER_TABLE_Y + tableHeight + BOTTOM_PADDING);
  const canvas = document.createElement("canvas");
  canvas.width = TEMPLATE_WIDTH;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Unable to create booklet binder job card preview");

  if (canvasHeight === TEMPLATE_HEIGHT) {
    ctx.drawImage(template, 0, 0, TEMPLATE_WIDTH, TEMPLATE_HEIGHT);
  } else {
    const stretchStartY = 1200;
    ctx.drawImage(template, 0, 0, TEMPLATE_WIDTH, stretchStartY, 0, 0, TEMPLATE_WIDTH, stretchStartY);
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
  drawFitText(ctx, displayValue(order?.orderNumber), 265, 460, 415, 30);
  drawFitText(ctx, formatDate(order?.bookletBinderAssignedAt), 800, 460, 250, 30);
  drawFitText(ctx, displayValue(order?.party?.partyName), 305, 575, 740, 30);
  drawFitText(ctx, displayValue(order?.jobName), 265, 690, 780, 30);
  drawFitText(ctx, displayValue(order?.productItem?.itemName), 165, 805, 250, 22);
  drawFitText(ctx, displayValue(order?.size), 510, 805, 265, 30);
  drawFitText(ctx, displayValue(order?.qty), 855, 805, 190, 30);

  const laminationType = String(order?.laminationType || "").toLowerCase();
  drawCheck(ctx, !!order?.isLamination && laminationType.startsWith("gloss"), 347, 912);
  drawCheck(ctx, !!order?.isLamination && laminationType === "matte", 572, 912);
  drawCheck(ctx, order?.uv === true || String(order?.uv).toLowerCase() === "yes", 783, 912);
  drawCheck(ctx, !!order?.isFoil, 950, 912);
  drawCheck(ctx, !!order?.isPasting, 217, 1029);
  drawCheck(ctx, !!order?.isCutting, 468, 1029);
  drawCheck(ctx, !!order?.isCreasing, 746, 1029);
  drawCheck(ctx, !!order?.isPunching, 1028, 1029);
  drawWrappedText(ctx, displayValue(order?.bookletBinderRemarks), 263, 1120, 780, 34, 2);

  const tableX = 54;
  const tableWidth = 994;
  const columnWidths = [380, 240, 170, 204];
  const titles = ["BOOKLET PAPER", "SIZE", "GSM", "QTY"];
  ctx.save();
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 2.5;
  ctx.strokeRect(tableX, PAPER_TABLE_Y, tableWidth, tableHeight);
  ctx.beginPath();
  ctx.moveTo(tableX, PAPER_TABLE_Y + HEADER_HEIGHT);
  ctx.lineTo(tableX + tableWidth, PAPER_TABLE_Y + HEADER_HEIGHT);
  ctx.stroke();
  let dividerX = tableX;
  columnWidths.slice(0, -1).forEach((width) => {
    dividerX += width;
    ctx.beginPath();
    ctx.moveTo(dividerX, PAPER_TABLE_Y);
    ctx.lineTo(dividerX, PAPER_TABLE_Y + tableHeight);
    ctx.stroke();
  });
  for (let index = 1; index < papers.length; index += 1) {
    const rowY = PAPER_TABLE_Y + HEADER_HEIGHT + ROW_HEIGHT * index;
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
  titles.forEach((title, index) => {
    const width = columnWidths[index];
    ctx.fillText(title, headerX + width / 2, PAPER_TABLE_Y + HEADER_HEIGHT / 2, width - 16);
    headerX += width;
  });
  ctx.restore();

  ctx.fillStyle = "#111";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  papers.forEach((paper: any, index: number) => {
    const rowTop = PAPER_TABLE_Y + HEADER_HEIGHT + index * ROW_HEIGHT;
    let cellX = tableX;
    drawPaperCell(ctx, resolveMaterialValue(paper?.paperType, "materialName", materials), cellX + 10, rowTop, columnWidths[0] - 20);
    cellX += columnWidths[0];
    drawPaperCell(ctx, resolveMaterialValue(paper?.sheetSize, "materialSize", materials), cellX + 10, rowTop, columnWidths[1] - 20);
    cellX += columnWidths[1];
    drawPaperCell(ctx, resolveMaterialValue(paper?.gsm, "materialGSM", materials), cellX + 10, rowTop, columnWidths[2] - 20);
    cellX += columnWidths[2];
    drawPaperCell(ctx, displayValue(paper?.numberOfSheetsUsed), cellX + 10, rowTop, columnWidths[3] - 20);
  });

  return { url: canvas.toDataURL("image/png", 1), height: canvasHeight };
};

const BookletBinderJobCardDialog = ({ open, onClose, order, materials }: Props) => {
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
    return () => { active = false; };
  }, [open, order, materials]);

  const handlePrint = () => {
    if (!previewUrl) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setError("Please allow pop-ups to print the job card.");
      return;
    }
    printWindow.opener = null;
    printWindow.document.title = `Booklet Job Card - ${displayValue(order?.orderNumber)}`;
    const printHeightInches = (8.5 * previewHeight) / TEMPLATE_WIDTH;
    const style = printWindow.document.createElement("style");
    style.textContent = `
      @page { size: 8.5in ${printHeightInches}in; margin: 0; }
      html, body { width: 8.5in; height: ${printHeightInches}in; margin: 0; padding: 0; }
      img { display: block; width: 8.5in; height: auto; }
    `;
    printWindow.document.head.appendChild(style);
    const image = printWindow.document.createElement("img");
    image.alt = "Booklet Binder Job Card";
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
      <DialogTitle>Booklet Binder Job Card Preview</DialogTitle>
      <DialogContent dividers>
        <Box minHeight={400} display="flex" justifyContent="center" alignItems="center">
          {!previewUrl && !error && <CircularProgress />}
          {error && <Box color="error.main">{error}</Box>}
          {previewUrl && (
            <Box
              component="img"
              src={previewUrl}
              alt="Completed booklet binder job card"
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

export default BookletBinderJobCardDialog;
