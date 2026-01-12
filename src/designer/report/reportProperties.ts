import { Property } from "../../components/propertyGrid/property";
import StyleProperties from "../../core/styleProperties";
import { PageSize } from "../../core/layout";
import { resolvePageDimensions, getAvailablePageSizes } from "../../core/utils/pageSize";
import DropdownList from "../../components/propertyGrid/editors/dropdownList";

const MIN_REPORT_WIDTH = 100;

export default class ReportProperties extends StyleProperties {
  private _pageSize: PageSize | undefined = "A4";
  private _width: number | undefined;
  private _height: number | undefined;
  private _pageHeaderVisibleOnFirstPage: boolean = false;
  private _pageFooterVisibleOnFirstPage: boolean = false;

  get pageSize() {
    return this._pageSize;
  }

  get width() {
    return this._width;
  }

  get height() {
    return this._height;
  }

  get pageHeaderVisibleOnFirstPage() {
    return this._pageHeaderVisibleOnFirstPage;
  }

  get pageFooterVisibleOnFirstPage() {
    return this._pageFooterVisibleOnFirstPage;
  }

  set pageSize(value: PageSize | undefined) {
    const oldValue = this.pageSize;
    this._pageSize = value;
    // Clear width/height when a page size is selected (use page size dimensions)
    if (value) {
      this._width = undefined;
      this._height = undefined;
    }
    this.emitOnChange("pageSize", value, oldValue);
  }

  set width(value: number | string | undefined) {
    const oldValue = this.width;
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (numValue !== undefined && numValue !== null && !isNaN(numValue) && numValue > 0) {
      this._width = Math.max(numValue, MIN_REPORT_WIDTH);
    } else {
      this._width = undefined;
    }
    this.emitOnChange("width", this._width, oldValue);
  }

  set height(value: number | string | undefined) {
    const oldValue = this.height;
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (numValue !== undefined && numValue !== null && !isNaN(numValue) && numValue > 0) {
      this._height = numValue;
    } else {
      this._height = undefined;
    }
    this.emitOnChange("height", this._height, oldValue);
  }

  set pageHeaderVisibleOnFirstPage(value: boolean | string) {
    const oldValue = this._pageHeaderVisibleOnFirstPage;
    this._pageHeaderVisibleOnFirstPage = value === true || value === "true";
    this.emitOnChange("pageHeaderVisibleOnFirstPage", this._pageHeaderVisibleOnFirstPage, oldValue);
  }

  set pageFooterVisibleOnFirstPage(value: boolean | string) {
    const oldValue = this._pageFooterVisibleOnFirstPage;
    this._pageFooterVisibleOnFirstPage = value === true || value === "true";
    this.emitOnChange("pageFooterVisibleOnFirstPage", this._pageFooterVisibleOnFirstPage, oldValue);
  }

  getPropertyDefinitions(): Property[] {
    const pageSizeItems = [
      { value: "", label: "(Custom)" },
      ...getAvailablePageSizes().map(size => ({ value: size, label: size })),
    ];

    const booleanItems = [
      { value: "false", label: "No" },
      { value: "true", label: "Yes" },
    ];

    return [
      { 
        field: "pageSize", 
        label: "Page Size", 
        type: "string",
        editor: new DropdownList({
          items: pageSizeItems,
          defaultValue: "A4",
        }),
      },
      { field: "width", label: "Width", type: "string" },
      { field: "height", label: "Height", type: "string" },
      { 
        field: "pageHeaderVisibleOnFirstPage", 
        label: "Page Header On First Page", 
        type: "string",
        editor: new DropdownList({
          items: booleanItems,
          defaultValue: "false",
        }),
      },
      { 
        field: "pageFooterVisibleOnFirstPage", 
        label: "Page Footer On First Page", 
        type: "string",
        editor: new DropdownList({
          items: booleanItems,
          defaultValue: "false",
        }),
      },
      ...super.getPropertyDefinitions(),
    ];
  }
}
