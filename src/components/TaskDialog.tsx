import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Clock, Send, Smile, X, MessageCircle, Plus, CalendarIcon, Edit, Check, Trash2, Activity, MoreVertical, CheckCircle2, RotateCcw } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DialogFooter } from "@/components/ui/dialog";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { MentionAutocomplete } from "@/components/MentionAutocomplete";
import { AssigneeSelector } from "@/components/AssigneeSelector";
import { BlockerDialog } from "./BlockerDialog";
import { TaskDependenciesSection } from "./TaskDependenciesSection";
import { TaskChecklistSection } from "./TaskChecklistSection";
// import { TaskTimeTrackingSection } from "./TaskTimeTrackingSection"; // Removed time tracking
import { MultiAssigneeSelector } from "./MultiAssigneeSelector";
import { useRealtimeAssignees } from "@/hooks/useRealtimeAssignees";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ENTITIES, TEAMS } from "@/lib/constants";
import { TeamsMultiSelect } from "@/components/admin/TeamsMultiSelect";
import { AttachedAdsSection } from "@/components/tasks/AttachedAdsSection";
import { ConfirmPopover } from "@/components/ui/ConfirmPopover";
import { PromptDialog } from "@/components/ui/PromptDialog";
import { useTaskChangeLogs } from "@/hooks/useTaskChangeLogs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TaskPresenceIndicator } from "@/components/tasks/TaskPresenceIndicator";
import { ActivityLogEntry } from "@/components/tasks/ActivityLogEntry";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
}

