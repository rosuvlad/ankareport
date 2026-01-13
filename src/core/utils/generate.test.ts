import { ILayout } from "../layout";
import { generateItems } from "./generate";

describe("getItems", () => {
  test("get correct items", () => {
    const layout = getLayout();

    const data = {
      title: "Report1",
      invoices: [
        {
          ficheNo: "0000000001",
          client: "Client1",
          lines: [
            { stock: "Stock 1", description: "Description 1" },
            { stock: "Stock 2", description: "Description 2" },
          ],
        },
        {
          ficheNo: "0000000002",
          client: "Client2",
          lines: [
            { stock: "Stock 3", description: "Description 3" },
            { stock: "Stock 4", description: "Description 4" },
          ],
        },
      ],
    };

    const items = generateItems(layout, data);

    expect(items.length).toBe(16);

    const client2 = items.find(x => x.type === "text" && x.text === "Client2");
    const footer2 = items.find(x => x.type === "text" && x.text === "Footer 2");

    expect(client2).toEqual({
      type: "text",
      name: "",
      binding: "$.client",
      text: "Client2",
      x: 25,
      y: 400,
      width: 80,
      height: 10,
      color: "#000000",
      fontFamily: "Arial",
      fontSize: "12px",
    });

    expect(footer2).toEqual({
      type: "text",
      name: "",
      text: "Footer 2",
      x: 20,
      y: 670,
      width: 40,
      height: 10,
      color: "#000000",
      fontFamily: "Arial",
      fontSize: "12px",
    });
  });
});

describe("path-based binding", () => {
  test("resolves nested path binding in header", () => {
    const layout: ILayout = {
      width: 500,
      headerSection: {
        height: 50,
        binding: "",
        items: [
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "$.invoices[0].client" },
        ],
      },
      contentSection: { height: 0, binding: "", items: [] },
      footerSection: { height: 0, binding: "", items: [] },
    };

    const data = {
      invoices: [{ client: "Client1" }, { client: "Client2" }],
    };

    const items = generateItems(layout, data);
    const headerItem = items.find(x => x.type === "text");

    expect(headerItem?.text).toBe("Client1");
  });

  test("resolves deeply nested path binding", () => {
    const layout: ILayout = {
      width: 500,
      headerSection: {
        height: 50,
        binding: "",
        items: [
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "$.data.items[1].details.value" },
        ],
      },
      contentSection: { height: 0, binding: "", items: [] },
      footerSection: { height: 0, binding: "", items: [] },
    };

    const data = {
      data: {
        items: [
          { details: { value: "First" } },
          { details: { value: "Second" } },
        ],
      },
    };

    const items = generateItems(layout, data);
    const headerItem = items.find(x => x.type === "text");

    expect(headerItem?.text).toBe("Second");
  });
});

describe("report() rowIndex binding", () => {
  test("resolves report('$.rowIndex') in content section", () => {
    const layout: ILayout = {
      width: 500,
      headerSection: { height: 0, binding: "", items: [] },
      contentSection: {
        height: 50,
        binding: "$.items",
        items: [
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "report('$.rowIndex')" },
        ],
      },
      footerSection: { height: 0, binding: "", items: [] },
    };

    const data = {
      items: [{}, {}, {}],
    };

    const items = generateItems(layout, data);
    const textItems = items.filter(x => x.type === "text");

    expect(textItems.length).toBe(3);
    expect(textItems[0].text).toBe("0");
    expect(textItems[1].text).toBe("1");
    expect(textItems[2].text).toBe("2");
  });

  test("resolves report('$.rowIndex') in nested subsection", () => {
    const layout: ILayout = {
      width: 500,
      headerSection: { height: 0, binding: "", items: [] },
      contentSection: {
        height: 50,
        binding: "$.orders",
        items: [],
        sections: [
          {
            height: 30,
            binding: "$.lines",
            items: [
              { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "report('$.rowIndex')" },
            ],
          },
        ],
      },
      footerSection: { height: 0, binding: "", items: [] },
    };

    const data = {
      orders: [
        { lines: [{}, {}, {}] },
      ],
    };

    const items = generateItems(layout, data);
    const textItems = items.filter(x => x.type === "text");

    expect(textItems.length).toBe(3);
    expect(textItems[0].text).toBe("0");
    expect(textItems[1].text).toBe("1");
    expect(textItems[2].text).toBe("2");
  });

  test("resolves report('$.rowIndex') in path binding", () => {
    const layout: ILayout = {
      width: 500,
      headerSection: { height: 0, binding: "", items: [] },
      contentSection: {
        height: 50,
        binding: "$.items",
        items: [
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "$.values[report('$.rowIndex')]" },
        ],
      },
      footerSection: { height: 0, binding: "", items: [] },
    };

    const data = {
      items: [
        { values: ["A", "B", "C"] },
        { values: ["D", "E", "F"] },
        { values: ["G", "H", "I"] },
      ],
    };

    const items = generateItems(layout, data);
    const textItems = items.filter(x => x.type === "text");

    expect(textItems.length).toBe(3);
    expect(textItems[0].text).toBe("A");
    expect(textItems[1].text).toBe("E");
    expect(textItems[2].text).toBe("I");
  });
});

