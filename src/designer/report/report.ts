import EventEmitter, { EventCallback } from "../../core/eventEmitter";
import { ILayout } from "../../core/layout";
import { resolvePageDimensions } from "../../core/utils/pageSize";
import Resizer, { ResizerOrientation } from "../components/resizer";
import Designer from "../designer";
import { SelectEventArgs } from "../reportSection/report-section.events";
import ReportSection from "../reportSection/reportSection";
import { ChangeEventArgs, ReportEventMap } from "./report.events";
import ReportProperties from "./reportProperties";

import "./report.css";

export interface ReportOptions {
  designer: Designer;
}

export default class Report {
  public readonly element = document.createElement("div");

  public readonly reportSectionPageHeader: ReportSection;
  public readonly reportSectionHeader: ReportSection;
  public readonly reportSectionContent: ReportSection;
  public readonly reportSectionFooter: ReportSection;
  public readonly reportSectionPageFooter: ReportSection;

  public readonly resizer = new Resizer({
    orientation: ResizerOrientation.Vertical,
    onResize: (e) => {
      const currentWidth = typeof this.properties.width === 'number' ? this.properties.width : 595;
      this.properties.width = currentWidth + e.offsetX;
    },
  });

  public readonly properties = new ReportProperties();

  private readonly _changeEventEmitter = new EventEmitter<ChangeEventArgs>();

  constructor(options: ReportOptions) {
    // Order: Header -> Page Header -> Content -> Page Footer -> Footer
    this.reportSectionHeader = new ReportSection({
      title: "Header",
      designer: options.designer,
      parentStyles: [this.properties],
      appendTo: this.element,
    });
    this.reportSectionPageHeader = new ReportSection({
      title: "Page Header",
      designer: options.designer,
      parentStyles: [this.properties],
      appendTo: this.element,
      isPageSection: true,
    });
    this.reportSectionContent = new ReportSection({
      title: "Content",
      designer: options.designer,
      parentStyles: [this.properties],
      appendTo: this.element,
    });
    this.reportSectionPageFooter = new ReportSection({
      title: "Page Footer",
      designer: options.designer,
      parentStyles: [this.properties],
      appendTo: this.element,
      isPageSection: true,
    });
    this.reportSectionFooter = new ReportSection({
      title: "Footer",
      designer: options.designer,
      parentStyles: [this.properties],
      appendTo: this.element,
    });

    this._init();
  }

  private _init() {
    this.element.classList.add("anka-report");

    this.element.tabIndex = 0;

    this.element.appendChild(this.resizer.element);

    this.properties.addEventListener("change", (e) => {
      this.refresh();
      this._onChange({
        type: "change-report",
        report: this,
        changes: e.changes,
      });
    });

    this._initChangeEvents();
    this._initKeyDownEvents();
    this._initSelectEvents();

    this.refresh();
  }

  private _initChangeEvents() {
    this.reportSectionPageHeader.addEventListener("change", (e) => {
      this._onChange(e);
    });

    this.reportSectionHeader.addEventListener("change", (e) => {
      this._onChange(e);
    });

    this.reportSectionContent.addEventListener("change", (e) => {
      this._onChange(e);
    });

    this.reportSectionFooter.addEventListener("change", (e) => {
      this._onChange(e);
    });

    this.reportSectionPageFooter.addEventListener("change", (e) => {
      this._onChange(e);
    });
  }

  private _initKeyDownEvents() {
    this.element.addEventListener("keydown", (e) => {
      if (e.key === "Delete") {
        this.reportSectionPageHeader.removeSelectedItem();
        this.reportSectionHeader.removeSelectedItem();
        this.reportSectionContent.removeSelectedItem();
        this.reportSectionFooter.removeSelectedItem();
        this.reportSectionPageFooter.removeSelectedItem();
      }
    });
  }

  private _initSelectEvents() {
    this.reportSectionPageHeader.addEventListener("select", (e) => {
      this._deselectExcept(e, this.reportSectionPageHeader);
    });

    this.reportSectionHeader.addEventListener("select", (e) => {
      this._deselectExcept(e, this.reportSectionHeader);
    });

    this.reportSectionContent.addEventListener("select", (e) => {
      this._deselectExcept(e, this.reportSectionContent);
    });

    this.reportSectionFooter.addEventListener("select", (e) => {
      this._deselectExcept(e, this.reportSectionFooter);
    });

    this.reportSectionPageFooter.addEventListener("select", (e) => {
      this._deselectExcept(e, this.reportSectionPageFooter);
    });
  }

