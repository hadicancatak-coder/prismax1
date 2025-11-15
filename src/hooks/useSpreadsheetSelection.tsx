import { useState, useCallback } from 'react';

export interface CellPosition {
  row: number;
  col: number;
}

export interface SelectionRange {
  start: CellPosition;
  end: CellPosition;
}

export function useSpreadsheetSelection() {
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
  const [selectionRange, setSelectionRange] = useState<SelectionRange | null>(null);
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<Set<number>>(new Set());
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [allSelected, setAllSelected] = useState(false);

  const selectCell = useCallback((row: number, col: number, isShiftKey: boolean = false) => {
    if (isShiftKey && selectedCell) {
      setSelectionRange({
        start: selectedCell,
        end: { row, col },
      });
    } else {
      setSelectedCell({ row, col });
      setSelectionRange(null);
      setSelectedColumns(new Set());
      setSelectedRows(new Set());
      setAllSelected(false);
    }
  }, [selectedCell]);

  const selectColumn = useCallback((col: number) => {
    setSelectedColumns(new Set([col]));
    setSelectedRows(new Set());
    setSelectedCell(null);
    setSelectionRange(null);
    setAllSelected(false);
  }, []);

  const selectRow = useCallback((row: number) => {
    setSelectedRows(new Set([row]));
    setSelectedColumns(new Set());
    setSelectedCell(null);
    setSelectionRange(null);
    setAllSelected(false);
  }, []);

  const selectAll = useCallback(() => {
    setAllSelected(true);
    setSelectedCell(null);
    setSelectionRange(null);
    setSelectedColumns(new Set());
    setSelectedRows(new Set());
  }, []);

  const startEditing = useCallback((row: number, col: number) => {
    setEditingCell({ row, col });
  }, []);

  const stopEditing = useCallback(() => {
    setEditingCell(null);
  }, []);

  const isCellSelected = useCallback((row: number, col: number): boolean => {
    if (allSelected) return true;
    if (selectedColumns.has(col)) return true;
    if (selectedRows.has(row)) return true;
    if (selectedCell?.row === row && selectedCell?.col === col) return true;
    
    if (selectionRange) {
      const minRow = Math.min(selectionRange.start.row, selectionRange.end.row);
      const maxRow = Math.max(selectionRange.start.row, selectionRange.end.row);
      const minCol = Math.min(selectionRange.start.col, selectionRange.end.col);
      const maxCol = Math.max(selectionRange.start.col, selectionRange.end.col);
      
      return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
    }
    
    return false;
  }, [selectedCell, selectionRange, selectedColumns, selectedRows, allSelected]);

  const isActiveCell = useCallback((row: number, col: number): boolean => {
    return selectedCell?.row === row && selectedCell?.col === col;
  }, [selectedCell]);

  const isEditing = useCallback((row: number, col: number): boolean => {
    return editingCell?.row === row && editingCell?.col === col;
  }, [editingCell]);

  return {
    selectedCell,
    selectionRange,
    editingCell,
    selectedColumns,
    selectedRows,
    allSelected,
    selectCell,
    selectColumn,
    selectRow,
    selectAll,
    startEditing,
    stopEditing,
    isCellSelected,
    isActiveCell,
    isEditing,
  };
}
