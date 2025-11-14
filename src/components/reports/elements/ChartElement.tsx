import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { ChartWizardDialog } from "../ChartWizardDialog";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ChartElementData, ReportElement } from "@/types/report";
import type { SpreadsheetData } from "@/lib/formulaParser";

interface ChartElementProps {
  data: ChartElementData;
  onChange: (data: ChartElementData) => void;
  isActive: boolean;
  allElements: ReportElement[];
}

export function ChartElement({ data, onChange, isActive, allElements }: ChartElementProps) {
  const [showWizard, setShowWizard] = useState(!data.sourceTableId);

  // Get source table data
  const sourceTable = allElements.find((el) => el.id === data.sourceTableId);
  const tableData = sourceTable?.type === 'table' ? (sourceTable.data as any).cells : {};

  // Transform table data to chart format
  const chartData = transformTableToChartData(tableData, data);

  const handleConfigUpdate = (newConfig: Partial<ChartElementData>) => {
    onChange({ ...data, ...newConfig });
    setShowWizard(false);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <input
          type="text"
          value={data.title || ''}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-0"
          placeholder="Chart Title"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowWizard(true)}
        >
          <Settings className="h-4 w-4 mr-2" />
          Configure
        </Button>
      </div>

      {/* Chart */}
      {data.sourceTableId && chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={data.height || 400}>
          {data.chartType === 'line' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {data.yAxis.map((yKey, idx) => (
                <Line
                  key={yKey}
                  type="monotone"
                  dataKey={yKey}
                  stroke={data.colors?.[idx] || CHART_COLORS[idx % CHART_COLORS.length]}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          ) : data.chartType === 'bar' ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {data.yAxis.map((yKey, idx) => (
                <Bar
                  key={yKey}
                  dataKey={yKey}
                  fill={data.colors?.[idx] || CHART_COLORS[idx % CHART_COLORS.length]}
                />
              ))}
            </BarChart>
          ) : (
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {data.yAxis.map((yKey, idx) => (
                <Area
                  key={yKey}
                  type="monotone"
                  dataKey={yKey}
                  fill={data.colors?.[idx] || CHART_COLORS[idx % CHART_COLORS.length]}
                  stroke={data.colors?.[idx] || CHART_COLORS[idx % CHART_COLORS.length]}
                />
              ))}
            </AreaChart>
          )}
        </ResponsiveContainer>
      ) : (
        <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">No data configured</p>
            <Button onClick={() => setShowWizard(true)}>
              Configure Chart
            </Button>
          </div>
        </div>
      )}

      {/* Chart Wizard Dialog */}
      <ChartWizardDialog
        open={showWizard}
        onOpenChange={setShowWizard}
        currentConfig={data}
        allElements={allElements}
        onSave={handleConfigUpdate}
      />
    </div>
  );
}

// Chart color palette
const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

// Transform spreadsheet data to chart format
function transformTableToChartData(
  tableData: SpreadsheetData,
  config: ChartElementData
): any[] {
  if (!config.xAxis || config.yAxis.length === 0) return [];

  const result: any[] = [];
  const xColMatch = config.xAxis.match(/^([A-Z]+)/);
  if (!xColMatch) return [];

  const xCol = columnToIndex(xColMatch[1]);
  const yCols = config.yAxis.map((y) => {
    const match = y.match(/^([A-Z]+)/);
    return match ? columnToIndex(match[1]) : -1;
  }).filter(col => col !== -1);

  // Get row range
  const xRowMatch = config.xAxis.match(/(\d+)$/);
  const startRow = xRowMatch ? parseInt(xRowMatch[1]) : 1;
  
  // Collect data from rows
  for (let row = startRow; row < startRow + 100; row++) {
    const xKey = `${indexToColumn(xCol)}${row}`;
    const xValue = tableData[xKey]?.value;
    
    if (!xValue) break; // Stop at first empty cell

    const dataPoint: any = { name: String(xValue) };
    
    yCols.forEach((yCol, idx) => {
      const yKey = `${indexToColumn(yCol)}${row}`;
      const yValue = tableData[yKey]?.value;
      const yLabel = config.yAxis[idx].match(/^([A-Z]+)/)?.[1] || `Series ${idx + 1}`;
      dataPoint[yLabel] = typeof yValue === 'number' ? yValue : parseFloat(String(yValue)) || 0;
    });

    result.push(dataPoint);
  }

  return result;
}

function columnToIndex(col: string): number {
  let index = 0;
  for (let i = 0; i < col.length; i++) {
    index = index * 26 + (col.charCodeAt(i) - 64);
  }
  return index - 1;
}

function indexToColumn(index: number): string {
  let col = '';
  let num = index + 1;
  while (num > 0) {
    const remainder = (num - 1) % 26;
    col = String.fromCharCode(65 + remainder) + col;
    num = Math.floor((num - 1) / 26);
  }
  return col;
}
