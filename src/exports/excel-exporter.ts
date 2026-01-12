import { Workbook } from "exceljs";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import { Chart, registerables } from "chart.js";
import { ILayout, IReportItem, IBarcodeReportItem, IQRCodeReportItem, IChartReportItem } from "../core/layout";
import { generateItems, generatePageSectionItems } from "../core/utils/generate";
import { getExcelPaperSize } from "../core/utils/pageSize";
import { pxToPt } from "../core/utils/units";

Chart.register(...registerables);

export async function exportToXlsx(layout: ILayout, data: any) {
  let items = generateItems(layout, data, { rootData: data });

  // Handle Page Header (Visible on First Page)
  if (layout.pageHeaderSection && layout.pageHeaderSection.visibleOnFirstPage) {
    const headerItems = generatePageSectionItems(layout.pageHeaderSection, data, 0, { data, rootData: data });

    // Calculate header height
    let headerHeight = 0;
    for (const item of headerItems) {
      headerHeight = Math.max(headerHeight, item.y + item.height);
    }
    // Add small padding
    headerHeight += 10;

    // Shift content items down
    items.forEach(item => item.y += headerHeight);

    // Prepend header items
    items = [...headerItems, ...items];
  }

  // Handle Page Footer (Visible on Last Page)
  if (layout.pageFooterSection && layout.pageFooterSection.visibleOnLastPage) {
    // Find bottom of content
    let contentBottom = 0;
    for (const item of items) {
      contentBottom = Math.max(contentBottom, item.y + item.height);
    }
    // Add padding
    contentBottom += 10;

    const footerItems = generatePageSectionItems(layout.pageFooterSection, data, 0, { data, rootData: data });

    // Shift footer items to bottom
    footerItems.forEach(item => item.y += contentBottom);

    items = [...items, ...footerItems];
  }

  // excelMeta works with Pixels as defined in layout (HTML)
  const excelMeta = getExcelMeta(items);

  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet("Worksheet1");

  // Set page setup based on layout pageSize
  worksheet.pageSetup = {
    paperSize: getExcelPaperSize(layout.pageSize),
    orientation: "portrait",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  };

  // Excel column widths are roughly 1/7 of a pixel or something weird (char width).
  // 0.3 factor is a heuristic.
  // Standard heuristic: 1px is approx 0.14 units usually?
  // Let's stick with 0.15 heuristic for now but standardizing via points could be better later.
  worksheet.columns = excelMeta.columns.map(x => ({ key: x.key, width: pxToPt(x.width) / 5 })); // Adjusted heuristic

  for (const item of items) {
    if (item.type === "text") {
      const cellName = excelMeta.getCellName(item.x, item.y);
      const cell = worksheet.getCell(cellName);
      cell.value = item.text;

      // Apply styling from item properties (including conditional styles already applied)
      if (item.color && item.color !== "#000000") {
        cell.font = { ...cell.font, color: { argb: hexToArgb(item.color) } };
      }
      if (item.backgroundColor && item.backgroundColor !== "transparent") {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: hexToArgb(item.backgroundColor) },
        };
      }
      if (item.fontWeight === "bold" || item.fontWeight === "700" || item.fontWeight === "800" || item.fontWeight === "900") {
        cell.font = { ...cell.font, bold: true };
      }
      if (item.fontSize) {
        const size = parseInt(item.fontSize.replace("px", ""));
        cell.font = { ...cell.font, size: Math.round(size * 0.75) }; // Convert px to pt
      }
      if (item.fontFamily) {
        cell.font = { ...cell.font, name: item.fontFamily.split(",")[0].trim().replace(/['"]/g, "") };
      }
      if (item.textAlign) {
        cell.alignment = { ...cell.alignment, horizontal: item.textAlign as "left" | "center" | "right" };
      }
      if (item.borderWidth && item.borderColor) {
        const borderColor = { argb: hexToArgb(item.borderColor) };
        cell.border = {
          top: { style: "thin", color: borderColor },
          left: { style: "thin", color: borderColor },
          bottom: { style: "thin", color: borderColor },
          right: { style: "thin", color: borderColor },
        };
      }
    } else if (item.type === "barcode") {
      try {
        const barcodeItem = item as IBarcodeReportItem;
        const barcodeValue = barcodeItem.value || "0000000000";
        const displayValue = barcodeItem.displayValue ?? false;
        // Account for 4px padding on each side (8px total)
        const innerWidth = item.width - 8;
        const innerHeight = item.height - 8;
        const base64 = await generateBarcodeBase64(barcodeValue, barcodeItem.format || "CODE128", innerWidth, innerHeight, barcodeItem.barWidth || 1, displayValue);

        const imageId = workbook.addImage({
          base64,
          extension: 'png',
        });

        const rowIndex = excelMeta.rows.findIndex(r => r.breakpoint === Math.round(item.y));
        const colIndex = excelMeta.columns.findIndex(c => c.breakpoint === Math.round(item.x));

        worksheet.addImage(imageId, {
          tl: { col: colIndex, row: rowIndex },
          ext: { width: item.width, height: item.height },
        });
      } catch (e) {
        // Skip invalid barcodes
      }
    } else if (item.type === "qrcode") {
      try {
        const qrItem = item as IQRCodeReportItem;
        const qrValue = qrItem.value || "https://example.com";
        // Account for 4px padding on each side (8px total)
        const innerSize = Math.min(item.width, item.height) - 8;

        const dataUrl = await QRCode.toDataURL(qrValue, {
          width: innerSize,
          margin: 0,
          errorCorrectionLevel: qrItem.errorCorrectionLevel || "M",
        });
        const base64 = dataUrl.split(',')[1];

        const imageId = workbook.addImage({
          base64,
          extension: 'png',
        });

        const rowIndex = excelMeta.rows.findIndex(r => r.breakpoint === Math.round(item.y));
        const colIndex = excelMeta.columns.findIndex(c => c.breakpoint === Math.round(item.x));

        worksheet.addImage(imageId, {
          tl: { col: colIndex, row: rowIndex },
          ext: { width: innerSize, height: innerSize },
        });
      } catch (e) {
        // Skip invalid QR codes
      }
    } else if (item.type === "chart") {
      try {
        const chartItem = item as IChartReportItem;
        const base64 = await generateChartBase64(chartItem);

        const imageId = workbook.addImage({
          base64,
          extension: 'png',
        });

        const rowIndex = excelMeta.rows.findIndex(r => r.breakpoint === Math.round(item.y));
        const colIndex = excelMeta.columns.findIndex(c => c.breakpoint === Math.round(item.x));

        worksheet.addImage(imageId, {
          tl: { col: colIndex, row: rowIndex },
          ext: { width: item.width, height: item.height },
        });
      } catch (e) {
        // Skip invalid charts
      }
    }
  }

  excelMeta.rows.forEach(x => worksheet.getRow(x.key).height = x.height);

  return workbook;
}

async function generateChartBase64(chartItem: IChartReportItem): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = chartItem.width;
  canvas.height = chartItem.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  const chartData = {
    labels: chartItem.labels || ["Label 1", "Label 2", "Label 3"],
    datasets: chartItem.datasets || [
      {
        label: "Sample Data",
        data: [10, 20, 30],
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
        borderColor: ["#FF6384", "#36A2EB", "#FFCE56"],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions: any = {
    responsive: false,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      title: {
        display: !!chartItem.title,
        text: chartItem.title || "",
      },
      legend: {
        display: chartItem.legend?.display ?? chartItem.showLegend ?? true,
        position: chartItem.legend?.position || chartItem.legendPosition || "top",
        align: chartItem.legend?.align || "center",
        title: chartItem.legend?.title ? {
          display: true,
          text: chartItem.legend.title,
        } : undefined,
      },
    },
  };

  // Add scales configuration for bar/line charts
  if (["bar", "line", "radar"].includes(chartItem.chartType)) {
    chartOptions.scales = {
      x: {
        display: chartItem.scales?.x?.display ?? true,
        stacked: chartItem.scales?.x?.stacked,
        title: {
          display: !!chartItem.scales?.x?.title?.text,
          text: chartItem.scales?.x?.title?.text || "",
          color: chartItem.scales?.x?.title?.color,
          font: chartItem.scales?.x?.title?.font,
        },
      },
      y: {
        display: chartItem.scales?.y?.display ?? true,
        stacked: chartItem.scales?.y?.stacked,
        beginAtZero: chartItem.scales?.y?.beginAtZero,
        min: chartItem.scales?.y?.min,
        max: chartItem.scales?.y?.max,
        title: {
          display: !!chartItem.scales?.y?.title?.text,
          text: chartItem.scales?.y?.title?.text || "",
          color: chartItem.scales?.y?.title?.color,
          font: chartItem.scales?.y?.title?.font,
        },
      },
    };
  }

  const chart = new Chart(ctx, {
    type: chartItem.chartType || "bar",
    data: chartData,
    options: chartOptions,
  });

  // Wait for chart to render
  await new Promise(resolve => setTimeout(resolve, 100));

  const dataUrl = canvas.toDataURL('image/png');
  chart.destroy();

  return dataUrl.split(',')[1];
}

async function generateBarcodeBase64(value: string, format: string, width: number, height: number, barWidth: number, displayValue: boolean = false): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  JsBarcode(canvas, value, {
    format: format,
    width: barWidth,
    height: displayValue ? height - 20 : height,
    displayValue: displayValue,
    margin: 0,
  });

  const dataUrl = canvas.toDataURL('image/png');
  return dataUrl.split(',')[1];
}

function hexToArgb(hex: string): string {
  if (!hex || hex === "transparent") return "00000000";
  const hexString = hex.startsWith('#') ? hex.slice(1) : hex;

  if (hexString.length === 3) {
    const r = hexString[0] + hexString[0];
    const g = hexString[1] + hexString[1];
    const b = hexString[2] + hexString[2];
    return `FF${r}${g}${b}`.toUpperCase();
  }

  return `FF${hexString}`.toUpperCase();
}

export function getExcelMeta(items: IReportItem[]) {
  const column_breakpoints: number[] = [0];
  const row_breakpoints: number[] = [0];

  for (const item of items) {
    const x = Math.round(item.x);
    const y = Math.round(item.y);
    const width = Math.round(item.width);
    const height = Math.round(item.height);

    if (!column_breakpoints.includes(x)) column_breakpoints.push(x);
    if (!column_breakpoints.includes(x + width)) column_breakpoints.push(x + width);

    if (!row_breakpoints.includes(y)) row_breakpoints.push(y);
    if (!row_breakpoints.includes(y + height)) row_breakpoints.push(y + height);
  }

  column_breakpoints.sort((a, b) => a - b);
  row_breakpoints.sort((a, b) => a - b);

  const columns: { key: string, breakpoint: number, width: number }[] = [];
  const rows: { key: number, breakpoint: number, height: number }[] = [];

  for (let i = 0; i < column_breakpoints.length - 1; i++) {
    columns.push({
      key: getColumnName(i),
      breakpoint: column_breakpoints[i],
      width: column_breakpoints[i + 1] - column_breakpoints[i],
    });
  }

  for (let i = 0; i < row_breakpoints.length - 1; i++) {
    rows.push({
      key: i + 1,
      breakpoint: row_breakpoints[i],
      height: row_breakpoints[i + 1] - row_breakpoints[i],
    });
  }

  const getCellName = (x: number, y: number) => {
    const col = columns.find(c => c.breakpoint === x);
    const row = rows.find(r => r.breakpoint === y);

    if (!col || !row) return "A1"; // Fallback to avoid crash

    return `${col.key}${row.key}`;
  }

  // TODO: Fix name
  const getBeforeCellName = (cell: number, row: number) => {
    const cellIndex = column_breakpoints.findIndex(x => x === cell);
    const cellName = getColumnName(cellIndex >= 0 ? cellIndex : 0);
    const rowIndex = row_breakpoints.findIndex(x => x === row) + 1;

    return `${cellName}${rowIndex}`;
  }

  return { columns, rows, getCellName, getBeforeCellName };
}

function getColumnName(index: number): string {
  let name = '';
  let num = index;
  while (num >= 0) {
    name = String.fromCharCode(65 + (num % 26)) + name;
    num = Math.floor(num / 26) - 1;
  }
  return name;
}
