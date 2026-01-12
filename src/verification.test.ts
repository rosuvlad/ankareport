
/**
 * @jest-environment node
 */

// Polyfill DOM for Chart.js / JsBarcode / PDFLib usage in Node
const mockContext = {
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(() => ({ data: [] })),
    putImageData: jest.fn(),
    createImageData: jest.fn(() => []),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    measureText: jest.fn(() => ({ width: 10 })), // Return some width
    transform: jest.fn(),
    rect: jest.fn(),
    clip: jest.fn(),
};

const mockCanvas = {
    getContext: () => mockContext,
    toDataURL: () => "data:image/png;base64,00",
    width: 0,
    height: 0,
};

(global as any).document = {
    createElement: (tag: string) => {
        if (tag === 'canvas') return mockCanvas;
        return {};
    },
    documentElement: {
        style: {}
    }
};

(global as any).window = global;
(global as any).HTMLCanvasElement = class { };

import { exportToPdf } from "./export/export-to-pdf";
import { exportToXlsx } from "./exports/excel-exporter";
import { ILayout } from "./core/layout";

describe("Verification", () => {
    // Suppress console.log during tests
    // jest.spyOn(console, 'log').mockImplementation(() => {});

    const mockLayout: ILayout = {
        width: 800,
        height: 600,
        pageSize: "A4",
        headerSection: { height: 50, items: [], binding: "" },
        contentSection: {
            height: "auto",
            binding: "",
            items: [
                { type: "text", name: "text1", x: 10, y: 10, width: 200, height: 20, text: "Simple Text", fontSize: "14px" },
                // Long text to trigger wrapping
                { type: "text", name: "text2", x: 10, y: 50, width: 200, height: 50, text: "This is a very long text that should wrap to multiple lines and verify that the wrapping logic works correctly without crashing.", fontSize: "12px", color: "#FF0000" },
            ]
        },
        footerSection: { height: 50, items: [], binding: "" },
        pageHeaderSection: {
            height: 30,
            binding: "",
            items: [{ type: "text", name: "ph", x: 0, y: 0, width: 100, height: 20, text: "First Page Header" }],
            visibleOnFirstPage: true
        },
        pageFooterSection: {
            height: 30,
            binding: "",
            items: [{ type: "text", name: "pf", x: 0, y: 0, width: 100, height: 20, text: "Last Page Footer" }],
            visibleOnLastPage: true
        },
    };

    const mockData = {
        title: "Test Report",
    };

    test("exportToPdf should succeed with text wrapping", async () => {
        const pdfBytes = await exportToPdf(mockLayout, mockData);
        expect(pdfBytes).toBeDefined();
        expect(pdfBytes.length).toBeGreaterThan(0);
        console.log(`PDF Generated. Size: ${pdfBytes.length} bytes`);
    });

    test("exportToXlsx should succeed", async () => {
        const workbook = await exportToXlsx(mockLayout, mockData);
        expect(workbook).toBeDefined();
    });
});
