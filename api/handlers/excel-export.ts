// Excel Export Handler
// Executes Excel generation entirely in Playwright browser context
// Uses AnkaReport's exportToXlsx function which is now exported from the bundle

import { Page } from 'playwright';

/**
 * Generate Excel file in Playwright browser context
 * Uses AnkaReport.exportToXlsx which runs entirely in the browser
 * Returns the Excel file buffer
 */
export async function exportToExcel(
  page: Page,
  layout: any,
  data: any
): Promise<Buffer> {
  // Execute Excel generation in browser context
  const excelBuffer = await page.evaluate(async (layoutData: any, reportData: any) => {
    try {
      // Use AnkaReport.exportToXlsx which is now exported from the bundle
      const workbook = await (window as any).AnkaReport.exportToXlsx(layoutData, reportData);
      
      // Get the Excel buffer (returns ArrayBuffer)
      const buffer = await workbook.xlsx.writeBuffer();
      
      // Convert ArrayBuffer to base64 for transfer back to Node.js
      // Use chunked approach to avoid stack overflow for large files
      const uint8Array = new Uint8Array(buffer);
      const chunkSize = 0x8000; // 32KB chunks
      let binaryString = '';
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.slice(i, i + chunkSize);
        binaryString += String.fromCharCode.apply(null, Array.from(chunk));
      }
      const base64 = btoa(binaryString);
      
      return base64;
    } catch (error: any) {
      throw new Error(`Excel generation failed: ${error.message}`);
    }
  }, layout, data);

  // Convert base64 back to Buffer
  const buffer = Buffer.from(excelBuffer, 'base64');
  return buffer;
}
