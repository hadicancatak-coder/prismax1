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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Clock, Send, Smile, X, MessageCircle } from "lucide-react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";

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
  const [showComments, setShowComments] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(true);
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
      <DialogContent className={`max-h-[90vh] overflow-hidden transition-all duration-300 ${showComments ? "max-w-6xl" : "max-w-3xl"}`}>
        <DialogHeader className="pr-8">
          <DialogTitle className="flex items-center justify-between">
            <span>{task.title}</span>
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

        <div className="flex gap-4 overflow-hidden">
          {/* Task Details Section */}
          <div className={`space-y-6 overflow-y-auto pr-4 transition-all duration-300 ${showComments ? "w-1/2" : "w-full"}`}>
            <div>
              <Label>Description</Label>
              <p className="text-sm text-muted-foreground mt-1">{task.description || "No description"}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Status</Label>
                <Select 
                  value={task.status} 
                  onValueChange={async (value: any) => {
                    const { error } = await supabase
                      .from("tasks")
                      .update({ status: value })
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
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Blocked">Blocked</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
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
              <Label className="mb-2 block">Entity</Label>
              <Select 
                value={task.entity || ""} 
                onValueChange={async (value) => {
                  const { error } = await supabase
                    .from("tasks")
                    .update({ entity: value })
                    .eq("id", taskId);
                  if (error) {
                    toast({ title: "Error", description: error.message, variant: "destructive" });
                  } else {
                    fetchTask();
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select entity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Jordan">Jordan</SelectItem>
                  <SelectItem value="Lebanon">Lebanon</SelectItem>
                  <SelectItem value="Kuwait">Kuwait</SelectItem>
                  <SelectItem value="UAE">UAE</SelectItem>
                  <SelectItem value="South Africa">South Africa</SelectItem>
                  <SelectItem value="Azerbaijan">Azerbaijan</SelectItem>
                  <SelectItem value="UK">UK</SelectItem>
                  <SelectItem value="Latin America">Latin America</SelectItem>
                  <SelectItem value="Seychelles">Seychelles</SelectItem>
                  <SelectItem value="Palestine">Palestine</SelectItem>
                  <SelectItem value="Bahrain">Bahrain</SelectItem>
                  <SelectItem value="Qatar">Qatar</SelectItem>
                  <SelectItem value="International">International</SelectItem>
                  <SelectItem value="Global Management">Global Management</SelectItem>
                </SelectContent>
              </Select>
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
              <div className="flex items-center gap-2 mt-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm">{task.due_at ? new Date(task.due_at).toLocaleDateString() : "No due date"}</span>
                {userRole !== "admin" && (
                  <Button size="sm" variant="outline" onClick={handlePostpone}>
                    Request Postpone
                  </Button>
                )}
              </div>
            </div>
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
                      <div key={comment.id} className="flex gap-3 animate-fade-in">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={comment.profiles?.avatar_url} />
                          <AvatarFallback>{comment.profiles?.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-muted rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">{comment.profiles?.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">
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
                      <Input
                        placeholder="Type a message... Use @username to mention"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleCommentSubmit();
                          }
                        }}
                        className="pr-10"
                      />
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
