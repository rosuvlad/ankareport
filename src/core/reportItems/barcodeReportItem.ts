import JsBarcode from "jsbarcode";
import { IBarcodeReportItem } from "../layout";
import { MultipleStyles } from "../utils/style.utils";
import BarcodeReportItemProperties from "./barcodeReportItemProperties";
import BaseReportItem, { ReportItemOptions } from "./baseReportItem";

export default class BarcodeReportItem extends BaseReportItem {
  public elementSvg: SVGElement = null!;

  public readonly properties = new BarcodeReportItemProperties();

  constructor(options: ReportItemOptions) {
    super();

    if (options.appendTo) {
      options.appendTo.appendChild(this.element);
    }

    this._styles = new MultipleStyles(...options.parentStyles, this.properties);

    if (options.defaultProperties) {
      super.loadLayout(options.defaultProperties);
    }

    super._init();
  }

  refresh() {
    super.refresh();

    // Set up container with 4px internal padding
    this.element.style.padding = "4px";
    this.element.style.boxSizing = "border-box";
    this.element.style.display = "flex";
    this.element.style.alignItems = "center";
    this.element.style.justifyContent = "center";

    if (this.elementSvg) this.elementSvg.remove();

    this.elementSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.elementSvg.style.maxWidth = "100%";
    this.elementSvg.style.maxHeight = "100%";

    this.element.appendChild(this.elementSvg);

    const barcode = this.properties.value || (this.properties.binding ? `[${this.properties.binding}]` : "1234567890");

    // Calculate inner dimensions (account for 8px total padding)
    const displayValue = this.properties.displayValue === true;
    const innerWidth = this.properties.width - 8;
    const innerHeight = this.properties.height - 8;
    const barcodeHeight = displayValue 
      ? Math.max(20, innerHeight - 20)  // Leave space for text
      : innerHeight;
    
    JsBarcode(this.elementSvg, barcode, {
      width: this.properties.barWidth,
      height: barcodeHeight,
      format: this.properties.format,
      displayValue: displayValue,
      margin: 0,
    });

    // Force SVG to fit within inner dimensions
    this.elementSvg.setAttribute("width", String(innerWidth));
    this.elementSvg.setAttribute("height", String(innerHeight));
    this.elementSvg.style.width = innerWidth + "px";
    this.elementSvg.style.height = innerHeight + "px";
  }

  applyLayout(layout: Partial<IBarcodeReportItem>) {
    this.properties.value = layout.value || "";
    this.properties.binding = layout.binding || "";
    this.properties.format = layout.format || "";
    this.properties.barWidth = layout.barWidth || 1;
    this.properties.displayValue = layout.displayValue ?? false;
    super.applyLayout(layout);
  }

  toJSON(): IBarcodeReportItem {
    return {
      ...super.toJSON(),
      type: "barcode",
      value: this.properties.value,
      binding: this.properties.binding,
      format: this.properties.format,
      barWidth: this.properties.barWidth,
      displayValue: this.properties.displayValue === true,
    };
  }
}
