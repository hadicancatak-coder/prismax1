import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ReportDialog({ open, onOpenChange, onSuccess }: ReportDialogProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [updateFrequency, setUpdateFrequency] = useState("monthly");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !link.trim()) {
      toast({ title: "Error", description: "Title and link are required", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("reports").insert({
      title: title.trim(),
      link: link.trim(),
      update_frequency: updateFrequency,
      type: "sheet",
      created_by: user?.id
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Report created successfully" });
    resetForm();
    onOpenChange(false);
    onSuccess?.();
  };

  const resetForm = () => {
    setTitle("");
    setLink("");
    setUpdateFrequency("monthly");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Report</DialogTitle>
          <DialogDescription>Add a new report link</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Report title"
            />
          </div>

          <div>
            <Label htmlFor="link">Link *</Label>
            <Input
              id="link"
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div>
            <Label htmlFor="frequency">Update Frequency</Label>
            <Select value={updateFrequency} onValueChange={setUpdateFrequency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Report</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