describe("header/footer section binding", () => {
  test("resolves header section binding before item bindings", () => {
    const layout: ILayout = {
      width: 500,
      headerSection: {
        height: 50,
        binding: "$.header",
        items: [
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "$.title" },
        ],
      },
      contentSection: { height: 0, binding: "", items: [] },
      footerSection: { height: 0, binding: "", items: [] },
    };

    const data = {
      header: { title: "Header Title" },
      title: "Root Title",
    };

    const items = generateItems(layout, data);
    const headerItem = items.find(x => x.type === "text");

    expect(headerItem?.text).toBe("Header Title");
  });

  test("resolves footer section binding before item bindings", () => {
    const layout: ILayout = {
      width: 500,
      headerSection: { height: 0, binding: "", items: [] },
      contentSection: { height: 0, binding: "", items: [] },
      footerSection: {
        height: 50,
        binding: "$.footer",
        items: [
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "$.summary" },
        ],
      },
    };

    const data = {
      footer: { summary: "Footer Summary" },
      summary: "Root Summary",
    };

    const items = generateItems(layout, data);
    const footerItem = items.find(x => x.type === "text");

    expect(footerItem?.text).toBe("Footer Summary");
  });

  test("resolves header section binding with array index", () => {
    const layout: ILayout = {
      width: 500,
      headerSection: {
        height: 50,
        binding: "$.invoices[0]",
        items: [
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "$.client" },
        ],
      },
      contentSection: { height: 0, binding: "", items: [] },
      footerSection: { height: 0, binding: "", items: [] },
    };

    const data = {
      invoices: [{ client: "First Client" }, { client: "Second Client" }],
    };

    const items = generateItems(layout, data);
    const headerItem = items.find(x => x.type === "text");

    expect(headerItem?.text).toBe("First Client");
  });

  test("falls back to root data when section binding is invalid", () => {
    const layout: ILayout = {
      width: 500,
      headerSection: {
        height: 50,
        binding: "$.nonexistent",
        items: [
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "$.title" },
        ],
      },
      contentSection: { height: 0, binding: "", items: [] },
      footerSection: { height: 0, binding: "", items: [] },
    };

    const data = {
      title: "Root Title",
    };

    const items = generateItems(layout, data);
    const headerItem = items.find(x => x.type === "text");

    expect(headerItem?.text).toBe("Root Title");
  });
});

