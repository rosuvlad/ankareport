import { PageSize, PageOrientation } from "../layout";

// Page dimensions in points (1 point = 1/72 inch)
export interface PageDimensions {
  width: number;
  height: number;
}

// Standard page sizes in points (portrait orientation)
const PAGE_SIZES: Record<PageSize, PageDimensions> = {
  A2: { width: 1191, height: 1684 },
  A3: { width: 842, height: 1191 },
  A4: { width: 595, height: 842 },
  A5: { width: 420, height: 595 },
  Letter: { width: 612, height: 792 },
  Legal: { width: 612, height: 1008 },
  Tabloid: { width: 792, height: 1224 },
};

// Default page size and orientation
const DEFAULT_PAGE_SIZE: PageSize = "A4";
const DEFAULT_ORIENTATION: PageOrientation = "portrait";

/**
 * Get page dimensions from a page size name
 */
export function getPageDimensions(pageSize?: PageSize, orientation?: PageOrientation): PageDimensions {
  const baseDimensions = PAGE_SIZES[pageSize || DEFAULT_PAGE_SIZE];
  const orient = orientation || DEFAULT_ORIENTATION;
  
  // Swap width and height for landscape orientation
  if (orient === "landscape") {
    return {
      width: baseDimensions.height,
      height: baseDimensions.width,
    };
  }
  
  return baseDimensions;
}

/**
 * Resolve page dimensions from layout settings
 * Priority: explicit width/height > pageSize with orientation > default (A4 portrait)
 */
export function resolvePageDimensions(
  pageSize?: PageSize,
  width?: number,
  height?: number,
  orientation?: PageOrientation
): PageDimensions {
  const baseDimensions = getPageDimensions(pageSize, orientation);
  
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
