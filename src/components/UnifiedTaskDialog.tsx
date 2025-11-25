import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, AlertTriangle, MessageCircle, Activity, Send, ChevronDown, ChevronUp } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ENTITIES } from "@/lib/constants";
import { TeamsMultiSelect } from "@/components/admin/TeamsMultiSelect";
import { AttachedAdsSection } from "@/components/tasks/AttachedAdsSection";
import { validateDateForUsers, getDayName, formatWorkingDays } from "@/lib/workingDaysHelper";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MultiAssigneeSelector } from "./MultiAssigneeSelector";
import { AssigneeMultiSelect } from "./AssigneeMultiSelect";
import { useRealtimeAssignees } from "@/hooks/useRealtimeAssignees";
import { TaskChecklistSection } from "./TaskChecklistSection";
import { TaskDependenciesSection } from "./TaskDependenciesSection";
import { BlockerDialog } from "./BlockerDialog";
import { useTaskChangeLogs } from "@/hooks/useTaskChangeLogs";
import { ActivityLogEntry } from "@/components/tasks/ActivityLogEntry";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import DOMPurify from 'dompurify';
import { CommentText } from "@/components/CommentText";
import { MentionAutocomplete } from "./MentionAutocomplete";
import { useQueryClient } from "@tanstack/react-query";

interface UnifiedTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'view' | 'edit';
  taskId?: string; // Required for view/edit, not for create
}

