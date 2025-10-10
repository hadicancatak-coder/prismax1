import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateTaskDialog = ({ open, onOpenChange }: CreateTaskDialogProps) => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [status, setStatus] = useState<"Pending Approval" | "In Progress" | "Blocked" | "Completed" | "Archived">("In Progress");
  const [jiraLink, setJiraLink] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>("unassigned");
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (open && userRole === "admin") {
      fetchUsers();
    }
  }, [open, userRole]);

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("user_id, name");
    setUsers(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Client-side validation
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Task title is required",
        variant: "destructive",
      });
      return;
    }

    if (title.trim().length > 200) {
      toast({
        title: "Error",
        description: "Task title must not exceed 200 characters",
        variant: "destructive",
      });
      return;
    }

    if (description && description.length > 5000) {
      toast({
        title: "Error",
        description: "Task description must not exceed 5000 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const taskData = {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status: (userRole === "member" ? "Pending Approval" : status) as "Pending Approval" | "In Progress" | "Blocked" | "Completed" | "Archived",
        due_at: date?.toISOString(),
        jira_link: jiraLink.trim() || null,
        created_by: user.id,
        assignee_id: userRole === "admin" ? (assigneeId === "unassigned" ? null : assigneeId) : user.id,
        visibility: "global" as "global" | "pool" | "private",
      };

      const { error } = await supabase.from("tasks").insert([taskData]);

      if (error) throw error;

      toast({
        title: userRole === "member" ? "Task submitted for approval" : "Task created",
        description: userRole === "member" 
          ? "Your task has been submitted and is awaiting admin approval." 
          : "Task has been successfully created.",
      });

      setTitle("");
      setDescription("");
      setPriority("Medium");
      setStatus("In Progress");
      setJiraLink("");
      setAssigneeId("unassigned");
      setDate(undefined);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create task",
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
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <form className="space-y-4 py-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input 
              id="title" 
              placeholder="Enter task title" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter task description"
              className="min-h-[100px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(val) => setPriority(val as "High" | "Medium" | "Low")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {userRole === "admin" && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(val) => setStatus(val as typeof status)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Blocked">Blocked</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jiraLink">Jira Link (optional)</Label>
            <Input
              id="jiraLink"
              type="url"
              placeholder="https://jira.company.com/browse/TASK-123"
              value={jiraLink}
              onChange={(e) => setJiraLink(e.target.value)}
            />
          </div>

          {userRole === "admin" && (
            <div className="space-y-2">
              <Label htmlFor="assignee">Assign To</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title}>
              {loading ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
