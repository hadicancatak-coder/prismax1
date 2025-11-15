import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { VirtualizedSpreadsheet } from './VirtualizedSpreadsheet';
import { SpreadsheetToolbar } from './SpreadsheetToolbar';
import { ChartGeneratorDialog } from './ChartGeneratorDialog';
import { FormulaBar } from './FormulaBar';
import { FormulaLibraryPanel } from './FormulaLibraryPanel';
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
  const cellDataRef = useRef<AdvancedSpreadsheetData>(initialData);
  
  const [selectedCells, setSelectedCells] = useState<string[]>([]);
  const [selectedRange, setSelectedRange] = useState<{ startRow: number; startCol: number; endRow: number; endCol: number } | null>(null);
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [contextMenuCell, setContextMenuCell] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [showChartDialog, setShowChartDialog] = useState(false);
  const [mergedCells, setMergedCells] = useState<MergedCell[]>([]);
  const [showFormulaLibrary, setShowFormulaLibrary] = useState(false);
  const [filterActive, setFilterActive] = useState(false);

  const cellDataMap = useMemo(() => {
    const map = new Map<string, AdvancedCellData>();
    Object.entries(cellData).forEach(([key, value]) => {
      map.set(key, value);
    });
    return map;
  }, [cellData]);
  
  const selectedCellsSet = useMemo(() => new Set(selectedCells), [selectedCells]);
  
  const mergedCellsMap = useMemo(() => {
    const map = new Map<string, boolean>();
    mergedCells.forEach(mc => {
      for (let r = mc.startRow; r < mc.startRow + mc.rowSpan; r++) {
        for (let c = mc.startCol; c < mc.startCol + mc.colSpan; c++) {
          if (r !== mc.startRow || c !== mc.startCol) {
            map.set(`${r}-${c}`, true);
          }
        }
      }
    });
    return map;
  }, [mergedCells]);

  useEffect(() => {
    cellDataRef.current = cellData;
  }, [cellData]);

  useEffect(() => {
    if (!contextMenuOpen) return;
    
    const handleClickOutside = () => setContextMenuOpen(false);
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenuOpen(false);
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [contextMenuOpen]);

  const updateCellData = useCallback((updates: AdvancedSpreadsheetData) => {
    setCellData(prev => {
      const newData = { ...prev, ...updates };
      const recalculated = recalculateAll(newData as any);
      onDataChange?.(recalculated as AdvancedSpreadsheetData);
      return recalculated as AdvancedSpreadsheetData;
    });
  }, [onDataChange]);

  const handleCellEdit = useCallback((row: number, col: number, value: string) => {
    const cellKey = getCellKey(col, row);
    const updates: AdvancedSpreadsheetData = {};

    if (isFormula(value)) {
      try {
        const calculatedValue = evaluateFormula(value, cellDataRef.current as any);
        updates[cellKey] = {
          value: value,
          formula: value,
          calculatedValue,
          style: cellDataRef.current[cellKey]?.style,
        };
      } catch (error) {
        toast.error(`Formula error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        updates[cellKey] = {
          value: value,
          formula: value,
          calculatedValue: 0,
          style: cellDataRef.current[cellKey]?.style,
        };
      }
    } else {
      updates[cellKey] = {
        value: value,
        style: cellDataRef.current[cellKey]?.style,
      };
    }

    updateCellData(updates);
  }, [updateCellData]);

  const handleVirtualCellClick = useCallback((row: number, col: number, e: React.MouseEvent) => {
    const cellKey = `${row}-${col}`;
    
    if (e.shiftKey && selectedCell) {
      const [startRow, startCol] = selectedCell.split('-').map(Number);
      const minRow = Math.min(startRow, row);
      const maxRow = Math.max(startRow, row);
      const minCol = Math.min(startCol, col);
      const maxCol = Math.max(startCol, col);
      
      const newSelected: string[] = [];
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          newSelected.push(`${r}-${c}`);
        }
      }
      setSelectedCells(newSelected);
      setSelectedRange({ startRow: minRow, startCol: minCol, endRow: maxRow, endCol: maxCol });
    } else if (e.ctrlKey || e.metaKey) {
      setSelectedCells(prev => 
        prev.includes(cellKey) 
          ? prev.filter(k => k !== cellKey)
          : [...prev, cellKey]
      );
    } else {
      setSelectedCells([cellKey]);
      setSelectedCell(cellKey);
      setSelectedRange(null);
    }
  }, [selectedCell]);

  const handleVirtualContextMenu = useCallback((row: number, col: number, e: React.MouseEvent) => {
    e.preventDefault();
    const cellKey = `${row}-${col}`;
    setContextMenuCell(cellKey);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMenuOpen(true);
  }, []);

  const applyStyleToSelection = useCallback((style: Partial<CellStyle>) => {
    if (selectedCells.length === 0) return;

    const updates: AdvancedSpreadsheetData = {};
    selectedCells.forEach(cellKey => {
      const existing = cellData[cellKey] || { value: '' };
      updates[cellKey] = {
        ...existing,
        style: { ...existing.style, ...style },
      };
    });

    updateCellData(updates);
  }, [selectedCells, cellData, updateCellData]);

  const formulaBarValue = selectedCell ? cellData[selectedCell]?.formula || cellData[selectedCell]?.value?.toString() || '' : '';

  const handleFormulaBarChange = useCallback((value: string) => {
    // Input changes are handled by FormulaBar component
  }, []);

  const handleFormulaBarCommit = useCallback(() => {
    if (!selectedCell) return;
    const [row, col] = selectedCell.split('-').map(Number);
    handleCellEdit(row, col, formulaBarValue);
  }, [selectedCell, formulaBarValue, handleCellEdit]);

  useEffect(() => {
    onChartsChange?.(charts);
  }, [charts, onChartsChange]);

  return (
    <div className="flex flex-col h-full bg-[#1a1f25]">
      <FormulaBar
        selectedCell={selectedCell}
        value={formulaBarValue}
        onChange={handleFormulaBarChange}
        onCommit={handleFormulaBarCommit}
      />

      <SpreadsheetToolbar
        onToggleBold={() => applyStyleToSelection({ bold: true })}
        onToggleItalic={() => applyStyleToSelection({ italic: true })}
        onToggleUnderline={() => applyStyleToSelection({ underline: true })}
        onSetAlignment={(align) => applyStyleToSelection({ textAlign: align })}
        onSetBackgroundColor={(color) => applyStyleToSelection({ backgroundColor: color })}
        onSetTextColor={(color) => applyStyleToSelection({ textColor: color })}
        onSetBorders={() => {}}
        onExportCSV={() => toast.info('Export coming soon')}
        onImportCSV={() => {}}
        onCreateChart={() => setShowChartDialog(true)}
        onToggleFormulaLibrary={() => setShowFormulaLibrary(!showFormulaLibrary)}
        onAddRow={() => setRowCount(prev => prev + 1)}
        onAddColumn={() => setColCount(prev => prev + 1)}
        onDeleteRow={() => setRowCount(prev => Math.max(1, prev - 1))}
        onDeleteColumn={() => setColCount(prev => Math.max(1, prev - 1))}
        onMergeCells={() => {}}
        onSplitCells={() => {}}
        hasSelection={selectedCells.length > 0}
      />

      <div className="flex-1 border border-white/10 rounded overflow-hidden bg-[#1a1f25]">
        <VirtualizedSpreadsheet
          rowCount={rowCount}
          colCount={colCount}
          cellData={cellDataMap}
          selectedCells={selectedCellsSet}
          mergedCells={mergedCellsMap}
          onCellEdit={handleCellEdit}
          onCellClick={handleVirtualCellClick}
          onContextMenu={handleVirtualContextMenu}
        />
      </div>

      {showChartDialog && (
        <ChartGeneratorDialog
          open={showChartDialog}
          onOpenChange={setShowChartDialog}
          selectedRange={selectedRange}
          data={[]}
          onCreateChart={(chart) => {
            setCharts(prev => [...prev, { ...chart, id: crypto.randomUUID() }]);
            setShowChartDialog(false);
            toast.success('Chart created');
          }}
        />
      )}

      {showFormulaLibrary && (
        <FormulaLibraryPanel
          isOpen={showFormulaLibrary}
          onToggle={() => setShowFormulaLibrary(false)}
          onInsertFormula={(formula) => {
            if (selectedCell) {
              const [row, col] = selectedCell.split('-').map(Number);
              handleCellEdit(row, col, formula);
            }
            setShowFormulaLibrary(false);
          }}
        />
      )}
    </div>
  );
}
