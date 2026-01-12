/**
 * Unit conversion utilities.
 * 
 * Standardizations:
 * - HTML/Screen: 96 DPI (pixels)
 * - PDF: 72 DPI (points)
 * 
 * 1 inch = 96 px = 72 pt
 * 1 px = 0.75 pt
 * 1 pt = 1.3333 px
 */

export const DPI_SCREEN = 96;
export const DPI_PDF = 72;

export const PX_TO_PT_RATIO = DPI_PDF / DPI_SCREEN; // 0.75
export const PT_TO_PX_RATIO = DPI_SCREEN / DPI_PDF; // 1.3333...

/**
 * Converts pixels (screen) to points (PDF).
 * @param px - Pixels
 * @returns Points
 */
export function pxToPt(px: number): number {
  return px * PX_TO_PT_RATIO;
}

/**
 * Converts points (PDF) to pixels (screen).
 * @param pt - Points
 * @returns Pixels
 */
export function ptToPx(pt: number): number {
  return pt * PT_TO_PX_RATIO;
}

/**
 * Parses a CSS size string (e.g., "12px", "10pt") and returns the value in pixels.
 * Defaults to pixels if unit is missing.
 * @param sizeStr - Size string
 * @returns Pixels
 */
export function parseSizeToPx(sizeStr: string): number {
  if (!sizeStr) return 0;
  
  const value = parseFloat(sizeStr);
  if (isNaN(value)) return 0;
  
  if (sizeStr.endsWith("pt")) {
    return ptToPx(value);
  }
  
  // Default to px
  return value;
}

/**
 * Parses a CSS size string (e.g., "12px", "10pt") and returns the value in points.
 * @param sizeStr - Size string
 * @returns Points
 */
export function parseSizeToPt(sizeStr: string): number {
  if (!sizeStr) return 0;
  
  const value = parseFloat(sizeStr);
  if (isNaN(value)) return 0;
  
  if (sizeStr.endsWith("px") || !sizeStr.match(/[a-z%]+$/i)) {
    return pxToPt(value);
  }
  
  // Already pt (or unknown, treat as value)
  return value;
}
