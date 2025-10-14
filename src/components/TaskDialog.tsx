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
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Clock, Send, Smile, X, MessageCircle, Plus, CalendarIcon } from "lucide-react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { MentionAutocomplete } from "@/components/MentionAutocomplete";
import { AssigneeSelector } from "@/components/AssigneeSelector";
import { BlockerDialog } from "./BlockerDialog";
import { TaskDependenciesSection } from "./TaskDependenciesSection";
import { TaskChecklistSection } from "./TaskChecklistSection";
import { TaskTimeTrackingSection } from "./TaskTimeTrackingSection";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

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
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [blockers, setBlockers] = useState<any[]>([]);
  const [blockerDialogOpen, setBlockerDialogOpen] = useState(false);
  const [editingAssignee, setEditingAssignee] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
          console.log("Comment change detected:", payload);
          fetchComments();
        }
      )
      .subscribe((status) => {
        console.log("Comments subscription status:", status);
      });

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

  if (loading || !task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-h-[90vh] flex flex-col transition-all duration-300 ${showComments ? "max-w-6xl" : "max-w-3xl"}`}>
        <DialogHeader className="pr-8">
          <DialogTitle className="flex items-center justify-between">
            {editingTitle ? (
              <Input
                value={task.title}
                onChange={(e) => setTask({ ...task, title: e.target.value })}
                onBlur={async () => {
                  setEditingTitle(false);
                  const { error } = await supabase.from("tasks").update({ title: task.title }).eq("id", taskId);
                  if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
                }}
                onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
                autoFocus
                className="font-semibold text-lg"
              />
            ) : (
              <span onClick={() => setEditingTitle(true)} className="cursor-pointer hover:text-primary">{task.title}</span>
            )}
            {!showComments && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments(true)}
                className="gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Show Comments ({comments.length})
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>Task details and team discussion</DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 flex-1 min-h-0">
          {/* Task Details Section */}
          <div className={`space-y-6 overflow-y-auto overflow-x-visible pr-4 flex-1 min-h-0 transition-all duration-300 ${showComments ? "w-1/2" : "w-full"}`}>
            <div>
              <Label>Description</Label>
              {editingDescription ? (
                <MentionAutocomplete
                  value={task.description || ""}
                  onChange={(value) => setTask({ ...task, description: value })}
                  users={profiles.map(p => ({
                    user_id: p.user_id,
                    name: p.name || p.email,
                    username: p.username
                  }))}
                  onBlur={async () => {
                    setEditingDescription(false);
                    const { error } = await supabase.from("tasks").update({ description: task.description }).eq("id", taskId);
                    if (error) {
                      toast({ title: "Error", description: error.message, variant: "destructive" });
                      return;
                    }
                    
                    // Process @mentions in description
                    const mentions = (task.description || '').match(/@(\w+)/g) || [];
                    for (const mention of mentions) {
                      const username = mention.substring(1);
                      const mentionedProfile = profiles.find(
                        p => p.name?.toLowerCase() === username.toLowerCase() ||
                             p.username?.toLowerCase() === username.toLowerCase()
                      );
                      
                      if (mentionedProfile && mentionedProfile.user_id !== user?.id) {
                        await supabase.from("notifications").insert({
                          user_id: mentionedProfile.user_id,
                          type: "mention",
                          payload_json: { 
                            task_id: taskId, 
                            message: `mentioned you in task description`,
                            task_title: task.title
                          },
                        });
                      }
                    }
                  }}
                  as="textarea"
                  className="mt-1"
                  placeholder="Add task description..."
                />
              ) : (
                <p
                  onClick={() => setEditingDescription(true)}
                  className="text-sm text-muted-foreground mt-1 cursor-pointer hover:text-foreground min-h-[40px] p-2 rounded border border-transparent hover:border-border"
                >
                  {task.description || "Click to add description"}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Status</Label>
                <Select 
                  value={task.status} 
                  onValueChange={async (value: any) => {
                    if (userRole === 'admin') {
                      const { error } = await supabase
                        .from("tasks")
                        .update({ status: value })
                        .eq("id", taskId);
                      if (error) {
                        toast({ title: "Error", description: error.message, variant: "destructive" });
                      } else {
                        setTask({ ...task, status: value });
                        fetchTask();
                      }
                      return;
                    }

                    const requiresApproval = ['Completed', 'Failed', 'Blocked'].includes(value);
                    
                    if (requiresApproval) {
                      const confirmed = confirm(`Request admin approval to mark this task as ${value}?`);
                      if (!confirmed) return;
                      
                      const { error } = await supabase
                        .from("tasks")
                        .update({ 
                          pending_approval: true,
                          approval_requested_at: new Date().toISOString(),
                          approval_requested_by: user?.id,
                          requested_status: value
                        })
                        .eq("id", taskId);
                        
                      if (error) {
                        toast({ title: "Error", description: error.message, variant: "destructive" });
                      } else {
                        toast({ 
                          title: "Approval Requested", 
                          description: "Admin will review your request" 
                        });
                        fetchTask();
                      }
                    } else {
                      const { error } = await supabase
                        .from("tasks")
                        .update({ status: value })
                        .eq("id", taskId);
                      if (error) {
                        toast({ title: "Error", description: error.message, variant: "destructive" });
                      } else {
                        setTask({ ...task, status: value });
                        fetchTask();
                      }
                    }
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
                
                {task.pending_approval && (
                  <Badge variant="outline" className="mt-2 bg-blue-500/10 text-blue-500">
                    ⏳ Awaiting Admin Approval for: {task.requested_status}
                  </Badge>
                )}
              </div>
              <div>
                <Label className="mb-2 block">Priority</Label>
                <Select 
                  value={task.priority} 
                  onValueChange={async (value: any) => {
                    const { error } = await supabase
                      .from("tasks")
                      .update({ priority: value })
                      .eq("id", taskId);
                    if (error) {
                      toast({ title: "Error", description: error.message, variant: "destructive" });
                    } else {
                      fetchTask();
                    }
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
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Assignee</Label>
              {!editingAssignee ? (
                <div 
                  className="flex items-center justify-between p-2 border rounded-md cursor-pointer hover:bg-accent"
                  onClick={() => setEditingAssignee(true)}
                >
                  <div className="flex items-center gap-2">
                    {task.assignee ? (
                      <>
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={task.assignee.avatar_url} />
                          <AvatarFallback>
                            {task.assignee.name?.substring(0, 2).toUpperCase() || "??"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{task.assignee.name || "Unknown"}</span>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">Unassigned</span>
                    )}
                  </div>
                  <Button variant="ghost" size="sm">Edit</Button>
                </div>
              ) : (
                <div className="space-y-2 p-3 border rounded-md bg-background">
                  <Input
                    placeholder="Search users..."
                    value={assigneeSearch}
                    onChange={(e) => setAssigneeSearch(e.target.value)}
                    autoFocus
                  />
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    <div
                      className="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer"
                      onClick={async () => {
                        const { error } = await supabase
                          .from("tasks")
                          .update({ assignee_id: null })
                          .eq("id", taskId);
                        if (!error) {
                          toast({ title: "Success", description: "Assignee cleared" });
                          await fetchTask();
                          setEditingAssignee(false);
                          setAssigneeSearch("");
                        }
                      }}
                    >
                      <span className="text-sm text-muted-foreground">Unassigned</span>
                    </div>
                    {profiles
                      .filter(p => 
                        !assigneeSearch || 
                        p.name?.toLowerCase().includes(assigneeSearch.toLowerCase())
                      )
                      .map(profile => (
                        <div
                          key={profile.user_id}
                          className="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer"
                          onClick={async () => {
                            const { error } = await supabase
                              .from("tasks")
                              .update({ assignee_id: profile.user_id })
                              .eq("id", taskId);
                            if (!error) {
                              toast({ title: "Success", description: "Assignee updated" });
                              await fetchTask();
                              setEditingAssignee(false);
                              setAssigneeSearch("");
                            } else {
                              toast({ 
                                title: "Error", 
                                description: error.message, 
                                variant: "destructive" 
                              });
                            }
                          }}
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>
                              {profile.name?.substring(0, 2).toUpperCase() || "??"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{profile.name}</span>
                        </div>
                      ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setEditingAssignee(false);
                      setAssigneeSearch("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {task.status === "Blocked" && (
              <div>
                <Label className="mb-2 block">Blocker</Label>
                <div className="flex gap-2">
                  <Select value={task.blocker_id || ""} onValueChange={async (value) => {
                    const { error } = await supabase.from("tasks").update({ blocker_id: value }).eq("id", taskId);
                    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
                    else fetchTask();
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select blocker" /></SelectTrigger>
                    <SelectContent>
                      {blockers.map(b => <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={() => setBlockerDialogOpen(true)}><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
            )}

            {task.status === "Failed" && (
              <div>
                <Label htmlFor="failureReason">Failure Reason</Label>
                <Textarea
                  id="failureReason"
                  value={task.failure_reason || ""}
                  onChange={(e) => setTask({ ...task, failure_reason: e.target.value })}
                  onBlur={async () => {
                    const { error } = await supabase.from("tasks").update({ failure_reason: task.failure_reason }).eq("id", taskId);
                    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
                  }}
                  placeholder="Why did this task fail?"
                  rows={2}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Countries (Entity)</Label>
                {task.entity && task.entity.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {task.entity.map((ent: string) => (
                      <Badge key={ent} variant="secondary">
                        {ent}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No countries assigned</p>
                )}
              </div>
              <div>
                <Label className="mb-2 block">Entity</Label>
                <p className="text-sm">{task.entity && task.entity.length > 0 ? task.entity.join(', ') : 'None'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Recurring Task</Label>
                <Select 
                  value={task.recurrence_rrule || "none"} 
                  onValueChange={async (value) => {
                    const rrule = value === "none" ? null : value;
                    // Clear due date when setting recurrence
                    const updateData: any = { recurrence_rrule: rrule };
                    if (value !== "none") {
                      updateData.due_at = null;
                    }
                    
                    const { error } = await supabase
                      .from("tasks")
                      .update(updateData)
                      .eq("id", taskId);
                    if (error) {
                      toast({ title: "Error", description: error.message, variant: "destructive" });
                    } else {
                      fetchTask();
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No recurrence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Recurrence</SelectItem>
                    <SelectItem value="FREQ=DAILY">Daily</SelectItem>
                    <SelectItem value="FREQ=WEEKLY">Weekly</SelectItem>
                    <SelectItem value="FREQ=MONTHLY">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Project</Label>
                <Select 
                  value={task.project_id || "none"} 
                  onValueChange={async (value) => {
                    const projectId = value === "none" ? null : value;
                    const { error } = await supabase
                      .from("tasks")
                      .update({ project_id: projectId })
                      .eq("id", taskId);
                    if (error) {
                      toast({ title: "Error", description: error.message, variant: "destructive" });
                    } else {
                      fetchTask();
                    }
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
                <Textarea
                  value={task.blocker_reason || ""}
                  onChange={(e) => setTask({ ...task, blocker_reason: e.target.value })}
                  onBlur={async () => {
                    const { error } = await supabase
                      .from("tasks")
                      .update({ blocker_reason: task.blocker_reason })
                      .eq("id", taskId);
                    if (error) {
                      toast({ title: "Error", description: error.message, variant: "destructive" });
                    }
                  }}
                  placeholder="Describe the reason for blocking this task..."
                  className="min-h-[100px]"
                />
              </div>
            )}

            <div>
              <Label>Assigned To</Label>
              <div className="flex items-center gap-2 mt-1">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={task.assignee?.avatar_url} />
                  <AvatarFallback>{task.assignee?.name?.[0] || "U"}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{task.assignee?.name || "Unassigned"}</span>
              </div>
            </div>

            {task.jira_link && (
              <div>
                <Label>Jira Link</Label>
                <a
                  href={task.jira_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline block mt-1"
                >
                  {task.jira_link}
                </a>
              </div>
            )}

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

            {/* Time Tracking Section */}
            <TaskTimeTrackingSection
              taskId={taskId}
              estimatedHours={task.estimated_hours}
              actualHours={task.actual_hours}
              onUpdate={fetchTask}
            />

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
          </div>

          {/* Comments Section - Messaging Style */}
          {showComments && (
            <>
              <Separator orientation="vertical" className="h-auto" />
              <div className="w-1/2 flex flex-col h-[600px]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Comments ({comments.length})</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowComments(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
                  {comments.length > 0 ? (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3 animate-fade-in group">
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
                                onClick={async () => {
                                  const newBody = prompt("Edit comment:", comment.body);
                                  if (newBody && newBody.trim()) {
                                    await supabase
                                      .from('comments')
                                      .update({ body: newBody.trim() })
                                      .eq('id', comment.id);
                                    fetchComments();
                                    toast({ title: "Comment updated" });
                                  }
                                }}
                              >
                                ✏️
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-destructive"
                                onClick={async () => {
                                  if (confirm("Delete this comment?")) {
                                    await supabase.from('comments').delete().eq('id', comment.id);
                                    fetchComments();
                                    toast({ title: "Comment deleted" });
                                  }
                                }}
                              >
                                🗑️
                              </Button>
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
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">No comments yet. Start the conversation!</div>
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
      </DialogContent>
    </Dialog>
  );
}
