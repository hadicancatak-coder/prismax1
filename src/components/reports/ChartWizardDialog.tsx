import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart3, LineChart as LineChartIcon, AreaChart as AreaChartIcon } from "lucide-react";
import type { ChartElementData, ReportElement } from "@/types/report";

interface ChartWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentConfig: ChartElementData;
  allElements: ReportElement[];
  onSave: (config: Partial<ChartElementData>) => void;
}

export function ChartWizardDialog({
  open,
  onOpenChange,
  currentConfig,
  allElements,
  onSave,
}: ChartWizardDialogProps) {
  const [config, setConfig] = useState<ChartElementData>(currentConfig);

  useEffect(() => {
    setConfig(currentConfig);
  }, [currentConfig]);

  const tableElements = allElements.filter((el) => el.type === 'table');

  const handleSave = () => {
    onSave(config);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configure Chart</DialogTitle>
          <DialogDescription>
            Select a source table and configure chart settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Chart Type Selection */}
          <div className="space-y-2">
            <Label>Chart Type</Label>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={config.chartType === 'bar' ? 'default' : 'outline'}
                className="h-20 flex-col gap-2"
                onClick={() => setConfig({ ...config, chartType: 'bar' })}
              >
                <BarChart3 className="h-6 w-6" />
                <span className="text-xs">Bar Chart</span>
              </Button>
              <Button
                variant={config.chartType === 'line' ? 'default' : 'outline'}
                className="h-20 flex-col gap-2"
                onClick={() => setConfig({ ...config, chartType: 'line' })}
              >
                <LineChartIcon className="h-6 w-6" />
                <span className="text-xs">Line Chart</span>
              </Button>
              <Button
                variant={config.chartType === 'area' ? 'default' : 'outline'}
                className="h-20 flex-col gap-2"
                onClick={() => setConfig({ ...config, chartType: 'area' })}
              >
                <AreaChartIcon className="h-6 w-6" />
                <span className="text-xs">Area Chart</span>
              </Button>
            </div>
          </div>

          {/* Source Table */}
          <div className="space-y-2">
            <Label htmlFor="sourceTable">Source Table</Label>
            <Select
              value={config.sourceTableId || ''}
              onValueChange={(value) => setConfig({ ...config, sourceTableId: value })}
            >
              <SelectTrigger id="sourceTable">
                <SelectValue placeholder="Select a table..." />
              </SelectTrigger>
              <SelectContent>
                {tableElements.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    No tables available. Add a table first.
                  </div>
                ) : (
                  tableElements.map((table) => (
                    <SelectItem key={table.id} value={table.id}>
                      {(table.data as any).title || `Table ${table.id.slice(0, 8)}`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* X-Axis Column */}
          <div className="space-y-2">
            <Label htmlFor="xAxis">X-Axis Column</Label>
            <Input
              id="xAxis"
              placeholder="e.g., A1 (column for labels)"
              value={config.xAxis}
              onChange={(e) => setConfig({ ...config, xAxis: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Enter the column letter (e.g., A, B, C) for X-axis labels
            </p>
          </div>

          {/* Y-Axis Columns */}
          <div className="space-y-2">
            <Label htmlFor="yAxis">Y-Axis Columns</Label>
            <Input
              id="yAxis"
              placeholder="e.g., B,C,D (comma-separated columns)"
              value={config.yAxis.join(',')}
              onChange={(e) =>
                setConfig({
                  ...config,
                  yAxis: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              Enter column letters for data series, separated by commas
            </p>
          </div>

          {/* Chart Title */}
          <div className="space-y-2">
            <Label htmlFor="chartTitle">Chart Title (Optional)</Label>
            <Input
              id="chartTitle"
              placeholder="Enter chart title..."
              value={config.title || ''}
              onChange={(e) => setConfig({ ...config, title: e.target.value })}
            />
          </div>

          {/* Preview Info */}
          {config.sourceTableId && config.xAxis && config.yAxis.length > 0 && (
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm font-medium mb-2">Preview Configuration:</p>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Chart Type: {config.chartType}</li>
                <li>• X-Axis: Column {config.xAxis}</li>
                <li>• Y-Axis: Columns {config.yAxis.join(', ')}</li>
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!config.sourceTableId || !config.xAxis || config.yAxis.length === 0}
          >
            Create Chart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
