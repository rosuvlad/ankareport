import { Chart, registerables, ChartOptions } from "chart.js";
import { IChartReportItem } from "../layout";
import { MultipleStyles } from "../utils/style.utils";
import ChartReportItemProperties from "./chartReportItemProperties";
import BaseReportItem, { ReportItemOptions } from "./baseReportItem";

Chart.register(...registerables);

export default class ChartReportItem extends BaseReportItem {
  public elementCanvas: HTMLCanvasElement = null!;
  private chart: Chart | null = null;

  public readonly properties = new ChartReportItemProperties();

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

    if (this.elementCanvas) {
      this.elementCanvas.remove();
    }
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    this.elementCanvas = document.createElement("canvas");
    this.elementCanvas.width = this.properties.width;
    this.elementCanvas.height = this.properties.height;
    this.element.appendChild(this.elementCanvas);

    const ctx = this.elementCanvas.getContext("2d");
    if (!ctx) return;

    const chartData = {
      labels: this.properties.labels.length > 0 ? this.properties.labels : ["Label 1", "Label 2", "Label 3"],
      datasets: this.properties.datasets.length > 0 ? this.properties.datasets : [
        {
          label: "Sample Data",
          data: [10, 20, 30],
          backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
          borderColor: ["#FF6384", "#36A2EB", "#FFCE56"],
          borderWidth: 1,
        },
      ],
    };

    this.chart = new Chart(ctx, {
      type: this.properties.chartType,
      data: chartData,
      options: this.buildChartOptions(),
    });
  }

  private buildChartOptions(): ChartOptions {
    const options: ChartOptions = {
      responsive: false,
      maintainAspectRatio: false,
      animation: false,  // Disable all animations for static rendering
      plugins: {
        title: {
          display: !!this.properties.title,
          text: this.properties.title,
        },
        legend: {
          display: this.properties.showLegend,
          position: this.properties.legendPosition,
          align: this.properties.legend?.align || "center",
        },
      },
    };

    // Add scales for bar/line charts
    if (["bar", "line", "radar"].includes(this.properties.chartType)) {
      (options as any).scales = {
        x: {
          display: true,
          stacked: this.properties.stacked,
          title: {
            display: !!this.properties.xAxisTitle,
            text: this.properties.xAxisTitle,
          },
        },
        y: {
          display: true,
          stacked: this.properties.stacked,
          beginAtZero: this.properties.yAxisBeginAtZero,
          title: {
            display: !!this.properties.yAxisTitle,
            text: this.properties.yAxisTitle,
          },
          min: this.properties.yAxisMin,
          max: this.properties.yAxisMax,
        },
      };
    }

    return options;
  }

  applyLayout(layout: Partial<IChartReportItem>) {
    this.properties.chartType = layout.chartType || "bar";
    this.properties.labels = layout.labels || [];
    this.properties.labelsBinding = layout.labelsBinding || "";
    this.properties.datasets = layout.datasets || [];
    this.properties.datasetsBinding = layout.datasetsBinding || "";
    this.properties.title = layout.title || "";
    this.properties.titleBinding = layout.titleBinding || "";
    this.properties.showLegend = layout.showLegend ?? layout.legend?.display ?? true;
    this.properties.legendPosition = layout.legendPosition || layout.legend?.position || "top";
    this.properties.legend = layout.legend || {};
    this.properties.scales = layout.scales || {};
    
    // Apply axis configuration from scales
    if (layout.scales?.x?.title?.text) {
      this.properties.xAxisTitle = layout.scales.x.title.text;
    }
    if (layout.scales?.y?.title?.text) {
      this.properties.yAxisTitle = layout.scales.y.title.text;
    }
    if (layout.scales?.y?.beginAtZero !== undefined) {
      this.properties.yAxisBeginAtZero = layout.scales.y.beginAtZero;
    }
    if (layout.scales?.x?.stacked || layout.scales?.y?.stacked) {
      this.properties.stacked = true;
    }
    if (layout.scales?.y?.min !== undefined) {
      this.properties.yAxisMin = layout.scales.y.min;
    }
    if (layout.scales?.y?.max !== undefined) {
      this.properties.yAxisMax = layout.scales.y.max;
    }
    
    super.applyLayout(layout);
  }

  toJSON(): IChartReportItem {
    const result: IChartReportItem = {
      ...super.toJSON(),
      type: "chart",
      chartType: this.properties.chartType,
      labels: this.properties.labels,
      labelsBinding: this.properties.labelsBinding || undefined,
      datasets: this.properties.datasets,
      datasetsBinding: this.properties.datasetsBinding || undefined,
      title: this.properties.title || undefined,
      titleBinding: this.properties.titleBinding || undefined,
      showLegend: this.properties.showLegend,
      legendPosition: this.properties.legendPosition,
    };

    // Add legend config if customized
    if (this.properties.legend && Object.keys(this.properties.legend).length > 0) {
      result.legend = this.properties.legend;
    }

    // Add scales config
    const scales: any = {};
    if (this.properties.xAxisTitle || this.properties.xAxisTitleBinding) {
      scales.x = {
        title: {
          display: true,
          text: this.properties.xAxisTitle,
          textBinding: this.properties.xAxisTitleBinding || undefined,
        },
        stacked: this.properties.stacked || undefined,
      };
    }
    if (this.properties.yAxisTitle || this.properties.yAxisTitleBinding || 
        this.properties.yAxisBeginAtZero || this.properties.yAxisMin !== undefined || 
        this.properties.yAxisMax !== undefined) {
      scales.y = {
        title: {
          display: !!this.properties.yAxisTitle,
          text: this.properties.yAxisTitle,
          textBinding: this.properties.yAxisTitleBinding || undefined,
        },
        beginAtZero: this.properties.yAxisBeginAtZero || undefined,
        min: this.properties.yAxisMin,
        max: this.properties.yAxisMax,
        stacked: this.properties.stacked || undefined,
      };
    }
    if (Object.keys(scales).length > 0) {
      result.scales = scales;
    }

    return result;
  }

  async toBase64(): Promise<string> {
    if (!this.elementCanvas) return "";
    return this.elementCanvas.toDataURL("image/png").split(",")[1];
  }
}
