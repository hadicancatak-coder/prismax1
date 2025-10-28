import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ListPlus } from "lucide-react";
import { useCreateBulkOperationItems } from "@/hooks/useOperationLogs";

interface BulkItemsInputProps {
  auditLogId: string;
  defaultAssignee?: string;
}

export function BulkItemsInput({ auditLogId, defaultAssignee }: BulkItemsInputProps) {
  const [open, setOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const createBulk = useCreateBulkOperationItems();

  const handleSubmit = async () => {
    if (!bulkText.trim()) return;

    const lines = bulkText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const items = lines.map((content, index) => ({
      audit_log_id: auditLogId,
      content,
      assigned_to: defaultAssignee,
      order_index: index,
    }));

    await createBulk.mutateAsync(items);
    setBulkText("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ListPlus className="mr-2 h-4 w-4" />
          Bulk Add
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Add Items</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="bulk-items">
              Enter items (one per line)
            </Label>
            <Textarea
              id="bulk-items"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="Fix disapproved ads in SA campaign&#10;Update negative keywords list&#10;Budget allocation needs review&#10;..."
              rows={12}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {bulkText.split('\n').filter(l => l.trim()).length} items
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createBulk.isPending || !bulkText.trim()}>
              {createBulk.isPending ? "Adding..." : "Add Items"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
