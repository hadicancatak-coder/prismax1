import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

interface DeleteAdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ad: any;
  onSuccess: () => void;
}

export function DeleteAdDialog({ open, onOpenChange, ad, onSuccess }: DeleteAdDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('ads')
        .delete()
        .eq('id', ad.id);

      if (error) throw error;

      toast.success(`"${ad.name}" deleted successfully`);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete ad");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Delete Ad
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{ad?.name}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete Ad"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
