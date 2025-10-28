import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Circle, XCircle, Trash2, MessageSquare } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { OperationAuditItem } from "@/lib/operationsService";
import { useUpdateOperationItem, useDeleteOperationItem } from "@/hooks/useOperationLogs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { RichTextEditor } from "@/components/RichTextEditor";
import { AuditItemComments } from "./AuditItemComments";
import { useAuditItemComments } from "@/hooks/useAuditItemComments";

interface AuditItemCardProps {
  item: OperationAuditItem;
  auditLogId: string;
  index: number;
}


export function AuditItemCard({ item, auditLogId, index }: AuditItemCardProps) {
  const { user } = useAuth();
  const updateItem = useUpdateOperationItem();
  const deleteItem = useDeleteOperationItem();
  const [isDeleting, setIsDeleting] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const { data: comments } = useAuditItemComments(item.id);
  
  const isAdmin = user?.user_metadata?.role === 'admin';

  const handleStatusChange = (newStatus: string) => {
    updateItem.mutate({
      id: item.id,
      updates: { status: newStatus },
    });
  };

  const handleDelete = async () => {
    if (!isAdmin) return;
    setIsDeleting(true);
    await deleteItem.mutateAsync(item.id);
    setIsDeleting(false);
  };

  const getStatusIcon = () => {
    switch (item.status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      completed: "default",
      failed: "destructive",
    };

    return (
      <Badge variant={variants[item.status] || "secondary"}>
        {item.status}
      </Badge>
    );
  };

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {getStatusIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                {getStatusBadge()}
              </div>
              <RichTextEditor
                value={item.content}
                onSave={async (newContent) => {
                  await updateItem.mutateAsync({
                    id: item.id,
                    updates: { content: newContent }
                  });
                }}
                className="text-sm"
              />
            </div>

            {isAdmin && (
              <div className="flex items-center gap-1">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isDeleting}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Item</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this item? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Select
                value={item.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="h-8 w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {item.profiles && (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={item.profiles.avatar_url} />
                  <AvatarFallback>{item.profiles.name?.[0]}</AvatarFallback>
                </Avatar>
                <span className="text-muted-foreground">{item.profiles.name}</span>
              </div>
            )}
          </div>

          {item.completed_at && (
            <p className="text-xs text-muted-foreground mt-2">
              Completed {new Date(item.completed_at).toLocaleDateString()}
            </p>
          )}

          <Collapsible open={commentsOpen} onOpenChange={setCommentsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-start mt-2">
                <MessageSquare className="h-4 w-4 mr-2" />
                Comments
                {comments && comments.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {comments.length}
                  </Badge>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <AuditItemComments itemId={item.id} />
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </Card>
  );
}
