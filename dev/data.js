const data = {
  // Company Information
  company: {
    name: "TechVision Corp",
    logo: "", // Would be base64 image in production
  },
  reportTitle: "Annual Review Report",
  reportYear: 2025,
  generatedDate: "2026-01-12",
  reportUrl: "https://techvision.com/reports/2025",

  // Context - includes localization and temporal data
  context: {
    temporal: {
      nowUtc: "2026-01-12T14:00:00Z",
      timeZoneId: "Europe/Bucharest",
      nowLocal: "2026-01-12T16:00:00+02:00",
      utcOffsetMinutes: 120,
    },
    // Localization Resources - change localeCode to switch language: "en-US", "ro-RO", "cs-CZ"
    localization: {
      localeCode: "en-US",
      resources: {
        "en-US": {
          report_title: "Annual Review Report",
          executive_summary: "Executive Summary",
          total_revenue: "Total Revenue",
          total_expenses: "Total Expenses",
          net_profit: "Net Profit",
          growth_rate: "Growth Rate",
          departments: "Departments",
          projects: "Projects",
          top_performers: "Top Performers",
          monthly_performance: "Monthly Performance",
          revenue_by_dept: "Revenue by Department",
          x_axis_months: "Month",
          y_axis_amount: "Amount ($)",
          status_exceeds: "Exceeds",
          status_meets: "Meets",
          status_below: "Below",
          completed: "Completed",
          in_progress: "In Progress",
        },
        "ro-RO": {
          report_title: "Raport Anual de Evaluare",
          executive_summary: "Rezumat Executiv",
          total_revenue: "Venituri Totale",
          total_expenses: "Cheltuieli Totale",
          net_profit: "Profit Net",
          growth_rate: "Rata de Creștere",
          departments: "Departamente",
          projects: "Proiecte",
          top_performers: "Performeri de Top",
          monthly_performance: "Performanță Lunară",
          revenue_by_dept: "Venituri pe Departament",
          x_axis_months: "Luna",
          y_axis_amount: "Sumă ($)",
          status_exceeds: "Depășește",
          status_meets: "Îndeplinește",
          status_below: "Sub Așteptări",
          completed: "Finalizat",
          in_progress: "În Desfășurare",
        },
        "cs-CZ": {
          report_title: "Výroční hodnotící zpráva",
          executive_summary: "Shrnutí pro vedení",
          total_revenue: "Celkové příjmy",
          total_expenses: "Celkové výdaje",
          net_profit: "Čistý zisk",
          growth_rate: "Míra růstu",
          departments: "Oddělení",
          projects: "Projekty",
          top_performers: "Nejlepší zaměstnanci",
          monthly_performance: "Měsíční výkon",
          revenue_by_dept: "Příjmy podle oddělení",
          x_axis_months: "Měsíc",
          y_axis_amount: "Částka ($)",
          status_exceeds: "Překračuje",
          status_meets: "Splňuje",
          status_below: "Pod očekáváním",
          completed: "Dokončeno",
          in_progress: "Probíhá",
        },
      },
    },
  },

  // Executive Summary
  summary: {
    totalRevenue: 12500000,
    totalExpenses: 8750000,
    netProfit: 3750000,
    growthRate: 15.5,
    employeeCount: 245,
    customerCount: 1850,
    projectsCompleted: 47,
  },

  // Chart Data
  charts: {
    monthlyLabels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    revenueData: [850000, 920000, 1050000, 980000, 1100000, 1150000, 1080000, 1200000, 1050000, 1100000, 1020000, 1000000],
    expensesData: [620000, 680000, 750000, 710000, 780000, 800000, 760000, 850000, 740000, 780000, 720000, 560000],
    departmentLabels: ["Engineering", "Sales", "Marketing", "Operations", "HR"],
    departmentRevenue: [4500000, 3800000, 2200000, 1500000, 500000],
    departmentColors: ["#4CAF50", "#2196F3", "#FF9800", "#9C27B0", "#F44336"],
  },

  // Departments Data (for grouped content)
  departments: [
    {
      name: "Engineering",
      manager: "Sarah Johnson",
      revenue: 4500000,
      expenses: 3200000,
      profit: 1300000,
      employeeCount: 85,
      status: "exceeds",
      code: "ENG-2025",
      projects: [
        { name: "Cloud Migration", budget: 500000, spent: 480000, status: "completed", completion: 100 },
        { name: "Mobile App v3", budget: 350000, spent: 320000, status: "completed", completion: 100 },
        { name: "AI Integration", budget: 800000, spent: 450000, status: "in_progress", completion: 65 },
      ],
    },
    {
      name: "Sales",
      manager: "Michael Chen",
      revenue: 3800000,
      expenses: 2100000,
      profit: 1700000,
      employeeCount: 62,
      status: "exceeds",
      code: "SAL-2025",
      projects: [
        { name: "Enterprise Expansion", budget: 200000, spent: 185000, status: "completed", completion: 100 },
        { name: "Partner Program", budget: 150000, spent: 140000, status: "completed", completion: 100 },
      ],
    },
    {
      name: "Marketing",
      manager: "Emily Davis",
      revenue: 2200000,
      expenses: 1800000,
      profit: 400000,
      employeeCount: 38,
      status: "meets",
      code: "MKT-2025",
      projects: [
        { name: "Brand Refresh", budget: 300000, spent: 295000, status: "completed", completion: 100 },
        { name: "Digital Campaign", budget: 250000, spent: 180000, status: "in_progress", completion: 72 },
      ],
    },
    {
      name: "Operations",
      manager: "David Wilson",
      revenue: 1500000,
      expenses: 1350000,
      profit: 150000,
      employeeCount: 42,
      status: "below",
      code: "OPS-2025",
      projects: [
        { name: "Process Automation", budget: 400000, spent: 380000, status: "completed", completion: 100 },
      ],
    },
    {
      name: "Human Resources",
      manager: "Lisa Anderson",
      revenue: 500000,
      expenses: 300000,
      profit: 200000,
      employeeCount: 18,
      status: "meets",
      code: "HR-2025",
      projects: [
        { name: "Training Platform", budget: 100000, spent: 95000, status: "completed", completion: 100 },
        { name: "Recruitment System", budget: 80000, spent: 45000, status: "in_progress", completion: 55 },
      ],
    },
  ],

  // Top Performers
  topPerformers: [
    { name: "Alex Thompson", department: "Engineering", achievement: "Led Cloud Migration", bonus: 25000 },
    { name: "Jennifer Lee", department: "Sales", achievement: "150% Quota Achievement", bonus: 35000 },
    { name: "Robert Martinez", department: "Marketing", achievement: "Brand Campaign Success", bonus: 20000 },
    { name: "Amanda White", department: "Engineering", achievement: "AI System Architecture", bonus: 30000 },
    { name: "Chris Brown", department: "Sales", achievement: "Enterprise Deal Closer", bonus: 28000 },
  ],

  // Footer
  footerText: "Confidential - TechVision Corp © 2025",
};
