var layout = {
  "pageSize": "A4",
  "orientation": "portrait",
  "initialPageNumber": 1,
  "supportedOutputs": "PDF_AND_EXCEL",
  "pageHeaderSection": {
    "height": "auto",
    "binding": "",
    "items": [
      {
        "x": 40,
        "y": 5,
        "width": 200,
        "height": 18,
        "name": "",
        "fontSize": "11px",
        "fontWeight": "bold",
        "type": "text",
        "text": "",
        "binding": "$.company.name",
        "format": ""
      },
      {
        "x": 470,
        "y": 5,
        "width": 30,
        "height": 18,
        "name": "",
        "color": "#666666",
        "fontSize": "10px",
        "type": "text",
        "text": "Page",
        "binding": "",
        "format": ""
      },
      {
        "x": 500,
        "y": 5,
        "width": 15,
        "height": 18,
        "name": "",
        "fontSize": "10px",
        "type": "text",
        "text": "",
        "binding": "report('$.pageNum')",
        "format": ""
      },
      {
        "x": 515,
        "y": 5,
        "width": 10,
        "height": 18,
        "name": "",
        "fontSize": "10px",
        "type": "text",
        "text": "/",
        "binding": "",
        "format": ""
      },
      {
        "x": 525,
        "y": 5,
        "width": 20,
        "height": 18,
        "name": "",
        "fontSize": "10px",
        "type": "text",
        "text": "",
        "binding": "report('$.totalPages')",
        "format": ""
      }
    ],
    "sections": [],
    "visibleOnFirstPage": true,
    "visibleOnLastPage": true
  },
  "headerSection": {
    "height": 374,
    "binding": "",
    "items": [
      {
        "x": 140,
        "y": 10,
        "width": 315,
        "height": 28,
        "name": "",
        "textAlign": "center",
        "fontSize": "20px",
        "fontWeight": "bold",
        "type": "text",
        "text": "",
        "binding": "localize('report_title')",
        "format": ""
      },
      {
        "x": 250,
        "y": 40,
        "width": 95,
        "height": 22,
        "name": "",
        "textAlign": "center",
        "fontSize": "16px",
        "type": "text",
        "text": "",
        "binding": "$.reportYear",
        "format": ""
      },
      {
        "x": 220,
        "y": 65,
        "width": 70,
        "height": 18,
        "name": "",
        "color": "#666666",
        "fontSize": "11px",
        "type": "text",
        "text": "Generated:",
        "binding": "",
        "format": ""
      },
      {
        "x": 290,
        "y": 65,
        "width": 120,
        "height": 18,
        "name": "",
        "fontSize": "11px",
        "type": "text",
        "text": "",
        "binding": "$.generatedDate",
        "format": "MMMM dd, yyyy"
      },
      {
        "x": 485,
        "y": 10,
        "width": 70,
        "height": 70,
        "name": "",
        "type": "qrcode",
        "value": "",
        "binding": "$.reportUrl",
        "errorCorrectionLevel": "M"
      },
      {
        "x": 40,
        "y": 95,
        "width": 200,
        "height": 22,
        "name": "",
        "fontSize": "14px",
        "fontWeight": "bold",
        "type": "text",
        "text": "",
        "binding": "localize('executive_summary')",
        "format": ""
      },
      {
        "x": 50,
        "y": 120,
        "width": 85,
        "height": 18,
        "name": "",
        "fontSize": "11px",
        "type": "text",
        "text": "Total Revenue:",
        "binding": "",
        "format": ""
      },
      {
        "x": 135,
        "y": 120,
        "width": 80,
        "height": 18,
        "name": "",
        "color": "#4CAF50",
        "fontSize": "11px",
        "fontWeight": "bold",
        "type": "text",
        "text": "",
        "binding": "$.summary.totalRevenue",
        "format": "$#,##0"
      },
      {
        "x": 225,
        "y": 120,
        "width": 90,
        "height": 18,
        "name": "",
        "fontSize": "11px",
        "type": "text",
        "text": "Total Expenses:",
        "binding": "",
        "format": ""
      },
      {
        "x": 315,
        "y": 120,
        "width": 80,
        "height": 18,
        "name": "",
        "color": "#F44336",
        "fontSize": "11px",
        "fontWeight": "bold",
        "type": "text",
        "text": "",
        "binding": "$.summary.totalExpenses",
        "format": "$#,##0"
      },
      {
        "x": 405,
        "y": 120,
        "width": 65,
        "height": 18,
        "name": "",
        "fontSize": "11px",
        "type": "text",
        "text": "Net Profit:",
        "binding": "",
        "format": ""
      },
      {
        "x": 470,
        "y": 120,
        "width": 80,
        "height": 18,
        "name": "",
        "color": "#2196F3",
        "fontSize": "11px",
        "fontWeight": "bold",
        "type": "text",
        "text": "",
        "binding": "$.summary.netProfit",
        "format": "$#,##0"
      },
      {
        "x": 50,
        "y": 140,
        "width": 50,
        "height": 18,
        "name": "",
        "fontSize": "11px",
        "type": "text",
        "text": "Growth:",
        "binding": "",
        "format": ""
      },
      {
        "x": 100,
        "y": 140,
        "width": 40,
        "height": 18,
        "name": "",
        "fontSize": "11px",
        "fontWeight": "bold",
        "conditionalStyles": [
          {
            "condition": "$.summary.growthRate >= 10",
            "color": "#4CAF50",
            "fontWeight": "bold"
          },
          {
            "condition": "$.summary.growthRate < 10 && $.summary.growthRate >= 0",
            "color": "#FF9800"
          },
          {
            "condition": "$.summary.growthRate < 0",
            "color": "#F44336"
          }
        ],
        "type": "text",
        "text": "",
        "binding": "$.summary.growthRate + '%'",
        "format": ""
      },
      {
        "x": 160,
        "y": 140,
        "width": 65,
        "height": 18,
        "name": "",
        "fontSize": "11px",
        "type": "text",
        "text": "Employees:",
        "binding": "",
        "format": ""
      },
      {
        "x": 225,
        "y": 140,
        "width": 40,
        "height": 18,
        "name": "",
        "fontSize": "11px",
        "type": "text",
        "text": "",
        "binding": "$.summary.employeeCount",
        "format": ""
      },
      {
        "x": 40,
        "y": 170,
        "width": 250,
        "height": 160,
        "name": "",
        "type": "chart",
        "chartType": "line",
        "labels": [],
        "labelsBinding": "$.charts.monthlyLabels",
        "datasets": [],
        "datasetsBinding": "[{label: 'Revenue', data: $.charts.revenueData, borderColor: '#4CAF50', backgroundColor: 'rgba(76,175,80,0.1)', fill: true}, {label: 'Expenses', data: $.charts.expensesData, borderColor: '#F44336', backgroundColor: 'rgba(244,67,54,0.1)', fill: true}]",
        "titleBinding": "localize('monthly_performance')",
        "showLegend": true,
        "legendPosition": "bottom",
        "scales": {
          "y": {
            "title": {
              "display": false,
              "text": ""
            },
            "beginAtZero": true
          }
        }
      },
      {
        "x": 305,
        "y": 170,
        "width": 250,
        "height": 160,
        "name": "",
        "type": "chart",
        "chartType": "pie",
        "labels": [],
        "labelsBinding": "$.charts.departmentLabels",
        "datasets": [],
        "datasetsBinding": "[{data: $.charts.departmentRevenue, backgroundColor: $.charts.departmentColors}]",
        "titleBinding": "localize('revenue_by_dept')",
        "showLegend": true,
        "legendPosition": "right"
      },
      {
        "x": 40,
        "y": 345,
        "width": 150,
        "height": 22,
        "name": "",
        "fontSize": "14px",
        "fontWeight": "bold",
        "type": "text",
        "text": "",
        "binding": "localize('departments')",
        "format": ""
      }
    ],
    "sections": []
  },
  "contentSection": {
    "height": "auto",
    "binding": "$.departments",
    "keepTogether": true,
    "items": [
      {
        "x": 40,
        "y": 5,
        "width": 20,
        "height": 18,
        "name": "",
        "fontSize": "11px",
        "fontWeight": "bold",
        "type": "text",
        "text": "",
        "binding": "report('$.rowNum') + '.'",
        "format": ""
      },
      {
        "x": 65,
        "y": 5,
        "width": 120,
        "height": 18,
        "name": "",
        "fontSize": "12px",
        "fontWeight": "bold",
        "type": "text",
        "text": "",
        "binding": "$.name",
        "format": ""
      },
      {
        "x": 190,
        "y": 5,
        "width": 55,
        "height": 18,
        "name": "",
        "color": "#666666",
        "fontSize": "10px",
        "type": "text",
        "text": "Manager:",
        "binding": "",
        "format": ""
      },
      {
        "x": 245,
        "y": 5,
        "width": 100,
        "height": 18,
        "name": "",
        "fontSize": "10px",
        "type": "text",
        "text": "",
        "binding": "$.manager",
        "format": ""
      },
      {
        "x": 455,
        "y": 2,
        "width": 100,
        "height": 23,
        "name": "",
        "type": "barcode",
        "value": "",
        "binding": "$.code",
        "format": "CODE128",
        "barWidth": 1.5,
        "displayValue": false
      },
      {
        "x": 65,
        "y": 25,
        "width": 55,
        "height": 18,
        "name": "",
        "fontSize": "10px",
        "type": "text",
        "text": "Revenue:",
        "binding": "",
        "format": ""
      },
      {
        "x": 120,
        "y": 25,
        "width": 70,
        "height": 18,
        "name": "",
        "color": "#4CAF50",
        "fontSize": "10px",
        "type": "text",
        "text": "",
        "binding": "$.revenue",
        "format": "$#,##0"
      },
      {
        "x": 200,
        "y": 25,
        "width": 55,
        "height": 18,
        "name": "",
        "fontSize": "10px",
        "type": "text",
        "text": "Expenses:",
        "binding": "",
        "format": ""
      },
      {
        "x": 255,
        "y": 25,
        "width": 70,
        "height": 18,
        "name": "",
        "color": "#F44336",
        "fontSize": "10px",
        "type": "text",
        "text": "",
        "binding": "$.expenses",
        "format": "$#,##0"
      },
      {
        "x": 335,
        "y": 25,
        "width": 40,
        "height": 18,
        "name": "",
        "fontSize": "10px",
        "type": "text",
        "text": "Profit:",
        "binding": "",
        "format": ""
      },
      {
        "x": 375,
        "y": 25,
        "width": 70,
        "height": 18,
        "name": "",
        "fontSize": "10px",
        "conditionalStyles": [
          {
            "condition": "$.profit >= 1000000",
            "color": "#4CAF50",
            "fontWeight": "bold"
          },
          {
            "condition": "$.profit >= 500000 && $.profit < 1000000",
            "color": "#FF9800"
          },
          {
            "condition": "$.profit < 500000",
            "color": "#F44336"
          }
        ],
        "type": "text",
        "text": "",
        "binding": "$.profit",
        "format": "$#,##0"
      },
      {
        "x": 455,
        "y": 25,
        "width": 35,
        "height": 18,
        "name": "",
        "fontSize": "10px",
        "type": "text",
        "text": "Staff:",
        "binding": "",
        "format": ""
      },
      {
        "x": 490,
        "y": 25,
        "width": 30,
        "height": 18,
        "name": "",
        "fontSize": "10px",
        "type": "text",
        "text": "",
        "binding": "$.employeeCount",
        "format": ""
      },
      {
        "x": 520,
        "y": 25,
        "width": 35,
        "height": 18,
        "name": "",
        "textAlign": "center",
        "fontSize": "9px",
        "conditionalStyles": [
          {
            "condition": "$.status == 'exceeds'",
            "backgroundColor": "#4CAF50",
            "color": "#FFFFFF"
          },
          {
            "condition": "$.status == 'meets'",
            "backgroundColor": "#FF9800",
            "color": "#FFFFFF"
          },
          {
            "condition": "$.status == 'below'",
            "backgroundColor": "#F44336",
            "color": "#FFFFFF"
          }
        ],
        "type": "text",
        "text": "",
        "binding": "$.status",
        "format": ""
      }
    ],
    "sections": [
      {
        "height": "auto",
        "binding": "$.projects",
        "items": [
          {
            "x": 75,
            "y": 2,
            "width": 10,
            "height": 16,
            "name": "",
            "fontSize": "10px",
            "type": "text",
            "text": "•",
            "binding": "",
            "format": ""
          },
          {
            "x": 85,
            "y": 2,
            "width": 110,
            "height": 16,
            "name": "",
            "fontSize": "10px",
            "type": "text",
            "text": "",
            "binding": "$.name",
            "format": ""
          },
          {
            "x": 200,
            "y": 2,
            "width": 45,
            "height": 16,
            "name": "",
            "color": "#666666",
            "fontSize": "9px",
            "type": "text",
            "text": "Budget:",
            "binding": "",
            "format": ""
          },
          {
            "x": 245,
            "y": 2,
            "width": 60,
            "height": 16,
            "name": "",
            "fontSize": "9px",
            "type": "text",
            "text": "",
            "binding": "$.budget",
            "format": "$#,##0"
          },
          {
            "x": 315,
            "y": 2,
            "width": 35,
            "height": 16,
            "name": "",
            "color": "#666666",
            "fontSize": "9px",
            "type": "text",
            "text": "Spent:",
            "binding": "",
            "format": ""
          },
          {
            "x": 350,
            "y": 2,
            "width": 60,
            "height": 16,
            "name": "",
            "fontSize": "9px",
            "conditionalStyles": [
              {
                "condition": "$.spent > $.budget",
                "color": "#F44336",
                "fontWeight": "bold"
              },
              {
                "condition": "$.spent <= $.budget",
                "color": "#4CAF50"
              }
            ],
            "type": "text",
            "text": "",
            "binding": "$.spent",
            "format": "$#,##0"
          },
          {
            "x": 420,
            "y": 2,
            "width": 35,
            "height": 16,
            "name": "",
            "fontSize": "9px",
            "type": "text",
            "text": "",
            "binding": "$.completion + '%'",
            "format": ""
          },
          {
            "x": 460,
            "y": 2,
            "width": 70,
            "height": 16,
            "name": "",
            "fontSize": "9px",
            "conditionalStyles": [
              {
                "condition": "$.status == 'completed'",
                "color": "#4CAF50"
              },
              {
                "condition": "$.status == 'in_progress'",
                "color": "#2196F3"
              }
            ],
            "type": "text",
            "text": "",
            "binding": "$.status",
            "format": ""
          }
        ],
        "sections": []
      }
    ]
  },
  "footerSection": {
    "height": "auto",
    "binding": "",
    "items": [
      {
        "x": 40,
        "y": 10,
        "width": 150,
        "height": 22,
        "name": "",
        "fontSize": "14px",
        "fontWeight": "bold",
        "type": "text",
        "text": "",
        "binding": "localize('top_performers')",
        "format": ""
      },
      {
        "x": 300,
        "y": 10,
        "width": 255,
        "height": 140,
        "name": "",
        "type": "chart",
        "chartType": "bar",
        "labels": [],
        "labelsBinding": "$.topPerformers.map(p => p.name)",
        "datasets": [],
        "datasetsBinding": "[{label: 'Bonus ($)', data: $.topPerformers.map(p => p.bonus), backgroundColor: ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336']}]",
        "title": "Performance Bonuses",
        "showLegend": false,
        "legendPosition": "top",
        "scales": {
          "y": {
            "title": {
              "display": true,
              "text": "Amount ($)"
            },
            "beginAtZero": true
          }
        }
      }
    ],
    "sections": [
      {
        "height": "auto",
        "binding": "$.topPerformers",
        "items": [
          {
            "x": 50,
            "y": 3,
            "width": 120,
            "height": 18,
            "name": "",
            "fontSize": "10px",
            "fontWeight": "bold",
            "type": "text",
            "text": "",
            "binding": "report('$.rowNum') + '. ' + $.name",
            "format": ""
          },
          {
            "x": 175,
            "y": 3,
            "width": 70,
            "height": 18,
            "name": "",
            "color": "#666666",
            "fontSize": "10px",
            "type": "text",
            "text": "",
            "binding": "$.department",
            "format": ""
          },
          {
            "x": 250,
            "y": 3,
            "width": 150,
            "height": 18,
            "name": "",
            "fontSize": "10px",
            "type": "text",
            "text": "",
            "binding": "$.achievement",
            "format": ""
          }
        ],
        "sections": []
      }
    ]
  },
  "pageFooterSection": {
    "height": "auto",
    "binding": "",
    "items": [
      {
        "x": 150,
        "y": 5,
        "width": 295,
        "height": 15,
        "name": "",
        "color": "#666666",
        "textAlign": "center",
        "fontSize": "9px",
        "type": "text",
        "text": "",
        "binding": "$.footerText",
        "format": ""
      }
    ],
    "sections": [],
    "visibleOnFirstPage": true,
    "visibleOnLastPage": true
  }
};
