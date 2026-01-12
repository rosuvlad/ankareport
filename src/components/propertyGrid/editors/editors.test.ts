
import NumberInput from "./numberInput";
import Textbox from "./textbox";

describe("Property Editors", () => {
    test("NumberInput renders input[type=number]", () => {
        const editor = new NumberInput({ minValue: 0, maxValue: 100 });
        expect(editor.element.tagName).toBe("INPUT");
        expect(editor.element.type).toBe("number");
        expect(editor.element.min).toBe("0");
        expect(editor.element.max).toBe("100");
    });

    test("NumberInput emits change event", () => {
        const editor = new NumberInput();
        let valueBound = 0;

        editor.addEventListener("change", (e) => {
            valueBound = (e as any).value;
        });

        // Simulate DOM interaction
        editor.element.value = "42";
        editor.element.dispatchEvent(new Event("change"));

        expect(valueBound).toBe("42");
    });

    test("Textbox renders correct input", () => {
        const editor = new Textbox();
        expect(editor.element.tagName).toBe("INPUT");
        expect(editor.element.type).toBe("text");
    });

    test("Textbox emits change event", () => {
        const editor = new Textbox();
        let textBound = "";

        editor.addEventListener("change", (e) => {
            textBound = e.value;
        });

        editor.element.value = "New Text";
        editor.element.dispatchEvent(new Event("input")); // Textbox listens to input or change? Let's assume standard input for now or check impl.
        // Assuming Textbox implements standard PropertyEditor interface which listens to one of them.
        // Let's force check impl if this fails.
        // Usually these editors listen to 'change' or 'input'.
        // Let's try 'change' first as per NumberInput pattern.
        editor.element.dispatchEvent(new Event("change"));

        expect(textBound).toBe("New Text");
    });
});
