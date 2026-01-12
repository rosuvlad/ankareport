import QRCode from "qrcode";
import { IQRCodeReportItem } from "../layout";
import { MultipleStyles } from "../utils/style.utils";
import QRCodeReportItemProperties from "./qrcodeReportItemProperties";
import BaseReportItem, { ReportItemOptions } from "./baseReportItem";

export default class QRCodeReportItem extends BaseReportItem {
  public elementCanvas: HTMLCanvasElement = null!;

  public readonly properties = new QRCodeReportItemProperties();

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

    if (this.elementCanvas) this.elementCanvas.remove();

    this.elementCanvas = document.createElement("canvas");

    this.element.appendChild(this.elementCanvas);

    const qrValue = this.properties.value || (this.properties.binding ? `[${this.properties.binding}]` : "https://example.com");

    // Account for 8px total padding (4px on each side)
    const innerSize = Math.min(this.properties.width, this.properties.height) - 8;

    QRCode.toCanvas(this.elementCanvas, qrValue, {
      width: innerSize,
      errorCorrectionLevel: this.properties.errorCorrectionLevel,
      margin: 0,
    }).catch((err) => {
      console.error("QR Code generation error:", err);
    });
  }

  applyLayout(layout: Partial<IQRCodeReportItem>) {
    this.properties.value = layout.value || "";
    this.properties.binding = layout.binding || "";
    this.properties.errorCorrectionLevel = layout.errorCorrectionLevel || "M";
    super.applyLayout(layout);
  }

  toJSON(): IQRCodeReportItem {
    return {
      ...super.toJSON(),
      type: "qrcode",
      value: this.properties.value,
      binding: this.properties.binding,
      errorCorrectionLevel: this.properties.errorCorrectionLevel,
    };
  }
}
