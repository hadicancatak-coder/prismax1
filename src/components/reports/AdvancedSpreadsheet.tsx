import { useState, useCallback, useMemo, useEffect } from 'react';
import { DataGrid, Column, RenderCellProps, RenderEditCellProps } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import { SpreadsheetToolbar } from './SpreadsheetToolbar';
import { ChartGeneratorDialog } from './ChartGeneratorDialog';
import { FormulaBar } from './FormulaBar';
import { Button } from '@/components/ui/button';
import { FormulaLibraryPanel } from './FormulaLibraryPanel';
import { GridCell } from './GridCell';
import type { AdvancedSpreadsheetData, AdvancedCellData, CellStyle, ChartConfig, MergedCell } from '@/types/spreadsheet';
import { evaluateFormula, isFormula, recalculateAll } from '@/lib/formulaParser';
import { toast } from 'sonner';

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
  initialRows = 100,
  initialCols = 26,
  onDataChange,
  onChartsChange,
}: AdvancedSpreadsheetProps) {
  const [rowCount, setRowCount] = useState(initialRows);
  const [colCount, setColCount] = useState(initialCols);
  const [cellData, setCellData] = useState<AdvancedSpreadsheetData>(initialData);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [selectedRange, setSelectedRange] = useState<{ startRow: number; startCol: number; endRow: number; endCol: number } | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ col: number; row: number } | null>(null);
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [showChartDialog, setShowChartDialog] = useState(false);
  const [contextMenuCell, setContextMenuCell] = useState<{ col: number; row: number } | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [mergedCells, setMergedCells] = useState<Map<string, MergedCell>>(new Map());
  const [showFormulaLibrary, setShowFormulaLibrary] = useState(false);
  const [frozenRows, setFrozenRows] = useState(0);
  const [frozenColumns, setFrozenColumns] = useState(0);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [filterActive, setFilterActive] = useState(false);

  // Click outside to close context menu
  useEffect(() => {
    if (!contextMenuOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.context-menu-panel')) {
        setContextMenuOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenuOpen]);

  // Escape key to close context menu
  useEffect(() => {
    if (!contextMenuOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenuOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [contextMenuOpen]);

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
        style: { ...(cell.style || {}), ...styleUpdates },
      };
    });

    updateCellData(updates);
  }, [selectedCells, cellData, updateCellData]);

  const applyBorders = (borderType: 'all' | 'outer' | 'top' | 'bottom' | 'left' | 'right' | 'none') => {
    const borderStyle: Partial<CellStyle> = {
      borderTop: ['all', 'outer', 'top'].includes(borderType),
      borderBottom: ['all', 'outer', 'bottom'].includes(borderType),
      borderLeft: ['all', 'outer', 'left'].includes(borderType),
      borderRight: ['all', 'outer', 'right'].includes(borderType),
      borderColor: borderType === 'none' ? undefined : 'hsl(var(--border))',
    };

    if (borderType === 'none') {
      borderStyle.borderTop = false;
      borderStyle.borderBottom = false;
      borderStyle.borderLeft = false;
      borderStyle.borderRight = false;
    }

    applyStyleToSelection(borderStyle);
  };

  const handleMergeCells = () => {
    if (!selectedRange) return;

    const { startRow, startCol, endRow, endCol } = selectedRange;
    const rowSpan = endRow - startRow + 1;
    const colSpan = endCol - startCol + 1;

    if (rowSpan === 1 && colSpan === 1) {
      toast.error('Select multiple cells to merge');
      return;
    }

    const topLeftKey = getCellKey(startCol, startRow);
    setMergedCells(prev => {
      const newMap = new Map(prev);
      newMap.set(topLeftKey, { startRow, startCol, rowSpan, colSpan });
      return newMap;
    });

    toast.success('Cells merged');
  };

  const handleSplitCells = () => {
    if (!selectedCell) return;

    const cellKey = getCellKey(selectedCell.col, selectedCell.row);
    if (!mergedCells.has(cellKey)) {
      toast.error('This cell is not merged');
      return;
    }

    setMergedCells(prev => {
      const newMap = new Map(prev);
      newMap.delete(cellKey);
      return newMap;
    });

    toast.success('Cells split');
  };

  const columns: Column<Row>[] = useMemo(() => {
    const cols: Column<Row>[] = [
      {
        key: 'rowNumber',
        name: '',
        width: 50,
        frozen: true,
        resizable: false,
        renderCell: (props: RenderCellProps<Row>) => (
          <div className="flex items-center justify-center h-full bg-[#282E33] text-gray-400 font-medium">
            {props.row.rowIdx + 1}
          </div>
        ),
      },
    ];

    for (let colIndex = 0; colIndex < colCount; colIndex++) {
      cols.push({
        key: `col-${colIndex}`,
        name: columnToLetter(colIndex),
        width: 120,
        resizable: true,
        editable: true,
        renderEditCell: (props: RenderEditCellProps<Row>) => {
          const rowIndex = props.row.rowIdx;
          const cellKey = getCellKey(colIndex, rowIndex);
          const cell = cellData[cellKey];
          const displayValue = String(cell?.formula || cell?.value || '');

          return (
            <input
              autoFocus
              className="w-full h-full px-2 outline-none bg-background text-foreground border-0"
              value={displayValue}
              onChange={(e) => {
                handleCellEdit(colIndex, rowIndex, e.target.value);
              }}
            />
          );
        },
        renderCell: (props: RenderCellProps<Row>) => {
          const rowIndex = props.row.rowIdx;
          const cellKey = getCellKey(colIndex, rowIndex);
          const cell = cellData[cellKey];
          const isSelected = selectedCells.has(cellKey);

          // Check if this cell is part of a merged range (but not the top-left cell)
          const isMergedChild = Array.from(mergedCells.entries()).some(([topLeftKey, range]) => {
            if (topLeftKey === cellKey) return false;
            const parts = topLeftKey.match(/([A-Z]+)(\d+)/);
            if (!parts) return false;
            const topLeftColLetters = parts[1];
            const topLeftRow = parseInt(parts[2]) - 1;
            let topLeftCol = -1;
            for (let i = 0; i < topLeftColLetters.length; i++) {
              topLeftCol = (topLeftCol + 1) * 26 + topLeftColLetters.charCodeAt(i) - 65;
            }
            return (
              colIndex >= topLeftCol &&
              colIndex < topLeftCol + range.colSpan &&
              rowIndex >= topLeftRow &&
              rowIndex < topLeftRow + range.rowSpan
            );
          });

          if (isMergedChild) {
            return <div className="h-full w-full" />;
          }

          const mergeInfo = mergedCells.get(cellKey);

          return (
            <GridCell
              cell={cell}
              isSelected={isSelected}
              mergeInfo={mergeInfo}
              onCellClick={() => {
                setSelectedCells(new Set([cellKey]));
                setSelectedRange({ startRow: rowIndex, startCol: colIndex, endRow: rowIndex, endCol: colIndex });
                setSelectedCell({ col: colIndex, row: rowIndex });
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenuCell({ col: colIndex, row: rowIndex });
                setContextMenuPosition({ x: e.clientX, y: e.clientY });
                setContextMenuOpen(true);
              }}
              onCellEdit={(value) => handleCellEdit(colIndex, rowIndex, value)}
            />
          );
        },
      });
    }

    return cols;
  }, [colCount, cellData, selectedCells, handleCellEdit, mergedCells]);

  const rows: Row[] = useMemo(() => {
    return Array.from({ length: rowCount }, (_, i) => ({ rowIdx: i }));
  }, [rowCount]);

  const addRow = () => setRowCount(prev => prev + 1);
  const addColumn = () => setColCount(prev => prev + 1);
  
  const deleteRow = (rowIdx: number) => {
    const newData = { ...cellData };
    for (let col = 0; col < colCount; col++) {
      const cellKey = getCellKey(col, rowIdx);
      delete newData[cellKey];
    }
    setCellData(newData);
    setRowCount(prev => Math.max(1, prev - 1));
    toast.success('Row deleted');
  };

  const deleteColumn = (colIdx: number) => {
    const newData = { ...cellData };
    for (let row = 0; row < rowCount; row++) {
      const cellKey = getCellKey(colIdx, row);
      delete newData[cellKey];
    }
    setCellData(newData);
    setColCount(prev => Math.max(1, prev - 1));
    toast.success('Column deleted');
  };

  const exportToCSV = () => {
    let csv = '';
    for (let row = 0; row < rowCount; row++) {
      const rowData: string[] = [];
      for (let col = 0; col < colCount; col++) {
        const cellKey = getCellKey(col, row);
        const cell = cellData[cellKey];
        const value = cell?.calculatedValue !== undefined ? cell.calculatedValue : cell?.value || '';
        rowData.push(`"${value}"`);
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
    toast.success('CSV exported');
  };

  const importFromCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = text.split('\n').map(row => row.split(','));
      
      const newData: AdvancedSpreadsheetData = {};
      rows.forEach((row, rowIdx) => {
        row.forEach((value, colIdx) => {
          const cleanValue = value.replace(/^"|"$/g, '');
          if (cleanValue) {
            const cellKey = getCellKey(colIdx, rowIdx);
            newData[cellKey] = { value: cleanValue };
          }
        });
      });

      updateCellData(newData);
      setRowCount(Math.max(rowCount, rows.length));
      setColCount(Math.max(colCount, Math.max(...rows.map(r => r.length))));
      toast.success('CSV imported');
    };
    reader.readAsText(file);
  };

  const handleCreateChart = (config: ChartConfig) => {
    setCharts(prev => [...prev, config]);
    onChartsChange?.([...charts, config]);
    setShowChartDialog(false);
    toast.success('Chart created');
  };

  const formulaBarValue = useMemo(() => {
    if (!selectedCell) return '';
    const cellKey = getCellKey(selectedCell.col, selectedCell.row);
    const cell = cellData[cellKey];
    if (!cell) return '';
    return cell.formula || cell.value?.toString() || '';
  }, [selectedCell, cellData]);

  const handleFormulaBarChange = (value: string) => {
    if (!selectedCell) return;
    const cellKey = getCellKey(selectedCell.col, selectedCell.row);
    if (cellKey) {
      handleCellEdit(selectedCell.col, selectedCell.row, value);
    }
  };

  const handleFormulaBarCommit = () => {
    if (!selectedCell) return;
    const cellKey = getCellKey(selectedCell.col, selectedCell.row);
    const cell = cellData[cellKey];
    if (cell?.formula) {
      try {
        const calculated = evaluateFormula(cell.formula, cellData as any);
        updateCellData({ [cellKey]: { ...cell, calculatedValue: calculated } });
      } catch (error) {
        console.error('Formula evaluation error:', error);
      }
    }
  };

  return (
    <div className="flex h-full w-full">
      <div className="flex-1 flex flex-col min-w-0">
        <FormulaBar
          selectedCell={selectedCell ? `${columnToLetter(selectedCell.col)}${selectedCell.row + 1}` : null}
          value={formulaBarValue}
          onChange={handleFormulaBarChange}
          onCommit={handleFormulaBarCommit}
        />

        <SpreadsheetToolbar
          onAddRow={addRow}
          onAddColumn={addColumn}
          onDeleteRow={() => {
            if (contextMenuCell) {
              deleteRow(contextMenuCell.row);
            } else if (selectedCell) {
              deleteRow(selectedCell.row);
            }
          }}
          onDeleteColumn={() => {
            if (contextMenuCell) {
              deleteColumn(contextMenuCell.col);
            } else if (selectedCell) {
              deleteColumn(selectedCell.col);
            }
          }}
          onExportCSV={exportToCSV}
          onImportCSV={importFromCSV}
          onCreateChart={() => setShowChartDialog(true)}
          onToggleBold={() => applyStyleToSelection({ bold: true })}
          onToggleItalic={() => applyStyleToSelection({ italic: true })}
          onToggleUnderline={() => applyStyleToSelection({ underline: true })}
          onSetAlignment={(align) => applyStyleToSelection({ textAlign: align as any })}
          onSetBackgroundColor={(color) => applyStyleToSelection({ backgroundColor: color })}
          onSetTextColor={(color) => applyStyleToSelection({ textColor: color })}
          onSetBorders={applyBorders}
          onMergeCells={handleMergeCells}
          onSplitCells={handleSplitCells}
          onToggleFormulaLibrary={() => setShowFormulaLibrary(!showFormulaLibrary)}
          hasSelection={selectedCells.size > 0}
        />

        <div className="flex-1 overflow-auto bg-background">
          <DataGrid
            columns={columns}
            rows={rows}
            className="rdg-light h-full"
            style={{ height: '100%' }}
            rowKeyGetter={(row) => row.rowIdx}
            onCellClick={(args) => {
              const colIdx = columns.findIndex(c => c.key === args.column.key);
              if (colIdx > 0) {
                setSelectedCell({ col: colIdx - 1, row: args.row.rowIdx });
              }
            }}
          />
        </div>

        {contextMenuOpen && contextMenuPosition && contextMenuCell && (
          <div 
            className="context-menu-panel fixed z-50 bg-popover text-popover-foreground rounded-md border shadow-md p-1 w-48"
            style={{ 
              left: contextMenuPosition.x, 
              top: contextMenuPosition.y,
            }}
          >
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                className="justify-start h-8 px-2"
                onClick={() => {
                  handleCellEdit(contextMenuCell.col, contextMenuCell.row, '');
                  setContextMenuOpen(false);
                }}
              >
                Clear Cell
              </Button>
              <Button
                variant="ghost"
                className="justify-start h-8 px-2"
                onClick={() => {
                  const cellKey = getCellKey(contextMenuCell.col, contextMenuCell.row);
                  const cell = cellData[cellKey];
                  if (cell) {
                    navigator.clipboard.writeText(String(cell.value));
                    toast.success('Copied to clipboard');
                  }
                  setContextMenuOpen(false);
                }}
              >
                Copy
              </Button>
              <div className="h-px bg-border my-1" />
              <Button
                variant="ghost"
                className="justify-start h-8 px-2"
                onClick={() => {
                  deleteRow(contextMenuCell.row);
                  setContextMenuOpen(false);
                }}
              >
                Delete Row
              </Button>
              <Button
                variant="ghost"
                className="justify-start h-8 px-2"
                onClick={() => {
                  deleteColumn(contextMenuCell.col);
                  setContextMenuOpen(false);
                }}
              >
                Delete Column
              </Button>
            </div>
          </div>
        )}

        {showChartDialog && selectedRange && (
          <ChartGeneratorDialog
            open={showChartDialog}
            onOpenChange={setShowChartDialog}
            selectedRange={selectedRange}
            data={[]}
            onCreateChart={(config) => handleCreateChart({ ...config, id: String(Date.now()) })}
          />
        )}
      </div>

      <FormulaLibraryPanel
        isOpen={showFormulaLibrary}
        onToggle={() => setShowFormulaLibrary(!showFormulaLibrary)}
        onInsertFormula={(formula) => {
          if (selectedCell) {
            handleCellEdit(selectedCell.col, selectedCell.row, formula);
            toast.success('Formula inserted!');
          } else {
            toast.error('Please select a cell first');
          }
        }}
      />
    </div>
  );
}
