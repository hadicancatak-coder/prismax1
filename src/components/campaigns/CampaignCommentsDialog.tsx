import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useCampaignComments } from "@/hooks/useCampaignComments";
import { format } from "date-fns";
import { MessageSquare } from "lucide-react";

interface CampaignCommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackingId: string;
  campaignName: string;
  entityName: string;
  isExternal?: boolean;
  externalReviewerName?: string;
  externalReviewerEmail?: string;
}

export function CampaignCommentsDialog({
  open,
  onOpenChange,
  trackingId,
  campaignName,
  entityName,
  isExternal = false,
  externalReviewerName,
  externalReviewerEmail,
}: CampaignCommentsDialogProps) {
  const { useComments, addComment } = useCampaignComments();
  const { data: comments = [] } = useComments(trackingId);
  const [newComment, setNewComment] = useState("");

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      await addComment.mutateAsync({
        trackingId,
        commentText: newComment,
        isExternal,
        authorName: externalReviewerName,
        authorEmail: externalReviewerEmail,
      });
      setNewComment("");
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Campaign Comments
          </DialogTitle>
          <DialogDescription>
            {campaignName} in {entityName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <ScrollArea className="h-64 border rounded-lg p-3 bg-muted/30">
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No comments yet. Be the first to add one!
              </p>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="mb-4 last:mb-0 p-3 bg-background rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        {comment.author_name}
                      </p>
                      {comment.is_external && (
                        <Badge variant="outline" className="text-xs">
                          External
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(comment.created_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                  <p className="text-sm">{comment.comment_text}</p>
                </div>
              ))
            )}
          </ScrollArea>

          <div className="space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[80px]"
            />
            <Button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="w-full"
            >
              Add Comment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
