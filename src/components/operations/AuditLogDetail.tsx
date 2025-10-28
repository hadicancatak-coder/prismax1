import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, ExternalLink, Edit } from "lucide-react";
import { useOperationLog, useOperationItems, useCreateOperationItem } from "@/hooks/useOperationLogs";
import { AuditItemCard } from "./AuditItemCard";
import { BulkItemsInput } from "./BulkItemsInput";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { EditAuditLogDialog } from "./EditAuditLogDialog";
import { DeleteAuditLogDialog } from "./DeleteAuditLogDialog";

export function AuditLogDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [newItemText, setNewItemText] = useState("");
  const { user } = useAuth();

  const { data: log, isLoading: logLoading } = useOperationLog(id!);
  const { data: items = [], isLoading: itemsLoading } = useOperationItems(id!);
  const createItem = useCreateOperationItem();

  const isAdmin = user?.user_metadata?.role === 'admin';

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim() || !id) return;

    await createItem.mutateAsync({
      audit_log_id: id,
      content: newItemText,
      order_index: items.length,
    });

    setNewItemText("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'archived':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (logLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!log) {
    return (
      <div className="container mx-auto p-6">
        <p>Audit log not found</p>
      </div>
    );
  }

  const pendingCount = items.filter(i => i.status === 'pending').length;
  const completedCount = items.filter(i => i.status === 'completed').length;
  const failedCount = items.filter(i => i.status === 'failed').length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/operations')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Logs
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <CardTitle className="text-2xl">{log.title}</CardTitle>
                {isAdmin && (
                  <div className="flex gap-2">
                    <EditAuditLogDialog log={log} />
                    <DeleteAuditLogDialog
                      logId={log.id}
                      logTitle={log.title}
                      itemCount={items?.length || 0}
                      hasLinkedTask={!!log.task_id}
                      onSuccess={() => navigate("/operations")}
                      variant="icon"
                    />
                  </div>
                )}
              </div>
              {log.description && (
                <CardDescription className="mt-2">{log.description}</CardDescription>
              )}
            </div>
            <Badge variant={getStatusColor(log.status)}>
              {log.status.replace('_', ' ')}
            </Badge>
          </div>
          
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Platform: {log.platform}</span>
            </div>
            {log.entity && log.entity.length > 0 && (
              <div className="flex items-center gap-2">
                <span>Entities:</span>
                {log.entity.map(e => (
                  <Badge key={e} variant="outline">{e}</Badge>
                ))}
              </div>
            )}
            {log.deadline && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Deadline: {new Date(log.deadline).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {log.task_id && (
            <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-primary">Linked Task</Badge>
                  <span className="text-sm font-medium">
                    Task automatically created for this audit log
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/tasks?id=${log.task_id}`)}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Task
                </Button>
              </div>
              
              {(log as any).tasks?.assignees && (log as any).tasks.assignees.length > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Assigned to:</span>
                  <div className="flex -space-x-2">
                    {(log as any).tasks.assignees.slice(0, 5).map((assignee: any) => (
                      <Avatar key={assignee.id} className="h-7 w-7 border-2 border-background">
                        <AvatarImage src={assignee.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {assignee.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {(log as any).tasks.assignees.length > 5 && (
                      <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                        +{(log as any).tasks.assignees.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Action Items ({items.length})</CardTitle>
              <CardDescription>
                {pendingCount} pending • {completedCount} completed • {failedCount} failed
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <BulkItemsInput auditLogId={id!} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddItem} className="mb-6">
            <div className="flex gap-2">
              <Input
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="Add a new item... (Press Enter)"
                className="flex-1"
              />
              <Button type="submit" disabled={!newItemText.trim() || createItem.isPending}>
                Add
              </Button>
            </div>
          </form>

          {itemsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No items yet. Add your first action item above or use bulk add.
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <AuditItemCard
                  key={item.id}
                  item={item}
                  auditLogId={id!}
                  index={index}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
