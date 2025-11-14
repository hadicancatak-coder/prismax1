import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Download } from "lucide-react";
import { SpreadsheetCell } from "./SpreadsheetCell";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  SpreadsheetData, 
  getCellKey, 
  indexToColumn, 
  isFormula, 
  recalculateAll 
} from "@/lib/formulaParser";

interface SpreadsheetTableProps {
  onDataChange?: (data: SpreadsheetData) => void;
  initialData?: SpreadsheetData;
  initialRows?: number;
  initialCols?: number;
}

export function SpreadsheetTable({ 
  onDataChange, 
  initialData = {},
  initialRows = 10,
  initialCols = 8,
}: SpreadsheetTableProps) {
  const [rows, setRows] = useState(initialRows);
  const [cols, setCols] = useState(initialCols);
  const [data, setData] = useState<SpreadsheetData>(initialData);
  const [selectedCell, setSelectedCell] = useState<{ col: number; row: number } | null>(null);

  const updateData = useCallback((newData: SpreadsheetData) => {
    const recalculated = recalculateAll(newData);
    setData(recalculated);
    onDataChange?.(recalculated);
  }, [onDataChange]);

  const handleCellChange = (col: number, row: number, value: string) => {
    const cellKey = getCellKey(col, row);
    const newData = { ...data };
    
    if (isFormula(value)) {
      newData[cellKey] = {
        value: value,
        formula: value,
      };
    } else {
      newData[cellKey] = {
        value: value,
      };
    }
    
    updateData(newData);
  };

  const handleKeyDown = (col: number, row: number, e: React.KeyboardEvent) => {
    e.preventDefault();
    let newCol = col;
    let newRow = row;

    switch (e.key) {
      case 'ArrowUp':
        newRow = Math.max(0, row - 1);
        break;
      case 'ArrowDown':
      case 'Enter':
        newRow = Math.min(rows - 1, row + 1);
        break;
      case 'ArrowLeft':
        newCol = Math.max(0, col - 1);
        break;
      case 'ArrowRight':
      case 'Tab':
        newCol = Math.min(cols - 1, col + 1);
        break;
      default:
        return;
    }

    setSelectedCell({ col: newCol, row: newRow });
  };

  const addRow = () => setRows(rows + 1);
  const removeRow = () => setRows(Math.max(1, rows - 1));
  const addColumn = () => setCols(cols + 1);
  const removeColumn = () => setCols(Math.max(1, cols - 1));

  const exportToCSV = () => {
    let csv = '';
    
    // Header row
    csv += ',' + Array.from({ length: cols }, (_, i) => indexToColumn(i)).join(',') + '\n';
    
    // Data rows
    for (let row = 0; row < rows; row++) {
      csv += (row + 1).toString();
      for (let col = 0; col < cols; col++) {
        const cellKey = getCellKey(col, row);
        const cell = data[cellKey];
        const value = cell?.formula 
          ? `"${cell.formula}"` 
          : cell?.value || '';
        csv += ',' + value;
      }
      csv += '\n';
    }
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spreadsheet.csv';
    a.click();
    URL.revokeObjectURL(url);
  };


  const selectedCellKey = selectedCell ? getCellKey(selectedCell.col, selectedCell.row) : null;
  const selectedCellData = selectedCellKey ? data[selectedCellKey] : null;

  return (
    <div className="space-y-3">
      {/* Compact Toolbar */}
      <div className="flex items-center justify-between px-1">
        <TooltipProvider>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={addRow}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Add Row</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={removeRow}>
                  <Minus className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Remove Row</TooltipContent>
            </Tooltip>
            <div className="h-4 w-px bg-border mx-1" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={addColumn}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Add Column</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={removeColumn}>
                  <Minus className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Remove Column</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        <Button variant="ghost" size="sm" onClick={exportToCSV} className="h-7 text-xs">
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Export CSV
        </Button>
      </div>

      {/* Formula Bar */}
      {selectedCellData && (
        <div className="flex items-center gap-2 px-2 py-1.5 bg-muted/30 rounded border text-xs">
          <span className="font-medium text-muted-foreground min-w-[60px]">
            {selectedCell && `${indexToColumn(selectedCell.col)}${selectedCell.row + 1}`}
          </span>
          <div className="flex-1 font-mono text-foreground">
            {selectedCellData.formula || selectedCellData.value || ''}
          </div>
        </div>
      )}

      {/* Google Sheets-like Table */}
      <div className="border rounded-md overflow-auto bg-background">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-10 h-6 bg-muted/50 border-r border-b text-[10px] font-medium text-muted-foreground"></th>
              {Array.from({ length: cols }, (_, i) => (
                <th
                  key={i}
                  className="h-6 min-w-[80px] bg-muted/50 border-r border-b text-[10px] font-medium text-muted-foreground px-1 text-center"
                >
                  {indexToColumn(i)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, rowIndex) => (
              <tr key={rowIndex} className="group">
                <td className="sticky left-0 z-10 w-10 h-7 bg-muted/50 border-r border-b text-[10px] font-medium text-muted-foreground text-center">
                  {rowIndex + 1}
                </td>
                {Array.from({ length: cols }, (_, colIndex) => {
                  const cellKey = getCellKey(colIndex, rowIndex);
                  const cell = data[cellKey];
                  const isSelected = selectedCell?.col === colIndex && selectedCell?.row === rowIndex;
                  
                  return (
                    <td
                      key={colIndex}
                      className="border-r border-b p-0 min-w-[80px] h-7"
                    >
                      <SpreadsheetCell
                        value={cell?.value || ''}
                        formula={cell?.formula}
                        calculated={cell?.calculated}
                        isSelected={isSelected}
                        onChange={(value) => handleCellChange(colIndex, rowIndex, value)}
                        onSelect={() => setSelectedCell({ col: colIndex, row: rowIndex })}
                        onKeyDown={(e) => handleKeyDown(colIndex, rowIndex, e)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
