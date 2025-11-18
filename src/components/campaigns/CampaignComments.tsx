import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send } from "lucide-react";
import { useCampaignComments } from "@/hooks/useCampaignComments";
import { formatDistanceToNow } from "date-fns";

interface CampaignCommentsProps {
  campaignId: string;
}

export function CampaignComments({ campaignId }: CampaignCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const { useUtmCampaignComments, addUtmCampaignComment } = useCampaignComments();
  const { data: comments = [], isLoading } = useUtmCampaignComments(campaignId);

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    
    addUtmCampaignComment.mutate({
      campaignId,
      commentText: newComment,
    }, {
      onSuccess: () => setNewComment(""),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[300px] pr-4">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment: any) => (
                <div key={comment.id} className="border-b pb-3 last:border-0">
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-medium text-sm">{comment.author_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {comment.comment_text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <Button
            onClick={handleSubmit}
            disabled={!newComment.trim() || addUtmCampaignComment.isPending}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            Post Comment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
