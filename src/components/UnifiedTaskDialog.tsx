import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, AlertTriangle, MessageCircle, Send, ChevronDown, ChevronRight, X, Pencil, Eye } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ENTITIES } from "@/lib/constants";
import { AttachedAdsSection } from "@/components/tasks/AttachedAdsSection";
import { validateDateForUsers, getDayName, formatWorkingDays } from "@/lib/workingDaysHelper";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRealtimeAssignees } from "@/hooks/useRealtimeAssignees";
import { TaskChecklistSection } from "./TaskChecklistSection";
import { TaskDependenciesSection } from "./TaskDependenciesSection";
import { BlockerDialog } from "./BlockerDialog";
import { useTaskChangeLogs } from "@/hooks/useTaskChangeLogs";
import { ActivityLogEntry } from "@/components/tasks/ActivityLogEntry";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CommentText } from "@/components/CommentText";
import { MentionAutocomplete } from "./MentionAutocomplete";
import { useQueryClient } from "@tanstack/react-query";
import { TaskAssigneeSelector } from "@/components/tasks/TaskAssigneeSelector";
import { TagsMultiSelect } from "@/components/tasks/TagsMultiSelect";

interface UnifiedTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'view' | 'edit';
  taskId?: string;
}

export function UnifiedTaskDialog({ open, onOpenChange, mode, taskId }: UnifiedTaskDialogProps) {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Internal mode state to allow switching from view to edit
  const [internalMode, setInternalMode] = useState<'create' | 'view' | 'edit'>(mode);
  
  // Side panel state
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  
  // Advanced settings collapsed state
  const [advancedOpen, setAdvancedOpen] = useState(false);
  
  // State management
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [status, setStatus] = useState<"Pending" | "Ongoing" | "Blocked" | "Completed" | "Failed" | "Backlog">("Pending");
  const [dueDate, setDueDate] = useState<Date>();
  const [entities, setEntities] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [recurrence, setRecurrence] = useState<string>("none");
  const [recurrenceDaysOfWeek, setRecurrenceDaysOfWeek] = useState<number[]>([]);
  const [recurrenceDayOfMonth, setRecurrenceDayOfMonth] = useState<number | null>(null);
  const [attachedAds, setAttachedAds] = useState<any[]>([]);
  const [workingDaysWarning, setWorkingDaysWarning] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  
  // View/Edit mode specific
  const [task, setTask] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
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
      setSidePanelOpen(false);
      setAdvancedOpen(false);
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
    if (open) {
      fetchUsers();
    }
  }, [open]);

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

  // Update selected assignees from realtime data
  useEffect(() => {
    if (!isCreate && realtimeAssignees.length > 0) {
      setSelectedAssignees(realtimeAssignees.map(a => a.id));
    }
  }, [realtimeAssignees, isCreate]);

  const fetchTask = async () => {
    if (!taskId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("tasks")
      .select(`*`)
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
      setEntities(Array.isArray(data.entity) ? data.entity.map(String) : []);
      setTags(Array.isArray(data.labels) ? data.labels : []);
      
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
    
    // Fetch comments first
    const { data: commentsData, error: commentsError } = await supabase
      .from("comments")
      .select("id, task_id, author_id, body, created_at")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (commentsError || !commentsData) {
      console.error("Error fetching comments:", commentsError);
      setComments([]);
      return;
    }

    // Get unique author IDs and fetch their profiles
    const authorIds = [...new Set(commentsData.map(c => c.author_id))];
    
    if (authorIds.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, name, avatar_url, user_id")
        .in("user_id", authorIds);

      // Map profiles to comments
      const commentsWithAuthors = commentsData.map(comment => ({
        ...comment,
        author: profilesData?.find(p => p.user_id === comment.author_id) || null
      }));

      setComments(commentsWithAuthors);
    } else {
      setComments(commentsData);
    }
  };

  const fetchUsers = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, user_id, name, username, working_days");
    setUsers(data || []);
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
        entity: entities.length > 0 ? entities : [],
        labels: tags.length > 0 ? tags : [],
        recurrence_rrule: recurrenceRule,
        recurrence_days_of_week: recurrence === 'weekly' ? recurrenceDaysOfWeek : null,
        recurrence_day_of_month: recurrenceDayOfMonth,
        task_type: recurrence !== "none" ? 'recurring' : 'generic',
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
    setEntities([]);
    setTags([]);
    setRecurrence("none");
    setRecurrenceDaysOfWeek([]);
    setRecurrenceDayOfMonth(null);
    setSelectedAssignees([]);
    setAttachedAds([]);
    setWorkingDaysWarning(null);
    setSidePanelOpen(false);
    setAdvancedOpen(false);
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
      // Auto-scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const getModeLabel = () => {
    if (isCreate) return "Create";
    if (isReadOnly) return "View";
    return "Edit";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        hideCloseButton
        className={cn(
          "max-h-[90vh] flex flex-col overflow-hidden p-0 transition-smooth",
          sidePanelOpen ? "max-w-[1200px]" : "max-w-3xl"
        )}
      >
        <div className="flex h-full">
          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* HEADER */}
            <div className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <DialogTitle className="text-heading-md">
                    {isCreate ? "New Task" : "Task Details"}
                  </DialogTitle>
                  <Badge variant="secondary" className="text-metadata">
                    {getModeLabel()}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {!isCreate && (
                    <Button
                      type="button"
                      variant={sidePanelOpen ? "secondary" : "ghost"}
                      size="icon-sm"
                      onClick={() => setSidePanelOpen(!sidePanelOpen)}
                      title="Comments & Activity"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  )}
                  {!isCreate && isReadOnly && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setInternalMode('edit')}
                      className="gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                  )}
                  {!isCreate && !isReadOnly && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setInternalMode('view')}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onOpenChange(false)}
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {!isCreate && task && (
                <DialogDescription className="mt-1">
                  Created {format(new Date(task.created_at), "PPP 'at' p")}
                </DialogDescription>
              )}
            </div>

            {/* MAIN FORM */}
            <div className="flex-1 overflow-y-auto hide-scrollbar px-6">
              <form onSubmit={handleSubmit} className="space-y-6 py-6">
                
                {/* === BASIC INFO === */}
                <div className="space-y-4">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
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
                </div>

                {/* === PLANNING SECTION === */}
                <div className="space-y-4">
                  <h3 className="text-body-sm font-medium text-muted-foreground uppercase tracking-wide">Planning</h3>
                  
                  {/* Row 1: Status, Priority, Due Date */}
                  <div className="grid grid-cols-3 gap-4">
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

                    {/* Due Date */}
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
                            {recurrence !== "none" ? "N/A" : dueDate ? format(dueDate, "PPP") : "Pick date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-popover z-[100]" align="start">
                          <Calendar
                            mode="single"
                            selected={dueDate}
                            onSelect={setDueDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {workingDaysWarning && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-metadata">
                        {workingDaysWarning}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Row 2: Assignees, Tags */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Assignees */}
                    <div className="space-y-2">
                      <Label>Assignees</Label>
                      <TaskAssigneeSelector
                        mode={isCreate ? 'create' : 'edit'}
                        taskId={taskId}
                        selectedIds={selectedAssignees}
                        onSelectionChange={(ids) => {
                          setSelectedAssignees(ids);
                          if (!isCreate) refetchAssignees();
                        }}
                        users={users}
                        disabled={isReadOnly}
                      />
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                      <Label>Tags</Label>
                      <TagsMultiSelect
                        value={tags}
                        onChange={setTags}
                        disabled={isReadOnly}
                      />
                    </div>
                  </div>
                </div>

                {/* === ADVANCED SETTINGS (Collapsed) === */}
                <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                  <CollapsibleTrigger asChild>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="w-full justify-between px-0 hover:bg-transparent"
                    >
                      <span className="text-body-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Advanced Settings
                      </span>
                      {advancedOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-4">
                    
                    {/* Countries/Entity */}
                    <div className="space-y-2">
                      <Label>Countries (Entity)</Label>
                      <Popover modal={true}>
                        <PopoverTrigger asChild disabled={isReadOnly}>
                          <Button variant="outline" className="w-full justify-start">
                            {entities.length > 0 ? `${entities.length} selected` : "Select countries"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-popover z-[100]" align="start">
                          <ScrollArea className="h-[280px] hide-scrollbar">
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
                                  <Label htmlFor={`entity-${ent}`} className="text-body-sm cursor-pointer">
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
                            <Badge key={ent} variant="secondary" className="text-metadata">
                              {ent}
                              {!isReadOnly && (
                                <button
                                  type="button"
                                  onClick={() => setEntities(entities.filter(c => c !== ent))}
                                  className="ml-1 hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Recurrence */}
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
                              className={cn(
                                "flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 transition-smooth",
                                isReadOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50',
                                recurrenceDaysOfWeek.includes(day.value) 
                                  ? 'border-primary bg-primary/10' 
                                  : 'border-border'
                              )}
                            >
                              <Checkbox
                                checked={recurrenceDaysOfWeek.includes(day.value)}
                                disabled={isReadOnly}
                              />
                              <span className="text-metadata">{day.label}</span>
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

                    {/* Dependencies (View/Edit only) */}
                    {!isCreate && taskId && (
                      <div className="space-y-2">
                        <Label>Dependencies</Label>
                        <TaskDependenciesSection taskId={taskId} currentStatus={status} />
                      </div>
                    )}

                    {/* Checklist (View/Edit only) */}
                    {!isCreate && taskId && (
                      <div className="space-y-2">
                        <Label>Checklist</Label>
                        <TaskChecklistSection taskId={taskId} />
                      </div>
                    )}

                    {/* Attached Ads (View/Edit only) */}
                    {!isCreate && taskId && (
                      <div className="space-y-2">
                        <Label>Attached Ads</Label>
                        <AttachedAdsSection 
                          attachedAds={attachedAds} 
                          onAdsChange={setAttachedAds}
                          editable={!isReadOnly}
                        />
                      </div>
                    )}

                    {/* Blocker (View/Edit only) */}
                    {!isCreate && taskId && (
                      <div className="space-y-2">
                        <Label>Blocker</Label>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => setBlockerDialogOpen(true)}
                          disabled={isReadOnly}
                        >
                          {status === "Blocked" ? "View/Update Blocker" : "No blocker"}
                        </Button>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </form>
            </div>

            {/* FOOTER */}
            <div className="px-6 py-4 border-t border-border flex-shrink-0">
              <div className="flex justify-end gap-3">
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
          </div>

          {/* SIDE PANEL - Comments & Activity */}
          {sidePanelOpen && !isCreate && taskId && (
            <div className="w-[380px] border-l border-border flex flex-col overflow-hidden animate-slide-in-right">
              <div className="px-4 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-body font-semibold">Comments & Activity</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSidePanelOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-6">
                {/* Activity Log */}
                <div className="space-y-3">
                  <h4 className="text-body-sm font-medium text-muted-foreground">Activity</h4>
                  {changeLogsLoading ? (
                    <p className="text-body-sm text-muted-foreground">Loading...</p>
                  ) : changeLogs.length > 0 ? (
                    <div className="space-y-2">
                      {changeLogs.slice(0, 10).map((log) => (
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
                <div className="space-y-3">
                  <h4 className="text-body-sm font-medium text-muted-foreground">
                    Comments {comments.length > 0 && `(${comments.length})`}
                  </h4>
                  {comments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-body-sm">No comments yet</p>
                      <p className="text-metadata">Be the first to comment</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {comments.map((comment) => {
                        const isCurrentUser = comment.author?.user_id === user?.id;
                        return (
                          <div 
                            key={comment.id} 
                            className={cn(
                              "flex gap-3",
                              isCurrentUser && "flex-row-reverse"
                            )}
                          >
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarFallback className="text-metadata bg-primary/10 text-primary">
                                {comment.author?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div className={cn(
                              "flex-1 max-w-[85%]",
                              isCurrentUser && "flex flex-col items-end"
                            )}>
                              <div className={cn(
                                "rounded-lg px-3 py-2",
                                isCurrentUser 
                                  ? "bg-primary text-primary-foreground rounded-tr-none" 
                                  : "bg-muted/50 rounded-tl-none"
                              )}>
                                {!isCurrentUser && (
                                  <div className="text-metadata font-medium mb-1">
                                    {comment.author?.name}
                                  </div>
                                )}
                                <CommentText 
                                  text={comment.body} 
                                  className={cn(
                                    "text-body-sm",
                                    isCurrentUser && "text-primary-foreground"
                                  )}
                                  linkClassName={isCurrentUser ? "text-primary-foreground underline" : "text-primary underline"}
                                  enableMentions
                                  profiles={users}
                                />
                              </div>
                              <span className="text-metadata text-muted-foreground mt-1">
                                {format(new Date(comment.created_at), "MMM d, h:mm a")}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Comment Input */}
              <div className="p-4 border-t border-border">
                <div className="flex flex-col gap-2">
                  <MentionAutocomplete
                    value={newComment}
                    onChange={setNewComment}
                    users={users}
                    placeholder="Write a comment... Use @ to mention"
                    minRows={2}
                    maxRows={4}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-metadata text-muted-foreground">
                      {newComment.trim() ? `⌘+Enter to send` : ''}
                    </span>
                    <Button 
                      type="button" 
                      size="sm" 
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className={cn(
                        "gap-2 transition-all duration-200",
                        newComment.trim() 
                          ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md" 
                          : "bg-muted text-muted-foreground opacity-50"
                      )}
                    >
                      <Send className="h-3.5 w-3.5" />
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {!isCreate && <BlockerDialog open={blockerDialogOpen} onOpenChange={setBlockerDialogOpen} taskId={taskId || ''} />}
      </DialogContent>
    </Dialog>
  );
}
