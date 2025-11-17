import { useState } from "react";
import { Trash2, X, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmPopover } from "@/components/ui/ConfirmPopover";

interface LegalBulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onDelete: () => void;
  onStatusChange: (status: string) => void;
  onExport: () => void;
}

export function LegalBulkActionsBar({
  selectedCount,
  onClearSelection,
  onDelete,
  onStatusChange,
  onExport,
}: LegalBulkActionsBarProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border rounded-lg shadow-lg p-4 flex items-center gap-4 animate-in slide-in-from-bottom-5">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="h-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-6 w-px bg-border" />

      <div className="flex items-center gap-2">
        <Select onValueChange={onStatusChange}>
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="Change Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={onExport}>
          <FileDown className="h-4 w-4 mr-2" />
          Export
        </Button>

        <ConfirmPopover
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          onConfirm={onDelete}
          title="Delete Selected Requests?"
          description={`This will permanently delete ${selectedCount} request(s) and all their assets. This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          trigger={
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          }
        />
      </div>
    </div>
  );
}
