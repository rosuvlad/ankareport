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
      binding: "client",
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
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "invoices[0].client" },
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
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "data.items[1].details.value" },
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

describe("$index binding", () => {
  test("resolves $index in content section", () => {
    const layout: ILayout = {
      width: 500,
      headerSection: { height: 0, binding: "", items: [] },
      contentSection: {
        height: 50,
        binding: "items",
        items: [
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "$index" },
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

  test("resolves $index in nested subsection", () => {
    const layout: ILayout = {
      width: 500,
      headerSection: { height: 0, binding: "", items: [] },
      contentSection: {
        height: 50,
        binding: "orders",
        items: [],
        sections: [
          {
            height: 30,
            binding: "lines",
            items: [
              { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "$index" },
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

  test("resolves $index in path binding", () => {
    const layout: ILayout = {
      width: 500,
      headerSection: { height: 0, binding: "", items: [] },
      contentSection: {
        height: 50,
        binding: "items",
        items: [
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "values[$index]" },
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
        binding: "header",
        items: [
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "title" },
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
        binding: "footer",
        items: [
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "summary" },
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
        binding: "invoices[0]",
        items: [
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "client" },
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
        binding: "nonexistent",
        items: [
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "title" },
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
        binding: "items",
        groupBy: "category",
        items: [
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "name" },
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
        binding: "items",
        groupBy: "category",
        groupHeader: {
          height: 30,
          binding: "",
          items: [
            { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "$groupKey" },
          ],
        },
        items: [
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "name" },
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
        binding: "items",
        groupBy: "category",
        groupFooter: {
          height: 30,
          binding: "",
          items: [
            { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "$sum_amount" },
          ],
        },
        items: [
          { type: "text", x: 0, y: 0, width: 100, height: 20, name: "", text: "", binding: "name" },
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
        binding: "items",
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
});

function getLayout(): ILayout {
  return {
    width: 500,
    headerSection: {
      height: 50,
      binding: "",
      items: [
        { type: "text", x: 0, y: 0, width: 20, height: 10, name: "", text: "Header1", binding: "title" },
        { type: "text", x: 20, y: 20, width: 40, height: 10, name: "", text: "Header2" },
      ],
    },
    contentSection: {
      height: 100,
      binding: "invoices",
      items: [
        { type: "text", x: 25, y: 25, width: 20, height: 10, name: "", text: "", binding: "ficheNo" },
        { type: "text", x: 25, y: 50, width: 80, height: 10, name: "", text: "", binding: "client" },
      ],
      sections: [
        {
          height: 100,
          binding: "lines",
          items: [
            { type: "text", x: 25, y: 25, width: 20, height: 10, name: "", text: "", binding: "stock" },
            { type: "text", x: 25, y: 50, width: 80, height: 10, name: "", text: "", binding: "description" },
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
