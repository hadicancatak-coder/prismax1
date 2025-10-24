import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ColumnMapperProps {
  columns: string[];
  chartType: string;
  config: Record<string, any>;
  onChange: (config: Record<string, any>) => void;
}

export function ColumnMapper({ columns, chartType, config, onChange }: ColumnMapperProps) {
  const showXAxis = ['bar', 'line', 'area', 'scatter'].includes(chartType);
  const showYAxis = ['bar', 'line', 'area', 'scatter'].includes(chartType);
  const showValueField = ['pie'].includes(chartType);
  const showLabelField = ['pie'].includes(chartType);

  return (
    <div className="space-y-4">
      {showXAxis && (
        <div className="space-y-2">
          <Label>X-Axis Column</Label>
          <Select value={config.xAxis} onValueChange={(value) => onChange({ ...config, xAxis: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select column for X-axis" />
            </SelectTrigger>
            <SelectContent>
              {columns.map((col) => (
                <SelectItem key={col} value={col}>{col}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {showYAxis && (
        <div className="space-y-2">
          <Label>Y-Axis Column</Label>
          <Select value={config.yAxis} onValueChange={(value) => onChange({ ...config, yAxis: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select column for Y-axis" />
            </SelectTrigger>
            <SelectContent>
              {columns.map((col) => (
                <SelectItem key={col} value={col}>{col}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {showLabelField && (
        <div className="space-y-2">
          <Label>Label Column</Label>
          <Select value={config.labelField} onValueChange={(value) => onChange({ ...config, labelField: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select column for labels" />
            </SelectTrigger>
            <SelectContent>
              {columns.map((col) => (
                <SelectItem key={col} value={col}>{col}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {showValueField && (
        <div className="space-y-2">
          <Label>Value Column</Label>
          <Select value={config.valueField} onValueChange={(value) => onChange({ ...config, valueField: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select column for values" />
            </SelectTrigger>
            <SelectContent>
              {columns.map((col) => (
                <SelectItem key={col} value={col}>{col}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {chartType === 'table' && (
        <div className="text-sm text-muted-foreground">
          All columns will be displayed in the table view.
        </div>
      )}
    </div>
  );
}
