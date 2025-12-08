import { useState } from "react";
import DOMPurify from "dompurify";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  useAuditItemComments,
  useCreateAuditItemComment,
  useDeleteAuditItemComment,
} from "@/hooks/useAuditItemComments";
import { useAuth } from "@/hooks/useAuth";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AuditItemCommentsProps {
  itemId: string;
}

export function AuditItemComments({ itemId }: AuditItemCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const { data: comments, isLoading } = useAuditItemComments(itemId);
  const createComment = useCreateAuditItemComment();
  const deleteComment = useDeleteAuditItemComment();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    await createComment.mutateAsync({
      itemId,
      body: newComment,
    });
    setNewComment("");
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (showDeleteConfirm) {
      await deleteComment.mutateAsync(showDeleteConfirm);
      setShowDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading comments...</div>
        ) : comments && comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={comment.author?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {comment.author?.name?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{comment.author?.name || "Unknown"}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                </div>
                <div 
                  className="text-sm prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.body) }}
                />
              </div>
              {user?.id === comment.author_id && (
                <AlertDialog open={showDeleteConfirm === comment.id} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(comment.id); }}
                      className="flex-shrink-0 h-8 w-8 p-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="z-overlay" onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this comment?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          ))
        ) : (
          <div className="text-sm text-muted-foreground">No comments yet</div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <RichTextEditor
          value={newComment}
          onChange={setNewComment}
          placeholder="Add a comment..."
          minHeight="60px"
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={!newComment.trim() || createComment.isPending}>
            {createComment.isPending ? "Sending..." : "Send"}
          </Button>
        </div>
      </form>
    </div>
  );
}
