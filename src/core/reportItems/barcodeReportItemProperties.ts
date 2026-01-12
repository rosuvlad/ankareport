import DropdownList from "../../components/propertyGrid/editors/dropdownList";
import { Property } from "../../components/propertyGrid/property";
import BaseReportItemProperties from "./baseReportItemProperties";

export default class BarcodeReportItemProperties extends BaseReportItemProperties {
  private _value = "";
  private _binding = "";
  private _format = "";
  private _barWidth: 1 | 2 | 3 | 4 = 1;
  private _displayValue: boolean = false;

  get value() {
    return this._value;
  }
  get binding() {
    return this._binding;
  }
  get format() {
    return this._format;
  }
  get barWidth() {
    return this._barWidth;
  }
  get displayValue() {
    return this._displayValue;
  }

  set value(value: string) {
    const oldValue = this.value;
    this._value = value;
    this.emitOnChange("value", value, oldValue);
  }
  set binding(value: string) {
    const oldValue = this.binding;
    this._binding = value;
    this.emitOnChange("binding", value, oldValue);
  }
  set format(value: string) {
    const oldValue = this.format;
    this._format = value;
    this.emitOnChange("format", value, oldValue);
  }
  set barWidth(value: 1 | 2 | 3 | 4) {
    const oldValue = this.barWidth;
    this._barWidth = value;
    this.emitOnChange("barWidth", value, oldValue);
  }
  set displayValue(value: boolean | string) {
    const oldValue = this.displayValue;
    // Parse string to boolean
    if (typeof value === 'string') {
      this._displayValue = value.toLowerCase() === 'true';
    } else {
      this._displayValue = value;
    }
    this.emitOnChange("displayValue", this._displayValue, oldValue);
  }

  getPropertyDefinitions(): Property[] {
    return [
      { field: "value", label: "Value", type: "string" },
      { field: "binding", label: "Binding", type: "string" },
      { field: "format", label: "Format", type: "string", editor: createFormatEditor() },
      { field: "barWidth", label: "Bar Width", type: "number", editor: createBarWidthEditor() },
      { field: "displayValue", label: "Show Label", type: "string", editor: createBooleanEditor() },
      ...super.getPropertyDefinitions(),
    ];
  }
}

function createBooleanEditor() {
  return new DropdownList({
    defaultValue: "false",
    items: [
      { value: "false", label: "False" },
      { value: "true", label: "True" },
    ],
  });
}

function createFormatEditor() {
  return new DropdownList({
    defaultValue: "",
    items: [
      { value: "CODE128", label: "CODE128 auto" },
      { value: "CODE128A", label: "CODE128 A" },
      { value: "CODE128B", label: "CODE128 B" },
      { value: "CODE128C", label: "CODE128 C" },
      { value: "EAN13", label: "EAN13" },
      { value: "EAN8", label: "EAN8" },
      { value: "UPC", label: "UPC" },
      { value: "CODE39", label: "CODE39" },
      { value: "ITF14", label: "ITF14" },
      { value: "ITF", label: "ITF" },
      { value: "MSI", label: "MSI" },
      { value: "MSI10", label: "MSI10" },
      { value: "MSI11", label: "MSI11" },
      { value: "MSI1010", label: "MSI1010" },
      { value: "MSI1110", label: "MSI1110" },
      { value: "pharmacode", label: "Pharmacode" },
    ],
  });
}

function createBarWidthEditor() {
  return new DropdownList({
    defaultValue: "",
    items: [
      { value: "1", label: "1" },
      { value: "2", label: "2" },
      { value: "3", label: "3" },
      { value: "4", label: "4" },
    ],
  });
}
