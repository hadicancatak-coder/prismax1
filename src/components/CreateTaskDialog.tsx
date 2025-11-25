import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { CalendarIcon, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { taskSchema } from "@/lib/validationSchemas";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ENTITIES, TEAMS } from "@/lib/constants";
import { TeamsMultiSelect } from "@/components/admin/TeamsMultiSelect";
import { AttachedAdsSection } from "@/components/tasks/AttachedAdsSection";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { validateDateForUsers, getDayName, formatWorkingDays } from "@/lib/workingDaysHelper";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateTaskDialog = ({ open, onOpenChange }: CreateTaskDialogProps) => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [status, setStatus] = useState<"Backlog" | "Ongoing" | "Blocked" | "Completed" | "Failed">("Ongoing");
  const [jiraLink, setJiraLink] = useState("");
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [entities, setEntities] = useState<string[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [recurrence, setRecurrence] = useState<string>("none");
  const [recurrenceDaysOfWeek, setRecurrenceDaysOfWeek] = useState<number[]>([]);
  const [recurrenceDayOfMonth, setRecurrenceDayOfMonth] = useState<number | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [attachedAds, setAttachedAds] = useState<any[]>([]);
  const [taskType, setTaskType] = useState<string>("generic");
  const [workingDaysWarning, setWorkingDaysWarning] = useState<string | null>(null);

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

  // Check working days when date or assignees change
  useEffect(() => {
    if (date && selectedAssignees.length > 0 && users.length > 0) {
      const assignedUsers = users.filter(u => selectedAssignees.includes(u.id));
      const validation = validateDateForUsers(date, assignedUsers);
      
      if (!validation.isValid) {
        const usersList = validation.invalidUsers.map(u => 
          `${u.name} (${formatWorkingDays(u.workingDays)})`
        ).join(', ');
        setWorkingDaysWarning(
          `⚠️ ${getDayName(date)} is outside working days for: ${usersList}`
        );
      } else {
        setWorkingDaysWarning(null);
      }
    } else {
      setWorkingDaysWarning(null);
    }
  }, [date, selectedAssignees, users]);

  // Auto-add team members when teams are selected
  useEffect(() => {
    if (selectedTeams.length > 0 && users.length > 0) {
      fetchTeamMembersAndAssign();
    }
  }, [selectedTeams]);

  const fetchTeamMembersAndAssign = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, user_id, name, teams')
      .not('teams', 'is', null);
    
    if (data) {
      const teamMemberIds: string[] = [];
      data.forEach(profile => {
        if (Array.isArray(profile.teams)) {
          const hasMatchingTeam = profile.teams.some(t => 
            selectedTeams.includes(t)
          );
          if (hasMatchingTeam && !teamMemberIds.includes(profile.id)) {
            teamMemberIds.push(profile.id);
          }
        }
      });
      
      // Auto-add without duplicates
      setSelectedAssignees(prev => {
        const combined = [...new Set([...prev, ...teamMemberIds])];
        return combined;
      });
      
      if (teamMemberIds.length > 0) {
        toast({
          title: "Team members added",
          description: `${teamMemberIds.length} assignee${teamMemberIds.length > 1 ? 's' : ''} from selected teams`,
        });
      }
    }
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("id, user_id, name");
    setUsers(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setValidationErrors({});

    // Note: Working day warnings are shown live in the UI, but we allow task creation
    // to proceed even if dates fall outside working days

    // Validate recurring task days against assignee working days
    if (recurrence === "weekly" && recurrenceDaysOfWeek.length > 0 && selectedAssignees.length > 0) {
      const { data: assigneeProfiles } = await supabase
        .from("profiles")
        .select("id, name, working_days")
        .in("id", selectedAssignees);

      const invalidAssignees: Map<string, string[]> = new Map();
      
      assigneeProfiles?.forEach(profile => {
        const invalidDays: string[] = [];
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        recurrenceDaysOfWeek.forEach(dayOfWeek => {
          const isValidDay = (
            (profile.working_days === 'mon-fri' && dayOfWeek >= 1 && dayOfWeek <= 5) ||
            (profile.working_days === 'sun-thu' && (dayOfWeek === 0 || (dayOfWeek >= 1 && dayOfWeek <= 4)))
          );
          
          if (!isValidDay) {
            invalidDays.push(days[dayOfWeek]);
          }
        });

        if (invalidDays.length > 0) {
          invalidAssignees.set(profile.name, invalidDays);
        }
      });

      if (invalidAssignees.size > 0) {
        const conflictMessages = Array.from(invalidAssignees.entries())
          .map(([name, days]) => `${name}: ${days.join(', ')}`)
          .join('\n');
        
        toast({
          title: "Working Day Conflicts",
          description: `The following assignees have conflicts:\n${conflictMessages}`,
          variant: "destructive",
        });
        return;
      }
    }

    // Generate recurrence rule based on selection
    let recurrenceRule = "";
    if (recurrence === "daily") {
      recurrenceRule = "FREQ=DAILY";
    } else if (recurrence === "weekly" && recurrenceDaysOfWeek.length > 0) {
      const days = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
      const selectedDays = recurrenceDaysOfWeek.map(d => days[d]).join(',');
      recurrenceRule = `FREQ=WEEKLY;BYDAY=${selectedDays}`;
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
        status: status,
        recurrence_rrule: recurrenceRule || "",
        recurrence_days_of_week: recurrenceDaysOfWeek.length > 0 ? recurrenceDaysOfWeek : null,
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
        status: "Ongoing" as "Pending" | "Ongoing" | "Blocked" | "Completed" | "Failed",
        due_at: recurrence !== "none" ? null : date?.toISOString(),
        jira_link: jiraLink.trim() || null,
        created_by: user.id,
        assignee_id: null,
        visibility: "global" as "global" | "pool" | "private",
        entity: entities.length > 0 ? entities : [],
        recurrence_rrule: recurrenceRule || null,
        recurrence_days_of_week: recurrenceDaysOfWeek.length > 0 ? recurrenceDaysOfWeek : null,
        recurrence_day_of_month: recurrenceDayOfMonth,
        teams: selectedTeams,
        task_type: taskType as 'generic' | 'campaign' | 'recurring',
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
      if (assigneesToUse.length > 0 && creatorProfile) {
        const assigneeInserts = assigneesToUse.map(profileId => ({
          task_id: createdTask.id,
          user_id: profileId,
          assigned_by: creatorProfile.id,
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

      // Invalidate tasks query to trigger refetch
      // Realtime subscription in useTasks.ts handles invalidation

      toast({
        title: userRole === "member" ? "Task submitted" : "Task created",
        description: userRole === "member" 
          ? "Your task has been submitted successfully." 
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
      setRecurrenceDaysOfWeek([]);
      setRecurrenceDayOfMonth(null);
      setValidationErrors({});
      setSelectedTeams([]);
      setAttachedAds([]);
      setTaskType("task");
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
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <form className="flex-1 flex flex-col overflow-hidden" onSubmit={handleSubmit}>
          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="space-y-4 px-6 py-4">
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
                <Label htmlFor="task-type">Task Type</Label>
                <Select value={taskType} onValueChange={setTaskType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select task type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="generic">General Task</SelectItem>
                    <SelectItem value="campaign">Campaign</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <RichTextEditor
                value={description}
                onChange={(value) => setDescription(value)}
                placeholder="Enter task description"
                minHeight="100px"
                className={cn(validationErrors.description && "border-destructive")}
              />
              {validationErrors.description && (
                <p className="text-sm text-destructive">{validationErrors.description}</p>
              )}
            </div>

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
            {workingDaysWarning && (
              <Alert variant="destructive" className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {workingDaysWarning}
                </AlertDescription>
              </Alert>
            )}
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
                    setRecurrenceDaysOfWeek([]);
                  }
                  if (value !== "monthly") {
                    setRecurrenceDayOfMonth(null);
                  }
                  setTaskType(value !== "none" ? "recurring" : "generic");
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base">Days of Week</Label>
                {recurrenceDaysOfWeek.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {recurrenceDaysOfWeek.length} {recurrenceDaysOfWeek.length === 1 ? 'day' : 'days'} selected
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground -mt-1">Select one or more days</p>
              <div className="grid grid-cols-7 gap-2">
                {[
                  { value: 1, label: 'Mon' },
                  { value: 2, label: 'Tue' },
                  { value: 3, label: 'Wed' },
                  { value: 4, label: 'Thu' },
                  { value: 5, label: 'Fri' },
                  { value: 6, label: 'Sat' },
                  { value: 0, label: 'Sun' },
                ].map(day => {
                  // Check if any assignee can't work this day
                  const hasConflict = selectedAssignees.some(assigneeId => {
                    const assignee = users.find((u: any) => u.id === assigneeId);
                    if (!assignee?.working_days) return false;
                    
                    return (
                      (assignee.working_days === 'mon-fri' && (day.value === 0 || day.value === 6)) ||
                      (assignee.working_days === 'sun-thu' && (day.value === 5 || day.value === 6))
                    );
                  });
                  
                  return (
                    <div
                      key={day.value}
                      onClick={() => {
                        if (hasConflict) return;
                        if (recurrenceDaysOfWeek.includes(day.value)) {
                          setRecurrenceDaysOfWeek(recurrenceDaysOfWeek.filter(d => d !== day.value));
                        } else {
                          setRecurrenceDaysOfWeek([...recurrenceDaysOfWeek, day.value].sort());
                        }
                      }}
                      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                        hasConflict 
                          ? 'opacity-40 cursor-not-allowed bg-muted' 
                          : 'cursor-pointer hover:border-primary/50'
                      } ${
                        recurrenceDaysOfWeek.includes(day.value) 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border'
                      }`}
                    >
                      <Checkbox
                        checked={recurrenceDaysOfWeek.includes(day.value)}
                        disabled={hasConflict}
                        onCheckedChange={(checked) => {
                          // Prevent double-firing from both div click and checkbox change
                          return;
                        }}
                      />
                      <span className={`text-sm font-medium ${hasConflict ? 'line-through' : ''}`}>
                        {day.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              {/* Recurrence Preview */}
              {recurrence === "weekly" && recurrenceDaysOfWeek.length > 0 && (
                <div className="p-3 bg-primary/5 rounded-md text-sm border border-primary/20">
                  <div className="flex items-center gap-2 mb-1">
                    <RotateCcw className="h-4 w-4 text-primary" />
                    <span className="font-medium text-primary">Recurrence Preview</span>
                  </div>
                  <p className="text-muted-foreground">
                    Task will repeat every{' '}
                    <strong className="text-foreground">
                      {recurrenceDaysOfWeek
                        .map(d => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d])
                        .join(', ')}
                    </strong>
                  </p>
                </div>
              )}
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
              
              {/* Monthly Recurrence Preview */}
              {recurrenceDayOfMonth && (
                <div className="p-3 bg-primary/5 rounded-md text-sm border border-primary/20">
                  <div className="flex items-center gap-2 mb-1">
                    <RotateCcw className="h-4 w-4 text-primary" />
                    <span className="font-medium text-primary">Recurrence Preview</span>
                  </div>
                  <p className="text-muted-foreground">
                    Task will repeat on the <strong className="text-foreground">{recurrenceDayOfMonth}{recurrenceDayOfMonth === 1 ? 'st' : recurrenceDayOfMonth === 2 ? 'nd' : recurrenceDayOfMonth === 3 ? 'rd' : 'th'} day</strong> of every month
                  </p>
                </div>
              )}
            </div>
          )}

          {recurrence === "daily" && (
            <div className="p-3 bg-primary/5 rounded-md text-sm border border-primary/20">
              <div className="flex items-center gap-2 mb-1">
                <RotateCcw className="h-4 w-4 text-primary" />
                <span className="font-medium text-primary">Recurrence Preview</span>
              </div>
              <p className="text-muted-foreground">
                Task will repeat <strong className="text-foreground">every day</strong>
              </p>
            </div>
          )}

          {userRole === "admin" && (
            <div className="space-y-2">
              <Label>Teams</Label>
              <TeamsMultiSelect
                selectedTeams={selectedTeams}
                onChange={setSelectedTeams}
              />
            </div>
          )}


              {/* Attached Ads Section - Only show for Campaign type */}
              {taskType === "campaign" && (
                <div className="space-y-2 pt-2 border-t">
                  <AttachedAdsSection
                    attachedAds={attachedAds}
                    onAdsChange={setAttachedAds}
                    editable={true}
                  />
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="flex-shrink-0 flex justify-end gap-3 px-6 pt-4 border-t bg-background">
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
