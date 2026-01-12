import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from "pdf-lib";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import { Chart, registerables } from "chart.js";
import { ILayout, IReportItem, ISection, IBarcodeReportItem, IQRCodeReportItem, IChartReportItem } from "../core/layout";
import { generateItemsWithSections, GenerateContext, SectionGroup } from "../core/utils/generate";
import { evaluateExpression, ExpressionContext } from "../core/utils/expression";
import { resolvePageDimensions } from "../core/utils/pageSize";

Chart.register(...registerables);

// Printer-friendly margins (in points, 1 inch = 72 points)
const PRINT_MARGIN = {
  top: 0,      // No extra margin - layout should define its own
  bottom: 0,
  left: 0,
  right: 0,
};

// Font cache for embedded fonts
interface FontCache {
  [key: string]: PDFFont;
}

async function embedFonts(doc: PDFDocument): Promise<FontCache> {
  const fonts: FontCache = {};
  
  // Embed standard fonts with regular and bold variants
  fonts['Helvetica'] = await doc.embedFont(StandardFonts.Helvetica);
  fonts['Helvetica-Bold'] = await doc.embedFont(StandardFonts.HelveticaBold);
  fonts['Times-Roman'] = await doc.embedFont(StandardFonts.TimesRoman);
  fonts['Times-Bold'] = await doc.embedFont(StandardFonts.TimesRomanBold);
  fonts['Courier'] = await doc.embedFont(StandardFonts.Courier);
  fonts['Courier-Bold'] = await doc.embedFont(StandardFonts.CourierBold);
  
  return fonts;
}

function getFont(fonts: FontCache, fontFamily?: string, fontWeight?: string): PDFFont {
  const isBold = fontWeight === 'bold' || fontWeight === '700' || fontWeight === '800' || fontWeight === '900';
  const family = (fontFamily || 'Helvetica').toLowerCase();
  
  // Map common font families to PDF standard fonts
  if (family.includes('arial') || family.includes('helvetica') || family.includes('sans')) {
    return isBold ? fonts['Helvetica-Bold'] : fonts['Helvetica'];
  } else if (family.includes('times') || family.includes('serif')) {
    return isBold ? fonts['Times-Bold'] : fonts['Times-Roman'];
  } else if (family.includes('courier') || family.includes('mono')) {
    return isBold ? fonts['Courier-Bold'] : fonts['Courier'];
  }
  
  // Default to Helvetica
  return isBold ? fonts['Helvetica-Bold'] : fonts['Helvetica'];
}

