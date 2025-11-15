import { memo, useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { CellStyle } from '@/types/spreadsheet';
import { Input } from '@/components/ui/input';

interface GridCellProps {
  row: number;
  col: number;
  value?: string | number;
  calculated?: string | number;
  formula?: string;
  style?: CellStyle;
  isSelected?: boolean;
  isActive?: boolean;
  isEditing?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: () => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onMouseEnter?: () => void;
  onEdit?: (value: string) => void;
  onStopEditing?: () => void;
  mergeInfo?: { colSpan: number; rowSpan: number };
}

export const GridCell = memo(function GridCell({
  row,
  col,
  value,
  calculated,
  formula,
  style,
  isSelected = false,
  isActive = false,
  isEditing = false,
  onClick,
  onDoubleClick,
  onMouseDown,
  onMouseEnter,
  onEdit,
  onStopEditing,
  mergeInfo,
}: GridCellProps) {
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const displayValue = calculated !== undefined ? calculated : (value || '');

  useEffect(() => {
    if (isEditing) {
      setEditValue(formula || value?.toString() || '');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isEditing, formula, value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onEdit?.(editValue);
      onStopEditing?.();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditValue(formula || value?.toString() || '');
      onStopEditing?.();
    }
  };

  const handleBlur = () => {
    onEdit?.(editValue);
    onStopEditing?.();
  };

  if (isEditing) {
    return (
      <div className="h-full w-full">
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="h-full w-full border-2 border-primary rounded-none px-2 py-1 text-sm bg-card"
        />
      </div>
    );
  }

  const cellStyle: React.CSSProperties = {
    backgroundColor: isSelected ? 'hsl(var(--primary) / 0.1)' : (style?.backgroundColor || 'hsl(var(--card))'),
    color: style?.textColor || 'hsl(var(--foreground))',
    textAlign: style?.textAlign || 'left',
    fontWeight: style?.bold ? 'bold' : 'normal',
    fontStyle: style?.italic ? 'italic' : 'normal',
    textDecoration: style?.underline ? 'underline' : 'none',
    borderTop: style?.borderTop ? `1px solid ${style?.borderColor || 'hsl(var(--border))'}` : undefined,
    gridColumn: mergeInfo ? `span ${mergeInfo.colSpan}` : undefined,
    gridRow: mergeInfo ? `span ${mergeInfo.rowSpan}` : undefined,
  };

  return (
    <div
      className={cn(
        "h-full w-full px-2 py-1 cursor-cell border-r border-b border-border text-sm select-none overflow-hidden flex items-center",
        isActive && "ring-2 ring-primary ring-inset"
      )}
      style={cellStyle}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
    >
      <div className="truncate">{displayValue}</div>
    </div>
  );
});
