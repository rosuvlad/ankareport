import { IConditionalStyle, IReportItem, ISection, IStyle, IChartReportItem } from "../core/layout";
import {
  BarcodeReportItem,
  ChartReportItem,
  ImageReportItem,
  QRCodeReportItem,
  ReportItem,
  TextReportItem,
} from "../core/reportItems";
import StyleProperties from "../core/styleProperties";
import { evaluateExpression, evaluateCondition, ExpressionContext } from "../core/utils/expression";
import { formatDate, formatNumber } from "../core/utils/format";
import { sortData } from "../core/utils/generate";

export interface SectionOptions {
  rootData?: any;
  pageNum?: number;
  totalPages?: number;
  groupKey?: any;
  groupCount?: number;
  groupData?: any[];
}

export default class Section {
  public readonly element = document.createElement("div");
  public readonly elementSections = document.createElement("div");
  private readonly reportItems: ReportItem[] = [];
  private readonly context: ExpressionContext;

  constructor(
    private readonly layout: ISection,
    private readonly data: any,
    private readonly defaultStyles: IStyle[],
    private readonly index?: number,
    private readonly options: SectionOptions = {},
  ) {
    this.context = {
      data: this.data,
      rootData: this.options.rootData ?? this.data,
      index: this.index,
      pageNum: this.options.pageNum,
      totalPages: this.options.totalPages,
      groupKey: this.options.groupKey,
      groupCount: this.options.groupCount,
      groupData: this.options.groupData,
    };
    this._init();
  }

  private evaluateBinding(binding: string): any {
    if (!binding) return null;
    return evaluateExpression(binding, this.context);
  }

  private isVisible(layout: IReportItem): boolean {
    if (!layout.visible) return true;
    return evaluateCondition(layout.visible, this.context);
  }

  private applyConditionalStyles(item: ReportItem, conditionalStyles?: IConditionalStyle[]) {
    if (!conditionalStyles || conditionalStyles.length === 0) return;

    for (const cs of conditionalStyles) {
      if (evaluateCondition(cs.condition, this.context)) {
        if (cs.color) item.element.style.color = cs.color;
        if (cs.backgroundColor) item.element.style.backgroundColor = cs.backgroundColor;
        if (cs.fontWeight) item.element.style.fontWeight = cs.fontWeight;
        if (cs.fontSize) item.element.style.fontSize = cs.fontSize;
        if (cs.borderColor) item.element.style.borderColor = cs.borderColor;
      }
    }
  }

  private _init() {
    this.element.classList.add("anka-section");

    this.element.style.position = "relative";


    // Handle auto height - will be calculated after items are added
    if (this.layout.height !== "auto") {
      this.element.style.height = this.layout.height + "px";
    }

    const defaultStylesList: StyleProperties[] = [];
    this.defaultStyles.forEach((x) =>
      defaultStylesList.push(new StyleProperties(x)),
    );
    defaultStylesList.push(new StyleProperties(this.layout));

    this.layout.items?.forEach((layout) => {
      // Check visibility condition
      if (!this.isVisible(layout)) return;

      if (!layout.type || layout.type === "text") {
        const item = new TextReportItem({ parentStyles: defaultStylesList });
        item.loadLayout(layout);
        if (layout.binding) {
          let bindedData = this.evaluateBinding(layout.binding) ?? "NULL";

          if (layout.format && typeof bindedData !== 'string') {
            if (typeof bindedData === "number") {
              bindedData = formatNumber(bindedData, layout.format);
            } else if (new Date(bindedData).toString() !== "Invalid Date") {
              bindedData = formatDate(bindedData, layout.format);
            }
          }

          item.properties.text = String(bindedData);
        }
        this.applyConditionalStyles(item, layout.conditionalStyles);
        this.element.appendChild(item.element);
        this.reportItems.push(item);
      } else if (layout.type === "image") {
        const item = new ImageReportItem({ parentStyles: defaultStylesList });
        item.loadLayout(layout);
        if (layout.binding) {
          item.properties.source = this.evaluateBinding(layout.binding) ?? "";
        }
        this.applyConditionalStyles(item, layout.conditionalStyles);
        this.element.appendChild(item.element);
        this.reportItems.push(item);
      } else if (layout.type === "barcode") {
        const item = new BarcodeReportItem({ parentStyles: defaultStylesList });
        item.loadLayout(layout);
        if (layout.binding) {
          item.properties.value = String(this.evaluateBinding(layout.binding) ?? "");
        }
        this.applyConditionalStyles(item, layout.conditionalStyles);
        this.element.appendChild(item.element);
        this.reportItems.push(item);
      } else if (layout.type === "qrcode") {
        const item = new QRCodeReportItem({ parentStyles: defaultStylesList });
        const qrLayout = { ...layout };
        if (layout.binding) {
          qrLayout.value = String(this.evaluateBinding(layout.binding) ?? "");
        }
        item.loadLayout(qrLayout);
        this.applyConditionalStyles(item, layout.conditionalStyles);
        this.element.appendChild(item.element);
        this.reportItems.push(item);
      } else if (layout.type === "chart") {
        const item = new ChartReportItem({ parentStyles: defaultStylesList });
        const chartLayout = { ...layout } as IChartReportItem;

        // Resolve labels binding
        if (layout.labelsBinding) {
          const labels = this.evaluateBinding(layout.labelsBinding);
          if (Array.isArray(labels)) {
            chartLayout.labels = labels.map(l => String(l));
          }
        }

        // Resolve datasets binding
        if (layout.datasetsBinding) {
          const datasets = this.evaluateBinding(layout.datasetsBinding);
          if (Array.isArray(datasets)) {
            chartLayout.datasets = datasets;
          }
        }

        item.loadLayout(chartLayout);
        this.applyConditionalStyles(item, layout.conditionalStyles);
        this.element.appendChild(item.element);
        this.reportItems.push(item);
      }
    });

    this.layout.sections?.forEach((sectionLayout) => {
      let subDataSource = this.data ? this.data[sectionLayout.binding] : {};

      if (Array.isArray(subDataSource)) {
        if (sectionLayout.orderBy) {
          subDataSource = sortData(subDataSource, sectionLayout.orderBy);
        }
        subDataSource.forEach((sectionDataSource: any, idx: number) => {
          const section = new Section(sectionLayout, sectionDataSource, [
            ...this.defaultStyles,
            this.layout,
          ], idx, { rootData: this.options.rootData ?? this.data });

          this.elementSections.appendChild(section.element);
          this.elementSections.appendChild(section.elementSections);
        });
      }
    });

    // Calculate auto height based on items
    if (this.layout.height === "auto") {
      this.element.style.height = this.calculateAutoHeight() + "px";
    }
  }

  private calculateAutoHeight(): number {
    let maxBottom = 0;

    // Calculate based on visible item positions only
    for (const item of this.reportItems) {
      // Check if item is actually rendered (visible in DOM)
      if (item.element.offsetParent !== null || item.element.style.display !== 'none') {
        const itemBottom = (item.properties.y || 0) + (item.properties.height || 0);
        if (itemBottom > maxBottom) {
          maxBottom = itemBottom;
        }
      }
    }

    // Add padding, minimum height of 20
    return Math.max(20, maxBottom + 10);
  }
}