export async function exportToPdf(layout: ILayout, data: any) {
  // Clear image cache for fresh export
  imageCache.clear();
  
  const doc = await PDFDocument.create();
  const fonts = await embedFonts(doc);
  
  // Resolve page dimensions from pageSize or explicit width/height
  const { width: pageWidth, height: pageHeight } = resolvePageDimensions(
    layout.pageSize,
    layout.width,
    layout.height
  );

  // Calculate usable page area (accounting for page header/footer)
  const pageHeaderHeight = layout.pageHeaderSection 
    ? (layout.pageHeaderSection.height === "auto" ? calculateSectionHeight(layout.pageHeaderSection) : layout.pageHeaderSection.height)
    : 0;
  const pageFooterHeight = layout.pageFooterSection
    ? (layout.pageFooterSection.height === "auto" ? calculateSectionHeight(layout.pageFooterSection) : layout.pageFooterSection.height)
    : 0;
  
  const contentAreaTop = PRINT_MARGIN.top + pageHeaderHeight;
  const contentAreaBottom = pageHeight - PRINT_MARGIN.bottom - pageFooterHeight;
  const contentAreaHeight = contentAreaBottom - contentAreaTop;

  // Generate all content items with section grouping info
  const { items: allItems, sectionGroups } = generateItemsWithSections(layout, data, { rootData: data });
  
  // Paginate items respecting keepTogether sections
  const pages = paginateItems(allItems, sectionGroups, contentAreaHeight, contentAreaTop);
  const totalPages = Math.max(1, pages.length);
  
  for (let pageNum = 0; pageNum < totalPages; pageNum++) {
    const currentPage = doc.addPage([pageWidth, pageHeight]);
    const pageData = pages[pageNum] || { items: [], yOffset: 0 };
    
    // Render content items for this page
    await renderItems(currentPage, pageData.items, pageHeight, pageData.yOffset, fonts, doc);
    
    // Render page header (if defined)
    if (layout.pageHeaderSection) {
      const pageContext: ExpressionContext = {
        data,
        rootData: data,
        pageNum: pageNum + 1,
        totalPages,
      };
      const pageHeaderItems = generatePageSectionItems(
        layout.pageHeaderSection,
        data,
        PRINT_MARGIN.top,
        pageContext
      );
      await renderItems(currentPage, pageHeaderItems, pageHeight, 0, fonts, doc);
    }
    
    // Render page footer (if defined)
    if (layout.pageFooterSection) {
      const pageContext: ExpressionContext = {
        data,
        rootData: data,
        pageNum: pageNum + 1,
        totalPages,
      };
      const pageFooterItems = generatePageSectionItems(
        layout.pageFooterSection,
        data,
        pageHeight - pageFooterHeight - PRINT_MARGIN.bottom,
        pageContext
      );
      await renderItems(currentPage, pageFooterItems, pageHeight, 0, fonts, doc);
    }
  }

  return await doc.save();
}

function calculateSectionHeight(section: ISection): number {
  let maxBottom = 0;
  for (const item of section.items || []) {
    const itemBottom = (item.y || 0) + (item.height || 0);
    if (itemBottom > maxBottom) {
      maxBottom = itemBottom;
    }
  }
  return maxBottom + 5; // Small padding
}

interface PageData {
  items: IReportItem[];
  yOffset: number;
}

function paginateItems(
  items: IReportItem[],
  sectionGroups: SectionGroup[],
  contentAreaHeight: number,
  contentAreaTop: number
): PageData[] {
  const pages: PageData[] = [];
  let currentPageItems: IReportItem[] = [];
  let currentPageStartY = 0;
  let currentPageUsedHeight = 0;

  // Sort items by Y position
  const sortedItems = [...items].sort((a, b) => a.y - b.y);
  
  // Build a map of item Y positions to their section groups (for keepTogether)
  const itemToGroup = new Map<number, SectionGroup>();
  for (const group of sectionGroups) {
    if (group.keepTogether) {
      for (const item of sortedItems) {
        if (item.y >= group.startY && item.y < group.endY) {
          itemToGroup.set(item.y, group);
        }
      }
    }
  }

  let i = 0;
  while (i < sortedItems.length) {
    const item = sortedItems[i];
    const itemRelativeY = item.y - currentPageStartY;
    const itemHeight = item.height;
    
    // Check if this item belongs to a keepTogether group
    const group = itemToGroup.get(item.y);
    
    if (group && group.keepTogether) {
      // Calculate the total height of the keepTogether group
      const groupHeight = group.endY - group.startY;
      const groupRelativeY = group.startY - currentPageStartY;
      
      // Check if the entire group fits on current page
      if (groupRelativeY + groupHeight > contentAreaHeight && currentPageItems.length > 0) {
        // Start new page - group doesn't fit
        pages.push({
          items: currentPageItems,
          yOffset: -currentPageStartY + contentAreaTop,
        });
        currentPageStartY = group.startY;
        currentPageItems = [];
        currentPageUsedHeight = 0;
      }
      
      // Add all items from this group to current page
      while (i < sortedItems.length) {
        const groupItem = sortedItems[i];
        if (groupItem.y >= group.endY) break;
        currentPageItems.push(groupItem);
        currentPageUsedHeight = Math.max(currentPageUsedHeight, groupItem.y + groupItem.height - currentPageStartY);
        i++;
      }
    } else {
      // Regular item - check if it fits
      if (itemRelativeY + itemHeight > contentAreaHeight && currentPageItems.length > 0) {
        // Start new page
        pages.push({
          items: currentPageItems,
          yOffset: -currentPageStartY + contentAreaTop,
        });
        currentPageStartY = item.y;
        currentPageItems = [];
        currentPageUsedHeight = 0;
      }
      
      currentPageItems.push(item);
      currentPageUsedHeight = Math.max(currentPageUsedHeight, item.y + item.height - currentPageStartY);
      i++;
    }
  }
  
  // Add remaining items as last page
  if (currentPageItems.length > 0) {
    pages.push({
      items: currentPageItems,
      yOffset: -currentPageStartY + contentAreaTop,
    });
  }
  
  // Ensure at least one page
  if (pages.length === 0) {
    pages.push({ items: [], yOffset: contentAreaTop });
  }
  
  return pages;
}

