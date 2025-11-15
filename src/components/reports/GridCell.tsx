import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { AdvancedCellData, MergedCell } from '@/types/spreadsheet';
import { toast } from 'sonner';

interface GridCellProps {
  cell: AdvancedCellData | undefined;
  isSelected: boolean;
  mergeInfo: MergedCell | undefined;
  onCellClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onCellEdit: (value: string) => void;
}

export const GridCell = memo(function GridCell({
  cell,
  isSelected,
  mergeInfo,
  onCellClick,
  onContextMenu,
  onCellEdit,
}: GridCellProps) {
  const displayValue = cell?.calculatedValue !== undefined
    ? cell.calculatedValue
    : cell?.value || '';

  const style = cell?.style;

  return (
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
        gridColumn: mergeInfo ? `span ${mergeInfo.colSpan}` : undefined,
        gridRow: mergeInfo ? `span ${mergeInfo.rowSpan}` : undefined,
      }}
      onClick={onCellClick}
      onContextMenu={onContextMenu}
      onDragOver={(e) => {
        e.preventDefault();
        e.currentTarget.classList.add('ring-2', 'ring-primary');
      }}
      onDragLeave={(e) => {
        e.currentTarget.classList.remove('ring-2', 'ring-primary');
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('ring-2', 'ring-primary');
        const formula = e.dataTransfer.getData('formula');
        if (formula) {
          onCellEdit(formula);
          toast.success('Formula inserted!');
        }
      }}
    >
      {displayValue}
    </div>
  );
});
