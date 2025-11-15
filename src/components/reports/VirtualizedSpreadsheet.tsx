import React, { useRef, useCallback, memo, useState } from 'react';
import { VariableSizeGrid as Grid, GridChildComponentProps } from 'react-window';
import type { AdvancedCellData, CellStyle } from '@/types/spreadsheet';

interface CellProps {
  rowIndex: number;
  columnIndex: number;
  cellData: AdvancedCellData | undefined;
  isSelected: boolean;
  isMerged: boolean;
  onEdit: (row: number, col: number, value: string) => void;
  onClick: (row: number, col: number, e: React.MouseEvent) => void;
  onContextMenu: (row: number, col: number, e: React.MouseEvent) => void;
}

const Cell = memo(({ 
  rowIndex, 
  columnIndex, 
  cellData, 
  isSelected, 
  isMerged,
  onEdit,
  onClick,
  onContextMenu
}: CellProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState('');

  const displayValue = cellData?.formula 
    ? (cellData.calculatedValue?.toString() || cellData.value?.toString() || '')
    : (cellData?.value?.toString() || '');

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditValue(cellData?.formula || cellData?.value?.toString() || '');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleBlur = () => {
    if (isEditing) {
      onEdit(rowIndex, columnIndex, editValue);
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onEdit(rowIndex, columnIndex, editValue);
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue('');
    }
  };

  const style: React.CSSProperties = {
    border: '1px solid hsl(var(--border))',
    padding: '4px 8px',
    backgroundColor: isSelected 
      ? 'hsl(var(--accent))' 
      : cellData?.style?.backgroundColor || 'hsl(var(--background))',
    color: cellData?.style?.textColor || 'hsl(var(--foreground))',
    fontWeight: cellData?.style?.bold ? 'bold' : 'normal',
    fontStyle: cellData?.style?.italic ? 'italic' : 'normal',
    textDecoration: cellData?.style?.underline ? 'underline' : 'none',
    textAlign: cellData?.style?.textAlign || 'left',
    fontSize: cellData?.style?.fontSize || 14,
    cursor: 'cell',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    opacity: isMerged ? 0 : 1,
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={{
          ...style,
          width: '100%',
          height: '100%',
          border: '2px solid hsl(var(--primary))',
          outline: 'none',
        }}
      />
    );
  }

  return (
    <div
      style={style}
      onClick={(e) => onClick(rowIndex, columnIndex, e)}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e) => onContextMenu(rowIndex, columnIndex, e)}
      title={displayValue}
    >
      {displayValue}
    </div>
  );
});

Cell.displayName = 'Cell';

interface VirtualizedSpreadsheetProps {
  rowCount: number;
  colCount: number;
  cellData: Map<string, AdvancedCellData>;
  selectedCells: Set<string>;
  mergedCells: Map<string, boolean>;
  onCellEdit: (row: number, col: number, value: string) => void;
  onCellClick: (row: number, col: number, e: React.MouseEvent) => void;
  onContextMenu: (row: number, col: number, e: React.MouseEvent) => void;
}

export function VirtualizedSpreadsheet({
  rowCount,
  colCount,
  cellData,
  selectedCells,
  mergedCells,
  onCellEdit,
  onCellClick,
  onContextMenu,
}: VirtualizedSpreadsheetProps) {
  const gridRef = useRef<Grid>(null);

  const getCellKey = (row: number, col: number) => `${row}-${col}`;

  const CellRenderer = useCallback(({ columnIndex, rowIndex, style }: GridChildComponentProps) => {
    const key = getCellKey(rowIndex, columnIndex);
    const cell = cellData.get(key);
    const isSelected = selectedCells.has(key);
    const isMerged = mergedCells.get(key) || false;

    return (
      <div style={style}>
        <Cell
          rowIndex={rowIndex}
          columnIndex={columnIndex}
          cellData={cell}
          isSelected={isSelected}
          isMerged={isMerged}
          onEdit={onCellEdit}
          onClick={onCellClick}
          onContextMenu={onContextMenu}
        />
      </div>
    );
  }, [cellData, selectedCells, mergedCells, onCellEdit, onCellClick, onContextMenu]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Grid
        ref={gridRef}
        columnCount={colCount}
        columnWidth={() => 120}
        height={600}
        rowCount={rowCount}
        rowHeight={() => 32}
        width={1200}
        overscanColumnCount={3}
        overscanRowCount={5}
      >
        {CellRenderer}
      </Grid>
    </div>
  );
}
