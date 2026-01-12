
import Renderer from "./renderer";
import { ILayout } from "../core/layout";

// Mock dependencies to prevent loading issues in JSDOM
jest.mock("../exports/excel-exporter", () => ({
    exportToXlsx: jest.fn()
}));
jest.mock("../export/export-to-pdf", () => ({
    exportToPdf: jest.fn()
}));

describe("Renderer", () => {
    test("initializes with layout", () => {
        const div = document.createElement("div");
        const layout: ILayout = {
            headerSection: { height: 50, binding: "", items: [] },
            contentSection: { height: 100, binding: "", items: [] },
            footerSection: { height: 50, binding: "", items: [] },
        };
        const data = {};

        const renderer = new Renderer({ element: div, layout, data });

        expect(renderer).toBeDefined();
        expect(div.style.position).toBe("relative");
        // Check sections created
        expect(div.children.length).toBeGreaterThan(0);
    });

    test("respects initialPageNumber in properties", () => {
        const div = document.createElement("div");
        const layout: ILayout = {
            headerSection: { height: 50, binding: "", items: [] },
            contentSection: { height: 100, binding: "", items: [] },
            footerSection: { height: 50, binding: "", items: [] },
            pageHeaderSection: { height: 30, binding: "", items: [], visibleOnFirstPage: true },
            initialPageNumber: 5
        };
        const data = {};

        const renderer = new Renderer({ element: div, layout, data });
        // Since we cannot easily inspect internal state without exposing it, 
        // we check if the DOM reflects page generation logic that relies on page number.
        // However, standard renderer doesn't output visible page numbers unless binded.
        // For now, valid initialization with the property is a basic smoke test.
        expect(renderer).toBeDefined();

        // We can check if page header section was created (it relies on logic that touches initialPageNumber)
        // The header section creation code uses initialPageNumber.
        const header = div.querySelector("[data-section-type='page-header']");
        expect(header).not.toBeNull();
    });
});