export function UnifiedTaskDialog({ open, onOpenChange, mode, taskId }: UnifiedTaskDialogProps) {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Internal mode state to allow switching from view to edit
  const [internalMode, setInternalMode] = useState<'create' | 'view' | 'edit'>(mode);
  
  // Comments panel state
  const [commentsPanelOpen, setCommentsPanelOpen] = useState(false);
  
  // State management
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [status, setStatus] = useState<"Pending" | "Ongoing" | "Blocked" | "Completed" | "Failed" | "Backlog">("Pending");
  const [dueDate, setDueDate] = useState<Date>();
  const [jiraLink, setJiraLink] = useState("");
  const [entities, setEntities] = useState<string[]>([]);
  const [recurrence, setRecurrence] = useState<string>("none");
  const [recurrenceDaysOfWeek, setRecurrenceDaysOfWeek] = useState<number[]>([]);
  const [recurrenceDayOfMonth, setRecurrenceDayOfMonth] = useState<number | null>(null);
  const [taskType, setTaskType] = useState<string>("generic");
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [attachedAds, setAttachedAds] = useState<any[]>([]);
  const [workingDaysWarning, setWorkingDaysWarning] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // View/Edit mode specific
  const [task, setTask] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [blockerDialogOpen, setBlockerDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { assignees: realtimeAssignees, refetch: refetchAssignees } = useRealtimeAssignees(
    "task",
    mode === 'create' ? '' : (taskId || '')
  );
  const { data: changeLogs = [], isLoading: changeLogsLoading } = useTaskChangeLogs(
    mode === 'create' ? '' : (taskId || '')
  );

  // Reset internal mode when dialog opens/closes or mode prop changes
  useEffect(() => {
    if (open) {
      setInternalMode(mode);
    }
  }, [open, mode]);

  const isReadOnly = internalMode === 'view';
  const isCreate = internalMode === 'create';

  // Fetch task data for view/edit modes
  useEffect(() => {
    if (open && !isCreate && taskId) {
      fetchTask();
      fetchComments();
    }
  }, [open, taskId, isCreate]);

  // Fetch users for assignee selection
  useEffect(() => {
    if (open && userRole === "admin") {
      fetchUsers();
    }
  }, [open, userRole]);

  // Working days validation
  useEffect(() => {
    if (dueDate && selectedAssignees.length > 0 && users.length > 0) {
      const assignedUsers = users.filter(u => selectedAssignees.includes(u.id));
      const validation = validateDateForUsers(dueDate, assignedUsers);
      
      if (!validation.isValid) {
        const usersList = validation.invalidUsers.map(u => 
          `${u.name} (${formatWorkingDays(u.workingDays)})`
        ).join(', ');
        setWorkingDaysWarning(
          `⚠️ ${getDayName(dueDate)} is outside working days for: ${usersList}`
        );
      } else {
        setWorkingDaysWarning(null);
      }
    } else {
      setWorkingDaysWarning(null);
    }
  }, [dueDate, selectedAssignees, users]);

  // Auto-add team members
  useEffect(() => {
    if (selectedTeams.length > 0 && users.length > 0 && isCreate) {
      fetchTeamMembersAndAssign();
    }
  }, [selectedTeams, isCreate]);

  const fetchTask = async () => {
    if (!taskId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .select(`
        *,
        project:projects(id, name),
        campaign:campaigns(id, title)
      `)
      .eq("id", taskId)
      .single();

    if (error) {
      console.error("Error fetching task:", error);
      toast({
        title: "Error",
        description: "Failed to load task details",
        variant: "destructive",
      });
    } else if (data) {
      setTask(data);
      setTitle(data.title);
      setDescription(data.description || "");
      setPriority(data.priority);
      setStatus(data.status);
      setDueDate(data.due_at ? new Date(data.due_at) : undefined);
      setJiraLink(data.jira_link || "");
      setEntities(Array.isArray(data.entity) ? data.entity.map(String) : []);
      setSelectedTeams(Array.isArray(data.teams) ? data.teams.map(String) : []);
      setTaskType(data.task_type || "generic");
      
      // Parse recurrence
      if (data.recurrence_rrule) {
        if (data.recurrence_rrule.includes('DAILY')) setRecurrence('daily');
        else if (data.recurrence_rrule.includes('WEEKLY')) setRecurrence('weekly');
        else if (data.recurrence_rrule.includes('MONTHLY')) setRecurrence('monthly');
        
        if (data.recurrence_days_of_week) {
          setRecurrenceDaysOfWeek(data.recurrence_days_of_week);
        }
        if (data.recurrence_day_of_month) {
          setRecurrenceDayOfMonth(data.recurrence_day_of_month);
        }
      }
    }
    setLoading(false);
  };

  const fetchComments = async () => {
    if (!taskId) return;
    
    const { data } = await supabase
      .from("comments")
      .select(`
        *,
        author:profiles!comments_author_id_fkey(id, name, avatar_url, user_id)
      `)
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    setComments(data || []);
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, user_id, name, working_days");
    setUsers(data || []);
  };

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
      
      setSelectedAssignees(prev => [...new Set([...prev, ...teamMemberIds])]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Validation Error",
        description: "Task title is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Generate recurrence rule
      let recurrenceRule = null;
      if (recurrence !== "none") {
        if (recurrence === "weekly" && recurrenceDaysOfWeek.length > 0) {
          const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
          const byDay = recurrenceDaysOfWeek.map(d => dayMap[d]).join(',');
          recurrenceRule = `FREQ=WEEKLY;BYDAY=${byDay}`;
        } else if (recurrence === "monthly" && recurrenceDayOfMonth) {
          recurrenceRule = `FREQ=MONTHLY;BYMONTHDAY=${recurrenceDayOfMonth}`;
        } else if (recurrence === "daily") {
          recurrenceRule = `FREQ=DAILY`;
        }
      }

      const taskData: any = {
        title: title.trim(),
        description: description || null,
        priority,
        status,
        due_at: dueDate?.toISOString() || null,
        created_by: user!.id,
        jira_link: jiraLink || null,
        entity: entities.length > 0 ? entities : [],
        recurrence_rrule: recurrenceRule,
        recurrence_days_of_week: recurrence === 'weekly' ? recurrenceDaysOfWeek : null,
        recurrence_day_of_month: recurrenceDayOfMonth,
        teams: selectedTeams,
        task_type: recurrence !== "none" ? 'recurring' : taskType,
        visibility: "global" as const,
      };

      if (isCreate) {
        // Create new task
        const { data: createdTask, error } = await supabase
          .from("tasks")
          .insert([taskData])
          .select()
          .single();

        if (error) throw error;

        // Assign users
        if (selectedAssignees.length > 0) {
          const { data: creatorProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", user!.id)
            .single();

          if (creatorProfile) {
            const assigneeInserts = selectedAssignees.map(profileId => ({
              task_id: createdTask.id,
              user_id: profileId,
              assigned_by: creatorProfile.id,
            }));

            await supabase.from("task_assignees").insert(assigneeInserts);
          }
        }

        toast({
          title: "Success",
          description: "Task created successfully",
        });
      } else {
        // Update existing task
        const { error } = await supabase
          .from("tasks")
          .update(taskData)
          .eq("id", taskId!);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Task updated successfully",
        });
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["recurring-tasks"] });
      
      // Reset and close
      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving task:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save task",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("Medium");
    setStatus("Pending");
    setDueDate(undefined);
    setJiraLink("");
    setEntities([]);
    setRecurrence("none");
    setRecurrenceDaysOfWeek([]);
    setRecurrenceDayOfMonth(null);
    setTaskType("generic");
    setSelectedTeams([]);
    setSelectedAssignees([]);
    setAttachedAds([]);
    setValidationErrors({});
    setWorkingDaysWarning(null);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !taskId) return;

    const { error } = await supabase.from("comments").insert({
      task_id: taskId,
      author_id: user!.id,
      body: newComment.trim(),
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    } else {
      setNewComment("");
      fetchComments();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "h-[90vh] flex flex-col overflow-hidden p-0 transition-all duration-300",
        commentsPanelOpen ? "max-w-[1400px]" : "max-w-4xl"
      )}>
        <div className="flex h-full">
          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b flex-shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <DialogTitle>
                    {isCreate ? "Create New Task" : isReadOnly ? "Task Details" : "Edit Task"}
                  </DialogTitle>
                  {!isCreate && task && (
                    <DialogDescription>
                      Created {format(new Date(task.created_at), "PPP 'at' p")}
                    </DialogDescription>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!isCreate && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setCommentsPanelOpen(!commentsPanelOpen)}
                      className={cn(commentsPanelOpen && "bg-accent")}
                    >
                      <MessageCircle className="h-5 w-5" />
                    </Button>
                  )}
                  {!isCreate && isReadOnly && (
                    <Button 
                      type="button" 
                      variant="default" 
                      size="sm"
                      onClick={() => setInternalMode('edit')}
                    >
                      Edit Task
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6">
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Task details and team discussion</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
                disabled={isReadOnly}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Enter task description"
                disabled={isReadOnly}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v: any) => setStatus(v)} disabled={isReadOnly}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Ongoing">Ongoing</SelectItem>
                    <SelectItem value="Backlog">Backlog</SelectItem>
                    <SelectItem value="Blocked">Blocked</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v: any) => setPriority(v)} disabled={isReadOnly}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Assignees - ALWAYS SHOW */}
            <div className="space-y-2">
              <Label>Assignees</Label>
              {!isCreate && taskId ? (
                <MultiAssigneeSelector
                  entityType="task"
                  entityId={taskId}
                  assignees={realtimeAssignees}
                  onAssigneesChange={refetchAssignees}
                />
              ) : isCreate && userRole === 'admin' ? (
                <AssigneeMultiSelect
                  users={users.map(u => ({ user_id: u.id, name: u.name, username: u.username || '' }))}
                  selectedUserIds={selectedAssignees}
                  onSelectionChange={setSelectedAssignees}
                  placeholder="Select assignees..."
                />
              ) : (
                <Input placeholder="No assignees" value="" disabled className="bg-muted" />
              )}
            </div>

            {/* Teams - ALWAYS SHOW */}
            <div className="space-y-2">
              <Label>Teams</Label>
              {userRole === 'admin' ? (
                <TeamsMultiSelect
                  selectedTeams={selectedTeams}
                  onChange={setSelectedTeams}
                />
              ) : (
                <Input placeholder="No teams assigned" value="" disabled className="bg-muted" />
              )}
            </div>

            {/* Countries/Entity - ALWAYS SHOW */}
            <div className="space-y-2">
              <Label>Countries (Entity)</Label>
              <Popover modal={true}>
                <PopoverTrigger asChild disabled={isReadOnly}>
                  <Button variant="outline" className="w-full justify-start">
                    {entities.length > 0 ? `${entities.length} selected` : "Select countries"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-card z-[100]" align="start" side="bottom" sideOffset={5}>
                  <ScrollArea className="h-[280px]">
                    <div className="space-y-2 p-2 pr-4">
                      {ENTITIES.map((ent) => (
                        <div key={ent} className="flex items-center space-x-2">
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
                            disabled={isReadOnly}
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
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => setEntities(entities.filter(c => c !== ent))}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Recurrence - ALWAYS SHOW */}
            <div className="space-y-2">
              <Label>Recurring Task</Label>
              <Select 
                value={recurrence} 
                onValueChange={(value) => {
                  setRecurrence(value);
                  if (value !== "none") setDueDate(undefined);
                  if (value !== "weekly") setRecurrenceDaysOfWeek([]);
                  if (value !== "monthly") setRecurrenceDayOfMonth(null);
                }}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Recurrence</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Weekly Recurrence Days */}
            {recurrence === "weekly" && (
              <div className="space-y-2">
                <Label>Days of Week</Label>
                <div className="grid grid-cols-7 gap-2">
                  {[
                    { value: 1, label: 'Mon' },
                    { value: 2, label: 'Tue' },
                    { value: 3, label: 'Wed' },
                    { value: 4, label: 'Thu' },
                    { value: 5, label: 'Fri' },
                    { value: 6, label: 'Sat' },
                    { value: 0, label: 'Sun' },
                  ].map(day => (
                    <div
                      key={day.value}
                      onClick={() => {
                        if (isReadOnly) return;
                        if (recurrenceDaysOfWeek.includes(day.value)) {
                          setRecurrenceDaysOfWeek(recurrenceDaysOfWeek.filter(d => d !== day.value));
                        } else {
                          setRecurrenceDaysOfWeek([...recurrenceDaysOfWeek, day.value].sort());
                        }
                      }}
                      className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                        isReadOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'
                      } ${
                        recurrenceDaysOfWeek.includes(day.value) 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border'
                      }`}
                    >
                      <Checkbox
                        checked={recurrenceDaysOfWeek.includes(day.value)}
                        disabled={isReadOnly}
                      />
                      <span className="text-xs">{day.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Monthly Recurrence Day */}
            {recurrence === "monthly" && (
              <div className="space-y-2">
                <Label>Day of Month</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={recurrenceDayOfMonth || ""}
                  onChange={(e) => setRecurrenceDayOfMonth(parseInt(e.target.value) || null)}
                  placeholder="Day of month (1-31)"
                  disabled={isReadOnly}
                />
              </div>
            )}

            {/* Project - ALWAYS SHOW */}
            <div className="space-y-2">
              <Label>Project</Label>
              <Input
                placeholder="No Project"
                value="No Project"
                disabled
                className="bg-muted"
              />
            </div>

            {/* Linked Blocker - ALWAYS SHOW */}
            <div className="space-y-2">
              <Label>Linked Blocker</Label>
              {!isCreate && taskId ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setBlockerDialogOpen(true)}
                  disabled={isReadOnly}
                >
                  {status === "Blocked" ? "View/Update Blocker" : "No blocker"}
                </Button>
              ) : (
                <Input
                  placeholder="No blocker"
                  value="No blocker"
                  disabled
                  className="bg-muted"
                />
              )}
            </div>

            {/* Jira Links - ALWAYS SHOW */}
            <div className="space-y-2">
              <Label>Jira Links</Label>
              <Input
                type="url"
                placeholder="https://jira.company.com/browse/TASK-123"
                value={jiraLink}
                onChange={(e) => setJiraLink(e.target.value)}
                disabled={isReadOnly}
              />
            </div>

            {/* Due Date - ALWAYS SHOW */}
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover modal={true}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isReadOnly || recurrence !== "none"}
                    className="w-full justify-start"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {recurrence !== "none" ? "N/A (Recurring)" : dueDate ? format(dueDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card z-[100]" align="start" side="bottom" sideOffset={5}>
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
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

            {/* Dependencies - ALWAYS SHOW */}
            <div className="space-y-2">
              <Label>Dependencies</Label>
              {!isCreate && taskId ? (
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button type="button" variant="outline" className="w-full justify-between" disabled={isReadOnly}>
                      <span>View Dependencies</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-2 mt-2">
                      <TaskDependenciesSection taskId={taskId} currentStatus={status} />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <Input
                  placeholder="No dependencies"
                  value=""
                  disabled
                  className="bg-muted"
                />
              )}
            </div>

            {/* Checklist - ALWAYS SHOW */}
            <div className="space-y-2">
              <Label>Checklist</Label>
              {!isCreate && taskId ? (
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button type="button" variant="outline" className="w-full justify-between" disabled={isReadOnly}>
                      <span>View Checklist</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-2 mt-2">
                      <TaskChecklistSection taskId={taskId} />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <Input
                  placeholder="No checklist items"
                  value=""
                  disabled
                  className="bg-muted"
                />
              )}
            </div>

            {/* Comments (View/Edit only) */}
            {!isCreate && taskId && (
              <div className="space-y-2 border-t pt-4">
                <Collapsible open={showComments} onOpenChange={setShowComments}>
                  <CollapsibleTrigger asChild>
                    <Button type="button" variant="outline" className="w-full justify-between">
                      <span className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Comments ({comments.length})
                      </span>
                      {showComments ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border rounded-md p-4 space-y-3 max-h-[300px] overflow-y-auto mt-2">
                      {comments.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center">No comments yet</p>
                      ) : (
                        comments.map((comment) => (
                          <div key={comment.id} className="flex gap-2 p-2 rounded bg-muted/30">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{comment.author?.name || 'Unknown'}</span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                                </span>
                              </div>
                              <CommentText text={comment.body} />
                            </div>
                          </div>
                        ))
                      )}
                      
                      {!isReadOnly && (
                        <div className="flex gap-2 pt-2 border-t">
                          <Input
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAddComment();
                              }
                            }}
                          />
                          <Button type="button" size="sm" onClick={handleAddComment}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}

            {/* Activity Log (View/Edit only) */}
            {!isCreate && taskId && (
              <div className="space-y-2">
                <Collapsible open={showActivity} onOpenChange={setShowActivity}>
                  <CollapsibleTrigger asChild>
                    <Button type="button" variant="outline" className="w-full justify-between">
                      <span className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Activity Log
                      </span>
                      {showActivity ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border rounded-md p-4 space-y-2 max-h-[300px] overflow-y-auto mt-2">
                      {changeLogsLoading ? (
                        <p className="text-sm text-muted-foreground">Loading...</p>
                      ) : changeLogs.length > 0 ? (
                        changeLogs.map((log) => (
                          <ActivityLogEntry 
                            key={log.id}
                            field_name={log.field_name}
                            old_value={log.old_value}
                            new_value={log.new_value}
                            description={log.description}
                            changed_at={log.changed_at}
                            profiles={log.profiles}
                          />
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No activity yet</p>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}

            {/* Comments (View/Edit only) */}
            {!isCreate && taskId && (
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowComments(!showComments)}
                  className="w-full justify-between"
                >
                  <span className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Comments ({comments.length})
                  </span>
                  {showComments ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                
                {showComments && (
                  <div className="border rounded-md p-4 space-y-4 max-h-[300px] overflow-y-auto">
                    {comments.map((comment) => (
                      <div key={comment.id} className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{comment.author?.name}</span>
                          <span className="text-muted-foreground text-xs">
                            {format(new Date(comment.created_at), "PPP 'at' p")}
                          </span>
                        </div>
                        <CommentText text={comment.body} />
                      </div>
                    ))}
                    
                    {!isReadOnly && (
                      <div className="space-y-2">
                        <Input
                          placeholder="Add a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleAddComment();
                            }
                          }}
                        />
                        <Button type="button" size="sm" onClick={handleAddComment} className="w-full">
                          <Send className="h-4 w-4 mr-2" />
                          Send
                        </Button>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            )}

            {/* Activity Log (View/Edit only) */}
            {!isCreate && taskId && (
              <div className="space-y-2">
                <Collapsible open={showActivity} onOpenChange={setShowActivity}>
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Activity Log
                      </span>
                      {showActivity ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border rounded-md p-4 space-y-2 max-h-[300px] overflow-y-auto mt-2">
                      {changeLogsLoading ? (
                        <p className="text-sm text-muted-foreground">Loading...</p>
                      ) : changeLogs.length > 0 ? (
                        changeLogs.map((log) => (
                          <ActivityLogEntry 
                            key={log.id}
                            field_name={log.field_name}
                            old_value={log.old_value}
                            new_value={log.new_value}
                            description={log.description}
                            changed_at={log.changed_at}
                            profiles={log.profiles}
                          />
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No activity yet</p>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}
          </form>
        </div>

        <div className="px-6 py-4 border-t flex-shrink-0">
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {isReadOnly ? "Close" : "Cancel"}
            </Button>
            {!isReadOnly && (
              <Button type="submit" onClick={handleSubmit} disabled={loading}>
                {loading ? "Saving..." : isCreate ? "Create Task" : "Save Changes"}
              </Button>
            )}
          </div>
        </div>

        {!isCreate && <BlockerDialog open={blockerDialogOpen} onOpenChange={setBlockerDialogOpen} taskId={taskId || ''} />}
      </div>

      {/* Comments Panel */}
      {commentsPanelOpen && !isCreate && taskId && (
        <div className="w-[400px] border-l flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b">
            <h3 className="text-heading-sm font-semibold">Comments & Activity</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Activity Log */}
            <div className="space-y-2">
              <h4 className="text-body-sm font-medium">Activity</h4>
              {changeLogsLoading ? (
                <p className="text-body-sm text-muted-foreground">Loading...</p>
              ) : changeLogs.length > 0 ? (
                <div className="space-y-2">
                  {changeLogs.map((log) => (
                    <ActivityLogEntry 
                      key={log.id}
                      field_name={log.field_name}
                      old_value={log.old_value}
                      new_value={log.new_value}
                      description={log.description}
                      changed_at={log.changed_at}
                      profiles={log.profiles}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-body-sm text-muted-foreground">No activity yet</p>
              )}
            </div>

            {/* Comments */}
            <div className="space-y-2">
              <h4 className="text-body-sm font-medium">Comments ({comments.length})</h4>
              {comments.map((comment) => (
                <div key={comment.id} className="space-y-1 p-2 rounded-md bg-muted/30">
                  <div className="flex items-center gap-2 text-body-sm">
                    <span className="font-medium">{comment.author?.name}</span>
                    <span className="text-muted-foreground text-metadata">
                      {format(new Date(comment.created_at), "PPP 'at' p")}
                    </span>
                  </div>
                  <CommentText text={comment.body} />
                </div>
              ))}
            </div>
          </div>

          {/* Comment Input */}
          {!isReadOnly && (
            <div className="p-4 border-t space-y-2">
              <MentionAutocomplete
                value={newComment}
                onChange={setNewComment}
                users={users}
                placeholder="Add a comment... (use @ to mention)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
              />
              <Button type="button" size="sm" onClick={handleAddComment} className="w-full">
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
      </DialogContent>
    </Dialog>
  );
}
