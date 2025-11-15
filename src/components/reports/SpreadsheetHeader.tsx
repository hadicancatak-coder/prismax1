import { memo } from 'react';
import { cn } from '@/lib/utils';

interface ColumnHeaderProps {
  column: number;
  width: number;
  isSelected: boolean;
  onClick: () => void;
  onResizeStart: (e: React.MouseEvent) => void;
}

export const ColumnHeader = memo(function ColumnHeader({
  column,
  width,
  isSelected,
  onClick,
  onResizeStart,
}: ColumnHeaderProps) {
  const columnLetter = String.fromCharCode(65 + (column % 26));
  
  return (
    <div
      className={cn(
        "relative h-full flex items-center justify-center border-r border-b border-border bg-muted text-muted-foreground text-xs font-medium cursor-pointer hover:bg-muted/80 select-none",
        isSelected && "bg-primary/20 border-primary"
      )}
      style={{ width }}
      onClick={onClick}
    >
      {columnLetter}
      <div
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50"
        onMouseDown={onResizeStart}
      />
    </div>
  );
});

interface RowHeaderProps {
  row: number;
  height: number;
  isSelected: boolean;
  onClick: () => void;
  onResizeStart: (e: React.MouseEvent) => void;
}

export const RowHeader = memo(function RowHeader({
  row,
  height,
  isSelected,
  onClick,
  onResizeStart,
}: RowHeaderProps) {
  return (
    <div
      className={cn(
        "relative w-full flex items-center justify-center border-r border-b border-border bg-muted text-muted-foreground text-xs font-medium cursor-pointer hover:bg-muted/80 select-none",
        isSelected && "bg-primary/20 border-primary"
      )}
      style={{ height }}
      onClick={onClick}
    >
      {row + 1}
      <div
        className="absolute bottom-0 left-0 right-0 h-1 cursor-row-resize hover:bg-primary/50"
        onMouseDown={onResizeStart}
      />
    </div>
  );
});

interface CornerCellProps {
  onClick: () => void;
}

export const CornerCell = memo(function CornerCell({ onClick }: CornerCellProps) {
  return (
    <div
      className="w-full h-full flex items-center justify-center border-r border-b border-border bg-muted cursor-pointer hover:bg-muted/80"
      onClick={onClick}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" className="text-muted-foreground">
        <path
          d="M0 0h12v12H0z"
          fill="none"
        />
        <path
          d="M0 4h12M4 0v12"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
});
