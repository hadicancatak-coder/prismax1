import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { GripVertical, Trash2, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportElementWrapperProps {
  elementId: string;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  children: React.ReactNode;
}

export function ReportElementWrapper({
  elementId,
  isActive,
  onSelect,
  onDelete,
  onDuplicate,
  children,
}: ReportElementWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: elementId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={cn(
        "relative group mb-4 rounded-lg transition-all",
        isActive && "ring-2 ring-primary",
        isDragging && "opacity-50 z-50"
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          "absolute -left-8 top-4 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity",
          isDragging && "cursor-grabbing"
        )}
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Toolbar */}
      <div className={cn(
        "absolute -top-10 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
        isActive && "opacity-100"
      )}>
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
        >
          <Copy className="h-3 w-3 mr-1" />
          Duplicate
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Delete
        </Button>
      </div>

      {/* Content */}
      <div className="bg-card border rounded-lg p-4">
        {children}
      </div>
    </div>
  );
}
