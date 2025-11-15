import React, { useRef, useCallback, useState, useEffect } from 'react';
import { VariableSizeGrid } from 'react-window';
import type { AdvancedCellData } from '@/types/spreadsheet';
import { GridCell } from './GridCell';
import { ColumnHeader, RowHeader, CornerCell } from './SpreadsheetHeader';
import { useSpreadsheetSelection } from '@/hooks/useSpreadsheetSelection';

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
  const gridRef = useRef<VariableSizeGrid>(null);
  const colHeaderScrollRef = useRef<HTMLDivElement>(null);
  const rowHeaderScrollRef = useRef<HTMLDivElement>(null);
  
  const [columnWidths, setColumnWidths] = useState<Record<number, number>>(() => 
    Array.from({ length: colCount }, (_, i) => 100).reduce((acc, width, i) => ({ ...acc, [i]: width }), {})
  );
  const [rowHeights, setRowHeights] = useState<Record<number, number>>(() =>
    Array.from({ length: rowCount }, (_, i) => 32).reduce((acc, height, i) => ({ ...acc, [i]: height }), {})
  );
  
  const {
    selectedCell,
    editingCell,
    selectedColumns,
    selectedRows,
    selectCell,
    selectColumn,
    selectRow,
    selectAll,
    startEditing,
    stopEditing,
    isCellSelected,
    isActiveCell,
    isEditing,
  } = useSpreadsheetSelection();

  const [resizing, setResizing] = useState<{ type: 'column' | 'row'; index: number; start: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ row: number; col: number } | null>(null);

  const DEFAULT_COL_WIDTH = 100;
  const DEFAULT_ROW_HEIGHT = 32;

  const getColumnWidth = useCallback((index: number) => {
    return columnWidths[index] || DEFAULT_COL_WIDTH;
  }, [columnWidths]);

  const getRowHeight = useCallback((index: number) => {
    return rowHeights[index] || DEFAULT_ROW_HEIGHT;
  }, [rowHeights]);

  const getCellKey = (row: number, col: number) => `${row}-${col}`;

  const handleCellClick = (row: number, col: number, event: React.MouseEvent) => {
    selectCell(row, col, event.shiftKey);
  };

  const handleCellDoubleClick = (row: number, col: number) => {
    startEditing(row, col);
  };

  const handleCellMouseDown = (row: number, col: number, event: React.MouseEvent) => {
    if (event.button !== 0) return;
    setIsDragging(true);
    setDragStart({ row, col });
    selectCell(row, col, false);
  };

  const handleCellMouseEnter = (row: number, col: number) => {
    if (isDragging && dragStart) {
      selectCell(row, col, true);
    }
  };

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
  }, []);

  const handleCellEdit = (row: number, col: number, value: string) => {
    onCellEdit(row, col, value);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!selectedCell) return;
    
    const { row, col } = selectedCell;
    const editing = editingCell && editingCell.row === row && editingCell.col === col;
    
    if (editing) return;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (row > 0) selectCell(row - 1, col, e.shiftKey);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (row < rowCount - 1) selectCell(row + 1, col, e.shiftKey);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (col > 0) selectCell(row, col - 1, e.shiftKey);
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (col < colCount - 1) selectCell(row, col + 1, e.shiftKey);
        break;
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          if (col > 0) selectCell(row, col - 1, false);
        } else {
          if (col < colCount - 1) selectCell(row, col + 1, false);
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (!editing) {
          startEditing(row, col);
        }
        break;
      case 'F2':
        e.preventDefault();
        startEditing(row, col);
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        if (!editing) {
          onCellEdit(row, col, '');
        }
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          startEditing(row, col);
        }
        break;
    }
  }, [selectedCell, editingCell, rowCount, colCount, selectCell, startEditing, onCellEdit]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleKeyDown, handleMouseUp]);

  const handleColumnResize = useCallback((col: number, startX: number) => {
    setResizing({ type: 'column', index: col, start: startX });
  }, []);

  const handleRowResize = useCallback((row: number, startY: number) => {
    setResizing({ type: 'row', index: row, start: startY });
  }, []);

  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (resizing.type === 'column') {
        const delta = e.clientX - resizing.start;
        const currentWidth = columnWidths[resizing.index] || DEFAULT_COL_WIDTH;
        const newWidth = Math.max(50, currentWidth + delta);
        setColumnWidths(prev => ({ ...prev, [resizing.index]: newWidth }));
        setResizing({ ...resizing, start: e.clientX });
        gridRef.current?.resetAfterColumnIndex(resizing.index);
      } else {
        const delta = e.clientY - resizing.start;
        const currentHeight = rowHeights[resizing.index] || DEFAULT_ROW_HEIGHT;
        const newHeight = Math.max(24, currentHeight + delta);
        setRowHeights(prev => ({ ...prev, [resizing.index]: newHeight }));
        setResizing({ ...resizing, start: e.clientY });
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
  }, [resizing, columnWidths, rowHeights]);

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

    return (
      <div style={style}>
        <GridCell
          row={rowIndex}
          col={columnIndex}
          value={cell?.value}
          calculated={cell?.calculatedValue}
          formula={cell?.formula}
          style={cell?.style}
          isSelected={isCellSelected(rowIndex, columnIndex)}
          isActive={isActiveCell(rowIndex, columnIndex)}
          isEditing={isEditing(rowIndex, columnIndex)}
          onClick={(e) => handleCellClick(rowIndex, columnIndex, e)}
          onDoubleClick={() => handleCellDoubleClick(rowIndex, columnIndex)}
          onMouseDown={(e) => handleCellMouseDown(rowIndex, columnIndex, e)}
          onMouseEnter={() => handleCellMouseEnter(rowIndex, columnIndex)}
          onEdit={(value) => handleCellEdit(rowIndex, columnIndex, value)}
          onStopEditing={stopEditing}
        />
      </div>
    );
  }, [cellData, isCellSelected, isActiveCell, isEditing, handleCellEdit, stopEditing]);

  return (
    <div className="relative h-full w-full bg-card overflow-hidden">
      <div className="absolute top-0 left-0 w-[40px] h-[32px] z-30">
        <CornerCell onClick={selectAll} />
      </div>

      <div 
        ref={colHeaderScrollRef}
        className="absolute top-0 left-[40px] right-0 h-[32px] overflow-hidden z-20"
      >
        <div className="flex" style={{ width: 'max-content' }}>
          {Array.from({ length: colCount }).map((_, i) => (
            <ColumnHeader
              key={i}
              column={i}
              width={getColumnWidth(i)}
              isSelected={selectedColumns.has(i)}
              onClick={() => selectColumn(i)}
              onResizeStart={(e) => {
                e.stopPropagation();
                handleColumnResize(i, e.clientX);
              }}
            />
          ))}
        </div>
      </div>

      <div 
        ref={rowHeaderScrollRef}
        className="absolute top-[32px] left-0 bottom-0 w-[40px] overflow-hidden z-20"
      >
        <div>
          {Array.from({ length: rowCount }).map((_, i) => (
            <RowHeader
              key={i}
              row={i}
              height={getRowHeight(i)}
              isSelected={selectedRows.has(i)}
              onClick={() => selectRow(i)}
              onResizeStart={(e) => {
                e.stopPropagation();
                handleRowResize(i, e.clientY);
              }}
            />
          ))}
        </div>
      </div>

      <div className="absolute top-[32px] left-[40px] right-0 bottom-0 overflow-hidden">
        <VariableSizeGrid
          ref={gridRef}
          columnCount={colCount}
          rowCount={rowCount}
          columnWidth={(index) => getColumnWidth(index)}
          rowHeight={(index) => getRowHeight(index)}
          width={typeof window !== 'undefined' ? window.innerWidth - 100 : 1200}
          height={typeof window !== 'undefined' ? window.innerHeight - 250 : 700}
          onScroll={handleScroll}
        >
          {CellRenderer}
        </VariableSizeGrid>
      </div>
    </div>
  );
}
