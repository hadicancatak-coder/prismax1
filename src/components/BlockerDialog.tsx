import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface BlockerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  onSuccess?: () => void;
}

export const BlockerDialog = ({ open, onOpenChange, taskId, onSuccess }: BlockerDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !description.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("blockers").insert([{
        task_id: taskId,
        description: description.trim(),
        created_by: user.id,
      }]);

      if (error) throw error;

      toast({
        title: "Blocker added",
        description: "The blocker has been added to the task.",
      });

      setDescription("");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add blocker",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Blocker</DialogTitle>
        </DialogHeader>
        <form className="space-y-4 py-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what's blocking this task..."
              className="min-h-[100px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !description.trim()}>
              {loading ? "Adding..." : "Add Blocker"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
