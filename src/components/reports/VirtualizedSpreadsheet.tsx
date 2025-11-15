import React, { useRef, useCallback, memo, useState, useEffect } from 'react';
import { VariableSizeGrid as Grid } from 'react-window';
import type { AdvancedCellData } from '@/types/spreadsheet';
import { GridCell } from './GridCell';
import { ColumnHeader, RowHeader, CornerCell } from './SpreadsheetHeader';
import { useSpreadsheetSelection } from '@/hooks/useSpreadsheetSelection';
import { useSpreadsheetKeyboard } from '@/hooks/useSpreadsheetKeyboard';

interface VirtualizedSpreadsheetProps {
  rowCount: number;
  colCount: number;
  cellData: Map<string, AdvancedCellData>;
  onCellEdit: (row: number, col: number, value: string) => void;
}

export function VirtualizedSpreadsheet({
  rowCount,
  colCount,
  cellData,
  onCellEdit,
}: VirtualizedSpreadsheetProps) {
  const gridRef = useRef<Grid>(null);
  const colHeaderScrollRef = useRef<HTMLDivElement>(null);
  const rowHeaderScrollRef = useRef<HTMLDivElement>(null);
  
  const [columnWidths, setColumnWidths] = useState<Record<number, number>>({});
  const [rowHeights, setRowHeights] = useState<Record<number, number>>({});
  const [resizing, setResizing] = useState<{ type: 'col' | 'row', index: number, start: number, startSize: number } | null>(null);

  const {
    selectedCell,
    selectCell,
    selectColumn,
    selectRow,
    selectAll,
    startEditing,
    stopEditing,
    isCellSelected,
    isActiveCell,
    isEditing,
    selectedColumns,
    selectedRows,
  } = useSpreadsheetSelection();

  const ROW_HEADER_WIDTH = 40;
  const COL_HEADER_HEIGHT = 28;
  const DEFAULT_COL_WIDTH = 120;
  const DEFAULT_ROW_HEIGHT = 32;

  const getColumnWidth = useCallback((index: number) => {
    return columnWidths[index] || DEFAULT_COL_WIDTH;
  }, [columnWidths]);

  const getRowHeight = useCallback((index: number) => {
    return rowHeights[index] || DEFAULT_ROW_HEIGHT;
  }, [rowHeights]);

  const getCellKey = (row: number, col: number) => `${row}-${col}`;

  const handleCellClick = useCallback((row: number, col: number, e: React.MouseEvent) => {
    selectCell(row, col, e.shiftKey);
  }, [selectCell]);

  const handleCellDoubleClick = useCallback((row: number, col: number) => {
    startEditing(row, col);
  }, [startEditing]);

  const handleCellChange = useCallback((row: number, col: number, value: string) => {
    onCellEdit(row, col, value);
    stopEditing();
  }, [onCellEdit, stopEditing]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!selectedCell || isEditing(selectedCell.row, selectedCell.col)) return;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (selectedCell.row > 0) selectCell(selectedCell.row - 1, selectedCell.col);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (selectedCell.row < rowCount - 1) selectCell(selectedCell.row + 1, selectedCell.col);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (selectedCell.col > 0) selectCell(selectedCell.row, selectedCell.col - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (selectedCell.col < colCount - 1) selectCell(selectedCell.row, selectedCell.col + 1);
        break;
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          if (selectedCell.col > 0) selectCell(selectedCell.row, selectedCell.col - 1);
        } else {
          if (selectedCell.col < colCount - 1) selectCell(selectedCell.row, selectedCell.col + 1);
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (e.shiftKey) {
          if (selectedCell.row > 0) selectCell(selectedCell.row - 1, selectedCell.col);
        } else {
          if (selectedCell.row < rowCount - 1) selectCell(selectedCell.row + 1, selectedCell.col);
        }
        break;
      case 'F2':
        e.preventDefault();
        startEditing(selectedCell.row, selectedCell.col);
        break;
      case 'Escape':
        e.preventDefault();
        stopEditing();
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        onCellEdit(selectedCell.row, selectedCell.col, '');
        break;
      default:
        // Start editing on any alphanumeric key
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          startEditing(selectedCell.row, selectedCell.col);
        }
    }
  }, [selectedCell, selectCell, rowCount, colCount, startEditing, stopEditing, onCellEdit, isEditing]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleColumnResizeStart = useCallback((col: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setResizing({ type: 'col', index: col, start: e.clientX, startSize: getColumnWidth(col) });
  }, [getColumnWidth]);

  const handleRowResizeStart = useCallback((row: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setResizing({ type: 'row', index: row, start: e.clientY, startSize: getRowHeight(row) });
  }, [getRowHeight]);

  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (resizing.type === 'col') {
        const delta = e.clientX - resizing.start;
        const newWidth = Math.max(50, resizing.startSize + delta);
        setColumnWidths(prev => ({ ...prev, [resizing.index]: newWidth }));
        gridRef.current?.resetAfterColumnIndex(resizing.index);
      } else {
        const delta = e.clientY - resizing.start;
        const newHeight = Math.max(21, resizing.startSize + delta);
        setRowHeights(prev => ({ ...prev, [resizing.index]: newHeight }));
        gridRef.current?.resetAfterRowIndex(resizing.index);
      }
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing]);

  const handleScroll = useCallback(({ scrollLeft, scrollTop }: { scrollLeft: number; scrollTop: number }) => {
    if (colHeaderScrollRef.current) {
      colHeaderScrollRef.current.scrollLeft = scrollLeft;
    }
    if (rowHeaderScrollRef.current) {
      rowHeaderScrollRef.current.scrollTop = scrollTop;
    }
  }, []);

  const CellRenderer = useCallback(({ columnIndex, rowIndex, style }: any) => {
    const key = getCellKey(rowIndex, columnIndex);
    const cell = cellData.get(key);
    const selected = isCellSelected(rowIndex, columnIndex);
    const active = isActiveCell(rowIndex, columnIndex);
    const editing = isEditing(rowIndex, columnIndex);

    return (
      <div style={style}>
        <GridCell
          cell={cell}
          isSelected={selected}
          isActive={active}
          isEditing={editing}
          mergeInfo={undefined}
          onCellClick={() => handleCellClick(rowIndex, columnIndex, {} as any)}
          onCellDoubleClick={() => handleCellDoubleClick(rowIndex, columnIndex)}
          onContextMenu={(e) => e.preventDefault()}
          onCellEdit={(value) => handleCellChange(rowIndex, columnIndex, value)}
        />
      </div>
    );
  }, [cellData, isCellSelected, isActiveCell, isEditing, handleCellClick, handleCellDoubleClick, handleCellChange]);

  return (
    <div className="relative h-full w-full bg-background border border-border rounded-lg overflow-hidden">
      {/* Corner Cell */}
      <div
        className="absolute top-0 left-0 z-30 border-b border-r border-border"
        style={{ width: ROW_HEADER_WIDTH, height: COL_HEADER_HEIGHT }}
      >
        <CornerCell onClick={selectAll} />
      </div>

      {/* Column Headers */}
      <div
        ref={colHeaderScrollRef}
        className="absolute top-0 z-20 overflow-hidden"
        style={{ left: ROW_HEADER_WIDTH, right: 0, height: COL_HEADER_HEIGHT }}
      >
        <div className="flex">
          {Array.from({ length: colCount }, (_, i) => (
            <ColumnHeader
              key={i}
              column={i}
              width={getColumnWidth(i)}
              isSelected={selectedColumns.has(i)}
              onClick={() => selectColumn(i)}
              onResizeStart={(e) => handleColumnResizeStart(i, e)}
            />
          ))}
        </div>
      </div>

      {/* Row Headers */}
      <div
        ref={rowHeaderScrollRef}
        className="absolute left-0 z-20 overflow-hidden"
        style={{ top: COL_HEADER_HEIGHT, bottom: 0, width: ROW_HEADER_WIDTH }}
      >
        <div>
          {Array.from({ length: rowCount }, (_, i) => (
            <RowHeader
              key={i}
              row={i}
              height={getRowHeight(i)}
              isSelected={selectedRows.has(i)}
              onClick={() => selectRow(i)}
              onResizeStart={(e) => handleRowResizeStart(i, e)}
            />
          ))}
        </div>
      </div>

      {/* Data Grid */}
      <div
        className="absolute z-10"
        style={{ top: COL_HEADER_HEIGHT, left: ROW_HEADER_WIDTH, right: 0, bottom: 0 }}
      >
        <Grid
          ref={gridRef}
          columnCount={colCount}
          columnWidth={getColumnWidth}
          height={600 - COL_HEADER_HEIGHT}
          rowCount={rowCount}
          rowHeight={getRowHeight}
          width={1200 - ROW_HEADER_WIDTH}
          overscanColumnCount={3}
          overscanRowCount={5}
          onScroll={handleScroll}
        >
          {CellRenderer}
        </Grid>
      </div>
    </div>
  );
}
