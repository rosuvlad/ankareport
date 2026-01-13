import { saveAs } from "file-saver";
import { ILayout, ISection } from "../core/layout";
import { exportToXlsx } from "../exports/excel-exporter";
import Section from "./section";
import { exportToPdf } from "../export/export-to-pdf";
import { resolvePageDimensions } from "../core/utils/pageSize";
import { evaluateExpression } from "../core/utils/expression";
import { sortData } from "../core/utils/generate";

/**
 * Determines if a page section (header/footer) should be rendered on a given page.
 * See export-to-pdf.ts for full documentation.
 */
function shouldRenderPageSection(
  section: ISection,
  isFirstPage: boolean,
  isLastPage: boolean
): boolean {
  const visibleOnFirst = section.visibleOnFirstPage ?? false;
  const visibleOnLast = section.visibleOnLastPage ?? false;

  if (isFirstPage && !visibleOnFirst) return false;
  if (isLastPage && !isFirstPage && !visibleOnLast) return false;

  return true;
}

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
      this.options.layout.height,
      this.options.layout.orientation
    );
    this.pageWidth = width;
    this.pageHeight = height;

    // Setup container
    this.options.element.style.width = width + "px";
    this.options.element.style.position = "relative";
    this.options.element.style.margin = "0 auto";
    this.options.element.style.backgroundColor = this.options.layout.backgroundColor || "#ffffff";

    // Render page header (shown at top, emulating PDF behavior)
    // For HTML preview, it's a single page (both first and last)
    if (this.options.layout.pageHeaderSection) {
      const shouldRender = shouldRenderPageSection(
        this.options.layout.pageHeaderSection,
        true,  // isFirstPage - preview is always page 1
        true   // isLastPage - preview is single page
      );

      if (shouldRender) {
        const initialPage = this.options.layout.initialPageNumber ?? 1;

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
    const contentBinding = this.options.layout.contentSection.binding;
    let contentData = contentBinding ? this.resolvePath(contentBinding, rootData) : null;

    if (Array.isArray(contentData)) {
      if (this.options.layout.contentSection.orderBy) {
        contentData = sortData(contentData, this.options.layout.contentSection.orderBy);
      }
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

    // Render page footer (shown at bottom, emulating PDF behavior)
    if (this.options.layout.pageFooterSection) {
      const shouldRender = shouldRenderPageSection(
        this.options.layout.pageFooterSection,
        true,  // isFirstPage - preview is always page 1
        true   // isLastPage - preview is single page
      );

      if (shouldRender) {
        const initialPage = this.options.layout.initialPageNumber ?? 1;

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

    // Handle $. prefix - strip it since $ represents the root data
    let normalizedPath = path;
    if (normalizedPath.startsWith('$.')) {
      normalizedPath = normalizedPath.substring(2);
    } else if (normalizedPath.startsWith('$')) {
      normalizedPath = normalizedPath.substring(1);
    }

    if (!normalizedPath) return data;

    const segments: (string | number)[] = [];
    const regex = /([^.\[\]]+)|\[(\d+)\]/g;
    let match;

    while ((match = regex.exec(normalizedPath)) !== null) {
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