  private _deselectExcept(
    e: SelectEventArgs,
    exceptReportSection: ReportSection,
  ) {
    if (
      e.type !== "ReportItem" ||
      exceptReportSection !== this.reportSectionPageHeader
    ) {
      this.reportSectionPageHeader.deselectAll();
    }

    if (
      e.type !== "ReportItem" ||
      exceptReportSection !== this.reportSectionHeader
    ) {
      this.reportSectionHeader.deselectAll();
    }

    if (
      e.type !== "ReportItem" ||
      exceptReportSection !== this.reportSectionContent
    ) {
      this.reportSectionContent.deselectAll();
    }

    if (
      e.type !== "ReportItem" ||
      exceptReportSection !== this.reportSectionFooter
    ) {
      this.reportSectionFooter.deselectAll();
    }

    if (
      e.type !== "ReportItem" ||
      exceptReportSection !== this.reportSectionPageFooter
    ) {
      this.reportSectionPageFooter.deselectAll();
    }
  }

  refresh() {
    // Use explicit width if set, otherwise use pageSize dimensions with orientation
    const propWidth = typeof this.properties.width === 'number' ? this.properties.width : undefined;
    const propHeight = typeof this.properties.height === 'number' ? this.properties.height : undefined;
    const { width } = resolvePageDimensions(
      this.properties.pageSize,
      propWidth,
      propHeight,
      this.properties.orientation
    );
    this.element.style.width = `${width}px`;
  }

  addEventListener<K extends keyof ReportEventMap>(
    event: K,
    listener: EventCallback<ReportEventMap[K]>,
  ) {
    switch (event) {
      case "select":
        this.reportSectionPageHeader.addEventListener(event, listener);
        this.reportSectionHeader.addEventListener(event, listener);
        this.reportSectionContent.addEventListener(event, listener);
        this.reportSectionFooter.addEventListener(event, listener);
        this.reportSectionPageFooter.addEventListener(event, listener);
        break;
      case "change":
        const callbackOnChange = listener as EventCallback<
          ReportEventMap["change"]
        >;
        this._changeEventEmitter.add(callbackOnChange);
        break;
    }
  }

  loadLayout(layout: ILayout) {
    if (layout.pageSize) this.properties.pageSize = layout.pageSize;
    if (layout.orientation) this.properties.orientation = layout.orientation;
    if (layout.width) this.properties.width = layout.width;
    if (layout.height) this.properties.height = layout.height;
    if (layout.initialPageNumber !== undefined) this.properties.initialPageNumber = layout.initialPageNumber;
    if (layout.supportedOutputs) this.properties.supportedOutputs = layout.supportedOutputs;
    this.properties.color = layout.color;

    // Load page header section (optional)
    if (layout.pageHeaderSection) {
      this.reportSectionPageHeader.loadLayout(layout.pageHeaderSection);
    } else {
      // Set default empty section with minimal height
      this.reportSectionPageHeader.loadLayout({ height: 30, binding: "", items: [] });
    }

    this.reportSectionHeader.loadLayout(layout.headerSection);
    this.reportSectionContent.loadLayout(layout.contentSection);
    this.reportSectionFooter.loadLayout(layout.footerSection);

    // Load page footer section (optional)
    if (layout.pageFooterSection) {
      this.reportSectionPageFooter.loadLayout(layout.pageFooterSection);
    } else {
      // Set default empty section with minimal height
      this.reportSectionPageFooter.loadLayout({ height: 30, binding: "", items: [] });
    }

    this.refresh();
  }

  toJSON(): ILayout {
    const width = typeof this.properties.width === 'number' ? this.properties.width : undefined;
    const height = typeof this.properties.height === 'number' ? this.properties.height : undefined;

    // Only include page header/footer if they have items
    const pageHeaderSection = this.reportSectionPageHeader.toJSON();
    const pageFooterSection = this.reportSectionPageFooter.toJSON();
    const hasPageHeader = pageHeaderSection.items && pageHeaderSection.items.length > 0;
    const hasPageFooter = pageFooterSection.items && pageFooterSection.items.length > 0;

    return {
      pageSize: this.properties.pageSize,
      orientation: this.properties.orientation,
      width,
      height,
      initialPageNumber: this.properties.initialPageNumber,
      supportedOutputs: this.properties.supportedOutputs,
      color: this.properties.color,
      backgroundColor: this.properties.backgroundColor,
      textAlign: this.properties.textAlign,
      borderWidth: this.properties.borderWidth,
      borderStyle: this.properties.borderStyle,
      borderColor: this.properties.borderColor,
      fontFamily: this.properties.fontFamily,
      fontSize: this.properties.fontSize,
      fontWeight: this.properties.fontWeight,
      pageHeaderSection: hasPageHeader ? pageHeaderSection : undefined,
      headerSection: this.reportSectionHeader.toJSON(),
      contentSection: this.reportSectionContent.toJSON(),
      footerSection: this.reportSectionFooter.toJSON(),
      pageFooterSection: hasPageFooter ? pageFooterSection : undefined,
    };
  }

  private _onChange(args: ChangeEventArgs) {
    this._changeEventEmitter.emit(args);
  }
}
