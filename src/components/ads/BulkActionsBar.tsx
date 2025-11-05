import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Download, Copy, Trash2 } from 'lucide-react';
import { ConfirmPopover } from '@/components/ui/ConfirmPopover';

interface BulkActionsBarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onChangeStatus?: (status: string) => void;
  onExport?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

export function BulkActionsBar({
  selectedIds,
  onClearSelection,
  onChangeStatus,
  onExport,
  onDuplicate,
  onDelete,
}: BulkActionsBarProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  if (selectedIds.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{selectedIds.length} selected</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClearSelection}
            className="text-primary-foreground hover:text-primary-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="h-6 w-px bg-primary-foreground/20" />

        <div className="flex items-center gap-2">
          {onChangeStatus && (
            <Select onValueChange={onChangeStatus}>
              <SelectTrigger className="w-40 h-8 bg-primary-foreground text-primary">
                <SelectValue placeholder="Change status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="limited">Limited</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          )}

          {onExport && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onExport}
            >
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          )}

          {onDuplicate && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onDuplicate}
            >
              <Copy className="w-4 h-4 mr-1" />
              Duplicate
            </Button>
          )}

          {onDelete && (
            <ConfirmPopover
              open={confirmDelete}
              onOpenChange={setConfirmDelete}
              onConfirm={() => {
                onDelete();
                setConfirmDelete(false);
              }}
              title={`Delete ${selectedIds.length} items?`}
              description="This action cannot be undone."
              trigger={
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
