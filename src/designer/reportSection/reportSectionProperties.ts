import { Property } from "../../components/propertyGrid/property";
import StyleProperties from "../../core/styleProperties";

const DEFAULT_SECTION_HEIGHT = 100;
const MIN_SECTION_HEIGHT = 10;

export default class ReportSectionProperties extends StyleProperties {
  private _height: number | "auto" = DEFAULT_SECTION_HEIGHT;
  private _binding = "";
  private _title = "Section";
  private _groupBy = "";
  private _keepTogether = false;

  get height() {
    return this._height;
  }
  get binding() {
    return this._binding;
  }
  get title() {
    return this._title;
  }
  get groupBy() {
    return this._groupBy;
  }
  get keepTogether() {
    return this._keepTogether;
  }

  set height(value: number | "auto") {
    const oldValue = this.height;
    if (value === "auto") {
      this._height = "auto";
    } else {
      this._height = Math.max(MIN_SECTION_HEIGHT, value);
    }
    this.emitOnChange("height", value, oldValue);
  }
  set binding(value: string) {
    const oldValue = this.binding;
    this._binding = value;
    this.emitOnChange("binding", value, oldValue);
  }
  set title(value: string) {
    const oldValue = this.title;
    this._title = value;
    this.emitOnChange("title", value, oldValue);
  }
  set groupBy(value: string) {
    const oldValue = this.groupBy;
    this._groupBy = value;
    this.emitOnChange("groupBy", value, oldValue);
  }
  set keepTogether(value: boolean) {
    const oldValue = this.keepTogether;
    this._keepTogether = value;
    this.emitOnChange("keepTogether", value, oldValue);
  }

  getPropertyDefinitions(): Property[] {
    return [
      { field: "height", label: "Height", type: "string" },
      { field: "groupBy", label: "Group By", type: "string" },
      { field: "keepTogether", label: "Keep Together", type: "boolean" },
      ...super.getPropertyDefinitions(),
    ];
  }
}
