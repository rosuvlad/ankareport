import DropdownList from "../../components/propertyGrid/editors/dropdownList";
import { Property } from "../../components/propertyGrid/property";
import BaseReportItemProperties from "./baseReportItemProperties";
import { IChartDataset, IChartLegend, IChartScales } from "../layout";

export default class ChartReportItemProperties extends BaseReportItemProperties {
  private _chartType: "bar" | "line" | "pie" | "doughnut" | "radar" | "polarArea" = "bar";
  private _labels: string[] = [];
  private _labelsBinding = "";
  private _datasets: IChartDataset[] = [];
  private _datasetsBinding = "";
  private _title = "";
  private _titleBinding = "";
  private _showLegend = true;
  private _legendPosition: "top" | "bottom" | "left" | "right" = "top";
  private _legend: IChartLegend = {};
  private _scales: IChartScales = {};
  private _xAxisTitle = "";
  private _xAxisTitleBinding = "";
  private _yAxisTitle = "";
  private _yAxisTitleBinding = "";
  private _xAxisMin: number | undefined;
  private _xAxisMax: number | undefined;
  private _yAxisMin: number | undefined;
  private _yAxisMax: number | undefined;
  private _yAxisBeginAtZero = false;
  private _stacked = false;

  get chartType() { return this._chartType; }
  get labels() { return this._labels; }
  get labelsBinding() { return this._labelsBinding; }
  get datasets() { return this._datasets; }
  get datasetsBinding() { return this._datasetsBinding; }
  get title() { return this._title; }
  get titleBinding() { return this._titleBinding; }
  get showLegend() { return this._showLegend; }
  get legendPosition() { return this._legendPosition; }
  get legend() { return this._legend; }
  get scales() { return this._scales; }
  get xAxisTitle() { return this._xAxisTitle; }
  get xAxisTitleBinding() { return this._xAxisTitleBinding; }
  get yAxisTitle() { return this._yAxisTitle; }
  get yAxisTitleBinding() { return this._yAxisTitleBinding; }
  get xAxisMin() { return this._xAxisMin; }
  get xAxisMax() { return this._xAxisMax; }
  get yAxisMin() { return this._yAxisMin; }
  get yAxisMax() { return this._yAxisMax; }
  get yAxisBeginAtZero() { return this._yAxisBeginAtZero; }
  get stacked() { return this._stacked; }