describe("grouping and subtotals", () => {
  test("groups content by field", () => {
    const layout: ILayout = {
      width: 500,
      headerSection: { height: 0, binding: "", items: [] },
      contentSection: {
        height: 25,
        binding: "$.items",
        groupBy: "category",
        items: [
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "$.name" },
        ],
      },
      footerSection: { height: 0, binding: "", items: [] },
    };

    const data = {
      items: [
        { category: "A", name: "Item1" },
        { category: "B", name: "Item2" },
        { category: "A", name: "Item3" },
      ],
    };

    const items = generateItems(layout, data);
    const textItems = items.filter(x => x.type === "text");

    expect(textItems.length).toBe(3);
    // Items should be grouped: A items first, then B items
    expect(textItems[0].text).toBe("Item1");
    expect(textItems[1].text).toBe("Item3");
    expect(textItems[2].text).toBe("Item2");
  });

  test("renders group header with $groupKey", () => {
    const layout: ILayout = {
      width: 500,
      headerSection: { height: 0, binding: "", items: [] },
      contentSection: {
        height: 25,
        binding: "$.items",
        groupBy: "category",
        groupHeader: {
          height: 30,
          binding: "",
          items: [
            { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "$groupKey" },
          ],
        },
        items: [
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "$.name" },
        ],
      },
      footerSection: { height: 0, binding: "", items: [] },
    };

    const data = {
      items: [
        { category: "Electronics", name: "Phone" },
        { category: "Electronics", name: "Laptop" },
        { category: "Clothing", name: "Shirt" },
      ],
    };

    const items = generateItems(layout, data);
    const textItems = items.filter(x => x.type === "text");

    // Should have: Electronics header, Phone, Laptop, Clothing header, Shirt
    expect(textItems.length).toBe(5);
    expect(textItems[0].text).toBe("Electronics");
    expect(textItems[1].text).toBe("Phone");
    expect(textItems[2].text).toBe("Laptop");
    expect(textItems[3].text).toBe("Clothing");
    expect(textItems[4].text).toBe("Shirt");
  });

  test("renders group footer with $sum_field", () => {
    const layout: ILayout = {
      width: 500,
      headerSection: { height: 0, binding: "", items: [] },
      contentSection: {
        height: 25,
        binding: "$.items",
        groupBy: "category",
        groupFooter: {
          height: 30,
          binding: "",
          items: [
            { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "$sum_amount" },
          ],
        },
        items: [
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "$.name" },
        ],
      },
      footerSection: { height: 0, binding: "", items: [] },
    };

    const data = {
      items: [
        { category: "A", name: "Item1", amount: 10 },
        { category: "A", name: "Item2", amount: 20 },
        { category: "B", name: "Item3", amount: 15 },
      ],
    };

    const items = generateItems(layout, data);
    const textItems = items.filter(x => x.type === "text");

    // Should have: Item1, Item2, sum(30), Item3, sum(15)
    expect(textItems.length).toBe(5);
    expect(textItems[2].text).toBe("30"); // Sum of category A
    expect(textItems[4].text).toBe("15"); // Sum of category B
  });

  test("renders $groupCount in group header", () => {
    const layout: ILayout = {
      width: 500,
      headerSection: { height: 0, binding: "", items: [] },
      contentSection: {
        height: 25,
        binding: "$.items",
        groupBy: "category",
        groupHeader: {
          height: 30,
          binding: "",
          items: [
            { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "$groupCount" },
          ],
        },
        items: [],
      },
      footerSection: { height: 0, binding: "", items: [] },
    };

    const data = {
      items: [
        { category: "A" },
        { category: "A" },
        { category: "B" },
      ],
    };

    const items = generateItems(layout, data);
    const textItems = items.filter(x => x.type === "text");

    expect(textItems.length).toBe(2);
    expect(textItems[0].text).toBe("2"); // Count of category A
    expect(textItems[1].text).toBe("1"); // Count of category B
  });

  test("sorts content with orderBy", () => {
    const layout: ILayout = {
      width: 500,
      headerSection: { height: 0, binding: "", items: [] },
      contentSection: {
        height: 25,
        binding: "$.items",
        orderBy: "score DESC, name ASC",
        items: [
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "$.name" },
        ],
      },
      footerSection: { height: 0, binding: "", items: [] },
    };

    const data = {
      items: [
        { score: 10, name: "B" },
        { score: 20, name: "C" },
        { score: 20, name: "A" },
      ],
    };

    const items = generateItems(layout, data);
    const textItems = items.filter(x => x.type === "text");

    expect(textItems.length).toBe(3);
    expect(textItems[0].text).toBe("A"); // score 20, name A
    expect(textItems[1].text).toBe("C"); // score 20, name C
    expect(textItems[2].text).toBe("B"); // score 10
  });

  test("sorts content with nested property orderBy", () => {
    const layout: ILayout = {
      width: 500,
      headerSection: { height: 0, binding: "", items: [] },
      contentSection: {
        height: 25,
        binding: "$.items",
        orderBy: "user.name ASC",
        items: [
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "$.id" },
        ],
      },
      footerSection: { height: 0, binding: "", items: [] },
    };

    const data = {
      items: [
        { id: 1, user: { name: "Zoe" } },
        { id: 2, user: { name: "Alice" } },
      ],
    };

    const items = generateItems(layout, data);
    const textItems = items.filter(x => x.type === "text");

    expect(textItems[0].text).toBe("2"); // Alice
    expect(textItems[1].text).toBe("1"); // Zoe
  });

  test("sorts content with multi-level nested property orderBy", () => {
    const layout: ILayout = {
      width: 500,
      headerSection: { height: 0, binding: "", items: [] },
      contentSection: {
        height: 25,
        binding: "$.items",
        orderBy: "user.profile.age DESC",
        items: [
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "$.id" },
        ],
      },
      footerSection: { height: 0, binding: "", items: [] },
    };

    const data = {
      items: [
        { id: 1, user: { profile: { age: 30 } } },
        { id: 2, user: { profile: { age: 40 } } },
        { id: 3, user: { profile: { age: 25 } } },
      ],
    };

    const items = generateItems(layout, data);
    const textItems = items.filter(x => x.type === "text");

    expect(textItems[0].text).toBe("2"); // 40
    expect(textItems[1].text).toBe("1"); // 30
    expect(textItems[2].text).toBe("3"); // 25
  });

  test("sorts content with simple one-level field", () => {
    const layout: ILayout = {
      width: 500,
      headerSection: { height: 0, binding: "", items: [] },
      contentSection: {
        height: 25,
        binding: "$.items",
        orderBy: "name DESC",
        items: [
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "$.name" },
        ],
      },
      footerSection: { height: 0, binding: "", items: [] },
    };

    const data = {
      items: [{ name: "A" }, { name: "C" }, { name: "B" }],
    };

    const items = generateItems(layout, data);
    const textItems = items.filter(x => x.type === "text");

    expect(textItems[0].text).toBe("C");
    expect(textItems[1].text).toBe("B");
    expect(textItems[2].text).toBe("A");
  });
});

