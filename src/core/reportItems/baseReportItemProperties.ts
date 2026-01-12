import NumberInput from "../../components/propertyGrid/editors/numberInput";
import { Property } from "../../components/propertyGrid/property";
import StyleProperties from "../styleProperties";
import { IConditionalStyle } from "../layout";

export default class BaseReportItemProperties extends StyleProperties {
  private _x = 0;
  private _y = 0;
  private _width = 0;
  private _height = 0;
  private _name = "";
  private _visible = "";
  private _conditionalStyles: IConditionalStyle[] = [];

  get x() {
    return this._x;
  }
  get y() {
    return this._y;
  }
  get width() {
    return this._width;
  }
  get height() {
    return this._height;
  }
  get name() {
    return this._name;
  }
  get visible() {
    return this._visible;
  }
  get conditionalStyles() {
    return this._conditionalStyles;
  }
  set x(value: number) {
    const oldValue = this.x;
    this._x = value;
    this.emitOnChange("x", value, oldValue);
  }
  set y(value: number) {
    const oldValue = this._y;
    this._y = value;
    this.emitOnChange("y", value, oldValue);
  }
  set width(value: number) {
    const oldValue = this.width;
    this._width = value;
    this.emitOnChange("width", value, oldValue);
  }
  set height(value: number) {
    const oldValue = this.height;
    this._height = value;
    this.emitOnChange("height", value, oldValue);
  }
  set name(value: string) {
    const oldValue = this.name;
    this._name = value;
    this.emitOnChange("name", value, oldValue);
  }
  set visible(value: string) {
    const oldValue = this.visible;
    this._visible = value;
    this.emitOnChange("visible", value, oldValue);
  }
  set conditionalStyles(value: IConditionalStyle[] | string) {
    const oldValue = this.conditionalStyles;
    // Handle JSON string input from property grid
    if (typeof value === 'string') {
      try {
        this._conditionalStyles = value ? JSON.parse(value) : [];
      } catch (e) {
        this._conditionalStyles = [];
      }
    } else {
      this._conditionalStyles = value ?? [];
    }
    this.emitOnChange("conditionalStyles", this._conditionalStyles, oldValue);
  }

  getPropertyDefinitions(): Property[] {
    return [
      {
        field: "x",
        label: "X",
        type: "number",
        editor: new NumberInput(),
      },
      {
        field: "y",
        label: "Y",
        type: "number",
        editor: new NumberInput(),
      },
      {
        field: "width",
        label: "Width",
        type: "number",
        editor: new NumberInput(),
      },
      {
        field: "height",
        label: "Height",
        type: "number",
        editor: new NumberInput(),
      },
      {
        field: "name",
        label: "Name",
        type: "string",
      },
      {
        field: "visible",
        label: "Visible",
        type: "string",
      },
      {
        field: "conditionalStyles",
        label: "Conditional Styles",
        type: "string",
      },
      ...super.getPropertyDefinitions(),
    ];
  }
}
