import {
  getPageDimensions,
  resolvePageDimensions,
  getAvailablePageSizes,
  getExcelPaperSize,
  EXCEL_PAPER_SIZES,
} from './pageSize';

describe('getPageDimensions', () => {
  test('returns A4 dimensions by default', () => {
    const dims = getPageDimensions();
    expect(dims.width).toBe(595);
    expect(dims.height).toBe(842);
  });

  test('returns A4 dimensions explicitly', () => {
    const dims = getPageDimensions('A4');
    expect(dims.width).toBe(595);
    expect(dims.height).toBe(842);
  });

  test('returns A3 dimensions', () => {
    const dims = getPageDimensions('A3');
    expect(dims.width).toBe(842);
    expect(dims.height).toBe(1191);
  });

  test('returns A5 dimensions', () => {
    const dims = getPageDimensions('A5');
    expect(dims.width).toBe(420);
    expect(dims.height).toBe(595);
  });

  test('returns A2 dimensions', () => {
    const dims = getPageDimensions('A2');
    expect(dims.width).toBe(1191);
    expect(dims.height).toBe(1684);
  });

  test('returns Letter dimensions', () => {
    const dims = getPageDimensions('Letter');
    expect(dims.width).toBe(612);
    expect(dims.height).toBe(792);
  });

  test('returns Legal dimensions', () => {
    const dims = getPageDimensions('Legal');
    expect(dims.width).toBe(612);
    expect(dims.height).toBe(1008);
  });

  test('returns Tabloid dimensions', () => {
    const dims = getPageDimensions('Tabloid');
    expect(dims.width).toBe(792);
    expect(dims.height).toBe(1224);
  });
});

describe('resolvePageDimensions', () => {
  test('uses page size when no explicit dimensions', () => {
    const dims = resolvePageDimensions('A4');
    expect(dims.width).toBe(595);
    expect(dims.height).toBe(842);
  });

  test('uses explicit width over page size', () => {
    const dims = resolvePageDimensions('A4', 800);
    expect(dims.width).toBe(800);
    expect(dims.height).toBe(842);
  });

  test('uses explicit height over page size', () => {
    const dims = resolvePageDimensions('A4', undefined, 1000);
    expect(dims.width).toBe(595);
    expect(dims.height).toBe(1000);
  });

  test('uses both explicit dimensions', () => {
    const dims = resolvePageDimensions('A4', 800, 1000);
    expect(dims.width).toBe(800);
    expect(dims.height).toBe(1000);
  });

  test('defaults to A4 when no page size specified', () => {
    const dims = resolvePageDimensions();
    expect(dims.width).toBe(595);
    expect(dims.height).toBe(842);
  });

  test('allows custom dimensions without page size', () => {
    const dims = resolvePageDimensions(undefined, 500, 700);
    expect(dims.width).toBe(500);
    expect(dims.height).toBe(700);
  });
});

describe('getAvailablePageSizes', () => {
  test('returns all page sizes', () => {
    const sizes = getAvailablePageSizes();
    
    expect(sizes).toContain('A2');
    expect(sizes).toContain('A3');
    expect(sizes).toContain('A4');
    expect(sizes).toContain('A5');
    expect(sizes).toContain('Letter');
    expect(sizes).toContain('Legal');
    expect(sizes).toContain('Tabloid');
    expect(sizes.length).toBe(7);
  });
});

describe('getExcelPaperSize', () => {
  test('returns correct Excel paper size for A4', () => {
    expect(getExcelPaperSize('A4')).toBe(9);
  });

  test('returns correct Excel paper size for Letter', () => {
    expect(getExcelPaperSize('Letter')).toBe(1);
  });

  test('returns correct Excel paper size for Legal', () => {
    expect(getExcelPaperSize('Legal')).toBe(5);
  });

  test('returns correct Excel paper size for A3', () => {
    expect(getExcelPaperSize('A3')).toBe(8);
  });

  test('returns correct Excel paper size for Tabloid', () => {
    expect(getExcelPaperSize('Tabloid')).toBe(3);
  });

  test('defaults to A4 paper size', () => {
    expect(getExcelPaperSize()).toBe(9);
  });
});

describe('EXCEL_PAPER_SIZES', () => {
  test('has all page sizes mapped', () => {
    expect(EXCEL_PAPER_SIZES.A2).toBe(66);
    expect(EXCEL_PAPER_SIZES.A3).toBe(8);
    expect(EXCEL_PAPER_SIZES.A4).toBe(9);
    expect(EXCEL_PAPER_SIZES.A5).toBe(11);
    expect(EXCEL_PAPER_SIZES.Letter).toBe(1);
    expect(EXCEL_PAPER_SIZES.Legal).toBe(5);
    expect(EXCEL_PAPER_SIZES.Tabloid).toBe(3);
  });
});