function generatePageSectionItems(
  section: ISection,
  data: any,
  yOffset: number,
  context: ExpressionContext
): IReportItem[] {
  const items: IReportItem[] = [];

  section.items?.forEach(item => {
    const result = { ...item } as IReportItem;
    result.y = yOffset + item.y;

    if (result.type === "text" && result.binding) {
      const value = evaluateExpression(result.binding, context);
      (result as any).text = String(value ?? "");
    }

    if (!result.color) result.color = "#000000";
    if (!result.fontSize) result.fontSize = "12px";
    if (!result.fontFamily) result.fontFamily = "Arial";

    items.push(result);
  });

  return items;
}

// Cache for embedded images to avoid re-generating
const imageCache = new Map<string, any>();

async function renderItems(
  page: PDFPage,
  items: IReportItem[],
  pageHeight: number,
  yOffset: number,
  fonts: FontCache,
  doc: PDFDocument
) {
  for (const item of items) {
    // Skip items that are outside the visible page area
    const itemY = pageHeight - item.y - item.height + yOffset;
    if (itemY < -item.height || itemY > pageHeight + item.height) {
      continue;
    }
    if (item.type === "text") {
      const itemTopY = pageHeight - item.y - item.height + yOffset;
      
      // Draw background and border first
      if ((item.borderWidth && item.borderColor) || item.backgroundColor) {
        page.drawRectangle({
          x: item.x,
          y: itemTopY,
          width: item.width,
          height: item.height,
          borderColor: item.borderColor ? hexToRgb(item.borderColor) : undefined,
          color: item.backgroundColor && item.backgroundColor !== 'transparent' ? hexToRgb(item.backgroundColor) : undefined,
          borderWidth: item.borderWidth || 0,
        });
      }

      // Get the appropriate font based on fontFamily and fontWeight
      const font = getFont(fonts, item.fontFamily, item.fontWeight);
      const fontSize = parseInt((item.fontSize || "12px").replace("px", ""));
      const text = String(item.text ?? "");
      
      if (!text) continue; // Skip empty text
      
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      
      // PDF text is positioned at baseline, not top
      // Use ascender height for proper vertical centering
      const ascent = font.heightAtSize(fontSize) * 0.75; // Approximate ascender
      const descent = font.heightAtSize(fontSize) * 0.25; // Approximate descender
      
      // Calculate X position based on text alignment with small padding
      const padding = 2;
      let textX = item.x + padding;
      if (item.textAlign === "center") {
        textX = item.x + (item.width - textWidth) / 2;
      } else if (item.textAlign === "right") {
        textX = item.x + item.width - textWidth - padding;
      }

      // Vertically center text baseline in the item height
      // Position = bottom of box + (box height - text height) / 2 + ascent
      const textY = itemTopY + (item.height - (ascent + descent)) / 2 + descent;

      page.drawText(text, {
        x: Math.max(item.x, textX), // Ensure text doesn't go outside left bound
        y: textY,
        color: hexToRgb(item.color) || rgb(0, 0, 0),
        font: font,
        size: fontSize,
      });
    } else if (item.type === "image" && item.source) {
      try {
        const image = await doc.embedPng(item.source);
        page.drawImage(image, {
          x: item.x,
          y: pageHeight - item.y - item.height + yOffset,
          width: item.width,
          height: item.height,
        });
      } catch (e) {
        // Skip invalid images
      }
    } else if (item.type === "barcode") {
      const barcodeItem = item as IBarcodeReportItem;
      const barcodeValue = barcodeItem.value || "0000000000";
      const displayValue = barcodeItem.displayValue ?? false;
      // Account for 4px padding on each side (8px total)
      const innerWidth = item.width - 8;
      const innerHeight = item.height - 8;
      const cacheKey = `barcode:${barcodeValue}:${barcodeItem.format}:${innerWidth}:${innerHeight}:${displayValue}`;
      try {
        let image = imageCache.get(cacheKey);
        if (!image) {
          const pngDataUrl = await generateBarcodePng(barcodeValue, barcodeItem.format || "CODE128", innerWidth, innerHeight, barcodeItem.barWidth || 1, displayValue);
          const pngData = pngDataUrl.split(',')[1];
          const pngBytes = Uint8Array.from(atob(pngData), c => c.charCodeAt(0));
          image = await doc.embedPng(pngBytes);
          imageCache.set(cacheKey, image);
        }
        // Draw with 4px padding offset
        page.drawImage(image, {
          x: item.x + 4,
          y: pageHeight - item.y - item.height + yOffset + 4,
          width: innerWidth,
          height: innerHeight,
        });
      } catch (e) {
        // Skip invalid barcodes
      }
    } else if (item.type === "qrcode") {
      const qrItem = item as IQRCodeReportItem;
      const qrValue = qrItem.value || "https://example.com";
      // Account for 4px padding on each side (8px total)
      const innerSize = Math.min(item.width, item.height) - 8;
      const cacheKey = `qrcode:${qrValue}:${innerSize}`;
      try {
        let image = imageCache.get(cacheKey);
        if (!image) {
          const pngDataUrl = await QRCode.toDataURL(qrValue, {
            width: innerSize,
            margin: 0,
            errorCorrectionLevel: qrItem.errorCorrectionLevel || "M",
          });
          const pngData = pngDataUrl.split(',')[1];
          const pngBytes = Uint8Array.from(atob(pngData), c => c.charCodeAt(0));
          image = await doc.embedPng(pngBytes);
          imageCache.set(cacheKey, image);
        }
        // Draw with 4px padding offset
        page.drawImage(image, {
          x: item.x + 4,
          y: pageHeight - item.y - item.height + yOffset + 4,
          width: innerSize,
          height: innerSize,
        });
        console.log(`[PDF-DEBUG-4] QR rendered: ${qrValue.slice(0,30)}...`);
      } catch (e) {
        console.error("[PDF-DEBUG-4-ERR] QR code error:", e);
      }
    } else if (item.type === "chart") {
      const chartItem = item as IChartReportItem;
      const cacheKey = `chart:${item.x}:${item.y}:${item.width}:${item.height}:${chartItem.chartType}`;
      try {
        let image = imageCache.get(cacheKey);
        if (!image) {
          const base64 = await generateChartPng(chartItem);
          const pngBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
          image = await doc.embedPng(pngBytes);
          imageCache.set(cacheKey, image);
        }
        page.drawImage(image, {
          x: item.x,
          y: pageHeight - item.y - item.height + yOffset,
          width: item.width,
          height: item.height,
        });
        console.log(`[PDF-DEBUG-5] Chart rendered: ${chartItem.chartType}`);
      } catch (e) {
        console.error("[PDF-DEBUG-5-ERR] Chart error:", e);
      }
    }
  }
}

