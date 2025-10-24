import { BarChart3, LineChart, PieChart, ScatterChart, AreaChart, Table } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ChartTypeSelectorProps {
  selected: string;
  onSelect: (type: string) => void;
}

const chartTypes = [
  { id: 'bar', name: 'Bar Chart', icon: BarChart3, description: 'Compare values across categories' },
  { id: 'line', name: 'Line Chart', icon: LineChart, description: 'Show trends over time' },
  { id: 'pie', name: 'Pie Chart', icon: PieChart, description: 'Show proportions and percentages' },
  { id: 'area', name: 'Area Chart', icon: AreaChart, description: 'Emphasize magnitude of change' },
  { id: 'scatter', name: 'Scatter Plot', icon: ScatterChart, description: 'Show relationships between variables' },
  { id: 'table', name: 'Data Table', icon: Table, description: 'Display raw data in rows and columns' },
];

export function ChartTypeSelector({ selected, onSelect }: ChartTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {chartTypes.map((type) => {
        const Icon = type.icon;
        return (
          <Card
            key={type.id}
            className={cn(
              "p-4 cursor-pointer transition-all hover:shadow-md",
              selected === type.id 
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary/50"
            )}
            onClick={() => onSelect(type.id)}
          >
            <div className="flex flex-col items-center text-center gap-2">
              <Icon className={cn(
                "h-8 w-8",
                selected === type.id ? "text-primary" : "text-muted-foreground"
              )} />
              <div>
                <div className="font-medium text-sm">{type.name}</div>
                <div className="text-xs text-muted-foreground">{type.description}</div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
