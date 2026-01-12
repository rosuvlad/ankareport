import { evaluateExpression, evaluateCondition, ExpressionContext } from "./expression";

describe("evaluateExpression", () => {
  describe("path resolution", () => {
    test("resolves simple path", () => {
      const context: ExpressionContext = { data: { name: "John" } };
      expect(evaluateExpression("name", context)).toBe("John");
    });

    test("resolves nested path", () => {
      const context: ExpressionContext = { data: { user: { name: "John" } } };
      expect(evaluateExpression("user.name", context)).toBe("John");
    });

    test("resolves array index", () => {
      const context: ExpressionContext = { data: { items: ["a", "b", "c"] } };
      expect(evaluateExpression("items[1]", context)).toBe("b");
    });

    test("resolves nested array path", () => {
      const context: ExpressionContext = {
        data: { orders: [{ id: 1 }, { id: 2 }] },
      };
      expect(evaluateExpression("orders[0].id", context)).toBe(1);
    });
  });

  describe("special variables", () => {
    test("resolves $index", () => {
      const context: ExpressionContext = { data: {}, index: 5 };
      expect(evaluateExpression("$index", context)).toBe(5);
    });

    test("resolves $rowNum", () => {
      const context: ExpressionContext = { data: {}, index: 5 };
      expect(evaluateExpression("$rowNum", context)).toBe(6);
    });

    test("resolves $pageNum", () => {
      const context: ExpressionContext = { data: {}, pageNum: 3 };
      expect(evaluateExpression("$pageNum", context)).toBe(3);
    });

    test("resolves $totalPages", () => {
      const context: ExpressionContext = { data: {}, totalPages: 10 };
      expect(evaluateExpression("$totalPages", context)).toBe(10);
    });

    test("resolves $groupKey", () => {
      const context: ExpressionContext = { data: {}, groupKey: "Electronics" };
      expect(evaluateExpression("$groupKey", context)).toBe("Electronics");
    });

    test("resolves $groupCount", () => {
      const context: ExpressionContext = { data: {}, groupCount: 5 };
      expect(evaluateExpression("$groupCount", context)).toBe(5);
    });

    test("resolves $sum_field", () => {
      const context: ExpressionContext = {
        data: {},
        groupData: [{ amount: 10 }, { amount: 20 }, { amount: 30 }],
      };
      expect(evaluateExpression("$sum_amount", context)).toBe(60);
    });

    test("resolves $avg_field", () => {
      const context: ExpressionContext = {
        data: {},
        groupData: [{ amount: 10 }, { amount: 20 }, { amount: 30 }],
      };
      expect(evaluateExpression("$avg_amount", context)).toBe(20);
    });
  });

  describe("arithmetic expressions", () => {
    test("evaluates multiplication", () => {
      const context: ExpressionContext = { data: { quantity: 5, price: 10 } };
      expect(evaluateExpression("quantity * price", context)).toBe(50);
    });

    test("evaluates complex arithmetic", () => {
      const context: ExpressionContext = { data: { a: 10, b: 5, c: 2 } };
      expect(evaluateExpression("a * b + c", context)).toBe(52);
    });

    test("evaluates with parentheses", () => {
      const context: ExpressionContext = { data: { quantity: 10, price: 100, discount: 0.1 } };
      expect(evaluateExpression("quantity * price * (1 - discount)", context)).toBe(900);
    });
  });

  describe("string concatenation", () => {
    test("concatenates strings", () => {
      const context: ExpressionContext = { data: { firstName: "John", lastName: "Doe" } };
      expect(evaluateExpression("firstName + ' ' + lastName", context)).toBe("John Doe");
    });
  });

  describe("ternary expressions", () => {
    test("evaluates true branch", () => {
      const context: ExpressionContext = { data: { status: "active" } };
      expect(evaluateExpression("status == 'active' ? 'Yes' : 'No'", context)).toBe("Yes");
    });

    test("evaluates false branch", () => {
      const context: ExpressionContext = { data: { status: "inactive" } };
      expect(evaluateExpression("status == 'active' ? 'Yes' : 'No'", context)).toBe("No");
    });

    test("evaluates numeric comparison", () => {
      const context: ExpressionContext = { data: { amount: 100 } };
      expect(evaluateExpression("amount > 0 ? amount : 0", context)).toBe(100);
    });
  });

  describe("fallback values", () => {
    test("returns value when not null", () => {
      const context: ExpressionContext = { data: { name: "John" } };
      expect(evaluateExpression("name ?? 'Unknown'", context)).toBe("John");
    });

    test("returns fallback when null", () => {
      const context: ExpressionContext = { data: { name: null } };
      expect(evaluateExpression("name ?? 'Unknown'", context)).toBe("Unknown");
    });

    test("returns fallback when undefined", () => {
      const context: ExpressionContext = { data: {} };
      expect(evaluateExpression("name ?? 'Unknown'", context)).toBe("Unknown");
    });
  });

  describe("aggregate functions", () => {
    test("SUM calculates sum", () => {
      const context: ExpressionContext = {
        data: { items: [{ amount: 10 }, { amount: 20 }, { amount: 30 }] },
      };
      expect(evaluateExpression("SUM(items.amount)", context)).toBe(60);
    });

    test("COUNT counts items", () => {
      const context: ExpressionContext = {
        data: { items: [{ id: 1 }, { id: 2 }, { id: 3 }] },
      };
      expect(evaluateExpression("COUNT(items)", context)).toBe(3);
    });

    test("AVG calculates average", () => {
      const context: ExpressionContext = {
        data: { items: [{ value: 10 }, { value: 20 }, { value: 30 }] },
      };
      expect(evaluateExpression("AVG(items.value)", context)).toBe(20);
    });

    test("MIN finds minimum", () => {
      const context: ExpressionContext = {
        data: { items: [{ value: 30 }, { value: 10 }, { value: 20 }] },
      };
      expect(evaluateExpression("MIN(items.value)", context)).toBe(10);
    });

    test("MAX finds maximum", () => {
      const context: ExpressionContext = {
        data: { items: [{ value: 30 }, { value: 10 }, { value: 20 }] },
      };
      expect(evaluateExpression("MAX(items.value)", context)).toBe(30);
    });
  });

  describe("filters/pipes", () => {
    test("uppercase filter", () => {
      const context: ExpressionContext = { data: { name: "john" } };
      expect(evaluateExpression("name | uppercase", context)).toBe("JOHN");
    });

    test("lowercase filter", () => {
      const context: ExpressionContext = { data: { name: "JOHN" } };
      expect(evaluateExpression("name | lowercase", context)).toBe("john");
    });

    test("capitalize filter", () => {
      const context: ExpressionContext = { data: { name: "john doe" } };
      expect(evaluateExpression("name | capitalize", context)).toBe("John Doe");
    });

    test("trim filter", () => {
      const context: ExpressionContext = { data: { text: "  hello  " } };
      expect(evaluateExpression("text | trim", context)).toBe("hello");
    });

    test("number filter with decimals", () => {
      const context: ExpressionContext = { data: { value: 123.456 } };
      expect(evaluateExpression("value | number:2", context)).toBe("123.46");
    });

    test("percent filter", () => {
      const context: ExpressionContext = { data: { ratio: 0.75 } };
      expect(evaluateExpression("ratio | percent:1", context)).toBe("75.0%");
    });

    test("truncate filter", () => {
      const context: ExpressionContext = { data: { text: "Hello World" } };
      expect(evaluateExpression("text | truncate:5", context)).toBe("Hello...");
    });

    test("padstart filter", () => {
      const context: ExpressionContext = { data: { id: "42" } };
      expect(evaluateExpression("id | padstart:5,'0'", context)).toBe("00042");
    });

    test("default filter", () => {
      const context: ExpressionContext = { data: { value: null } };
      expect(evaluateExpression("value | default:'N/A'", context)).toBe("N/A");
    });

    test("chained filters", () => {
      const context: ExpressionContext = { data: { name: "  john  " } };
      expect(evaluateExpression("name | trim | uppercase", context)).toBe("JOHN");
    });

    test("abs filter", () => {
      const context: ExpressionContext = { data: { value: -42 } };
      expect(evaluateExpression("value | abs", context)).toBe(42);
    });

    test("round filter", () => {
      const context: ExpressionContext = { data: { value: 3.7 } };
      expect(evaluateExpression("value | round", context)).toBe(4);
    });
  });
});

