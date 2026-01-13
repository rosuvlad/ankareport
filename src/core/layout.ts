import { TextAlign } from "./styleProperties";

export type PageSize = "A2" | "A3" | "A4" | "A5" | "Letter" | "Legal" | "Tabloid";

export interface ILayout extends IStyle {
  pageSize?: PageSize;
  width?: number;
  height?: number;
  headerSection: ISection;
  contentSection: ISection;
  footerSection: ISection;
  pageHeaderSection?: ISection;
  pageFooterSection?: ISection;
  initialPageNumber?: number; // Default: 1
}

export interface ISection extends IStyle {
  height: number | "auto";
  binding: string;
  items?: IReportItem[];
  sections?: ISection[];
  groupBy?: string;
  orderBy?: string | string[];
  groupHeader?: ISection;
  groupFooter?: ISection;
  keepTogether?: boolean;
  visibleOnFirstPage?: boolean;
  visibleOnLastPage?: boolean;
}

export interface IConditionalStyle extends IStyle {
  condition: string;
}

export interface IBaseReportItem extends IStyle {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  visible?: string;
  conditionalStyles?: IConditionalStyle[];
}

export interface ITextReportItem extends IBaseReportItem {
  type: "text";
  text: string;
  binding?: string;
  format?: string;
}

export interface IImageReportItem extends IBaseReportItem {
  type: "image";
  source: string;
  binding?: string;
}

export interface IBarcodeReportItem extends IBaseReportItem {
  type: "barcode";
  value: string;
  binding?: string;
  format?: string;
  barWidth: 1 | 2 | 3 | 4;
  displayValue?: boolean;
}

export interface IQRCodeReportItem extends IBaseReportItem {
  type: "qrcode";
  value: string;
  binding?: string;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
}

export interface IChartDataset {
  label?: string;
  labelBinding?: string;
  data: number[];
  dataBinding?: string;
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
}

export interface IChartLegend {
  display?: boolean;
  position?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  title?: string;
  titleBinding?: string;
}

export interface IChartAxisTitle {
  display?: boolean;
  text?: string;
  textBinding?: string;
  color?: string;
  font?: {
    size?: number;
    weight?: string;
  };
}

export interface IChartAxis {
  display?: boolean;
  title?: IChartAxisTitle;
  min?: number;
  max?: number;
  minBinding?: string;
  maxBinding?: string;
  beginAtZero?: boolean;
  stacked?: boolean;
  labels?: string[];
  labelsBinding?: string;
}

export interface IChartScales {
  x?: IChartAxis;
  y?: IChartAxis;
}

export interface IChartReportItem extends IBaseReportItem {
  type: "chart";
  chartType: "bar" | "line" | "pie" | "doughnut" | "radar" | "polarArea";
  labels?: string[];
  labelsBinding?: string;
  datasets?: IChartDataset[];
  datasetsBinding?: string;
  title?: string;
  titleBinding?: string;
  legend?: IChartLegend;
  scales?: IChartScales;
  // Legacy properties for backward compatibility
  showLegend?: boolean;
  legendPosition?: "top" | "bottom" | "left" | "right";
}

export type IReportItem = ITextReportItem | IImageReportItem | IBarcodeReportItem | IQRCodeReportItem | IChartReportItem;

export interface IStyle {
  color?: string;
  backgroundColor?: string;
  textAlign?: TextAlign;
  borderWidth?: number;
  borderStyle?: string;
  borderColor?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
}
