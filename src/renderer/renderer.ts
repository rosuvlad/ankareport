import { saveAs } from "file-saver";
import { ILayout, ISection } from "../core/layout";
import { exportToXlsx } from "../exports/excel-exporter";
import Section from "./section";
import { exportToPdf } from "../export/export-to-pdf";
import { resolvePageDimensions } from "../core/utils/pageSize";
import { evaluateExpression } from "../core/utils/expression";

export interface RendererOptions {
  element: HTMLDivElement;
  layout: ILayout;
  data: any;
}

export default class Renderer {
  private readonly headerSection: Section;
  private readonly footerSection: Section;
  private readonly pageWidth: number;
  private readonly pageHeight: number;

  constructor(private readonly options: RendererOptions) {
    if (!options.data) throw "Data is required";
    if (Array.isArray(options.data)) throw "Data must be an object";

    const rootData = this.options.data;

    // Resolve page dimensions
    const { width, height } = resolvePageDimensions(
      this.options.layout.pageSize,
      this.options.layout.width,
      this.options.layout.height
    );
    this.pageWidth = width;
    this.pageHeight = height;

    // Setup container
    this.options.element.style.width = width + "px";
    this.options.element.style.position = "relative";
    this.options.element.style.margin = "0 auto";
    this.options.element.style.backgroundColor = this.options.layout.backgroundColor || "#ffffff";

    // Render page header (shown at top, emulating PDF behavior)
    // For single page preview, it is both first and last page.
    if (this.options.layout.pageHeaderSection) {
      const section = this.options.layout.pageHeaderSection;
      // Default to false if undefined, as per user request (property default is false)
      const visibleOnFirst = section.visibleOnFirstPage ?? false;
      const visibleOnLast = section.visibleOnLastPage ?? false;

      const isFirst = true; // Preview is page 1
      const isLast = true;  // and only 1 page

      let shouldRender = true;
      if (isFirst && !visibleOnFirst) shouldRender = false;
      // If it's also last page, and visibleOnLast is false, should we hide it?
      // Logic: It must be valid for ALL current conditions?
      // Usually "First Page" takes precedence for "Start". "Last Page" for "End".
      // If 1 page document: it is First AND Last.
      // If visibleOnFirst=false, hide. If visibleOnFirst=true, visibleOnLast=false?
      // If I want it on page 1, I set visibleOnFirst=true.
      // If I have 1 page, I want it.
      // If visibleOnFirst=true, visibleOnLast=false. Page 1 is Last.
      // Conflict.
      // Standard logic: First Page rule applies to Page 1. Last Page rule applies to Page N.
      // If Page 1 == Page N:
      // Option A: logical OR (show if either allows?)
      // Option B: logical AND (must be allowed by both?)
      // User said "defaulting to false". So by default HIDDEN.
      // If I want header on single page report, I must enable BOTH? Or just one?
      // Let's assume standard "Show on First" / "Show on Last".
      // If I enable "Show on First", it shows on page 1.
      // If I enable "Show on Last", it shows on last page.
      // If I have 1 page, and "Show on First" is True, it shows.
      // Even if "Show on Last" is False?
      // Yes, usually "First Page" settings override "Last Page" if conflict, or additive.
      // Let's go with: Visible if (isFirst ? visibleOnFirst : true) && (isLast ? visibleOnLast : true) ?
      // No, that implies default is TRUE.
      // User default is FALSE.
      // So: Only visible if explicitly allowed.
      // If 1 page: needs visibleOnFirst=true OR visibleOnLast=true?
      // Let's start with strict:
      // If isFirst, check visibleOnFirstPage.
      // If isLast, check visibleOnLastPage.
      // If isFirst, ignore visibleOnLastPage?
      // Let's implement simpler check: 
      // If isFirst and !visibleOnFirst: Hide.
      // If isLast and !visibleOnLast: Hide.
      // So for 1 page: must be visible on BOTH first and last to show? That seems hard.
      // Maybe just checking First page rule for page 1 is enough for the recursive nature of "First Page properties".

      // Let's stick to: Page 1 checks VisibleOnFirst. Last Page checks VisibleOnLast.
      // If Page 1 is Last Page: It checks BOTH?
      // Yes. If I want it on specific single page, I enable both?
      // Or maybe:
      // If (isFirst && !visibleOnFirst) render = false;
      // else if (isLast && !visibleOnLast && !isFirst) render = false; <--- note !isFirst
      // This implies First Page settings dominate for Page 1.

      if (isFirst && !visibleOnFirst) shouldRender = false;
      else if (isLast && !visibleOnLast && !isFirst) shouldRender = false;

      // Wait, if 1 page, and visibleOnFirst=True, visibleOnLast=False.
      // isFirst=true -> !visibleOnFirst is false -> render=true.
      // isLast=true -> !visibleOnLast is true. if we checked isLast, it would hide.
      // My logic line 73 prevents checking isLast if isFirst is handled.
      // This means for 1 page doc, only visibleOnFirst matters. Correct?
      // Usually yes. "First Page" is the most specific state of Page 1.

      const initialPage = this.options.layout.initialPageNumber ?? 0;

      const pageHeaderSection = this.createPageSection(
        this.options.layout.pageHeaderSection,
        rootData,
        initialPage,
        1
      );
      pageHeaderSection.element.style.borderBottom = "1px dashed #ccc";
      pageHeaderSection.element.setAttribute("data-section-type", "page-header");
      this.options.element.appendChild(pageHeaderSection.element);
      this.options.element.appendChild(pageHeaderSection.elementSections);
    }

    // Render header section
    const headerData = this.resolveSectionData(this.options.layout.headerSection.binding, rootData);
    this.headerSection = new Section(
      this.options.layout.headerSection,
      headerData,
      [this.options.layout],
      undefined,
      { rootData },
    );
    this.options.element.appendChild(this.headerSection.element);
    this.options.element.appendChild(this.headerSection.elementSections);
    // Render content sections
    const contentProperty = this.options.layout.contentSection.binding;
    const contentData = contentProperty ? this.options.data[contentProperty] : null;

    if (Array.isArray(contentData)) {
      contentData.forEach((data: any, index: number) => {
        const contentSection = new Section(
          this.options.layout.contentSection,
          data,
          [this.options.layout],
          index,
          { rootData },
        );
        this.options.element.appendChild(contentSection.element);
        this.options.element.appendChild(contentSection.elementSections);
      });
    } else if (contentData) {
      const contentSection = new Section(
        this.options.layout.contentSection,
        contentData,
        [this.options.layout],
        0,
        { rootData },
      );
      this.options.element.appendChild(contentSection.element);
      this.options.element.appendChild(contentSection.elementSections);
    }

    // Render footer section
    const footerData = this.resolveSectionData(this.options.layout.footerSection.binding, rootData);
    this.footerSection = new Section(
      this.options.layout.footerSection,
      footerData,
      [this.options.layout],
      undefined,
      { rootData },
    );
    this.options.element.appendChild(this.footerSection.element);
    this.options.element.appendChild(this.footerSection.elementSections);
    // ... (footer section rendered) ...

    // Render page footer (shown at bottom, emulating PDF behavior)
    if (this.options.layout.pageFooterSection) {
      const section = this.options.layout.pageFooterSection;
      const visibleOnFirst = section.visibleOnFirstPage ?? false;
      const visibleOnLast = section.visibleOnLastPage ?? false;

      const isFirst = true;
      const isLast = true;

      let shouldRender = true;
      if (isFirst && !visibleOnFirst) shouldRender = false;
      else if (isLast && !visibleOnLast && !isFirst) shouldRender = false;

      if (shouldRender) {
        const initialPage = this.options.layout.initialPageNumber ?? 0;

        const pageFooterSection = this.createPageSection(
          this.options.layout.pageFooterSection,
          rootData,
          initialPage,
          1
        );
        pageFooterSection.element.style.borderTop = "1px dashed #ccc";
        pageFooterSection.element.setAttribute("data-section-type", "page-footer");
        this.options.element.appendChild(pageFooterSection.element);
        this.options.element.appendChild(pageFooterSection.elementSections);
      }
    }
  }