  set chartType(value: "bar" | "line" | "pie" | "doughnut" | "radar" | "polarArea") {
    const oldValue = this.chartType;
    this._chartType = value;
    this.emitOnChange("chartType", value, oldValue);
  }
  set labels(value: string[]) {
    const oldValue = this.labels;
    this._labels = value;
    this.emitOnChange("labels", value, oldValue);
  }
  set labelsBinding(value: string) {
    const oldValue = this.labelsBinding;
    this._labelsBinding = value;
    this.emitOnChange("labelsBinding", value, oldValue);
  }
  set datasets(value: IChartDataset[]) {
    const oldValue = this.datasets;
    this._datasets = value;
    this.emitOnChange("datasets", value, oldValue);
  }
  set datasetsBinding(value: string) {
    const oldValue = this.datasetsBinding;
    this._datasetsBinding = value;
    this.emitOnChange("datasetsBinding", value, oldValue);
  }
  set title(value: string) {
    const oldValue = this.title;
    this._title = value;
    this.emitOnChange("title", value, oldValue);
  }
  set titleBinding(value: string) {
    const oldValue = this.titleBinding;
    this._titleBinding = value;
    this.emitOnChange("titleBinding", value, oldValue);
  }
  set showLegend(value: boolean) {
    const oldValue = this.showLegend;
    this._showLegend = value;
    this.emitOnChange("showLegend", value, oldValue);
  }
  set legendPosition(value: "top" | "bottom" | "left" | "right") {
    const oldValue = this.legendPosition;
    this._legendPosition = value;
    this.emitOnChange("legendPosition", value, oldValue);
  }
  set legend(value: IChartLegend) {
    const oldValue = this.legend;
    this._legend = value;
    this.emitOnChange("legend", value, oldValue);
  }
  set scales(value: IChartScales) {
    const oldValue = this.scales;
    this._scales = value;
    this.emitOnChange("scales", value, oldValue);
  }
  set xAxisTitle(value: string) {
    const oldValue = this.xAxisTitle;
    this._xAxisTitle = value;
    this.emitOnChange("xAxisTitle", value, oldValue);
  }
  set xAxisTitleBinding(value: string) {
    const oldValue = this.xAxisTitleBinding;
    this._xAxisTitleBinding = value;
    this.emitOnChange("xAxisTitleBinding", value, oldValue);
  }
  set yAxisTitle(value: string) {
    const oldValue = this.yAxisTitle;
    this._yAxisTitle = value;
    this.emitOnChange("yAxisTitle", value, oldValue);
  }
  set yAxisTitleBinding(value: string) {
    const oldValue = this.yAxisTitleBinding;
    this._yAxisTitleBinding = value;
    this.emitOnChange("yAxisTitleBinding", value, oldValue);
  }
  set xAxisMin(value: number | undefined) {
    const oldValue = this.xAxisMin;
    this._xAxisMin = value;
    this.emitOnChange("xAxisMin", value, oldValue);
  }
  set xAxisMax(value: number | undefined) {
    const oldValue = this.xAxisMax;
    this._xAxisMax = value;
    this.emitOnChange("xAxisMax", value, oldValue);
  }
  set yAxisMin(value: number | undefined) {
    const oldValue = this.yAxisMin;
    this._yAxisMin = value;
    this.emitOnChange("yAxisMin", value, oldValue);
  }
  set yAxisMax(value: number | undefined) {
    const oldValue = this.yAxisMax;
    this._yAxisMax = value;
    this.emitOnChange("yAxisMax", value, oldValue);
  }
  set yAxisBeginAtZero(value: boolean) {
    const oldValue = this.yAxisBeginAtZero;
    this._yAxisBeginAtZero = value;
    this.emitOnChange("yAxisBeginAtZero", value, oldValue);
  }
  set stacked(value: boolean) {
    const oldValue = this.stacked;
    this._stacked = value;
    this.emitOnChange("stacked", value, oldValue);
  }

  getPropertyDefinitions(): Property[] {
    return [
      { field: "chartType", label: "Chart Type", type: "string", editor: createChartTypeEditor() },
      { field: "title", label: "Title", type: "string" },
      { field: "titleBinding", label: "Title Binding", type: "string" },
      { field: "labelsBinding", label: "Labels Binding", type: "string" },
      { field: "datasetsBinding", label: "Datasets Binding", type: "string" },
      { field: "showLegend", label: "Show Legend", type: "boolean" },
      { field: "legendPosition", label: "Legend Position", type: "string", editor: createLegendPositionEditor() },
      { field: "xAxisTitle", label: "X Axis Title", type: "string" },
      { field: "xAxisTitleBinding", label: "X Axis Title Binding", type: "string" },
      { field: "xAxisMin", label: "X Axis Min", type: "number" },
      { field: "xAxisMax", label: "X Axis Max", type: "number" },
      { field: "yAxisTitle", label: "Y Axis Title", type: "string" },
      { field: "yAxisTitleBinding", label: "Y Axis Title Binding", type: "string" },
      { field: "yAxisMin", label: "Y Axis Min", type: "number" },
      { field: "yAxisMax", label: "Y Axis Max", type: "number" },
      { field: "yAxisBeginAtZero", label: "Y Axis Begin at Zero", type: "boolean" },
      { field: "stacked", label: "Stacked", type: "boolean" },
      ...super.getPropertyDefinitions(),
    ];
  }
}

function createChartTypeEditor() {
  return new DropdownList({
    defaultValue: "bar",
    items: [
      { value: "bar", label: "Bar" },
      { value: "line", label: "Line" },
      { value: "pie", label: "Pie" },
      { value: "doughnut", label: "Doughnut" },
      { value: "radar", label: "Radar" },
      { value: "polarArea", label: "Polar Area" },
    ],
  });
}

function createLegendPositionEditor() {
  return new DropdownList({
    defaultValue: "top",
    items: [
      { value: "top", label: "Top" },
      { value: "bottom", label: "Bottom" },
      { value: "left", label: "Left" },
      { value: "right", label: "Right" },
    ],
  });
}
