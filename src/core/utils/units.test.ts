
import { ptToPx, pxToPt, parseSizeToPx, parseSizeToPt } from "./units";

describe("Unit Conversions", () => {
    test("converts pt to px", () => {
        // 1 pt approx 1.3333 px
        expect(ptToPx(1)).toBeCloseTo(1.3333, 3);
        expect(ptToPx(12)).toBeCloseTo(16, 0);
    });

    test("converts px to pt", () => {
        // 1 px approx 0.75 pt
        expect(pxToPt(1)).toBeCloseTo(0.75, 2);
        expect(pxToPt(16)).toBeCloseTo(12, 0);
    });

    test("parses size string to px", () => {
        expect(parseSizeToPx("16px")).toBe(16);
        expect(parseSizeToPx("12pt")).toBeCloseTo(16, 0);
        expect(parseSizeToPx("10")).toBe(10); // Default to px
        expect(parseSizeToPx("invalid")).toBe(0);
    });

    test("parses size string to pt", () => {
        expect(parseSizeToPt("16px")).toBeCloseTo(12, 0);
        expect(parseSizeToPt("12pt")).toBe(12);
        expect(parseSizeToPt("12")).toBeCloseTo(9, 0); // Default input treated as px (12px -> 9pt) based on current logic?
        // Check logic: "if (sizeStr.endsWith("px") || !sizeStr.match(/[a-z%]+$/i))" -> treated as px
        // So "12" matches !... -> treated as px -> converted to pt. Correct.
    });
});
