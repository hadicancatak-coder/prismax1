import type { ReportElement } from "@/types/report";

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  elements: Omit<ReportElement, 'id'>[];
  previewImage?: string;
}

export const reportTemplates: ReportTemplate[] = [
  {
    id: "monthly-report",
    name: "Monthly Performance Report",
    description: "Track monthly KPIs and performance metrics with charts and summaries",
    category: "Analytics",
    elements: [
      {
        type: 'text',
        position: 0,
        config: { width: 'full' },
        data: {
          content: '<h1>Monthly Performance Report</h1><p>Period: [Month Year]</p>',
        },
      },
      {
        type: 'table',
        position: 1,
        config: { width: 'full' },
        data: {
          rows: 6,
          cols: 4,
          cells: {
            'A1': { value: 'Metric' },
            'B1': { value: 'Target' },
            'C1': { value: 'Actual' },
            'D1': { value: 'Variance' },
            'A2': { value: 'Revenue' },
            'B2': { value: '100000' },
            'C2': { value: '95000' },
            'D2': { value: '=C2-B2' },
            'A3': { value: 'Costs' },
            'B3': { value: '50000' },
            'C3': { value: '48000' },
            'D3': { value: '=C3-B3' },
            'A4': { value: 'Profit Margin' },
            'B4': { value: '=(B2-B3)/B2' },
            'C4': { value: '=(C2-C3)/C2' },
            'D4': { value: '=C4-B4' },
          },
          title: 'Key Performance Metrics',
        },
      },
      {
        type: 'chart',
        position: 2,
        config: { width: 'full', height: 400 },
        data: {
          chartType: 'bar',
          xAxis: 'Metric',
          yAxis: ['Target', 'Actual'],
          title: 'Performance Comparison',
        },
      },
      {
        type: 'text',
        position: 3,
        config: { width: 'full' },
        data: {
          content: '<h2>Key Insights</h2><ul><li>Add key findings here</li><li>Highlight important trends</li><li>Note areas for improvement</li></ul>',
        },
      },
    ],
  },
  {
    id: "analytics-dashboard",
    name: "Analytics Dashboard",
    description: "Comprehensive dashboard with multiple charts and data visualizations",
    category: "Analytics",
    elements: [
      {
        type: 'text',
        position: 0,
        config: { width: 'full' },
        data: {
          content: '<h1>Analytics Dashboard</h1><p>Real-time performance overview</p>',
        },
      },
      {
        type: 'table',
        position: 1,
        config: { width: 'full' },
        data: {
          rows: 5,
          cols: 5,
          cells: {
            'A1': { value: 'Week' },
            'B1': { value: 'Users' },
            'C1': { value: 'Sessions' },
            'D1': { value: 'Conversions' },
            'E1': { value: 'Revenue' },
            'A2': { value: 'Week 1' },
            'B2': { value: '1200' },
            'C2': { value: '3500' },
            'D2': { value: '45' },
            'E2': { value: '15000' },
            'A3': { value: 'Week 2' },
            'B3': { value: '1350' },
            'C3': { value: '3800' },
            'D3': { value: '52' },
            'E3': { value: '17500' },
            'A4': { value: 'Week 3' },
            'B4': { value: '1450' },
            'C4': { value: '4100' },
            'D4': { value: '58' },
            'E4': { value: '19000' },
          },
          title: 'Weekly Performance Data',
        },
      },
      {
        type: 'chart',
        position: 2,
        config: { width: 'full', height: 350 },
        data: {
          chartType: 'line',
          xAxis: 'Week',
          yAxis: ['Users', 'Sessions'],
          title: 'User Engagement Trend',
        },
      },
      {
        type: 'chart',
        position: 3,
        config: { width: 'full', height: 350 },
        data: {
          chartType: 'area',
          xAxis: 'Week',
          yAxis: ['Revenue'],
          title: 'Revenue Growth',
        },
      },
    ],
  },
  {
    id: "kpi-tracker",
    name: "KPI Tracker",
    description: "Simple KPI tracking template with targets and actuals",
    category: "Performance",
    elements: [
      {
        type: 'text',
        position: 0,
        config: { width: 'full' },
        data: {
          content: '<h1>KPI Tracker</h1><p>Track your key performance indicators</p>',
        },
      },
      {
        type: 'table',
        position: 1,
        config: { width: 'full' },
        data: {
          rows: 8,
          cols: 5,
          cells: {
            'A1': { value: 'KPI' },
            'B1': { value: 'Target' },
            'C1': { value: 'Current' },
            'D1': { value: 'Status' },
            'E1': { value: 'Progress %' },
            'A2': { value: 'Customer Satisfaction' },
            'B2': { value: '90' },
            'C2': { value: '85' },
            'D2': { value: 'In Progress' },
            'E2': { value: '=C2/B2' },
            'A3': { value: 'Response Time' },
            'B3': { value: '2' },
            'C3': { value: '2.5' },
            'D3': { value: 'Needs Attention' },
            'E3': { value: '=B3/C3' },
            'A4': { value: 'Sales Target' },
            'B4': { value: '500000' },
            'C4': { value: '450000' },
            'D4': { value: 'On Track' },
            'E4': { value: '=C4/B4' },
          },
          title: 'KPI Overview',
        },
      },
      {
        type: 'chart',
        position: 2,
        config: { width: 'full', height: 400 },
        data: {
          chartType: 'bar',
          xAxis: 'KPI',
          yAxis: ['Target', 'Current'],
          title: 'KPI Performance',
        },
      },
    ],
  },
  {
    id: "blank-report",
    name: "Blank Report",
    description: "Start with a clean slate",
    category: "Basic",
    elements: [
      {
        type: 'text',
        position: 0,
        config: { width: 'full' },
        data: {
          content: '<h1>Untitled Report</h1><p>Start building your custom report...</p>',
        },
      },
    ],
  },
];
