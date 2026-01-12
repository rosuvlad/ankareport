import DropdownList from "../../components/propertyGrid/editors/dropdownList";
import { Property } from "../../components/propertyGrid/property";
import BaseReportItemProperties from "./baseReportItemProperties";

export default class QRCodeReportItemProperties extends BaseReportItemProperties {
  private _value = "";
  private _binding = "";
  private _errorCorrectionLevel: "L" | "M" | "Q" | "H" = "M";

  get value() {
    return this._value;
  }
  get binding() {
    return this._binding;
  }
  get errorCorrectionLevel() {
    return this._errorCorrectionLevel;
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
  set errorCorrectionLevel(value: "L" | "M" | "Q" | "H") {
    const oldValue = this.errorCorrectionLevel;
    this._errorCorrectionLevel = value;
    this.emitOnChange("errorCorrectionLevel", value, oldValue);
  }

  getPropertyDefinitions(): Property[] {
    return [
      { field: "value", label: "Value", type: "string" },
      { field: "binding", label: "Binding", type: "string" },
      { field: "errorCorrectionLevel", label: "Error Correction", type: "string", editor: createErrorCorrectionEditor() },
      ...super.getPropertyDefinitions(),
    ];
  }
}

function createErrorCorrectionEditor() {
  return new DropdownList({
    defaultValue: "M",
    items: [
      { value: "L", label: "Low (7%)" },
      { value: "M", label: "Medium (15%)" },
      { value: "Q", label: "Quartile (25%)" },
      { value: "H", label: "High (30%)" },
    ],
  });
}
