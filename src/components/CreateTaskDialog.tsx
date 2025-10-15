import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { taskSchema } from "@/lib/validationSchemas";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ENTITIES } from "@/lib/constants";

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
  const [status, setStatus] = useState<"Pending" | "Ongoing" | "Blocked" | "Completed" | "Failed">("Ongoing");
  const [jiraLink, setJiraLink] = useState("");
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [entities, setEntities] = useState<string[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [recurrence, setRecurrence] = useState<string>("none");
  const [recurrenceDayOfWeek, setRecurrenceDayOfWeek] = useState<number | null>(null);
  const [recurrenceDayOfMonth, setRecurrenceDayOfMonth] = useState<number | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleJiraLinkPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData('text');
    const atlassianLinks = pastedText.match(/https?:\/\/[^\s]+atlassian[^\s]*/gi);
    
    if (atlassianLinks && atlassianLinks.length > 0) {
      setJiraLink(atlassianLinks[0]);
      if (atlassianLinks.length > 1) {
        toast({
          title: "Multiple Jira links detected",
          description: "Using first link. You can add more after creating the task.",
        });
      }
    }
  };

  useEffect(() => {
    if (open && userRole === "admin") {
      fetchUsers();
    }
  }, [open, userRole]);

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("id, user_id, name");
    setUsers(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setValidationErrors({});

    // Generate recurrence rule based on selection
    let recurrenceRule = "";
    if (recurrence === "daily") {
      recurrenceRule = "FREQ=DAILY";
    } else if (recurrence === "weekly" && recurrenceDayOfWeek !== null) {
      const days = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
      recurrenceRule = `FREQ=WEEKLY;BYDAY=${days[recurrenceDayOfWeek]}`;
    } else if (recurrence === "monthly" && recurrenceDayOfMonth !== null) {
      recurrenceRule = `FREQ=MONTHLY;BYMONTHDAY=${recurrenceDayOfMonth}`;
    }

    // Validate with zod
    try {
      taskSchema.parse({
        title: title.trim(),
        description: description || "",
        jira_link: jiraLink || "",
        jira_key: "",
        entity: entities.length > 0 ? entities : undefined,
        priority: recurrence !== "none" ? "High" : priority,
        status: (userRole === "member" ? "Pending" : status),
        recurrence_rrule: recurrenceRule || "",
        recurrence_day_of_week: recurrenceDayOfWeek,
        recurrence_day_of_month: recurrenceDayOfMonth,
        assignee_id: null,
        project_id: null,
        due_at: recurrence !== "none" ? null : (date ? date.toISOString() : null),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setValidationErrors(errors);
        console.error("Validation errors:", errors);
        toast({
          title: "Validation Error",
          description: Object.values(errors)[0] || "Please fix the errors in the form",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    try {
      // Get current user's profile.id for member users
      let currentUserProfileId = null;
      if (userRole === "member") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();
        currentUserProfileId = profile?.id;
      }

      const assigneesToUse = userRole === "member" 
        ? (currentUserProfileId ? [currentUserProfileId] : [])
        : selectedAssignees.length > 0 
          ? selectedAssignees 
          : [];

      const taskData = {
        title: title.trim(),
        description: description.trim() || null,
        priority: recurrence !== "none" ? "High" : priority,
        status: (userRole === "member" ? "Pending" : status) as "Pending" | "Ongoing" | "Blocked" | "Completed" | "Failed",
        due_at: recurrence !== "none" ? null : date?.toISOString(),
        jira_link: jiraLink.trim() || null,
        created_by: user.id,
        assignee_id: null,
        visibility: "global" as "global" | "pool" | "private",
        entity: entities.length > 0 ? entities : [],
        recurrence_rrule: recurrenceRule || null,
        recurrence_day_of_week: recurrenceDayOfWeek,
        recurrence_day_of_month: recurrenceDayOfMonth,
      };

      const { data, error } = await supabase.from("tasks").insert([taskData]).select();

      if (error) throw error;

      const createdTask = data[0];

      // Get creator's profile.id for assigned_by
      const { data: creatorProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      // Insert multiple assignees into task_assignees table
      // assigneesToUse already contains profiles.id values
      if (assigneesToUse.length > 0 && creatorProfile) {
        const assigneeInserts = assigneesToUse.map(profileId => ({
          task_id: createdTask.id,
          user_id: profileId,  // This is profiles.id
          assigned_by: creatorProfile.id,  // This is also profiles.id
        }));

        const { error: assignError } = await supabase.from("task_assignees").insert(assigneeInserts);
        
        if (assignError) {
          console.error("Error assigning tasks:", assignError);
          toast({
            title: "Warning",
            description: "Task created but assignment failed",
            variant: "destructive",
          });
        }
      }

      toast({
        title: userRole === "member" ? "Task submitted for approval" : "Task created",
        description: userRole === "member" 
          ? "Your task has been submitted and is awaiting admin approval." 
          : "Task has been successfully created.",
      });

      setTitle("");
      setDescription("");
      setPriority("Medium");
      setStatus("Ongoing");
      setJiraLink("");
      setSelectedAssignees([]);
      setEntities([]);
      setDate(undefined);
      setRecurrence("none");
      setRecurrenceDayOfWeek(null);
      setRecurrenceDayOfMonth(null);
      setValidationErrors({});
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
              className={validationErrors.title ? "border-destructive" : ""}
              required 
            />
            {validationErrors.title && (
              <p className="text-sm text-destructive">{validationErrors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter task description"
              className={cn("min-h-[100px]", validationErrors.description && "border-destructive")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {validationErrors.description && (
              <p className="text-sm text-destructive">{validationErrors.description}</p>
            )}
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
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Ongoing">Ongoing</SelectItem>
                    <SelectItem value="Blocked">Blocked</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
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
                  disabled={recurrence !== "none"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {recurrence !== "none" ? "N/A (Recurring)" : date ? format(date, "PPP") : "Pick a date"}
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
              onPaste={handleJiraLinkPaste}
              className={validationErrors.jira_link ? "border-destructive" : ""}
            />
            {validationErrors.jira_link && (
              <p className="text-sm text-destructive">{validationErrors.jira_link}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Countries (Entity)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {entities.length > 0 ? `${entities.length} selected` : "Select countries"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-80 z-50"
                  onInteractOutside={(e) => {
                    const target = e.target as Element;
                    if (target.closest('[role="checkbox"]') || target.closest('label')) {
                      e.preventDefault();
                    }
                  }}
                >
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-2">
                      {ENTITIES.map((ent) => (
                        <div 
                          key={ent} 
                          className="flex items-center space-x-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            id={`entity-${ent}`}
                            checked={entities.includes(ent)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setEntities([...entities, ent]);
                              } else {
                                setEntities(entities.filter(c => c !== ent));
                              }
                            }}
                          />
                          <Label htmlFor={`entity-${ent}`} className="text-sm cursor-pointer">
                            {ent}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              {entities.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {entities.map((ent) => (
                    <Badge key={ent} variant="secondary" className="text-xs">
                      {ent}
                      <button
                        type="button"
                        onClick={() => setEntities(entities.filter(c => c !== ent))}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Recurrence</Label>
              <Select 
                value={recurrence} 
                onValueChange={(value) => {
                  setRecurrence(value);
                  if (value !== "none") {
                    setDate(undefined);
                  }
                  if (value !== "weekly") {
                    setRecurrenceDayOfWeek(null);
                  }
                  if (value !== "monthly") {
                    setRecurrenceDayOfMonth(null);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select recurrence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Recurrence</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {recurrence === "weekly" && (
            <div className="space-y-2">
              <Label>Day of Week</Label>
              <Select 
                value={recurrenceDayOfWeek?.toString() || ""} 
                onValueChange={(val) => setRecurrenceDayOfWeek(parseInt(val))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sunday</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="2">Tuesday</SelectItem>
                  <SelectItem value="3">Wednesday</SelectItem>
                  <SelectItem value="4">Thursday</SelectItem>
                  <SelectItem value="5">Friday</SelectItem>
                  <SelectItem value="6">Saturday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {recurrence === "monthly" && (
            <div className="space-y-2">
              <Label>Day of Month (Deadline Day)</Label>
              <Select 
                value={recurrenceDayOfMonth?.toString() || ""} 
                onValueChange={(val) => setRecurrenceDayOfMonth(parseInt(val))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day (1-31)" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                    <SelectItem key={day} value={day.toString()}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {userRole === "admin" && (
            <div className="space-y-2">
              <Label>Assignees</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {selectedAssignees.length > 0 
                      ? `${selectedAssignees.length} assignee${selectedAssignees.length > 1 ? 's' : ''} selected` 
                      : "Select assignees"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-80"
                  onInteractOutside={(e) => {
                    const target = e.target as Element;
                    if (target.closest('[role="checkbox"]') || target.closest('label')) {
                      e.preventDefault();
                    }
                  }}
                >
                  <ScrollArea className="max-h-[300px]">
                    <div className="space-y-2 pr-4">
                      {users.map((usr) => (
                        <div 
                          key={usr.id} 
                          className="flex items-center space-x-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            id={`assignee-${usr.id}`}
                            checked={selectedAssignees.includes(usr.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedAssignees([...selectedAssignees, usr.id]);
                              } else {
                                setSelectedAssignees(selectedAssignees.filter(id => id !== usr.id));
                              }
                            }}
                          />
                          <Label htmlFor={`assignee-${usr.id}`} className="text-sm cursor-pointer">
                            {usr.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              {selectedAssignees.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedAssignees.map((assigneeId) => {
                    const assignee = users.find(u => u.id === assigneeId);
                    return assignee ? (
                      <Badge key={assigneeId} variant="secondary" className="text-xs">
                        {assignee.name}
                        <button
                          type="button"
                          onClick={() => setSelectedAssignees(selectedAssignees.filter(id => id !== assigneeId))}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
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
