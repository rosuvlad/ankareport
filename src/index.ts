import Designer, { DesignerOptions } from "./designer/designer";
import Renderer, { RendererOptions } from "./renderer/renderer";
import * as pkg from "../package.json";
import "./index.css";
import { exportToXlsx } from "./exports/excel-exporter";

export const version = pkg.version as string;

export function designer(options: DesignerOptions) {
  return new Designer(options);
}

export function render(options: RendererOptions) {
  return new Renderer(options);
}

export { exportToXlsx };