export function TaskDialog({ open, onOpenChange, taskId }: TaskDialogProps) {
  const { user, userRole } = useAuth();
  const [task, setTask] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [profiles, setProfiles] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completionHistory, setCompletionHistory] = useState<any[]>([]);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [blockers, setBlockers] = useState<any[]>([]);
  const [blockerDialogOpen, setBlockerDialogOpen] = useState(false);
  const [editingAssignee, setEditingAssignee] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [editingEntities, setEditingEntities] = useState(false);
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [jiraLinks, setJiraLinks] = useState<string[]>([]);
  const [newJiraLink, setNewJiraLink] = useState("");
  const [showJiraInput, setShowJiraInput] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedTask, setEditedTask] = useState<any>(null);
  const [confirmDeleteComment, setConfirmDeleteComment] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<{id: string, body: string} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { assignees, refetch: refetchAssignees } = useRealtimeAssignees("task", taskId);
  const { data: changeLogs = [], isLoading: changeLogsLoading } = useTaskChangeLogs(taskId);

  // Validate taskId
  if (!taskId || taskId === "undefined") {
    return null;
  }

  useEffect(() => {
    if (open && taskId && taskId !== "undefined") {
      setLoading(true);
      fetchTask();
      fetchComments();
      fetchProfiles();
      fetchProjects();
      fetchBlockers();
    }
  }, [open, taskId]);

  // Set up real-time subscription for comments
  useEffect(() => {
    if (!open || !taskId || taskId === "undefined") return;

    const channel = supabase
      .channel(`comments-${taskId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `task_id=eq.${taskId}`
        },
        (payload) => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, taskId]);

  useEffect(() => {
    if (showComments) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments, showComments]);

  const fetchTask = async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", taskId)
        .single();

      if (error) throw error;

      // Fetch creator and assignee profiles separately
      let creatorProfile = null;
      let assigneeProfile = null;

      if (data.created_by) {
        const { data: creator } = await supabase
          .from("profiles")
          .select("name, avatar_url")
          .eq("user_id", data.created_by)
          .single();
        creatorProfile = creator;
      }

      if (data.assignee_id) {
        const { data: assignee } = await supabase
          .from("profiles")
          .select("name, avatar_url")
          .eq("user_id", data.assignee_id)
          .single();
        assigneeProfile = assignee;
      }

      setTask({
        ...data,
        profiles: creatorProfile,
        assignee: assigneeProfile
      });
      
      setSelectedEntities(data.entity || []);
      setJiraLinks(Array.isArray(data.jira_links) ? data.jira_links.filter((l): l is string => typeof l === 'string') : []);
    } catch (error) {
      console.error("Error fetching task:", error);
      toast({ title: "Error", description: "Failed to load task details", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch author profiles for each comment
      const commentsWithProfiles = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("name, avatar_url")
            .eq("user_id", comment.author_id)
            .single();
          return { ...comment, profiles: profile };
        })
      );

      setComments(commentsWithProfiles);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  // Merge comments and change logs, sorted by timestamp
  const activityFeed = [
    ...comments.map((c) => ({ ...c, type: "comment", timestamp: c.created_at })),
    ...changeLogs.map((l) => ({ ...l, type: "log", timestamp: l.changed_at })),
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const fetchProfiles = async () => {
    const { data } = await supabase.from("profiles").select("user_id, name, username");
    setProfiles(data || []);
  };

  const fetchProjects = async () => {
    const { data } = await supabase.from("projects").select("id, name");
    setProjects(data || []);
  };

  const fetchBlockers = async () => {
    const { data } = await supabase
      .from("blockers")
      .select("id, title")
      .eq("resolved", false)
      .order("created_at", { ascending: false });
    setBlockers(data || []);
  };

  const handlePostpone = async () => {
    const { error } = await supabase.from("task_change_requests").insert({
      task_id: taskId,
      requester_id: user?.id,
      type: "postpone",
      payload_json: { due_at: task.due_at },
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Postpone request sent to admin" });
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || !user) return;

    // Validate comment length (500 characters max)
    if (newComment.trim().length > 500) {
      toast({
        title: "Comment too long",
        description: "Comments must be 500 characters or less",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: comment, error } = await supabase
        .from("comments")
        .insert({
          task_id: taskId,
          author_id: user.id,
          body: newComment.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      // Parse @mentions (support both @name and @username)
      const mentions = newComment.match(/@(\w+)/g) || [];
      
      for (const mention of mentions) {
        const username = mention.substring(1);
        const mentionedProfile = profiles.find(
          (p) => 
            p.name?.toLowerCase() === username.toLowerCase() ||
            p.username?.toLowerCase() === username.toLowerCase()
        );

        if (mentionedProfile) {
          try {
            await supabase.from("comment_mentions").insert({
              comment_id: comment.id,
              mentioned_user_id: mentionedProfile.user_id,
            });

            await supabase.from("notifications").insert({
              user_id: mentionedProfile.user_id,
              type: "mention",
              payload_json: { 
                task_id: taskId, 
                comment_id: comment.id, 
                message: newComment.trim(),
                task_title: task.title
              },
            });
          } catch (notifError) {
            console.error("Error creating notification:", notifError);
          }
        }
      }

      setNewComment("");
      toast({ title: "Comment posted", description: "Your comment has been added" });
      
      // Immediately refetch comments to show the new one
      await fetchComments();
    } catch (error: any) {
      console.error("Error posting comment:", error);
      toast({ title: "Error", description: error.message || "Failed to post comment", variant: "destructive" });
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setNewComment((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleSave = async () => {
    try {
      // Define fields requiring approval (ONLY for status changes to Completed/Failed)
      const APPROVAL_REQUIRED_STATUSES = ['Completed', 'Failed'];
      
      // Validate recurring task working days if changed
      if (editedTask.recurrence_rrule?.includes('WEEKLY') && assignees.length > 0) {
        const { data: assigneeProfiles } = await supabase
          .from("profiles")
          .select("id, name, working_days")
          .in("id", assignees.map((a: any) => a.id));
        
        const invalidAssignees: string[] = [];
        const dayOfWeek = editedTask.recurrence_day_of_week;
        
        assigneeProfiles?.forEach(profile => {
          const isValidDay = (
            (profile.working_days === 'mon-fri' && dayOfWeek >= 1 && dayOfWeek <= 5) ||
            (profile.working_days === 'sun-thu' && (dayOfWeek === 0 || (dayOfWeek >= 1 && dayOfWeek <= 4)))
          );
          
          if (!isValidDay) {
            invalidAssignees.push(profile.name);
          }
        });
        
        if (invalidAssignees.length > 0) {
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          toast({
            title: "Working Day Conflict",
            description: `${days[dayOfWeek]} falls outside working days for: ${invalidAssignees.join(', ')}`,
            variant: "destructive",
          });
          return;
        }
      }

      // Members: Check if completing/failing task (requires approval)
      if (userRole === 'member') {
        const statusChanged = editedTask.status !== task.status;
        const requiresApproval = statusChanged && APPROVAL_REQUIRED_STATUSES.includes(editedTask.status);
        
        if (requiresApproval) {
          // Create task_change_request for approval
          const { error } = await supabase.from('task_change_requests').insert({
            requester_id: user?.id,
            type: 'status_change',
            payload_json: { 
              task_id: taskId,
              status: editedTask.status,
              failure_reason: editedTask.failure_reason 
            }
          });
          
          if (error) throw error;
          
          toast({ 
            title: "Submitted for Approval", 
            description: `Task ${editedTask.status.toLowerCase()} status will be reviewed by an admin` 
          });
          setEditMode(false);
          setEditedTask(null);
          fetchTask();
        } else {
          // Members can update all fields EXCEPT completing/failing
          const { error } = await supabase.from('tasks').update({
            title: editedTask.title,
            description: editedTask.description,
            status: editedTask.status,
            priority: editedTask.priority,
            entity: editedTask.entity,
            project_id: editedTask.project_id,
            due_at: editedTask.due_at,
            jira_links: editedTask.jira_links,
            recurrence_rrule: editedTask.recurrence_rrule,
            recurrence_day_of_week: editedTask.recurrence_day_of_week,
            recurrence_day_of_month: editedTask.recurrence_day_of_month,
            blocker_reason: editedTask.blocker_reason,
            checklist: editedTask.checklist
          }).eq('id', taskId);
          
          if (error) throw error;
          
          toast({ title: "Success", description: "Task updated successfully" });
          setEditMode(false);
          setEditedTask(null);
          fetchTask();
        }
      } else {
        // Admin: Save directly
        const { error } = await supabase
          .from("tasks")
          .update({
            title: editedTask.title,
            description: editedTask.description,
            status: editedTask.status,
            priority: editedTask.priority,
            entity: editedTask.entity,
            project_id: editedTask.project_id,
            due_at: editedTask.due_at,
            jira_links: editedTask.jira_links,
            recurrence_rrule: editedTask.recurrence_rrule,
            recurrence_day_of_week: editedTask.recurrence_day_of_week,
            recurrence_day_of_month: editedTask.recurrence_day_of_month,
            blocker_reason: editedTask.blocker_reason,
            failure_reason: editedTask.failure_reason,
          })
          .eq("id", taskId);
        
        if (error) throw error;
        
        toast({ title: "Success", description: "Task updated successfully" });
        setEditMode(false);
        setEditedTask(null);
        fetchTask();
      }
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save changes",
        variant: "destructive",
      });
    }
  };

  const handleDiscard = () => {
    setEditMode(false);
    setEditedTask(null);
    fetchTask();
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);
      
      if (error) throw error;
      
      toast({ title: "Success", description: "Task deleted successfully" });
      onOpenChange(false);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  if (loading || !task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-h-[90vh] flex flex-col transition-all duration-300 ${showComments ? "max-w-6xl" : "max-w-3xl"}`}>
        <DialogHeader className="pr-8">
          <div className="flex items-center justify-between gap-2 mb-2">
            <DialogTitle className="flex-1">
              {editMode ? (
                <Input
                  value={editedTask?.title || ""}
                  onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                  className="font-semibold text-lg"
                />
              ) : (
                <span>{task.title}</span>
              )}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {!editMode && !showComments && (
                <Button variant="outline" size="sm" onClick={() => {
                  setEditMode(true);
                  setEditedTask({...task});
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              {!showComments && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowComments(true)}
                  className="gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Comments ({comments.length})
                </Button>
              )}
              {!editMode && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {task.status !== 'Completed' && (
                      <DropdownMenuItem onClick={async () => {
                        const { error } = await supabase
                          .from('tasks')
                          .update({ status: 'Completed' })
                          .eq('id', taskId);
                        if (error) {
                          toast({ title: "Error", description: error.message, variant: "destructive" });
                        } else {
                          toast({ title: "Success", description: "Task marked as complete" });
                          fetchTask();
                        }
                      }}>
                        <Check className="h-4 w-4 mr-2" />
                        Mark Complete
                      </DropdownMenuItem>
                    )}
                    {userRole === 'admin' && (
                      <DropdownMenuItem 
                        onClick={handleDelete}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Task
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          <DialogDescription>Task details and team discussion</DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 flex-1 min-h-0">
          {/* Task Details Section */}
          <div className={`space-y-6 overflow-y-auto overflow-x-visible pr-4 flex-1 min-h-0 transition-all duration-300 ${showComments ? "w-1/2" : "w-full"}`}>
            <TaskPresenceIndicator taskId={taskId} editMode={editMode} />
            
            <div>
              <Label>Description</Label>
              {editMode ? (
                <RichTextEditor
                  value={editedTask?.description || ""}
                  onChange={(value) => setEditedTask({ ...editedTask, description: value })}
                  placeholder="Add task description..."
                  minHeight="100px"
                />
              ) : (
                <div 
                  className="text-sm text-muted-foreground mt-1 min-h-[40px] p-2 rounded border border-transparent prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: task.description || "No description" }}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Status</Label>
                  {task.recurrence_rrule && task.recurrence_rrule !== 'none' && (
                    <Badge variant="outline" className="text-xs">
                      Recurring Task
                    </Badge>
                  )}
                </div>
                {editMode ? (
                  <Select 
                    value={editedTask?.status} 
                    onValueChange={(value: any) => {
                      setEditedTask({ ...editedTask, status: value });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Ongoing">Ongoing</SelectItem>
                      <SelectItem value="Blocked">Blocked</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className="text-sm py-2 px-3 w-full justify-start">
                    {task.status}
                  </Badge>
                )}
                
                {task.pending_approval && (
                  <Badge variant="outline" className="mt-2 bg-blue-500/10 text-blue-500">
                    ⏳ Awaiting Admin Approval for: {task.requested_status}
                  </Badge>
                )}
              </div>
              <div>
                <Label className="mb-2 block">Priority</Label>
                {editMode ? (
                  <Select 
                    value={editedTask?.priority} 
                    onValueChange={(value: any) => {
                      setEditedTask({ ...editedTask, priority: value });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className="text-sm py-2 px-3 w-full justify-start">
                    {task.priority}
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Assignees</Label>
              <MultiAssigneeSelector
                entityType="task"
                entityId={taskId}
                assignees={assignees}
                onAssigneesChange={refetchAssignees}
              />
            </div>

            {userRole === 'admin' && (
              <div>
                <Label className="mb-2 block">Teams</Label>
                {editMode ? (
                  <TeamsMultiSelect
                    selectedTeams={Array.isArray(editedTask?.teams) ? editedTask.teams : []}
                    onChange={(teams) => setEditedTask({ ...editedTask, teams })}
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(task?.teams) ? task.teams : []).length > 0 ? (
                      (Array.isArray(task?.teams) ? task.teams : []).map((team: string) => (
                        <Badge key={team} variant="secondary">{team}</Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No teams assigned</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {task.status === "Blocked" && editMode && (
              <div>
                <Label className="mb-2 block">Blocker</Label>
                <div className="flex gap-2">
                  <Select 
                    value={editedTask?.blocker_id || ""} 
                    onValueChange={(value) => {
                      setEditedTask({ ...editedTask, blocker_id: value });
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select blocker" /></SelectTrigger>
                    <SelectContent>
                      {blockers.map(b => <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={() => setBlockerDialogOpen(true)}><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
            )}

            {task.status === "Failed" && editMode && (
              <div>
                <Label htmlFor="failureReason">Failure Reason</Label>
                <Textarea
                  id="failureReason"
                  value={editedTask?.failure_reason || ""}
                  onChange={(e) => setEditedTask({ ...editedTask, failure_reason: e.target.value })}
                  placeholder="Why did this task fail?"
                  rows={2}
                />
              </div>
            )}

            <div>
              <Label className="mb-2 block">Countries (Entity)</Label>
              {editMode ? (
                <Popover open={editingEntities} onOpenChange={setEditingEntities}>
                  <PopoverTrigger asChild>
                    <div 
                      className="flex items-center justify-between p-2 border rounded-md cursor-pointer hover:bg-accent"
                    >
                      <div className="flex flex-wrap gap-1">
                        {(editedTask?.entity || []).length > 0 ? (
                          (editedTask?.entity || []).map((ent: string) => (
                            <Badge key={ent} variant="secondary">{ent}</Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No countries assigned</span>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" type="button">Edit</Button>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-full p-4"
                    onInteractOutside={(e) => {
                      const target = e.target as Element;
                      if (target.closest('[role="checkbox"]') || target.closest('label')) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <div className="space-y-3">
                      <Label>Select Countries</Label>
                      <ScrollArea className="max-h-[300px]">
                        <div 
                          className="space-y-2 pr-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {ENTITIES.map((entity) => (
                            <div key={entity} className="flex items-center space-x-2">
                              <Checkbox
                                id={`entity-${entity}`}
                                checked={(editedTask?.entity || []).includes(entity)}
                                onCheckedChange={(checked) => {
                                  const currentEntities = editedTask?.entity || [];
                                  const newEntities = checked
                                    ? [...currentEntities, entity]
                                    : currentEntities.filter((e) => e !== entity);
                                  setEditedTask({ ...editedTask, entity: newEntities });
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <Label htmlFor={`entity-${entity}`} className="text-sm cursor-pointer">{entity}</Label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => setEditingEntities(false)}
                      >
                        Done
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <div className="flex flex-wrap gap-1 p-2 border rounded-md min-h-[42px]">
                  {selectedEntities.length > 0 ? (
                    selectedEntities.map((entity: string) => (
                      <Badge key={entity} variant="secondary">
                        {entity}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No countries selected</span>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Recurring Task</Label>
                {editMode ? (
                  <div className="space-y-2">
                    <Select 
                      value={(() => {
                        if (!editedTask?.recurrence_rrule || editedTask.recurrence_rrule === 'none') return 'none';
                        if (editedTask.recurrence_rrule.includes('DAILY')) return 'daily';
                        if (editedTask.recurrence_rrule.includes('WEEKLY')) return 'weekly';
                        if (editedTask.recurrence_rrule.includes('MONTHLY')) return 'monthly';
                        return 'none';
                      })()} 
                      onValueChange={(value) => {
                        setEditedTask({
                          ...editedTask,
                          recurrence_rrule: value === 'none' ? null : `FREQ=${value.toUpperCase()}`,
                          recurrence_day_of_week: value !== 'weekly' ? null : editedTask.recurrence_day_of_week,
                          recurrence_day_of_month: value !== 'monthly' ? null : editedTask.recurrence_day_of_month,
                        });
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

                    {editedTask?.recurrence_rrule?.includes('WEEKLY') && (
                      <Select 
                        value={editedTask.recurrence_day_of_week?.toString() || ""} 
                        onValueChange={(val) => setEditedTask({
                          ...editedTask,
                          recurrence_day_of_week: parseInt(val)
                        })}
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
                    )}

                    {editedTask?.recurrence_rrule?.includes('MONTHLY') && (
                      <Select 
                        value={editedTask.recurrence_day_of_month?.toString() || ""} 
                        onValueChange={(val) => setEditedTask({
                          ...editedTask,
                          recurrence_day_of_month: parseInt(val)
                        })}
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
                    )}
                  </div>
                ) : (
                  <Badge variant="outline" className="text-sm py-2 px-3">
                    {(() => {
                      if (!task.recurrence_rrule || task.recurrence_rrule === 'none') return 'No Recurrence';
                      if (task.recurrence_rrule.includes('DAILY')) return 'Daily';
                      if (task.recurrence_rrule.includes('WEEKLY')) {
                        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        const dayName = days[task.recurrence_day_of_week || 0];
                        return `Weekly on ${dayName}`;
                      }
                      if (task.recurrence_rrule.includes('MONTHLY')) {
                        const day = task.recurrence_day_of_month || 1;
                        const suffix = day > 3 && day < 21 ? 'th' : ['th', 'st', 'nd', 'rd'][day % 10] || 'th';
                        return `Monthly on ${day}${suffix}`;
                      }
                      return 'Unknown';
                    })()}
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Project</Label>
                {editMode ? (
                  <Select 
                    value={editedTask?.project_id || "none"} 
                    onValueChange={(value) => {
                      setEditedTask({ ...editedTask, project_id: value === "none" ? null : value });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Project</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className="text-sm py-2 px-3 w-full justify-start">
                    {task.project_id 
                      ? projects.find(p => p.id === task.project_id)?.name || "Unknown Project"
                      : "No Project"
                    }
                  </Badge>
                )}
              </div>
              
              <div>
                <Label className="mb-2 block">Linked Blocker</Label>
                <div className="text-sm text-muted-foreground pt-2">
                  {task.status === "Blocked" ? "Blocker created" : "No blocker"}
                </div>
              </div>
            </div>

            {task.status === "Blocked" && (
              <div>
                <Label className="mb-2 block">Blocker Reason</Label>
                {editMode ? (
                  <Textarea
                    value={editedTask?.blocker_reason || ""}
                    onChange={(e) => setEditedTask({ ...editedTask, blocker_reason: e.target.value })}
                    placeholder="Describe the reason for blocking this task..."
                    className="min-h-[100px]"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground p-2 border rounded-md min-h-[100px]">
                    {task.blocker_reason || "No reason provided"}
                  </p>
                )}
              </div>
            )}


            {/* Jira Links Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Jira Links</Label>
                {editMode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowJiraInput(!showJiraInput)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Link
                  </Button>
                )}
              </div>
              
              {jiraLinks.length > 0 ? (
                <div className="space-y-1">
                  {jiraLinks.map((link, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded group">
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline truncate flex-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {link}
                      </a>
                      {editMode && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100"
                          onClick={() => {
                            const updated = jiraLinks.filter((_, i) => i !== idx);
                            setJiraLinks(updated);
                            if (editMode) {
                              setEditedTask({ ...editedTask, jira_links: updated });
                            }
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No Jira links added</p>
              )}
              
              {showJiraInput && (
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Paste Atlassian/Jira link..."
                    value={newJiraLink}
                    onChange={(e) => setNewJiraLink(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' && newJiraLink.trim().includes('atlassian')) {
                        e.preventDefault();
                        const updated = [...jiraLinks, newJiraLink.trim()];
                        setJiraLinks(updated);
                        setNewJiraLink("");
                        setShowJiraInput(false);
                        await supabase
                          .from('tasks')
                          .update({ jira_links: updated })
                          .eq('id', taskId);
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={async () => {
                      if (newJiraLink.trim().includes('atlassian')) {
                        const updated = [...jiraLinks, newJiraLink.trim()];
                        setJiraLinks(updated);
                        setNewJiraLink("");
                        setShowJiraInput(false);
                        await supabase
                          .from('tasks')
                          .update({ jira_links: updated })
                          .eq('id', taskId);
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              )}
            </div>

            <div>
              <Label>Due Date</Label>
              <div className="flex gap-2 mt-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !task.due_at && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {task.due_at ? format(new Date(task.due_at), "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={task.due_at ? new Date(task.due_at) : undefined}
                      onSelect={async (date) => {
                        if (!date) return;
                        
                        // Get all assignees for this task
                        const { data: taskAssignees } = await supabase
                          .from("task_assignees")
                          .select("profiles:user_id(id, name, working_days)")
                          .eq("task_id", taskId);
                        
                        const dayOfWeek = date.getDay();
                        const invalidAssignees: string[] = [];
                        
                        taskAssignees?.forEach((ta: any) => {
                          const profile = ta.profiles;
                          const isValidDay = (
                            (profile.working_days === 'mon-fri' && dayOfWeek >= 1 && dayOfWeek <= 5) ||
                            (profile.working_days === 'sun-thu' && (dayOfWeek === 0 || (dayOfWeek >= 1 && dayOfWeek <= 4)))
                          );
                          
                          if (!isValidDay) {
                            invalidAssignees.push(profile.name);
                          }
                        });
                        
                        if (invalidAssignees.length > 0) {
                          toast({
                            title: "Working Day Conflict",
                            description: `This date is outside working days for: ${invalidAssignees.join(', ')}`,
                            variant: "destructive",
                          });
                          return;
                        }
                        
                        const { error } = await supabase
                          .from("tasks")
                          .update({ due_at: date.toISOString() })
                          .eq("id", taskId);
                        
                        if (error) {
                          toast({
                            title: "Error",
                            description: error.message,
                            variant: "destructive",
                          });
                        } else {
                          toast({
                            title: "Due date updated",
                            description: "Task due date has been changed",
                          });
                          fetchTask();
                        }
                      }}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                
                {userRole !== "admin" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePostpone}
                  >
                    Request Postpone
                  </Button>
                )}
              </div>
            </div>

            {/* Time Tracking Section - Removed per user request */}
            
            <Separator />

            {/* Dependencies Section */}
            <TaskDependenciesSection
              taskId={taskId}
              currentStatus={task.status}
            />

            <Separator />

            {/* Checklist Section */}
            <TaskChecklistSection
              taskId={taskId}
              initialChecklist={task.checklist || []}
              onUpdate={fetchTask}
            />

            <Separator />

            {/* Attached Ads Section */}
            {task.attached_ads && task.attached_ads.length > 0 && (
              <>
                <AttachedAdsSection
                  attachedAds={task.attached_ads}
                  onAdsChange={async (ads) => {
                    await supabase
                      .from("tasks")
                      .update({ attached_ads: ads.map(ad => ({ id: ad.id, headline: ad.headline, ad_type: ad.ad_type })) } as any)
                      .eq("id", taskId);
                    fetchTask();
                  }}
                  editable={editMode}
                />
                <Separator />
              </>
            )}
          </div>

          {/* Activity Feed - Comments & Change Logs */}
          {showComments && (
            <>
              <Separator orientation="vertical" className="h-auto" />
              <div className="w-1/2 flex flex-col h-[600px]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Activity ({activityFeed.length})
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowComments(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
                  {activityFeed.length > 0 ? (
                    activityFeed.map((item: any) => {
                      if (item.type === "comment") {
                        const comment = item;
                        return (
                          <div key={`comment-${comment.id}`} className="flex gap-3 animate-fade-in group">
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage src={comment.profiles?.avatar_url} />
                              <AvatarFallback>{comment.profiles?.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 bg-muted rounded-lg p-3 relative">
                              {comment.author_id === user?.id && (
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={() => setEditingComment({id: comment.id, body: comment.body})}
                                  >
                                    ✏️
                                  </Button>
                                  <ConfirmPopover
                                    open={confirmDeleteComment === comment.id}
                                    onOpenChange={(open) => !open && setConfirmDeleteComment(null)}
                                    onConfirm={async () => {
                                      await supabase.from('comments').delete().eq('id', comment.id);
                                      fetchComments();
                                      toast({ title: "Comment deleted" });
                                      setConfirmDeleteComment(null);
                                    }}
                                    title="Delete this comment?"
                                    description="This action cannot be undone."
                                    trigger={
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0 text-destructive"
                                        onClick={() => setConfirmDeleteComment(comment.id)}
                                      >
                                        🗑️
                                      </Button>
                                    }
                                  />
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm">{comment.profiles?.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(comment.created_at).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {comment.body.split(/(@\w+)/g).map((part: string, i: number) => {
                                  if (part.startsWith('@')) {
                                    const username = part.substring(1);
                                    const mentioned = profiles.find(
                                      p => p.name?.toLowerCase() === username.toLowerCase() ||
                                           p.username?.toLowerCase() === username.toLowerCase()
                                    );
                                    return mentioned ? (
                                      <span key={i} className="text-primary font-semibold cursor-pointer hover:underline">
                                        {part}
                                      </span>
                                    ) : part;
                                  }
                                  return part;
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      } else {
                        // Activity log entry
                        const log = item;
                        return (
                          <ActivityLogEntry
                            key={`log-${log.id}`}
                            field_name={log.field_name}
                            old_value={log.old_value}
                            new_value={log.new_value}
                            description={log.description}
                            changed_at={log.changed_at}
                            profiles={log.profiles}
                          />
                        );
                      }
                    })
                  ) : (
                    <div className="text-center text-muted-foreground py-8">No activity yet. Start the conversation!</div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t pt-4">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 relative">
                      <MentionAutocomplete
                        value={newComment}
                        onChange={setNewComment}
                        users={profiles.map(p => ({
                          user_id: p.user_id,
                          name: p.name || p.email,
                          username: p.username
                        }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleCommentSubmit();
                          }
                        }}
                        placeholder="Type a message... Use @username to mention"
                        as="input"
                        className="pr-10"
                      />
                      <span className={`absolute left-2 -top-5 text-xs ${newComment.length > 500 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {newComment.length}/500
                      </span>
                      <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                          >
                            <Smile className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0 border-0" align="end">
                          <EmojiPicker onEmojiClick={onEmojiClick} width={350} height={400} />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Button onClick={handleCommentSubmit} size="sm" disabled={!newComment.trim()} className="gap-2">
                      <Send className="h-4 w-4" />
                      Send
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Press Enter to send, Shift+Enter for new line. Use @username to mention teammates.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Edit Mode: Save/Discard Footer */}
        {editMode && (
          <>
            <Separator />
            <DialogFooter className="flex gap-2">
              <Button onClick={handleSave} className="gap-2">
                <Check className="h-4 w-4" />
                Save Changes
              </Button>
              <Button variant="outline" onClick={handleDiscard} className="gap-2">
                <X className="h-4 w-4" />
                Discard
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
      
      <PromptDialog
        open={!!editingComment}
        onOpenChange={(open) => !open && setEditingComment(null)}
        title="Edit comment"
        defaultValue={editingComment?.body || ""}
        placeholder="Enter comment text..."
        onConfirm={async (newBody) => {
          if (editingComment && newBody.trim()) {
            await supabase
              .from('comments')
              .update({ body: newBody.trim() })
              .eq('id', editingComment.id);
            fetchComments();
            toast({ title: "Comment updated" });
            setEditingComment(null);
          }
        }}
      />
    </Dialog>
  );
}
