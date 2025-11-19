import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEntityComments } from "@/hooks/useEntityComments";
import { formatDistanceToNow } from "date-fns";

interface EntityCommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityName: string;
  isExternal?: boolean;
  externalReviewerName?: string;
  externalReviewerEmail?: string;
}

export function EntityCommentsDialog({
  open,
  onOpenChange,
  entityName,
  isExternal = false,
  externalReviewerName,
  externalReviewerEmail,
}: EntityCommentsDialogProps) {
  const [newComment, setNewComment] = useState("");
  const { useComments, addComment } = useEntityComments();
  const { data: comments = [], isLoading } = useComments(entityName);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      await addComment.mutateAsync({
        entity: entityName,
        commentText: newComment,
        isExternal,
        authorName: isExternal ? externalReviewerName : undefined,
        authorEmail: isExternal ? externalReviewerEmail : undefined,
      });
      setNewComment("");
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle>Entity Comments</DialogTitle>
          <DialogDescription>
            Overall comments for {entityName}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                Loading comments...
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                No comments yet. Be the first to add one!
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {comment.author_name?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {comment.author_name || "Anonymous"}
                      </span>
                      {comment.is_external && comment.author_email && (
                        <span className="text-xs text-muted-foreground">
                          ({comment.author_email})
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{comment.comment_text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="space-y-2 pt-4 border-t">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleAddComment}
              disabled={!newComment.trim() || addComment.isPending}
            >
              {addComment.isPending ? "Adding..." : "Add Comment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
