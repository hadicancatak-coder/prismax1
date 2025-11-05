import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAdComments, useCreateAdComment, useDeleteAdComment } from '@/hooks/useAdComments';
import { MessageSquare, Send, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ConfirmPopover } from '@/components/ui/ConfirmPopover';
interface AdCommentsProps {
  adId: string;
}

export function AdComments({ adId }: AdCommentsProps) {
  const [newComment, setNewComment] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { data: comments, isLoading } = useAdComments(adId);
  const createComment = useCreateAdComment();
  const deleteComment = useDeleteAdComment();

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    
    createComment.mutate({
      ad_id: adId,
      body: newComment,
    }, {
      onSuccess: () => setNewComment('')
    });
  };

  const handleDelete = (commentId: string) => {
    deleteComment.mutate(commentId);
    setConfirmDeleteId(null);
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4" />
        <h3 className="font-semibold">Comments</h3>
        {comments && <span className="text-sm text-muted-foreground">({comments.length})</span>}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading comments...</p>
        ) : comments && comments.length > 0 ? (
          comments.map((comment: any) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={comment.profiles?.avatar_url} />
                <AvatarFallback>
                  {comment.profiles?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium">{comment.profiles?.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(comment.created_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  <ConfirmPopover
                    open={confirmDeleteId === comment.id}
                    onOpenChange={(open) => !open && setConfirmDeleteId(null)}
                    onConfirm={() => handleDelete(comment.id)}
                    title="Delete this comment?"
                    description="This action cannot be undone."
                    trigger={
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmDeleteId(comment.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    }
                  />
                </div>
                <p className="text-sm mt-1">{comment.body}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No comments yet</p>
        )}

        <div className="flex gap-2 pt-4 border-t">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={2}
            className="flex-1"
          />
          <Button onClick={handleSubmit} disabled={!newComment.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
