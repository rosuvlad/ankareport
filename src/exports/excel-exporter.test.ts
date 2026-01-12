/**
 * @jest-environment node
 */
import { getExcelMeta } from "./excel-exporter";

describe("Export To Excel", () => {
  test("excel exporter tests", () => {
    const items = [
      { text: 'Cell 1', x: 10, y: 10, width: 50, height: 30 },
      { text: 'Cell 2', x: 15, y: 15, width: 50, height: 30 },
      { text: 'Cell 3', x: 25, y: 25, width: 50, height: 30 },
      { text: 'Cell 4', x: 10, y: 60, width: 10, height: 10 },
    ];

    const columns = [
      { key: 'A', breakpoint: 0, width: 10 },
      { key: 'B', breakpoint: 10, width: 5 },
      { key: 'C', breakpoint: 15, width: 5 },
      { key: 'D', breakpoint: 20, width: 5 },
      { key: 'E', breakpoint: 25, width: 35 },
      { key: 'F', breakpoint: 60, width: 5 },
      { key: 'G', breakpoint: 65, width: 10 },
    ];

    const rows = [
      { key: 1, breakpoint: 0, height: 10 },
      { key: 2, breakpoint: 10, height: 5 },
      { key: 3, breakpoint: 15, height: 10 },
      { key: 4, breakpoint: 25, height: 15 },
      { key: 5, breakpoint: 40, height: 5 },
      { key: 6, breakpoint: 45, height: 10 },
      { key: 7, breakpoint: 55, height: 5 },
      { key: 8, breakpoint: 60, height: 10 },
    ];

    const meta = getExcelMeta(items as any);

    expect(meta.columns).toEqual(columns);
    expect(meta.rows).toEqual(rows);

    expect(meta.getCellName(25, 25)).toBe("E4");
    expect(meta.getCellName(65, 60)).toBe("G8");

    // TODO: add functionality
    // expect(meta.getBeforeCellName(25, 25)).toBe("D3");
    // expect(meta.getBeforeCellName(65, 60)).toBe("G8");
  });

  test("handles large number of columns correctly", () => {
    // Create items that force columns beyond Z (26th letter)
    // We need enough breakpoints.
    // Let's manually trigger getColumnName logic via getExcelMeta

    const items: any[] = [];
    // Add items at x=0, x=10, ..., x=300
    for (let i = 0; i <= 30; i++) {
      items.push({ text: 'Col' + i, x: i * 10, y: 0, width: 10, height: 10 });
    }

    const meta = getExcelMeta(items);

    // Index 0 -> 'A'
    // Index 25 -> 'Z'
    // Index 26 -> 'AA'

    const colA = meta.columns.find(c => c.key === 'A');
    const colZ = meta.columns.find(c => c.key === 'Z');
    const colAA = meta.columns.find(c => c.key === 'AA');
    const colAE = meta.columns.find(c => c.key === 'AE');

    expect(colA).toBeDefined();
    expect(colZ).toBeDefined();
    expect(colAA).toBeDefined();
    expect(colAE).toBeDefined();

    // Check specific cell names
    expect(meta.getCellName(0, 0)).toBe("A1");
    expect(meta.getCellName(260, 0)).toBe("AA1"); // 26th interval: 260
  });
});

