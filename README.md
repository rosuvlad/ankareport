<h1 align="center">Anka Report</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/ankareport" title="npm package">
    <img src="https://img.shields.io/npm/v/ankareport">
  </a>
  <a href="https://opensource.org/licenses/MIT" title="License: MIT">
    <img src="https://img.shields.io/badge/License-MIT-blue.svg">
  </a>
</p>

<h3 align="center">
  <a href="https://ankareport.github.io/docs/getting-started" target="_blank" title="Documentation">Docs</a> |
  <a href="https://ankareport.github.io/examples/playground" target="_blank" title="Playground">Playground</a>
</h3>

<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/ankareport/assets/designer/designer.png" alt="designer">
</p>

<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/ankareport/assets/AnkaReportFlowChart.png" alt="Anka Report">
</p>

## Purpose

Free & Open Source Web Reporting Tool with visual designer, data binding, and multi-format export capabilities.

## Features

### Report Items
- **Text** - Static and dynamic text with data binding, formatting, and conditional styles
- **Image** - Static images or data-bound image sources
- **Barcode** - CODE128 (A/B/C), EAN13, EAN8, UPC, CODE39, ITF14, ITF, MSI (10/11/1010/1110), Pharmacode formats with optional label display
- **QR Code** - QR codes with configurable error correction levels (L, M, Q, H)
- **Chart** - Line, Bar, Pie, Doughnut, Radar, PolarArea charts with data binding support

### Data Binding & Expressions
- Simple field binding: `binding: "fieldName"`
- Nested object access: `binding: "object.nested.field"`
- Array access: `binding: "items[0].name"`
- Expressions: `binding: "price * quantity"`
- String concatenation: `binding: "firstName + ' ' + lastName"`
- Built-in variables: `$index`, `$rowNum`, `$pageNum`, `$totalPages`
- Localization: `binding: "LOCALIZE('key')"`