async function generateChartPng(chartItem: IChartReportItem): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = chartItem.width;
  canvas.height = chartItem.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  console.log(`[PDF-DEBUG-3] Chart: type=${chartItem.chartType}, labels=${JSON.stringify(chartItem.labels)?.slice(0,100)}, datasets=${chartItem.datasets?.length || 0}`);

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

  // Chart renders synchronously with animation: false
  const dataUrl = canvas.toDataURL('image/png');
  chart.destroy();
  
  return dataUrl.split(',')[1];
}

async function generateBarcodePng(value: string, format: string, width: number, height: number, barWidth: number, displayValue: boolean = false): Promise<string> {
  // Create a canvas element for barcode generation
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
  
  return canvas.toDataURL('image/png');
}

function splitItemsByPage(items: IReportItem[], pageHeight: number): IReportItem[][] {
  // Safeguard: ensure pageHeight is at least 100 to prevent infinite loops
  const safePageHeight = Math.max(100, pageHeight);
  
  const result: IReportItem[][] = [];
  let pageNumber = 1;
  const maxItemBottomY = items.reduce((max, item) => Math.max(max, item.y + item.height), 0);

  // Safeguard: limit to 100 pages max
  const maxPages = 100;

  while (pageNumber <= maxPages) {
    const pageTopY = (pageNumber - 1) * safePageHeight;
    const pageBottomY = pageNumber * safePageHeight;

    const pageItems = items.filter(item => isItemInArea(item, pageTopY, pageBottomY));

    result.push(pageItems);

    if (maxItemBottomY <= pageBottomY) break;

    pageNumber++;
  }

  return result;
}