describe("conditional styles", () => {
  test("applies conditional style when condition is true", () => {
    const layout: ILayout = {
      width: 500,
      headerSection: { height: 0, binding: "", items: [] },
      contentSection: {
        height: 25,
        binding: "$.items",
        items: [
          {
            type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "",
            binding: "$.value",
            conditionalStyles: [
              { condition: "$.value > 100", color: "#FF0000", fontWeight: "bold" },
            ],
          },
        ],
      },
      footerSection: { height: 0, binding: "", items: [] },
    };

    const data = {
      items: [
        { value: 50 },
        { value: 150 },
      ],
    };

    const items = generateItems(layout, data);
    const textItems = items.filter(x => x.type === "text");

    expect(textItems[0].color).not.toBe("#FF0000"); // value 50, condition false
    expect(textItems[1].color).toBe("#FF0000"); // value 150, condition true
    expect(textItems[1].fontWeight).toBe("bold");
  });

  test("applies multiple conditional styles in order", () => {
    const layout: ILayout = {
      width: 500,
      headerSection: { height: 0, binding: "", items: [] },
      contentSection: {
        height: 25,
        binding: "$.items",
        items: [
          {
            type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "",
            binding: "$.status",
            conditionalStyles: [
              { condition: "$.status == 'success'", color: "#4CAF50", backgroundColor: "#E8F5E9" },
              { condition: "$.status == 'warning'", color: "#FF9800", backgroundColor: "#FFF3E0" },
              { condition: "$.status == 'error'", color: "#F44336", backgroundColor: "#FFEBEE" },
            ],
          },
        ],
      },
      footerSection: { height: 0, binding: "", items: [] },
    };

    const data = {
      items: [
        { status: "success" },
        { status: "warning" },
        { status: "error" },
        { status: "unknown" },
      ],
    };

    const items = generateItems(layout, data);
    const textItems = items.filter(x => x.type === "text");

    expect(textItems[0].color).toBe("#4CAF50");
    expect(textItems[0].backgroundColor).toBe("#E8F5E9");
    expect(textItems[1].color).toBe("#FF9800");
    expect(textItems[2].color).toBe("#F44336");
    expect(textItems[3].color).not.toBe("#4CAF50"); // No condition matched
  });

  test("conditional style with complex expression", () => {
    const layout: ILayout = {
      width: 500,
      headerSection: { height: 0, binding: "", items: [] },
      contentSection: {
        height: 25,
        binding: "$.items",
        items: [
          {
            type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "",
            binding: "$.profit",
            conditionalStyles: [
              { condition: "$.revenue > $.expenses && $.profit > 0", color: "#4CAF50" },
              { condition: "$.revenue <= $.expenses || $.profit <= 0", color: "#F44336" },
            ],
          },
        ],
      },
      footerSection: { height: 0, binding: "", items: [] },
    };

    const data = {
      items: [
        { revenue: 1000, expenses: 500, profit: 500 },
        { revenue: 500, expenses: 1000, profit: -500 },
      ],
    };

    const items = generateItems(layout, data);
    const textItems = items.filter(x => x.type === "text");

    expect(textItems[0].color).toBe("#4CAF50"); // Profitable
    expect(textItems[1].color).toBe("#F44336"); // Loss
  });

  test("conditional style with report('$.rowIndex') variable", () => {
    const layout: ILayout = {
      width: 500,
      headerSection: { height: 0, binding: "", items: [] },
      contentSection: {
        height: 25,
        binding: "$.items",
        items: [
          {
            type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "",
            binding: "$.name",
            conditionalStyles: [
              { condition: "report('$.rowIndex') % 2 == 0", backgroundColor: "#f5f5f5" },
            ],
          },
        ],
      },
      footerSection: { height: 0, binding: "", items: [] },
    };

    const data = {
      items: [{ name: "A" }, { name: "B" }, { name: "C" }, { name: "D" }],
    };

    const items = generateItems(layout, data);
    const textItems = items.filter(x => x.type === "text");

    expect(textItems[0].backgroundColor).toBe("#f5f5f5"); // index 0
    expect(textItems[1].backgroundColor).toBeUndefined(); // index 1
    expect(textItems[2].backgroundColor).toBe("#f5f5f5"); // index 2
    expect(textItems[3].backgroundColor).toBeUndefined(); // index 3
  });
});

