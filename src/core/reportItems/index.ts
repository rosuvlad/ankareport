import ImageReportItem from "./imageReportItem";
import TextReportItem from "./textReportItem";
import BarcodeReportItem from "./barcodeReportItem";
import QRCodeReportItem from "./qrcodeReportItem";
import ChartReportItem from "./chartReportItem";

export { default as TextReportItem } from "./textReportItem";
export { default as ImageReportItem } from "./imageReportItem";
export { default as BarcodeReportItem } from "./barcodeReportItem";
export { default as QRCodeReportItem } from "./qrcodeReportItem";
export { default as ChartReportItem } from "./chartReportItem";

export type ReportItem = TextReportItem | ImageReportItem | BarcodeReportItem | QRCodeReportItem | ChartReportItem;
