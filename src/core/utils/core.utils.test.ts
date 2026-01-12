
import { getPageDimensions, resolvePageDimensions, EXCEL_PAPER_SIZES, getExcelPaperSize } from "./pageSize";
import { MultipleStyles } from "./style.utils";
import StyleProperties from "../styleProperties";

describe("PageSize Utils", () => {
    test("getPageDimensions returns correct sizes", () => {
        expect(getPageDimensions("A4")).toEqual({ width: 595, height: 842 });
        expect(getPageDimensions("Letter")).toEqual({ width: 612, height: 792 });
        expect(getPageDimensions("A3")).toEqual({ width: 842, height: 1191 });
    });

    test("resolvePageDimensions prioritizes arguments", () => {
        // defaults to A4
        expect(resolvePageDimensions()).toEqual({ width: 595, height: 842 });

        // explicit overrides
        expect(resolvePageDimensions("A4", 100, 200)).toEqual({ width: 100, height: 200 });

        // partial override
        expect(resolvePageDimensions("A4", undefined, 200)).toEqual({ width: 595, height: 200 });
    });

    test("getExcelPaperSize returns correct codes", () => {
        expect(getExcelPaperSize("A4")).toBe(EXCEL_PAPER_SIZES.A4);
        expect(getExcelPaperSize("Letter")).toBe(EXCEL_PAPER_SIZES.Letter);
    });
});

describe("Style Utils (MultipleStyles)", () => {
    test("resolves styles with precedence", () => {
        const s1 = new StyleProperties({ color: "red", fontSize: "10px" });
        const s2 = new StyleProperties({ color: "blue" }); // overrides color, inherits fontSize? No, straightforward override check

        const multi = new MultipleStyles(s1, s2);

        // s2 is added last, so it has higher precedence usually? 
        // Let's check implementation: loop starts from end (length - 1). 
        // logical: last pushed style wins.

        expect(multi.getStyle("color", "default")).toBe("blue");
        expect(multi.getStyle("fontSize", "default")).toBe("10px");
        expect(multi.getStyle("backgroundColor", "transparent")).toBe("transparent");
    });
});
