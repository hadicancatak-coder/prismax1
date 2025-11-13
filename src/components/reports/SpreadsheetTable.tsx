import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Download } from "lucide-react";
import { SpreadsheetCell } from "./SpreadsheetCell";
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
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={addRow}>
            <Plus className="h-4 w-4 mr-2" />
            Add Row
          </Button>
          <Button variant="outline" size="sm" onClick={removeRow}>
            <Minus className="h-4 w-4 mr-2" />
            Remove Row
          </Button>
          <Button variant="outline" size="sm" onClick={addColumn}>
            <Plus className="h-4 w-4 mr-2" />
            Add Column
          </Button>
          <Button variant="outline" size="sm" onClick={removeColumn}>
            <Minus className="h-4 w-4 mr-2" />
            Remove Column
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Formula Bar */}
      {selectedCell && (
        <div className="flex items-center gap-2 p-2 border rounded bg-muted/30">
          <span className="text-sm font-medium min-w-[60px]">
            {getCellKey(selectedCell.col, selectedCell.row)}:
          </span>
          <div className="flex-1 px-2 py-1 text-sm bg-background rounded border">
            {selectedCellData?.formula || selectedCellData?.value || ''}
          </div>
        </div>
      )}

      {/* Spreadsheet Grid */}
      <div className="overflow-auto border rounded">
        <div className="inline-block min-w-full">
          {/* Header Row */}
          <div className="flex">
            <div className="w-12 h-10 flex items-center justify-center bg-muted border border-border text-xs font-medium">
              
            </div>
            {Array.from({ length: cols }, (_, colIndex) => (
              <div
                key={colIndex}
                className="w-24 h-10 flex items-center justify-center bg-muted border border-border text-xs font-medium"
              >
                {indexToColumn(colIndex)}
              </div>
            ))}
          </div>

          {/* Data Rows */}
          {Array.from({ length: rows }, (_, rowIndex) => (
            <div key={rowIndex} className="flex">
              <div className="w-12 h-10 flex items-center justify-center bg-muted border border-border text-xs font-medium">
                {rowIndex + 1}
              </div>
              {Array.from({ length: cols }, (_, colIndex) => {
                const cellKey = getCellKey(colIndex, rowIndex);
                const cell = data[cellKey] || { value: '' };
                const isSelected = selectedCell?.col === colIndex && selectedCell?.row === rowIndex;

                return (
                  <div key={colIndex} className="w-24">
                    <SpreadsheetCell
                      value={cell.value}
                      formula={cell.formula}
                      calculated={cell.calculated}
                      isSelected={isSelected}
                      isFormula={!!cell.formula}
                      onValueChange={(value) => handleCellChange(colIndex, rowIndex, value)}
                      onSelect={() => setSelectedCell({ col: colIndex, row: rowIndex })}
                      onKeyDown={(e) => handleKeyDown(colIndex, rowIndex, e)}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Help Text */}
      <div className="text-sm text-muted-foreground space-y-1">
        <p><strong>Formula examples:</strong></p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>=SUM(A1:A5) - Sum of range</li>
          <li>=AVG(B1:B10) - Average of range</li>
          <li>=A1+B1*2 - Math expression</li>
          <li>=MAX(C1:C5) - Maximum value</li>
          <li>=MIN(D1,D2,D3) - Minimum value</li>
        </ul>
      </div>
    </div>
  );
}
