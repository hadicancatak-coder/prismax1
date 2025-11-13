import { useState } from "react";
import { SpreadsheetTable } from "../SpreadsheetTable";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SpreadsheetData } from "@/lib/formulaParser";
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

  const handleDataChange = (cells: SpreadsheetData) => {
    onChange({ ...data, cells });
  };

  return (
    <div className="space-y-4">
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
      
      <SpreadsheetTable 
        onDataChange={handleDataChange}
        initialData={data.cells}
        initialRows={data.rows}
        initialCols={data.cols}
      />
    </div>
  );
}
