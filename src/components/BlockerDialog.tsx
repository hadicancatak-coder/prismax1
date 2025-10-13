import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface BlockerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId?: string;
  onSuccess?: () => void;
}

export const BlockerDialog = ({ open, onOpenChange, taskId, onSuccess }: BlockerDialogProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stuckReason, setStuckReason] = useState("");
  const [fixProcess, setFixProcess] = useState("");
  const [dueDate, setDueDate] = useState<Date>();
  const [timeline, setTimeline] = useState("");
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState(taskId || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchTasks();
      if (taskId) {
        setSelectedTaskId(taskId);
      }
    }
  }, [open, taskId]);

  const fetchTasks = async () => {
    const { data } = await supabase
      .from("tasks")
      .select("id, title")
      .order("created_at", { ascending: false });
    setTasks(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !selectedTaskId) {
      toast({ title: "Error", description: "Title and task are required", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error: blockerError } = await supabase.from("blockers").insert({
        task_id: selectedTaskId,
        title: title.trim(),
        description: description.trim(),
        stuck_reason: stuckReason.trim(),
        fix_process: fixProcess.trim(),
        due_date: dueDate?.toISOString(),
        timeline: timeline.trim(),
        created_by: user?.id,
        resolved: false
      });

      if (blockerError) throw blockerError;

      // Update task status to Blocked
      const { error: taskError } = await supabase
        .from("tasks")
        .update({ status: "Blocked" })
        .eq("id", selectedTaskId);

      if (taskError) throw taskError;

      toast({ title: "Success", description: "Blocker created successfully" });
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add blocker", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStuckReason("");
    setFixProcess("");
    setDueDate(undefined);
    setTimeline("");
    setSelectedTaskId(taskId || "");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Blocker</DialogTitle>
          <DialogDescription>Report what's blocking this task</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="task">Task *</Label>
            <Select value={selectedTaskId} onValueChange={setSelectedTaskId} disabled={!!taskId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a task" />
              </SelectTrigger>
              <SelectContent>
                {tasks.map(task => (
                  <SelectItem key={task.id} value={task.id}>{task.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief title of the blocker"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of the blocker"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="stuckReason">Why It's Stuck</Label>
            <Textarea
              id="stuckReason"
              value={stuckReason}
              onChange={(e) => setStuckReason(e.target.value)}
              placeholder="Explain why this task is blocked"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="fixProcess">Process to Fix</Label>
            <Textarea
              id="fixProcess"
              value={fixProcess}
              onChange={(e) => setFixProcess(e.target.value)}
              placeholder="Steps needed to resolve this blocker"
              rows={2}
            />
          </div>

          <div>
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus className="pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="timeline">Timeline</Label>
            <Input
              id="timeline"
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              placeholder="e.g., 2-3 days, 1 week"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Blocker"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