export interface KeepTogetherGroup {
  startY: number;
  endY: number;
  items: IReportItem[];
}

export function groupItemsForKeepTogether(items: IReportItem[], sectionHeight: number): KeepTogetherGroup[] {
  const groups: KeepTogetherGroup[] = [];
  let currentGroup: KeepTogetherGroup | null = null;
  
  // Sort items by Y position
  const sortedItems = [...items].sort((a, b) => a.y - b.y);
  
  for (const item of sortedItems) {
    const itemSectionStart = Math.floor(item.y / sectionHeight) * sectionHeight;
    
    if (!currentGroup || itemSectionStart !== currentGroup.startY) {
      if (currentGroup) {
        groups.push(currentGroup);
      }
      currentGroup = {
        startY: itemSectionStart,
        endY: itemSectionStart + sectionHeight,
        items: [item],
      };
    } else {
      currentGroup.items.push(item);
      currentGroup.endY = Math.max(currentGroup.endY, item.y + item.height);
    }
  }
  
  if (currentGroup) {
    groups.push(currentGroup);
  }
  
  return groups;
}

function isItemInArea(item: IReportItem, top: number, bottom: number) {
  if (top < item.y && item.y < bottom) return true;

  const bottomY = item.y + item.height;

  if (top < bottomY && bottomY < bottom) return true;

  return false;
}

function hexToRgb(hex: string | undefined) {
  if (!hex || hex === "transparent") return undefined;

  const hexString = hex.startsWith('#') ? hex.slice(1) : hex;

  let r, g, b;

  if (hexString.length === 3) {
    r = parseInt(hexString[0] + hexString[0], 16);
    g = parseInt(hexString[1] + hexString[1], 16);
    b = parseInt(hexString[2] + hexString[2], 16);
  } else if (hexString.length === 6) {
    r = parseInt(hexString.slice(0, 2), 16);
    g = parseInt(hexString.slice(2, 4), 16);
    b = parseInt(hexString.slice(4, 6), 16);
  } else {
    throw new Error('Invalid hex color string: ' + hex);
  }

  return rgb(r / 255, g / 255, b / 255);
}
