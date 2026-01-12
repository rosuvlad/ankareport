
import TextReportItemProperties from "./textReportItemProperties";
import BaseReportItemProperties from "./baseReportItemProperties";

describe("Report Item Properties", () => {
    test("TextReportItemProperties defaults", () => {
        const props = new TextReportItemProperties();
        expect(props.text).toBe("");
        expect(props.binding).toBe("");
        expect(props.format).toBe("");
        // Base properties
        expect(props.x).toBe(0);
        expect(props.y).toBe(0);
        expect(props.width).toBe(0);
        expect(props.height).toBe(0);
    });

    test("TextReportItemProperties setters trigger events", () => {
        const props = new TextReportItemProperties();
        let lastEvent: any = null;

        props.addEventListener("change", (e) => {
            lastEvent = e;
        });

        props.text = "Hello";
        expect(props.text).toBe("Hello");
        expect(lastEvent).toBeDefined();
        expect(lastEvent.changes).toHaveLength(1);
        expect(lastEvent.changes[0]).toEqual({
            property: "text",
            newValue: "Hello",
            oldValue: ""
        });

        props.binding = "data.field";
        expect(props.binding).toBe("data.field");
        expect(lastEvent.changes[0]).toEqual({
            property: "binding",
            newValue: "data.field",
            oldValue: ""
        });
    });

    test("BaseReportItemProperties setters trigger events", () => {
        const props = new TextReportItemProperties(); // Concrete implementation
        let allChanges: any[] = [];

        props.addEventListener("change", (e) => {
            allChanges.push(...e.changes);
        });

        props.x = 10;
        props.y = 20;
        props.width = 100;

        expect(props.x).toBe(10);
        expect(props.y).toBe(20);
        expect(props.width).toBe(100);

        expect(allChanges.length).toBe(3);
        expect(allChanges[0]).toEqual({ property: "x", newValue: 10, oldValue: 0 });
        expect(allChanges[1]).toEqual({ property: "y", newValue: 20, oldValue: 0 });
        expect(allChanges[2]).toEqual({ property: "width", newValue: 100, oldValue: 0 });
    });

    test("Handling JSON string for conditionalStyles", () => {
        const props = new BaseReportItemProperties();

        const styles = [{ condition: "val > 10", color: "red" }];
        const json = JSON.stringify(styles);

        props.conditionalStyles = json;

        const styles_ = (props.conditionalStyles as unknown) as any[];
        expect(styles_).toHaveLength(1);
        expect(styles_[0].color).toBe("red");

        // Test invalid JSON fallback
        props.conditionalStyles = "invalid {";
        expect(props.conditionalStyles).toEqual([]);
    });
});