  private createPageSection(
    sectionLayout: ISection,
    rootData: any,
    pageNum: number,
    totalPages: number
  ): Section {
    // Create a modified section with page variables resolved
    const modifiedLayout = { ...sectionLayout };

    // Create section with page context
    const section = new Section(
      modifiedLayout,
      rootData,
      [this.options.layout],
      undefined,
      {
        rootData,
        pageNum,
        totalPages,
      },
    );

    return section;
  }

  public async exportToXlsx(filename: string) {
    const workbook = await exportToXlsx(this.options.layout, this.options.data);

    const data = await workbook.xlsx.writeBuffer();

    const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8' });

    saveAs(blob, filename);
  }

  private resolveSectionData(binding: string, data: any): any {
    if (!binding || !data) return data;
    return this.resolvePath(binding, data) ?? data;
  }

  private resolvePath(path: string, data: any): any {
    if (!data || !path) return null;

    const segments: (string | number)[] = [];
    const regex = /([^.\[\]]+)|\[(\d+)\]/g;
    let match;

    while ((match = regex.exec(path)) !== null) {
      if (match[1] !== undefined) {
        // Convert numeric strings to numbers for array access
        const segment = match[1];
        segments.push(/^\d+$/.test(segment) ? parseInt(segment, 10) : segment);
      } else if (match[2] !== undefined) {
        segments.push(parseInt(match[2], 10));
      }
    }

    let result = data;
    for (const segment of segments) {
      if (result == null) return null;
      result = result[segment];
    }

    return result;
  }

  async exportToPdf(fileName: string) {
    try {
      const bytes = await exportToPdf(this.options.layout, this.options.data);
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
    } catch (e) {
      console.error("Error in exportToPdf:", e);
      throw e;
    }
  }
}
