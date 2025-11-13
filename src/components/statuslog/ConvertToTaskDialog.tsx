import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConvertToTask } from "@/hooks/useStatusLogs";
import { StatusLog } from "@/lib/statusLogService";
import { EnhancedMultiSelect } from "@/components/utm/EnhancedMultiSelect";
import { useSystemEntities } from "@/hooks/useSystemEntities";
import { AssigneeMultiSelect } from "@/components/AssigneeMultiSelect";
import { supabase } from "@/integrations/supabase/client";

interface ConvertToTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statusLog: StatusLog | null;
}

export function ConvertToTaskDialog({ open, onOpenChange, statusLog }: ConvertToTaskDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High" | "Urgent">("Medium");
  const [status, setStatus] = useState<"Pending" | "In Progress" | "Completed">("Pending");
  const [dueDate, setDueDate] = useState<Date>();
  const [assignees, setAssignees] = useState<string[]>([]);
  const [entity, setEntity] = useState<string[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const { data: entities = [] } = useSystemEntities();
  const convertMutation = useConvertToTask();

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase.from("profiles").select("user_id, name, username");
      setUsers(data || []);
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (statusLog && open) {
      setTitle(statusLog.title);
      setDescription(statusLog.description || "");
      setEntity(statusLog.entity || []);
    }
  }, [statusLog, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!statusLog) return;

    const taskData = {
      title,
      description,
      priority,
      status,
      due_at: dueDate?.toISOString(),
      entity: entity.length > 0 ? entity : undefined,
      task_type: 'task' as const,
    };

    convertMutation.mutate(
      { logId: statusLog.id, taskData },
      {
        onSuccess: ({ task }) => {
          // Assign users to the task
          if (assignees.length > 0) {
            // Handle task assignees via task_assignees table
            // This will be handled by the backend or another mutation
          }
          onOpenChange(false);
          resetForm();
        },
      }
    );
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("Medium");
    setStatus("Pending");
    setDueDate(undefined);
    setAssignees([]);
    setEntity([]);
  };

  if (!statusLog) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convert Status Log to Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Task Title *</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task description (pre-filled from log)"
              rows={6}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Assignees</Label>
            <AssigneeMultiSelect
              users={users}
              selectedUserIds={assignees}
              onSelectionChange={setAssignees}
            />
          </div>

          <div className="space-y-2">
            <Label>Entity</Label>
            <EnhancedMultiSelect
              options={entities.map(e => ({ value: e.name, label: e.name }))}
              selected={entity}
              onChange={setEntity}
              placeholder="Select entities"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={convertMutation.isPending}>
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
