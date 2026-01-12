const dataSource = [
  // Company Info
  { type: "text", label: "Company Name", field: "company.name" },
  { type: "image", label: "Company Logo", field: "company.logo" },
  { type: "text", label: "Report Title", field: "reportTitle" },
  { type: "text", label: "Report Year", field: "reportYear" },
  { type: "text", label: "Generated Date", field: "generatedDate" },
  
  // Executive Summary
  { type: "text", label: "Total Revenue", field: "summary.totalRevenue" },
  { type: "text", label: "Total Expenses", field: "summary.totalExpenses" },
  { type: "text", label: "Net Profit", field: "summary.netProfit" },
  { type: "text", label: "Growth Rate", field: "summary.growthRate" },
  { type: "text", label: "Employee Count", field: "summary.employeeCount" },
  
  // Chart Data
  { type: "text", label: "Monthly Labels", field: "charts.monthlyLabels" },
  { type: "text", label: "Revenue Data", field: "charts.revenueData" },
  { type: "text", label: "Expenses Data", field: "charts.expensesData" },
  { type: "text", label: "Department Labels", field: "charts.departmentLabels" },
  { type: "text", label: "Department Revenue", field: "charts.departmentRevenue" },
  { type: "text", label: "Department Colors", field: "charts.departmentColors" },
  
  // Departments (grouped content)
  {
    label: "Departments",
    field: "departments",
    children: [
      { type: "text", label: "Department Name", field: "name" },
      { type: "text", label: "Manager", field: "manager" },
      { type: "text", label: "Revenue", field: "revenue" },
      { type: "text", label: "Expenses", field: "expenses" },
      { type: "text", label: "Profit", field: "profit" },
      { type: "text", label: "Employee Count", field: "employeeCount" },
      { type: "text", label: "Status", field: "status" },
      { type: "barcode", label: "Department Code", field: "code" },
      {
        label: "Projects",
        field: "projects",
        children: [
          { type: "text", label: "Project Name", field: "name" },
          { type: "text", label: "Budget", field: "budget" },
          { type: "text", label: "Spent", field: "spent" },
          { type: "text", label: "Status", field: "status" },
          { type: "text", label: "Completion", field: "completion" },
        ],
      },
    ],
  },
  
  // Top Performers
  {
    label: "Top Performers",
    field: "topPerformers",
    children: [
      { type: "text", label: "Employee Name", field: "name" },
      { type: "text", label: "Department", field: "department" },
      { type: "text", label: "Achievement", field: "achievement" },
      { type: "text", label: "Bonus", field: "bonus" },
    ],
  },
  
  // Footer
  { type: "text", label: "Footer Text", field: "footerText" },
  { type: "text", label: "Page Number", field: "$pageNum" },
  { type: "text", label: "Total Pages", field: "$totalPages" },
  { type: "qrcode", label: "Report QR", field: "reportUrl" },
  
  // Temporal Context (special variables)
  { type: "text", label: "Now (UTC)", field: "$nowUtc" },
  { type: "text", label: "Now (Local)", field: "$nowLocal" },
  { type: "text", label: "Time Zone", field: "$timeZoneId" },
  { type: "text", label: "UTC Offset (min)", field: "$utcOffsetMinutes" },
];
