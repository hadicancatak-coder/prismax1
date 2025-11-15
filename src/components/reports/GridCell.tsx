import { memo, useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { AdvancedCellData, MergedCell } from '@/types/spreadsheet';
import { Input } from '@/components/ui/input';

interface GridCellProps {
  cell: AdvancedCellData | undefined;
  isSelected: boolean;
  isActive: boolean;
  isEditing: boolean;
  mergeInfo: MergedCell | undefined;
  onCellClick: () => void;
  onCellDoubleClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onCellEdit: (value: string) => void;
}

export const GridCell = memo(function GridCell({
  cell,
  isSelected,
  isActive,
  isEditing,
  mergeInfo,
  onCellClick,
  onCellDoubleClick,
  onContextMenu,
  onCellEdit,
}: GridCellProps) {
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const displayValue = cell?.calculatedValue !== undefined
    ? cell.calculatedValue
    : cell?.value || '';

  const style = cell?.style;

  useEffect(() => {
    if (isEditing) {
      setEditValue(cell?.formula || cell?.value?.toString() || '');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isEditing, cell]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onCellEdit(editValue);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCellEdit(cell?.formula || cell?.value?.toString() || '');
    }
  };

  const handleBlur = () => {
    onCellEdit(editValue);
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

  return (
    <div
      className={cn(
        "h-full w-full px-2 py-1 cursor-cell border-r border-b border-border bg-card text-foreground text-sm select-none overflow-hidden",
        isSelected && "bg-primary/10",
        isActive && "ring-2 ring-primary ring-inset"
      )}
      style={{
        backgroundColor: isSelected ? undefined : (style?.backgroundColor || 'hsl(var(--card))'),
        color: style?.textColor,
        textAlign: style?.textAlign || 'left',
        fontWeight: style?.bold ? 'bold' : 'normal',
        fontStyle: style?.italic ? 'italic' : 'normal',
        textDecoration: style?.underline ? 'underline' : 'none',
        borderTop: style?.borderTop ? `1px solid ${style?.borderColor || 'hsl(var(--border))'}` : undefined,
        gridColumn: mergeInfo ? `span ${mergeInfo.colSpan}` : undefined,
        gridRow: mergeInfo ? `span ${mergeInfo.rowSpan}` : undefined,
      }}
      onClick={onCellClick}
      onDoubleClick={onCellDoubleClick}
      onContextMenu={onContextMenu}
    >
      <div className="truncate">{displayValue}</div>
    </div>
  );
});