describe("visibility conditions", () => {
  test("hides item when visible condition is false", () => {
    const layout: ILayout = {
      width: 500,
      headerSection: { height: 0, binding: "", items: [] },
      contentSection: {
        height: 25,
        binding: "$.items",
        items: [
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "$.name", visible: "$.isVisible" },
        ],
      },
      footerSection: { height: 0, binding: "", items: [] },
    };

    const data = {
      items: [
        { name: "Visible", isVisible: true },
        { name: "Hidden", isVisible: false },
        { name: "Also Visible", isVisible: true },
      ],
    };

    const items = generateItems(layout, data);
    const textItems = items.filter(x => x.type === "text");

    expect(textItems.length).toBe(2);
    expect(textItems[0].text).toBe("Visible");
    expect(textItems[1].text).toBe("Also Visible");
  });

  test("visibility with comparison expression", () => {
    const layout: ILayout = {
      width: 500,
      headerSection: { height: 0, binding: "", items: [] },
      contentSection: {
        height: 25,
        binding: "$.items",
        items: [
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "$.name", visible: "$.amount > 50" },
        ],
      },
      footerSection: { height: 0, binding: "", items: [] },
    };

    const data = {
      items: [
        { name: "Small", amount: 30 },
        { name: "Large", amount: 100 },
        { name: "Medium", amount: 50 },
      ],
    };

    const items = generateItems(layout, data);
    const textItems = items.filter(x => x.type === "text");

    expect(textItems.length).toBe(1);
    expect(textItems[0].text).toBe("Large");
  });

  test("visibility with report('$.rowNum') variable", () => {
    const layout: ILayout = {
      width: 500,
      headerSection: { height: 0, binding: "", items: [] },
      contentSection: {
        height: 25,
        binding: "$.items",
        items: [
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "$.name", visible: "report('$.rowNum') <= 2" },
        ],
      },
      footerSection: { height: 0, binding: "", items: [] },
    };

    const data = {
      items: [{ name: "First" }, { name: "Second" }, { name: "Third" }, { name: "Fourth" }],
    };

    const items = generateItems(layout, data);
    const textItems = items.filter(x => x.type === "text");

    expect(textItems.length).toBe(2);
    expect(textItems[0].text).toBe("First");
    expect(textItems[1].text).toBe("Second");
  });

  test("visibility with string comparison", () => {
    const layout: ILayout = {
      width: 500,
      headerSection: { height: 0, binding: "", items: [] },
      contentSection: {
        height: 25,
        binding: "$.items",
        items: [
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "$.name", visible: "$.status == 'active'" },
        ],
      },
      footerSection: { height: 0, binding: "", items: [] },
    };

    const data = {
      items: [
        { name: "Active Item", status: "active" },
        { name: "Inactive Item", status: "inactive" },
        { name: "Another Active", status: "active" },
      ],
    };

    const items = generateItems(layout, data);
    const textItems = items.filter(x => x.type === "text");

    expect(textItems.length).toBe(2);
    expect(textItems[0].text).toBe("Active Item");
    expect(textItems[1].text).toBe("Another Active");
  });
});

