import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Clock, Send } from "lucide-react";

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

  useEffect(() => {
    if (open && taskId) {
      fetchTask();
      fetchComments();
      fetchProfiles();
    }
  }, [open, taskId]);

  const fetchTask = async () => {
    const { data } = await supabase.from("tasks").select("*, profiles:created_by(name), assignee:assignee_id(name, avatar_url)").eq("id", taskId).single();
    setTask(data);
  };

  const fetchComments = async () => {
    const { data } = await supabase.from("comments").select("*, profiles:author_id(name, avatar_url)").eq("task_id", taskId).order("created_at");
    setComments(data || []);
  };

  const fetchProfiles = async () => {
    const { data } = await supabase.from("profiles").select("user_id, name");
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
    if (!newComment.trim()) return;

    const mentions = newComment.match(/@(\w+)/g) || [];
    const { data: comment, error } = await supabase.from("comments").insert({
      task_id: taskId,
      author_id: user?.id,
      body: newComment,
    }).select().single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // Handle mentions
    for (const mention of mentions) {
      const username = mention.substring(1);
      const mentionedProfile = profiles.find(p => p.name.toLowerCase() === username.toLowerCase());
      
      if (mentionedProfile) {
        await supabase.from("comment_mentions").insert({
          comment_id: comment.id,
          mentioned_user_id: mentionedProfile.user_id,
        });

        await supabase.from("notifications").insert({
          user_id: mentionedProfile.user_id,
          type: "mention",
          payload_json: { task_id: taskId, comment_id: comment.id, message: newComment },
        });
      }
    }

    setNewComment("");
    fetchComments();
    toast({ title: "Success", description: "Comment posted" });
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label>Description</Label>
            <p className="text-sm text-muted-foreground mt-1">{task.description || "No description"}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Badge className="mt-1">{task.status}</Badge>
            </div>
            <div>
              <Label>Priority</Label>
              <Badge className="mt-1">{task.priority}</Badge>
            </div>
          </div>

          {task.jira_link && (
            <div>
              <Label>Jira Link</Label>
              <a href={task.jira_link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline block mt-1">
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
                <Button size="sm" variant="outline" onClick={handlePostpone}>Request Postpone</Button>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <Label className="mb-4 block">Comments</Label>
            <div className="space-y-4 mb-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.profiles?.avatar_url} />
                    <AvatarFallback>{comment.profiles?.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{comment.profiles?.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">{comment.body}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Textarea
                placeholder="Add a comment... Use @ to mention teammates"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleCommentSubmit} size="sm">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