### Formatting
- Number formats: `format: "f2"` (2 decimal places), `format: "f0"` (integer)
- Date formats: Uses [Moment.js format](https://momentjs.com/docs/#/displaying/format/): `format: "MMMM DD, YYYY"`, `format: "YYYY-MM-DD"`
- Use filters for advanced formatting: `binding: "amount | currency:USD"`

### Conditional Styles
- Dynamic styling based on data conditions
- Supports: `color`, `backgroundColor`, `fontWeight`, `fontSize`, `borderColor`

### Sections
- **Header Section** - Report header (renders once at top)
- **Content Section** - Main data section (repeats for each data item)
- **Footer Section** - Report footer (renders once at bottom)
- **Page Header/Footer** - Appears on every page in PDF export
- **Subsections** - Nested data groups with their own bindings
- **Grouping** - Group data by field with group headers/footers

### Styling
- Colors, backgrounds, borders
- Font family, size, weight
- Text alignment (left, center, right)
- Inherited styles from parent sections

### Export
- **PDF** - Multi-page support, page headers/footers, font support (Helvetica, Times, Courier with bold variants)
- **Excel** - Cell-based export with styling, charts, and images

### Designer
- Visual drag-and-drop editor
- Property grid for all item properties
- Undo/Redo support
- Bulk selection and editing
- Tree view of elements

## Installation

```sh
npm install ankareport
# or
yarn add ankareport
```

## Setup (CDN)

```html
<html>
  <head>
    <link rel="stylesheet" href="https://unpkg.com/ankareport/dist/ankareport.css" />
  </head>
  <body>
    <script src="https://unpkg.com/ankareport/dist/ankareport.js"></script>
  </body>
</html>
```

## Quick Start

### Designer

```html
<div id="designer"></div>

<script>
  const designer = AnkaReport.designer({
    element: document.getElementById("designer"),
    dataSource: dataSource,
    layout: layout,
    onSaveButtonClick: (layout) => {
      console.log(JSON.stringify(layout, null, 2));
    },
  });
</script>
```

### Renderer

```html
<div id="report"></div>

<script>
  const report = AnkaReport.render({
    element: document.getElementById("report"),
    layout: layout,
    data: data,
  });
</script>
```

### Export to PDF

```js
// Export is a method on the renderer instance
const renderer = AnkaReport.render({
  element: document.getElementById("report"),
  layout: layout,
  data: data,
});

// Export to PDF (downloads file automatically)
await renderer.exportToPdf("report.pdf");
```

#### PDF Page Breaks

The PDF export automatically handles page breaks with the following features:

- **Automatic pagination** - Content is split across pages based on page size
- **Page headers/footers** - Rendered on every page with `$pageNum` and `$totalPages` variables
- **keepTogether** - Sections with `keepTogether: true` will not be split across pages
- **Pixel-perfect rendering** - All positions, sizes, and styles match the HTML preview

```js
// Example: Keep each department row together on the same page
contentSection: {
  height: 80,
  binding: "departments",
  keepTogether: true,  // Entire section moves to next page if it doesn't fit
  items: [ ... ]
}
```

### Export to Excel

```js
// Export is a method on the renderer instance
const renderer = AnkaReport.render({
  element: document.getElementById("report"),
  layout: layout,
  data: data,
});

// Export to Excel (downloads file automatically)
await renderer.exportToXlsx("report.xlsx");
```

## Layout Reference

### Layout Structure

```js
const layout = {
  pageSize: "A4",           // "A4", "Letter", "Legal", or custom
  width: 595,               // Optional: override page width (pixels)
  height: 842,              // Optional: override page height (pixels)
  
  // Styling (inherited by all sections)
  color: "#000000",
  backgroundColor: "#ffffff",
  fontFamily: "Arial",
  fontSize: "12px",
  fontWeight: "normal",
  
  // Page header/footer (appears on every PDF page)
  pageHeaderSection: { ... },
  pageFooterSection: { ... },
  
  // Report sections
  headerSection: { ... },
  contentSection: { ... },
  footerSection: { ... },
};
```

### Section Structure

```js
{
  height: 100,              // Fixed height in pixels, or "auto"
  binding: "dataArray",     // Data source for repeating sections
  groupBy: "category",      // Optional: group data by field
  keepTogether: true,       // Keep section on same page if possible
  
  // Styling
  color: "#000000",
  backgroundColor: "#f5f5f5",
  
  // Items in this section
  items: [ ... ],
  
  // Nested subsections
  sections: [ ... ],
  
  // Group header/footer (when using groupBy)
  groupHeader: { ... },
  groupFooter: { ... },
}
```

### Report Items

#### Text Item

```js
{
  type: "text",
  x: 10, y: 10,
  width: 200, height: 20,
  
  // Content
  text: "Static text",           // Static text
  binding: "fieldName",          // Or data binding
  format: "$#,##0",              // Optional formatting
  
  // Styling
  color: "#000000",
  backgroundColor: "transparent",
  textAlign: "left",             // "left", "center", "right"
  fontFamily: "Arial",
  fontSize: "12px",
  fontWeight: "normal",          // "normal", "bold", "700", etc.
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "#000000",
  
  // Visibility
  visible: "data.showField",     // Conditional visibility expression
  
  // Conditional styles
  conditionalStyles: [
    { condition: "value > 100", color: "#4CAF50", fontWeight: "bold" },
    { condition: "value < 0", color: "#F44336" }
  ]
}
```

#### Image Item

```js
{
  type: "image",
  x: 10, y: 10,
  width: 100, height: 100,
  source: "data:image/png;base64,...",  // Base64 or URL
  binding: "imageField",                 // Or data binding
}
```

#### Barcode Item

```js
{
  type: "barcode",
  x: 10, y: 10,
  width: 150, height: 50,
  value: "1234567890",           // Static value
  binding: "barcodeField",       // Or data binding
  format: "CODE128",             // CODE128, CODE128A/B/C, EAN13, EAN8, UPC, CODE39, ITF14, ITF, MSI, MSI10/11/1010/1110, pharmacode
  barWidth: 2,                   // Bar width (1, 2, 3, or 4)
  displayValue: false,           // Show text label under barcode
}
```

#### QR Code Item

```js
{
  type: "qrcode",
  x: 10, y: 10,
  width: 100, height: 100,
  value: "https://example.com",  // Static value
  binding: "urlField",           // Or data binding
  errorCorrectionLevel: "M",     // "L", "M", "Q", "H"
}
```

#### Chart Item

```js
{
  type: "chart",
  x: 10, y: 10,
  width: 300, height: 200,
  chartType: "line",             // "line", "bar", "pie", "doughnut", "radar", "polarArea"
  
  // Static data
  labels: ["Jan", "Feb", "Mar"],
  datasets: [
    { label: "Sales", data: [100, 200, 150], borderColor: "#4CAF50" }
  ],
  
  // Or data binding
  labelsBinding: "chart.labels",
  datasetsBinding: "[{label: 'Sales', data: chart.salesData, borderColor: '#4CAF50'}]",
  
  // Title
  title: "Monthly Sales",
  titleBinding: "LOCALIZE('chart_title')",
  
  // Legend
  showLegend: true,
  legendPosition: "bottom",      // "top", "bottom", "left", "right"
  
  // Axis configuration
  scales: {
    x: {
      title: { display: true, text: "Month" },
      stacked: false,
    },
    y: {
      title: { display: true, text: "Amount" },
      beginAtZero: true,
      min: 0,                    // Optional min value
      max: 1000,                 // Optional max value
      minBinding: "chart.minY", // Or data binding
      maxBinding: "chart.maxY",
    }
  }
}
```

## Expression Reference

### Built-in Variables

| Variable | Description |
|----------|-------------|
| `$index` | Zero-based index of current item in array |
| `$rowNum` | One-based row number (index + 1) |
| `$pageNum` | Current page number (PDF only) |
| `$totalPages` | Total page count (PDF only) |
| `$groupKey` | Current group key value (when using groupBy) |
| `$groupCount` | Number of items in current group |
| `$first` | First item in current group |
| `$last` | Last item in current group |
| `$sum_field` | Sum of field values in group (e.g., `$sum_amount`) |
| `$avg_field` | Average of field values in group |
| `$min_field` | Minimum field value in group |
| `$max_field` | Maximum field value in group |

### Temporal Variables

Available when `context.temporal` is provided in data:

| Variable | Description |
|----------|-------------|
| `$nowUtc` | Current UTC datetime |
| `$nowLocal` | Current local datetime |
| `$timeZoneId` | Current timezone ID |
| `$utcOffsetMinutes` | UTC offset in minutes |

### Functions

| Function | Description | Example |
|----------|-------------|---------|
| `LOCALIZE(key)` | Get localized string | `LOCALIZE('report_title')` |
| `SUM(array)` | Sum array values | `SUM(items.map(i => i.amount))` |
| `AVG(array)` | Average array values | `AVG(scores)` |
| `COUNT(array)` | Count array items | `COUNT(items)` |
| `MIN(array)` | Minimum value | `MIN(prices)` |
| `MAX(array)` | Maximum value | `MAX(prices)` |

### Filters (Pipe Syntax)

```js
// Usage: binding: "expression | filter:arg1:arg2"

// String filters
"text | uppercase"               // Convert to uppercase
"text | lowercase"               // Convert to lowercase
"text | capitalize"              // Capitalize first letters
"text | trim"                    // Remove whitespace
"text | truncate:50:..."         // Truncate with suffix
"text | padstart:5:0"            // Pad start: "42" -> "00042"
"text | padend:5:0"              // Pad end: "42" -> "42000"
"text | replace:old:new"         // Replace text
"text | slice:0:10"              // Substring

// Number filters
"amount | currency:USD:en-US"    // Format as currency: $1,234.56
"amount | number:2"              // Fixed decimals: 1234.56
"amount | percent:1"             // Percentage: 12.3%
"amount | abs"                   // Absolute value
"amount | round"                 // Round to integer
"amount | floor"                 // Round down
"amount | ceil"                  // Round up

// Date filters
"date | date:YYYY-MM-DD"         // Format date
"date | time"                    // Time only
"date | datetime"                // Date and time

// Other
"value | default:N/A"            // Default if null/empty
"object | json"                  // JSON stringify
```

## Conditional Styles

Apply dynamic styles based on data conditions:

```js
{
  type: "text",
  binding: "status",
  conditionalStyles: [
    // Green background for "active" status
    { 
      condition: "status == 'active'", 
      backgroundColor: "#4CAF50", 
      color: "#FFFFFF" 
    },
    // Red for "inactive"
    { 
      condition: "status == 'inactive'", 
      backgroundColor: "#F44336", 
      color: "#FFFFFF" 
    },
    // Bold for high values
    { 
      condition: "value > 1000", 
      fontWeight: "bold",
      color: "#2196F3"
    }
  ]
}
```

### Supported Conditional Style Properties

- `color` - Text color
- `backgroundColor` - Background color
- `fontWeight` - Font weight ("normal", "bold", "700", etc.)
- `fontSize` - Font size ("12px", "14px", etc.)
- `borderColor` - Border color

## Data Source (Designer)

Define available fields for the designer's field picker:

```js
const dataSource = [
  { label: "Company Name", field: "company.name" },
  { label: "Report Year", field: "reportYear" },
  {
    label: "Summary",
    children: [
      { label: "Total Revenue", field: "summary.totalRevenue" },
      { label: "Total Expenses", field: "summary.totalExpenses" },
      { label: "Net Profit", field: "summary.netProfit" },
    ],
  },
  {
    label: "Departments",
    field: "departments",
    children: [
      { label: "Name", field: "name" },
      { label: "Manager", field: "manager" },
      { label: "Revenue", field: "revenue" },
      {
        label: "Projects",
        field: "projects",
        children: [
          { label: "Project Name", field: "name" },
          { label: "Budget", field: "budget" },
        ],
      },
    ],
  },
];
```

## Localization

Provide translations via the `context.localization` object in your data:

```js
const data = {
  // ... your data
  
  context: {
    localization: {
      localeCode: "en-US",  // Current locale
      resources: {
        "en-US": {
          report_title: "Annual Report",
          executive_summary: "Executive Summary",
          departments: "Departments",
        },
        "es-ES": {
          report_title: "Informe Anual",
          executive_summary: "Resumen Ejecutivo",
          departments: "Departamentos",
        },
        "ro-RO": {
          report_title: "Raport Anual",
          executive_summary: "Rezumat Executiv",
          departments: "Departamente",
        },
      },
    },
  },
};
```

Use in layout:

```js
// Basic usage - returns key if not found
{ type: "text", binding: "LOCALIZE('report_title')" }

// With default text fallback
{ type: "text", binding: "LOCALIZE('report_title', 'Annual Report')" }

// With explicit locale override
{ type: "text", binding: "LOCALIZE('report_title', 'Annual Report', 'es-ES')" }

// With dynamic key from data
{ type: "text", binding: "LOCALIZE(labelKey, 'Default')" }
```

## Page Sizes

Supported page sizes (defined in `PageSize` type):

| Size | Width (pt) | Height (pt) |
|------|------------|-------------|
| A2 | 1191 | 1684 |
| A3 | 842 | 1191 |
| A4 | 595 | 842 |
| A5 | 420 | 595 |
| Letter | 612 | 792 |
| Legal | 612 | 1008 |
| Tabloid | 792 | 1224 |

Or use custom dimensions:

```js
{
  pageSize: undefined,  // or omit
  width: 800,
  height: 600,
}
```

## Contributing

```sh
yarn install
yarn dev
# open localhost:8080
```

## License

MIT