describe("expression bindings", () => {
  test("evaluates arithmetic expression in binding", () => {
    const layout: ILayout = {
      width: 500,
      headerSection: { height: 0, binding: "", items: [] },
      contentSection: {
        height: 25,
        binding: "$.items",
        items: [
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "$.price * $.quantity" },
        ],
      },
      footerSection: { height: 0, binding: "", items: [] },
    };

    const data = {
      items: [
        { price: 10, quantity: 5 },
        { price: 25, quantity: 4 },
      ],
    };

    const items = generateItems(layout, data);
    const textItems = items.filter(x => x.type === "text");

    expect(textItems[0].text).toBe("50");
    expect(textItems[1].text).toBe("100");
  });

  test("evaluates string concatenation in binding", () => {
    const layout: ILayout = {
      width: 500,
      headerSection: { height: 0, binding: "", items: [] },
      contentSection: {
        height: 25,
        binding: "$.items",
        items: [
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "$.firstName + ' ' + $.lastName" },
        ],
      },
      footerSection: { height: 0, binding: "", items: [] },
    };

    const data = {
      items: [
        { firstName: "John", lastName: "Doe" },
        { firstName: "Jane", lastName: "Smith" },
      ],
    };

    const items = generateItems(layout, data);
    const textItems = items.filter(x => x.type === "text");

    expect(textItems[0].text).toBe("John Doe");
    expect(textItems[1].text).toBe("Jane Smith");
  });

  test("evaluates ternary expression in binding", () => {
    const layout: ILayout = {
      width: 500,
      headerSection: { height: 0, binding: "", items: [] },
      contentSection: {
        height: 25,
        binding: "$.items",
        items: [
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "$.active ? 'Yes' : 'No'" },
        ],
      },
      footerSection: { height: 0, binding: "", items: [] },
    };

    const data = {
      items: [
        { active: true },
        { active: false },
      ],
    };

    const items = generateItems(layout, data);
    const textItems = items.filter(x => x.type === "text");

    expect(textItems[0].text).toBe("Yes");
    expect(textItems[1].text).toBe("No");
  });

  test("evaluates nullish coalescing in binding", () => {
    const layout: ILayout = {
      width: 500,
      headerSection: { height: 0, binding: "", items: [] },
      contentSection: {
        height: 25,
        binding: "$.items",
        items: [
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "$.nickname ?? $.name" },
        ],
      },
      footerSection: { height: 0, binding: "", items: [] },
    };

    const data = {
      items: [
        { name: "John", nickname: "Johnny" },
        { name: "Jane", nickname: null },
        { name: "Bob" },
      ],
    };

    const items = generateItems(layout, data);
    const textItems = items.filter(x => x.type === "text");

    expect(textItems[0].text).toBe("Johnny");
    expect(textItems[1].text).toBe("Jane");
    expect(textItems[2].text).toBe("Bob");
  });

  test("uses report('$.rowNum') in binding expression", () => {
    const layout: ILayout = {
      width: 500,
      headerSection: { height: 0, binding: "", items: [] },
      contentSection: {
        height: 25,
        binding: "$.items",
        items: [
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "report('$.rowNum') + '. ' + $.name" },
        ],
      },
      footerSection: { height: 0, binding: "", items: [] },
    };

    const data = {
      items: [{ name: "First" }, { name: "Second" }, { name: "Third" }],
    };

    const items = generateItems(layout, data);
    const textItems = items.filter(x => x.type === "text");

    expect(textItems[0].text).toBe("1. First");
    expect(textItems[1].text).toBe("2. Second");
    expect(textItems[2].text).toBe("3. Third");
  });
});

