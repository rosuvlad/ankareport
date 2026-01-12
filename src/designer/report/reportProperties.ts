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
  private _initialPageNumber: number | undefined;

  get pageSize() {
    return this._pageSize;
  }

  get width() {
    return this._width;
  }

  get height() {
    return this._height;
  }

  get initialPageNumber() {
    return this._initialPageNumber;
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

  set initialPageNumber(value: number | string | undefined) {
    const oldValue = this._initialPageNumber;
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (numValue !== undefined && numValue !== null && !isNaN(numValue)) {
      this._initialPageNumber = numValue;
    } else {
      this._initialPageNumber = undefined;
    }
    this.emitOnChange("initialPageNumber", this._initialPageNumber, oldValue);
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
      { field: "initialPageNumber", label: "Initial Page Number", type: "number" },
      ...super.getPropertyDefinitions(),
    ];
  }
}
