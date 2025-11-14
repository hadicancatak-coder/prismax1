import { useState } from "react";
import { AdvancedSpreadsheet } from "../AdvancedSpreadsheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { AdvancedSpreadsheetData, ChartConfig } from "@/types/spreadsheet";
import type { TableElementData } from "@/types/report";

interface TableElementProps {
  data: TableElementData;
  onChange: (data: TableElementData) => void;
  isActive: boolean;
}

export function TableElement({ data, onChange, isActive }: TableElementProps) {
  const [title, setTitle] = useState(data.title || 'Table');

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    onChange({ ...data, title: newTitle });
  };

  const handleDataChange = (cells: AdvancedSpreadsheetData) => {
    onChange({ ...data, cells, useAdvanced: true });
  };

  const handleChartsChange = (charts: ChartConfig[]) => {
    onChange({ ...data, charts });
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center gap-4">
        <Label htmlFor="table-title" className="text-sm font-medium">
          Table Title
        </Label>
        <Input
          id="table-title"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="max-w-xs"
          placeholder="Enter table title..."
        />
      </div>
      
      <div className="flex-1 min-h-0">
        <AdvancedSpreadsheet
          onDataChange={handleDataChange}
          onChartsChange={handleChartsChange}
          initialData={data.cells as AdvancedSpreadsheetData}
          initialRows={data.rows}
          initialCols={data.cols}
        />
      </div>
    </div>
  );
}
