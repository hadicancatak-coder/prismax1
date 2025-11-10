import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Copy, Move, Trash2, Edit } from "lucide-react";
import { TreeNode } from "@/hooks/useAccountStructure";

interface AdContextMenuProps {
  node: TreeNode;
  children: React.ReactNode;
  onMove?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

export function AdContextMenu({
  node,
  children,
  onMove,
  onDuplicate,
  onDelete,
  onEdit,
}: AdContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {onEdit && (
          <>
            <ContextMenuItem onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        
        {node.type === 'ad' && (
          <>
            <ContextMenuItem onClick={onMove}>
              <Move className="mr-2 h-4 w-4" />
              Move to...
            </ContextMenuItem>
            <ContextMenuItem onClick={onDuplicate}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate to...
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        
        {onDelete && (
          <ContextMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
