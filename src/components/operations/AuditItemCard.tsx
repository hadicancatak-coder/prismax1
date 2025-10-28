import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Circle, XCircle, Trash2, ExternalLink } from "lucide-react";
import { OperationAuditItem } from "@/lib/operationsService";
import { useUpdateOperationItem, useDeleteOperationItem } from "@/hooks/useOperationLogs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { InlineEditField } from "@/components/InlineEditField";

interface AuditItemCardProps {
  item: OperationAuditItem;
  auditLogId: string;
  index: number;
}

function LinkifiedText({ text }: { text: string }) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return (
    <>
      {parts.map((part, i) => 
        urlRegex.test(part) ? (
          <a 
            key={i} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : part
      )}
    </>
  );
}

export function AuditItemCard({ item, auditLogId, index }: AuditItemCardProps) {
  const { user } = useAuth();
  const updateItem = useUpdateOperationItem();
  const deleteItem = useDeleteOperationItem();
  const [isDeleting, setIsDeleting] = useState(false);
  
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
              <InlineEditField
                value={item.content}
                onSave={async (newContent) => {
                  await updateItem.mutateAsync({
                    id: item.id,
                    updates: { content: newContent }
                  });
                }}
                type="textarea"
                className="text-sm"
                renderContent={(content) => <LinkifiedText text={content} />}
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
        </div>
      </div>
    </Card>
  );
}
