import { X, Trash2, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface CopywriterBulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onExport?: () => void;
  onDelete?: () => void;
  onStatusChange?: (status: string) => void;
  onSyncToPlanner?: () => void;
  className?: string;
}

export function CopywriterBulkActionsBar({
  selectedCount,
  onClearSelection,
  onExport,
  onDelete,
  onStatusChange,
  onSyncToPlanner,
  className = "",
}: CopywriterBulkActionsBarProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (selectedCount === 0) return null;

  const handleDelete = () => {
    onDelete?.();
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 ${className}`}>
        <div className="bg-card border border-border rounded-lg shadow-lg px-4 py-3 flex items-center gap-3">
          <Badge variant="secondary" className="px-3 py-1">
            {selectedCount} selected
          </Badge>

          <div className="h-6 w-px bg-border" />

          <Button
            size="sm"
            variant="ghost"
            onClick={onClearSelection}
            className="h-8"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>

          {onStatusChange && (
            <Select onValueChange={onStatusChange}>
              <SelectTrigger className="h-8 w-[140px]">
                <SelectValue placeholder="Change Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          )}

          {onSyncToPlanner && (
            <Button
              size="sm"
              variant="outline"
              onClick={onSyncToPlanner}
              className="h-8"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Sync to Planner
            </Button>
          )}

          {onExport && (
            <Button
              size="sm"
              variant="outline"
              onClick={onExport}
              className="h-8"
            >
              <Download className="h-4 w-4 mr-1" />
              Export CSV
            </Button>
          )}

          {onDelete && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              className="h-8"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} copies?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected copies.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
