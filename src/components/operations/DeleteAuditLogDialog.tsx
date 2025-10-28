import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useDeleteOperationLog } from "@/hooks/useOperationLogs";

interface DeleteAuditLogDialogProps {
  logId: string;
  logTitle: string;
  itemCount?: number;
  hasLinkedTask?: boolean;
  onSuccess?: () => void;
  variant?: "icon" | "button";
}

export function DeleteAuditLogDialog({
  logId,
  logTitle,
  itemCount = 0,
  hasLinkedTask = false,
  onSuccess,
  variant = "icon",
}: DeleteAuditLogDialogProps) {
  const [open, setOpen] = useState(false);
  const deleteLog = useDeleteOperationLog();

  const handleDelete = async () => {
    try {
      await deleteLog.mutateAsync(logId);
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {variant === "icon" ? (
          <Button variant="ghost" size="icon">
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Log
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Audit Log?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              This will permanently delete <strong>"{logTitle}"</strong>
              {itemCount > 0 && ` and all ${itemCount} action items`}.
            </p>
            {hasLinkedTask && (
              <p className="text-red-600 dark:text-red-500 font-semibold">
                ⚠️ The linked task will also be permanently deleted.
              </p>
            )}
            <p className="font-semibold">This action cannot be undone.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