describe("JSONPath advanced features", () => {
  test("resolves array wildcard in binding", () => {
    const layout: ILayout = {
      width: 500,
      headerSection: {
        height: 50,
        binding: "",
        items: [
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "root('$.items[*].name').join(',')" },
        ],
      },
      contentSection: { height: 0, binding: "", items: [] },
      footerSection: { height: 0, binding: "", items: [] },
    };

    const data = {
      items: [{ name: "A" }, { name: "B" }, { name: "C" }],
    };

    const items = generateItems(layout, data);
    const textItem = items.find(x => x.type === "text");

    expect(textItem?.text).toBe("A,B,C");
  });

  test("resolves filter expression in binding", () => {
    const layout: ILayout = {
      width: 500,
      headerSection: {
        height: 50,
        binding: "",
        items: [
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "root('$.items[?(@.price > 15)]').length" },
        ],
      },
      contentSection: { height: 0, binding: "", items: [] },
      footerSection: { height: 0, binding: "", items: [] },
    };

    const data = {
      items: [
        { name: "A", price: 10 },
        { name: "B", price: 20 },
        { name: "C", price: 30 },
      ],
    };

    const items = generateItems(layout, data);
    const textItem = items.find(x => x.type === "text");

    expect(textItem?.text).toBe("2"); // B and C have price > 15
  });
});

describe("aggregate functions in expressions", () => {
  test("sum function in header binding", () => {
    const layout: ILayout = {
      width: 500,
      headerSection: {
        height: 50,
        binding: "",
        items: [
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "sum($.items.map(x => x.amount))" },
        ],
      },
      contentSection: { height: 0, binding: "", items: [] },
      footerSection: { height: 0, binding: "", items: [] },
    };

    const data = {
      items: [{ amount: 100 }, { amount: 200 }, { amount: 300 }],
    };

    const items = generateItems(layout, data);
    const textItem = items.find(x => x.type === "text");

    expect(textItem?.text).toBe("600");
  });

  test("count function in footer binding", () => {
    const layout: ILayout = {
      width: 500,
      headerSection: { height: 0, binding: "", items: [] },
      contentSection: { height: 0, binding: "", items: [] },
      footerSection: {
        height: 50,
        binding: "",
        items: [
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "'Total: ' + count($.items) + ' items'" },
        ],
      },
    };

    const data = {
      items: [{}, {}, {}, {}, {}],
    };

    const items = generateItems(layout, data);
    const textItem = items.find(x => x.type === "text");

    expect(textItem?.text).toBe("Total: 5 items");
  });
});

function getLayout(): ILayout {
  return {
    width: 500,
    headerSection: {
      height: 50,
      binding: "",
      items: [
        { type: "text", x: 0, y: 0, width: 20, height: 10, name: "", text: "Header1", binding: "$.title" },
        { type: "text", x: 20, y: 20, width: 40, height: 10, name: "", text: "Header2" },
      ],
    },
    contentSection: {
      height: 100,
      binding: "$.invoices",
      items: [
        { type: "text", x: 25, y: 25, width: 20, height: 10, name: "", text: "", binding: "$.ficheNo" },
        { type: "text", x: 25, y: 50, width: 80, height: 10, name: "", text: "", binding: "$.client" },
      ],
      sections: [
        {
          height: 100,
          binding: "$.lines",
          items: [
            { type: "text", x: 25, y: 25, width: 20, height: 10, name: "", text: "", binding: "$.stock" },
            { type: "text", x: 25, y: 50, width: 80, height: 10, name: "", text: "", binding: "$.description" },
          ],
          sections: [
          ],
        },
      ],
    },
    footerSection: {
      height: 60,
      binding: "",
      items: [
        { type: "text", x: 0, y: 0, width: 20, height: 10, name: "", text: "Footer 1" },
        { type: "text", x: 20, y: 20, width: 40, height: 10, name: "", text: "Footer 2" },
      ],
    },
  };
}
