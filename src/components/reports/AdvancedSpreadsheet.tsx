import { useState, useCallback, useMemo } from 'react';
import { DataGrid, Column, RenderCellProps, RenderEditCellProps } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import { SpreadsheetToolbar } from './SpreadsheetToolbar';
import { ChartGeneratorDialog } from './ChartGeneratorDialog';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from '@/components/ui/context-menu';
import type { AdvancedSpreadsheetData, AdvancedCellData, CellStyle, ChartConfig } from '@/types/spreadsheet';
import { evaluateFormula, isFormula, recalculateAll } from '@/lib/formulaParser';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AdvancedSpreadsheetProps {
  initialData?: AdvancedSpreadsheetData;
  initialRows?: number;
  initialCols?: number;
  onDataChange?: (data: AdvancedSpreadsheetData) => void;
  onChartsChange?: (charts: ChartConfig[]) => void;
}

interface Row {
  rowIdx: number;
  [key: string]: string | number;
}

const columnToLetter = (index: number): string => {
  let letter = '';
  while (index >= 0) {
    letter = String.fromCharCode((index % 26) + 65) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
};

const getCellKey = (col: number, row: number): string => {
  return `${columnToLetter(col)}${row + 1}`;
};

export function AdvancedSpreadsheet({
  initialData = {},
  initialRows = 50,
  initialCols = 26,
  onDataChange,
  onChartsChange,
}: AdvancedSpreadsheetProps) {
  const [rowCount, setRowCount] = useState(initialRows);
  const [colCount, setColCount] = useState(initialCols);
  const [cellData, setCellData] = useState<AdvancedSpreadsheetData>(initialData);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [selectedRange, setSelectedRange] = useState<{ startRow: number; startCol: number; endRow: number; endCol: number } | null>(null);
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [showChartDialog, setShowChartDialog] = useState(false);
  const [contextMenuCell, setContextMenuCell] = useState<{ col: number; row: number } | null>(null);

  const updateCellData = useCallback((updates: Partial<AdvancedSpreadsheetData>) => {
    setCellData(prev => {
      const newData = { ...prev, ...updates };
      const recalculated = recalculateAll(newData as any);
      
      Object.keys(recalculated).forEach(key => {
        if (newData[key]) {
          newData[key] = {
            ...newData[key],
            calculatedValue: recalculated[key].calculated,
          };
        }
      });

      onDataChange?.(newData);
      return newData;
    });
  }, [onDataChange]);

  const handleCellEdit = useCallback((col: number, row: number, value: string) => {
    const cellKey = getCellKey(col, row);
    const cell: AdvancedCellData = cellData[cellKey] || { value: '' };

    if (isFormula(value)) {
      try {
        const calculated = evaluateFormula(value, cellData as any);
        updateCellData({
          [cellKey]: {
            ...cell,
            value,
            formula: value,
            calculatedValue: calculated,
          },
        });
      } catch (error) {
        toast.error('Invalid formula');
        updateCellData({
          [cellKey]: {
            ...cell,
            value,
            formula: value,
            calculatedValue: 0,
          },
        });
      }
    } else {
      updateCellData({
        [cellKey]: {
          ...cell,
          value,
          formula: undefined,
          calculatedValue: undefined,
        },
      });
    }
  }, [cellData, updateCellData]);

  const applyStyleToSelection = useCallback((styleUpdates: Partial<CellStyle>) => {
    if (selectedCells.size === 0) return;

    const updates: Partial<AdvancedSpreadsheetData> = {};
    selectedCells.forEach(cellKey => {
      const cell = cellData[cellKey] || { value: '' };
      updates[cellKey] = {
        ...cell,
        style: {
          ...cell.style,
          ...styleUpdates,
        },
      };
    });

    updateCellData(updates);
  }, [selectedCells, cellData, updateCellData]);

  const columns: Column<Row>[] = useMemo(() => {
    const cols: Column<Row>[] = [
      {
        key: 'rowNumber',
        name: '',
        width: 50,
        frozen: true,
        renderCell: (props: RenderCellProps<Row>) => (
          <div className="flex items-center justify-center h-full bg-muted/50 text-muted-foreground text-xs font-medium">
            {props.row.rowIdx + 1}
          </div>
        ),
      },
    ];

    for (let i = 0; i < colCount; i++) {
      const colLetter = columnToLetter(i);
      const colIndex = i; // Capture the column index
      cols.push({
        key: colLetter,
        name: colLetter,
        width: 120,
        resizable: true,
        editable: true,
        renderEditCell: (props: RenderEditCellProps<Row>) => {
          const rowIndex = props.row.rowIdx;
          const cellKey = getCellKey(colIndex, rowIndex);
          const cell = cellData[cellKey];
          const displayValue = cell?.formula || cell?.value || '';

          return (
            <input
              autoFocus
              className="w-full h-full px-2 outline-none bg-background"
              value={displayValue}
              onChange={(e) => {
                handleCellEdit(colIndex, rowIndex, e.target.value);
                props.onRowChange({ ...props.row, [colLetter]: e.target.value });
              }}
            />
          );
        },
        renderCell: (props: RenderCellProps<Row>) => {
          const rowIndex = props.row.rowIdx;
          const cellKey = getCellKey(colIndex, rowIndex);
          const cell = cellData[cellKey];
          const isSelected = selectedCells.has(cellKey);
          
          const displayValue = cell?.calculatedValue !== undefined 
            ? cell.calculatedValue 
            : cell?.value || '';

          const style = cell?.style;

          return (
            <ContextMenu>
              <ContextMenuTrigger asChild>
                <div
                  className={cn(
                    "h-full w-full px-2 py-1 cursor-cell",
                    isSelected && "ring-2 ring-primary ring-inset"
                  )}
                  style={{
                    backgroundColor: style?.backgroundColor,
                    color: style?.textColor,
                    textAlign: style?.textAlign || 'left',
                    fontWeight: style?.bold ? 'bold' : 'normal',
                    fontStyle: style?.italic ? 'italic' : 'normal',
                    textDecoration: style?.underline ? 'underline' : 'none',
                    borderTop: style?.borderTop ? `1px solid ${style?.borderColor || '#ccc'}` : undefined,
                    borderRight: style?.borderRight ? `1px solid ${style?.borderColor || '#ccc'}` : undefined,
                    borderBottom: style?.borderBottom ? `1px solid ${style?.borderColor || '#ccc'}` : undefined,
                    borderLeft: style?.borderLeft ? `1px solid ${style?.borderColor || '#ccc'}` : undefined,
                  }}
                  onClick={() => {
                    setSelectedCells(new Set([cellKey]));
                    setSelectedRange({ startRow: rowIndex, startCol: colIndex, endRow: rowIndex, endCol: colIndex });
                  }}
                  onContextMenu={() => setContextMenuCell({ col: colIndex, row: rowIndex })}
                >
                  {displayValue}
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={() => handleCellEdit(colIndex, rowIndex, '')}>
                  Clear Cell
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => {
                  const cell = cellData[cellKey];
                  if (cell) {
                    navigator.clipboard.writeText(String(cell.value));
                    toast.success('Copied to clipboard');
                  }
                }}>
                  Copy
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => deleteRow(rowIndex)}>
                  Delete Row
                </ContextMenuItem>
                <ContextMenuItem onClick={() => deleteColumn(colIndex)}>
                  Delete Column
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          );
        },
      });
    }

    return cols;
  }, [colCount, cellData, selectedCells, handleCellEdit]);

  const rows: Row[] = useMemo(() => {
    const rowsData: Row[] = [];
    for (let i = 0; i < rowCount; i++) {
      const row: Row = { rowNumber: i + 1, rowIdx: i };
      for (let j = 0; j < colCount; j++) {
        const cellKey = getCellKey(j, i);
        const cell = cellData[cellKey];
        row[columnToLetter(j)] = cell?.calculatedValue !== undefined ? cell.calculatedValue : cell?.value || '';
      }
      rowsData.push(row);
    }
    return rowsData;
  }, [rowCount, colCount, cellData]);

  const addRow = () => setRowCount(prev => Math.min(prev + 1, 1000));
  const addColumn = () => setColCount(prev => Math.min(prev + 1, 100));

  const deleteRow = (rowIndex: number) => {
    const updates: Partial<AdvancedSpreadsheetData> = {};
    for (let col = 0; col < colCount; col++) {
      const cellKey = getCellKey(col, rowIndex);
      updates[cellKey] = { value: '' };
    }
    updateCellData(updates);
  };

  const deleteColumn = (colIndex: number) => {
    const updates: Partial<AdvancedSpreadsheetData> = {};
    for (let row = 0; row < rowCount; row++) {
      const cellKey = getCellKey(colIndex, row);
      updates[cellKey] = { value: '' };
    }
    updateCellData(updates);
  };

  const exportToCSV = () => {
    let csv = '';
    for (let row = 0; row < rowCount; row++) {
      const rowData: string[] = [];
      for (let col = 0; col < colCount; col++) {
        const cellKey = getCellKey(col, row);
        const cell = cellData[cellKey];
        const value = cell?.calculatedValue !== undefined ? cell.calculatedValue : cell?.value || '';
        rowData.push(`"${String(value).replace(/"/g, '""')}"`);
      }
      csv += rowData.join(',') + '\n';
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spreadsheet.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  const importFromCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const updates: Partial<AdvancedSpreadsheetData> = {};

      lines.forEach((line, rowIdx) => {
        if (!line.trim()) return;
        const values = line.split(',').map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"'));
        values.forEach((value, colIdx) => {
          const cellKey = getCellKey(colIdx, rowIdx);
          updates[cellKey] = { value: value.trim() };
        });
      });

      updateCellData(updates);
      setRowCount(Math.max(rowCount, lines.length));
      setColCount(Math.max(colCount, Math.max(...lines.map(l => l.split(',').length))));
      toast.success('CSV imported successfully');
    };
    reader.readAsText(file);
  };

  const handleCreateChart = (config: Omit<ChartConfig, 'id'>) => {
    const newChart: ChartConfig = {
      ...config,
      id: `chart_${Date.now()}`,
    };
    const updatedCharts = [...charts, newChart];
    setCharts(updatedCharts);
    onChartsChange?.(updatedCharts);
    toast.success('Chart created successfully');
  };

  const getChartData = () => {
    if (!selectedRange) return [];

    const data: any[] = [];
    for (let row = selectedRange.startRow; row <= selectedRange.endRow; row++) {
      const rowData: any = { name: `Row ${row + 1}` };
      for (let col = selectedRange.startCol; col <= selectedRange.endCol; col++) {
        const cellKey = getCellKey(col, row);
        const cell = cellData[cellKey];
        const value = cell?.calculatedValue !== undefined ? cell.calculatedValue : cell?.value || 0;
        rowData[columnToLetter(col)] = parseFloat(String(value)) || 0;
      }
      data.push(rowData);
    }
    return data;
  };

  return (
    <div className="flex flex-col h-full">
      <SpreadsheetToolbar
        onAddRow={addRow}
        onAddColumn={addColumn}
        onDeleteRow={() => contextMenuCell && deleteRow(contextMenuCell.row)}
        onDeleteColumn={() => contextMenuCell && deleteColumn(contextMenuCell.col)}
        onExportCSV={exportToCSV}
        onImportCSV={importFromCSV}
        onCreateChart={() => setShowChartDialog(true)}
        onToggleBold={() => applyStyleToSelection({ bold: true })}
        onToggleItalic={() => applyStyleToSelection({ italic: true })}
        onToggleUnderline={() => applyStyleToSelection({ underline: true })}
        onSetAlignment={(align) => applyStyleToSelection({ textAlign: align })}
        onSetBackgroundColor={(color) => applyStyleToSelection({ backgroundColor: color })}
        onSetTextColor={(color) => applyStyleToSelection({ textColor: color })}
        hasSelection={selectedCells.size > 0}
      />

      <div className="flex-1 overflow-auto">
        <DataGrid
          columns={columns}
          rows={rows}
          className="rdg-light h-full"
          style={{ height: '100%' }}
          rowKeyGetter={(row) => row.rowIdx}
        />
      </div>

      <ChartGeneratorDialog
        open={showChartDialog}
        onOpenChange={setShowChartDialog}
        selectedRange={selectedRange}
        data={getChartData()}
        onCreateChart={handleCreateChart}
      />
    </div>
  );
}