describe("LOCALIZE function", () => {
  test("returns localized string from default resources path", () => {
    const context: ExpressionContext = {
      data: {
        context: {
          localization: {
            localeCode: "en-US",
            resources: {
              "en-US": { "greeting": "Hello", "farewell": "Goodbye" },
              "ro": { "greeting": "Salut", "farewell": "La revedere" },
            },
          },
        },
      },
    };
    expect(evaluateExpression("LOCALIZE('greeting', 'Hello')", context)).toBe("Hello");
  });

  test("returns localized string for different locale", () => {
    const context: ExpressionContext = {
      data: {
        context: {
          localization: {
            localeCode: "ro",
            resources: {
              "en-US": { "greeting": "Hello" },
              "ro": { "greeting": "Salut" },
            },
          },
        },
      },
    };
    expect(evaluateExpression("LOCALIZE('greeting', 'Hello')", context)).toBe("Salut");
  });

  test("returns default text when key not found", () => {
    const context: ExpressionContext = {
      data: {
        context: {
          localization: {
            localeCode: "en-US",
            resources: {
              "en-US": { "other": "Other" },
            },
          },
        },
      },
    };
    expect(evaluateExpression("LOCALIZE('missing', 'Default Text')", context)).toBe("Default Text");
  });

  test("uses explicit locale code parameter", () => {
    const context: ExpressionContext = {
      data: {
        context: {
          localization: {
            localeCode: "en-US",
            resources: {
              "en-US": { "greeting": "Hello" },
              "cs-CZ": { "greeting": "Ahoj" },
            },
          },
        },
      },
    };
    expect(evaluateExpression("LOCALIZE('greeting', 'Hello', 'cs-CZ')", context)).toBe("Ahoj");
  });

  test("uses custom resources path", () => {
    const context: ExpressionContext = {
      data: {
        customResources: {
          "de": { "greeting": "Hallo" },
        },
      },
    };
    expect(evaluateExpression("LOCALIZE('greeting', 'Hello', 'de', customResources)", context)).toBe("Hallo");
  });

  test("returns default when no localization context exists", () => {
    const context: ExpressionContext = { data: {} };
    expect(evaluateExpression("LOCALIZE('greeting', 'Hello')", context)).toBe("Hello");
  });

  test("works with dynamic key from binding", () => {
    const context: ExpressionContext = {
      data: {
        labelKey: "product_name",
        context: {
          localization: {
            localeCode: "en-US",
            resources: {
              "en-US": { "product_name": "Product Name" },
            },
          },
        },
      },
    };
    expect(evaluateExpression("LOCALIZE(labelKey, 'Name')", context)).toBe("Product Name");
  });
});

describe("evaluateCondition", () => {
  test("returns true for truthy expression", () => {
    const context: ExpressionContext = { data: { status: "paid" } };
    expect(evaluateCondition("status == 'paid'", context)).toBe(true);
  });

  test("returns false for falsy expression", () => {
    const context: ExpressionContext = { data: { status: "pending" } };
    expect(evaluateCondition("status == 'paid'", context)).toBe(false);
  });

  test("returns true for numeric comparison", () => {
    const context: ExpressionContext = { data: { amount: 100 } };
    expect(evaluateCondition("amount > 50", context)).toBe(true);
  });

  test("returns true for empty condition", () => {
    const context: ExpressionContext = { data: {} };
    expect(evaluateCondition("", context)).toBe(true);
  });
});
