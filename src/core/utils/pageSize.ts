import { PageSize } from "../layout";

// Page dimensions in points (1 point = 1/72 inch)
export interface PageDimensions {
  width: number;
  height: number;
}

// Standard page sizes in points
const PAGE_SIZES: Record<PageSize, PageDimensions> = {
  A2: { width: 1191, height: 1684 },
  A3: { width: 842, height: 1191 },
  A4: { width: 595, height: 842 },
  A5: { width: 420, height: 595 },
  Letter: { width: 612, height: 792 },
  Legal: { width: 612, height: 1008 },
  Tabloid: { width: 792, height: 1224 },
};

// Default page size
const DEFAULT_PAGE_SIZE: PageSize = "A4";

/**
 * Get page dimensions from a page size name
 */
export function getPageDimensions(pageSize?: PageSize): PageDimensions {
  return PAGE_SIZES[pageSize || DEFAULT_PAGE_SIZE];
}

/**
 * Resolve page dimensions from layout settings
 * Priority: explicit width/height > pageSize > default (A4)
 */
export function resolvePageDimensions(
  pageSize?: PageSize,
  width?: number,
  height?: number
): PageDimensions {
  const baseDimensions = getPageDimensions(pageSize);
  
  return {
    width: width ?? baseDimensions.width,
    height: height ?? baseDimensions.height,
  };
}

/**
 * Get all available page sizes
 */
export function getAvailablePageSizes(): PageSize[] {
  return Object.keys(PAGE_SIZES) as PageSize[];
}

// Excel paper size mapping (for exceljs)
export const EXCEL_PAPER_SIZES: Record<PageSize, number> = {
  A2: 66,      // A2 paper
  A3: 8,       // A3 paper
  A4: 9,       // A4 paper
  A5: 11,      // A5 paper
  Letter: 1,   // Letter paper
  Legal: 5,    // Legal paper
  Tabloid: 3,  // Tabloid paper
};

/**
 * Get Excel paper size code from page size
 */
export function getExcelPaperSize(pageSize?: PageSize): number {
  return EXCEL_PAPER_SIZES[pageSize || DEFAULT_PAGE_SIZE];
}
