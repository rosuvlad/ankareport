// A4 page: 595pt x 842pt (210mm x 297mm)
// Layout with 40px left/right margins
const layout = {
  pageSize: "A4",
  
  // Page Header (appears on every page)
  pageHeaderSection: {
    height: 'auto',
    items: [
      { type: "text", text: "", binding: "company.name", x: 40, y: 5, width: 200, height: 18, fontWeight: "bold", fontSize: "11px" },
      { type: "text", text: "Page", x: 470, y: 5, width: 30, height: 18, fontSize: "10px", color: "#666666" },
      { type: "text", text: "", binding: "$pageNum", x: 500, y: 5, width: 15, height: 18, fontSize: "10px" },
      { type: "text", text: "/", x: 515, y: 5, width: 10, height: 18, fontSize: "10px" },
      { type: "text", text: "", binding: "$totalPages", x: 525, y: 5, width: 20, height: 18, fontSize: "10px" },
    ],
  },

  // Report Header
  headerSection: {
    height: 374,
    items: [
      // Title with localization
      { type: "text", text: "", binding: "LOCALIZE('report_title')", x: 140, y: 10, width: 315, height: 28, fontSize: "20px", fontWeight: "bold", textAlign: "center" },
      { type: "text", text: "", binding: "reportYear", x: 250, y: 40, width: 95, height: 22, fontSize: "16px", textAlign: "center" },
      { type: "text", text: "Generated:", x: 220, y: 65, width: 70, height: 18, fontSize: "11px", color: "#666666" },
      { type: "text", text: "", binding: "generatedDate", format: "MMMM dd, yyyy", x: 290, y: 65, width: 120, height: 18, fontSize: "11px" },
      // QR Code for report URL
      { type: "qrcode", value: "", binding: "reportUrl", x: 485, y: 10, width: 70, height: 70, errorCorrectionLevel: "M" },
      
      // Executive Summary Section
      { type: "text", text: "", binding: "LOCALIZE('executive_summary')", x: 40, y: 95, width: 200, height: 22, fontSize: "14px", fontWeight: "bold" },
      
      // Summary KPIs - Row 1
      { type: "text", text: "Total Revenue:", x: 50, y: 120, width: 85, height: 18, fontSize: "11px" },
      { type: "text", text: "", binding: "summary.totalRevenue", format: "$#,##0", x: 135, y: 120, width: 80, height: 18, fontSize: "11px", fontWeight: "bold", color: "#4CAF50" },
      
      { type: "text", text: "Total Expenses:", x: 225, y: 120, width: 90, height: 18, fontSize: "11px" },
      { type: "text", text: "", binding: "summary.totalExpenses", format: "$#,##0", x: 315, y: 120, width: 80, height: 18, fontSize: "11px", fontWeight: "bold", color: "#F44336" },
      
      { type: "text", text: "Net Profit:", x: 405, y: 120, width: 65, height: 18, fontSize: "11px" },
      { type: "text", text: "", binding: "summary.netProfit", format: "$#,##0", x: 470, y: 120, width: 80, height: 18, fontSize: "11px", fontWeight: "bold", color: "#2196F3" },
      
      // Summary KPIs - Row 2
      { type: "text", text: "Growth:", x: 50, y: 140, width: 50, height: 18, fontSize: "11px" },
      { type: "text", text: "", binding: "summary.growthRate + '%'", x: 100, y: 140, width: 40, height: 18, fontSize: "11px", fontWeight: "bold",
        conditionalStyles: [
          { condition: "summary.growthRate >= 10", color: "#4CAF50", fontWeight: "bold" },
          { condition: "summary.growthRate < 10 && summary.growthRate >= 0", color: "#FF9800" },
          { condition: "summary.growthRate < 0", color: "#F44336" }
        ]
      },
      { type: "text", text: "Employees:", x: 160, y: 140, width: 65, height: 18, fontSize: "11px" },
      { type: "text", text: "", binding: "summary.employeeCount", x: 225, y: 140, width: 40, height: 18, fontSize: "11px" },
      
      // Monthly Performance Chart (line chart)
      { type: "chart", chartType: "line", x: 40, y: 170, width: 250, height: 160,
        titleBinding: "LOCALIZE('monthly_performance')",
        labelsBinding: "charts.monthlyLabels",
        datasetsBinding: "[{label: 'Revenue', data: charts.revenueData, borderColor: '#4CAF50', backgroundColor: 'rgba(76,175,80,0.1)', fill: true}, {label: 'Expenses', data: charts.expensesData, borderColor: '#F44336', backgroundColor: 'rgba(244,67,54,0.1)', fill: true}]",
        showLegend: true,
        legendPosition: "bottom",
        scales: {
          x: { title: { display: true, textBinding: "LOCALIZE('x_axis_months')" } },
          y: { title: { display: true, textBinding: "LOCALIZE('y_axis_amount')" }, beginAtZero: true }
        }
      },
      
      // Department Revenue Chart (pie chart)
      { type: "chart", chartType: "pie", x: 305, y: 170, width: 250, height: 160,
        titleBinding: "LOCALIZE('revenue_by_dept')",
        labelsBinding: "charts.departmentLabels",
        datasetsBinding: "[{data: charts.departmentRevenue, backgroundColor: charts.departmentColors}]",
        showLegend: true,
        legendPosition: "right"
      },
      
      // Department Details Section Header
      { type: "text", text: "", binding: "LOCALIZE('departments')", x: 40, y: 345, width: 150, height: 22, fontSize: "14px", fontWeight: "bold" },
    ],
  },

  // Main Content Section - Department rows
  contentSection: {
    height: "auto",
    binding: "departments",
    keepTogether: true,
    items: [
      // Department Row - Line 1
      { type: "text", text: "", binding: "$rowNum + '.'", x: 40, y: 5, width: 20, height: 18, fontWeight: "bold", fontSize: "11px" },
      { type: "text", text: "", binding: "name", x: 65, y: 5, width: 120, height: 18, fontWeight: "bold", fontSize: "12px" },
      { type: "text", text: "Manager:", x: 190, y: 5, width: 55, height: 18, color: "#666666", fontSize: "10px" },
      { type: "text", text: "", binding: "manager", x: 245, y: 5, width: 100, height: 18, fontSize: "10px" },
      
      // Department barcode
      { type: "barcode", value: "", binding: "code", format: "CODE128", x: 440, y: 2, width: 115, height: 45, barWidth: 1.5, displayValue: false },
      
      // Department Row - Line 2 (financials)
      { type: "text", text: "Revenue:", x: 65, y: 25, width: 55, height: 18, fontSize: "10px" },
      { type: "text", text: "", binding: "revenue", format: "$#,##0", x: 120, y: 25, width: 70, height: 18, color: "#4CAF50", fontSize: "10px" },
      
      { type: "text", text: "Expenses:", x: 200, y: 25, width: 55, height: 18, fontSize: "10px" },
      { type: "text", text: "", binding: "expenses", format: "$#,##0", x: 255, y: 25, width: 70, height: 18, color: "#F44336", fontSize: "10px" },
      
      { type: "text", text: "Profit:", x: 335, y: 25, width: 40, height: 18, fontSize: "10px" },
      { type: "text", text: "", binding: "profit", format: "$#,##0", x: 375, y: 25, width: 70, height: 18, fontSize: "10px",
        conditionalStyles: [
          { condition: "profit >= 1000000", color: "#4CAF50", fontWeight: "bold" },
          { condition: "profit >= 500000 && profit < 1000000", color: "#FF9800" },
          { condition: "profit < 500000", color: "#F44336" }
        ]
      },
      
      { type: "text", text: "Staff:", x: 455, y: 25, width: 35, height: 18, fontSize: "10px" },
      { type: "text", text: "", binding: "employeeCount", x: 490, y: 25, width: 30, height: 18, fontSize: "10px" },
      
      // Status badge
      { type: "text", text: "", binding: "status", x: 520, y: 25, width: 35, height: 18, textAlign: "center", fontSize: "9px",
        conditionalStyles: [
          { condition: "status == 'exceeds'", backgroundColor: "#4CAF50", color: "#FFFFFF" },
          { condition: "status == 'meets'", backgroundColor: "#FF9800", color: "#FFFFFF" },
          { condition: "status == 'below'", backgroundColor: "#F44336", color: "#FFFFFF" }
        ]
      },
    ],
    
    // Projects subsection
    sections: [
      {
        height: "auto",
        binding: "projects",
        items: [
          { type: "text", text: "•", x: 75, y: 2, width: 10, height: 16, fontSize: "10px" },
          { type: "text", text: "", binding: "name", x: 85, y: 2, width: 110, height: 16, fontSize: "10px" },
          { type: "text", text: "Budget:", x: 200, y: 2, width: 45, height: 16, color: "#666666", fontSize: "9px" },
          { type: "text", text: "", binding: "budget", format: "$#,##0", x: 245, y: 2, width: 60, height: 16, fontSize: "9px" },
          { type: "text", text: "Spent:", x: 315, y: 2, width: 35, height: 16, color: "#666666", fontSize: "9px" },
          { type: "text", text: "", binding: "spent", format: "$#,##0", x: 350, y: 2, width: 60, height: 16, fontSize: "9px",
            conditionalStyles: [
              { condition: "spent > budget", color: "#F44336", fontWeight: "bold" },
              { condition: "spent <= budget", color: "#4CAF50" }
            ]
          },
          { type: "text", text: "", binding: "completion + '%'", x: 420, y: 2, width: 35, height: 16, fontSize: "9px" },
          { type: "text", text: "", binding: "status", x: 460, y: 2, width: 70, height: 16, fontSize: "9px",
            conditionalStyles: [
              { condition: "status == 'completed'", color: "#4CAF50" },
              { condition: "status == 'in_progress'", color: "#2196F3" }
            ]
          },
        ],
      },
    ],
  },

  // Page Footer
  pageFooterSection: {
    height: "auto",
    items: [
      { type: "text", text: "", binding: "footerText", x: 150, y: 5, width: 295, height: 15, fontSize: "9px", color: "#666666", textAlign: "center" },
    ],
  },

  // Report Footer
  footerSection: {
    height: "auto",
    items: [
      // Top Performers Section
      { type: "text", text: "", binding: "LOCALIZE('top_performers')", x: 40, y: 10, width: 150, height: 22, fontSize: "14px", fontWeight: "bold" },
      
      // Bar chart for bonuses
      { type: "chart", chartType: "bar", x: 300, y: 10, width: 255, height: 140,
        title: "Performance Bonuses",
        labelsBinding: "topPerformers.map(p => p.name)",
        datasetsBinding: "[{label: 'Bonus ($)', data: topPerformers.map(p => p.bonus), backgroundColor: ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336']}]",
        showLegend: false,
        scales: {
          y: { beginAtZero: true, title: { display: true, text: "Amount ($)" } }
        }
      },
    ],
    sections: [
      {
        height: "auto",
        binding: "topPerformers",
        items: [
          { type: "text", text: "", binding: "$rowNum + '. ' + name", x: 50, y: 3, width: 120, height: 18, fontWeight: "bold", fontSize: "10px" },
          { type: "text", text: "", binding: "department", x: 175, y: 3, width: 70, height: 18, color: "#666666", fontSize: "10px" },
          { type: "text", text: "", binding: "achievement", x: 250, y: 3, width: 150, height: 18, fontSize: "10px" },
        ],
      },
    ],
  },
};
