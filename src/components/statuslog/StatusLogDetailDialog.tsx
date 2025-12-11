import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusLog } from "@/lib/statusLogService";
import { format } from "date-fns";
import { Edit, ArrowRight, CheckCircle, X } from "lucide-react";
import DOMPurify from "dompurify";

interface StatusLogDetailDialogProps {
  log: StatusLog | null;
  open: boolean;
  onClose: () => void;
  onEdit: (log: StatusLog) => void;
  onConvert: (log: StatusLog) => void;
  onResolve: (id: string) => void;
}

export function StatusLogDetailDialog({
  log,
  open,
  onClose,
  onEdit,
  onConvert,
  onResolve,
}: StatusLogDetailDialogProps) {
  if (!log) return null;

  const getLogTypeBadge = (type: string) => {
    const colors = {
      issue: "status-destructive",
      blocker: "status-orange",
      plan: "status-info",
      update: "status-success",
      note: "status-neutral",
    };
    return <Badge className={colors[type as keyof typeof colors]}>{type}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: "status-warning",
      resolved: "status-success",
      archived: "status-neutral",
    };
    return <Badge className={colors[status as keyof typeof colors]}>{status}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-heading-md">{log.title}</DialogTitle>
              <div className="flex gap-sm mt-sm">
                {getLogTypeBadge(log.log_type)}
                {getStatusBadge(log.status)}
              </div>
            </div>
          </div>
          <DialogDescription>
            View detailed information about this status log entry.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-md mt-md">
          {log.description && (
            <div>
              <h4 className="text-body-sm font-semibold text-foreground mb-xs">Description</h4>
              <div 
                className="text-body-sm text-muted-foreground prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(log.description) }}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-md">
            <div>
              <h4 className="text-body-sm font-semibold text-foreground mb-xs">Entity</h4>
              <div className="flex gap-xs flex-wrap">
                {log.entity?.map((e) => (
                  <Badge key={e} variant="outline">{e}</Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-body-sm font-semibold text-foreground mb-xs">Platform</h4>
              <p className="text-body-sm text-muted-foreground">{log.platform || "-"}</p>
            </div>

            <div>
              <h4 className="text-body-sm font-semibold text-foreground mb-xs">Campaign</h4>
              <p className="text-body-sm text-muted-foreground">{log.campaign_name || "-"}</p>
            </div>

            <div>
              <h4 className="text-body-sm font-semibold text-foreground mb-xs">Created</h4>
              <p className="text-body-sm text-muted-foreground">
                {format(new Date(log.created_at), "MMM dd, yyyy 'at' HH:mm")}
              </p>
            </div>

            {log.task_id && (
              <div>
                <h4 className="text-body-sm font-semibold text-foreground mb-xs">Linked Task</h4>
                <Badge variant="secondary">Task #{log.task_id}</Badge>
              </div>
            )}
          </div>

          {/* Brief Log Specific Fields */}
          {log.log_type === 'brief' && (
            <div className="space-y-md mt-md pt-md border-t border-border">
              <h3 className="text-body font-semibold text-foreground">Brief Details</h3>
              
              {log.socialua_update && (
                <div>
                  <h4 className="text-body-sm font-semibold text-foreground mb-xs">Social UA Update</h4>
                  <div 
                    className="text-body-sm text-muted-foreground prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(log.socialua_update) }}
                  />
                </div>
              )}

              {log.ppc_update && (
                <div>
                  <h4 className="text-body-sm font-semibold text-foreground mb-xs">PPC Update</h4>
                  <div 
                    className="text-body-sm text-muted-foreground prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(log.ppc_update) }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-sm pt-md border-t mt-md">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-sm" />
            Close
          </Button>
          
          {log.status === 'active' && (
            <Button
              variant="outline"
              onClick={() => {
                onResolve(log.id);
                onClose();
              }}
            >
              <CheckCircle className="h-4 w-4 mr-sm" />
              Mark Resolved
            </Button>
          )}

          {!log.task_id && (
            <Button
              variant="outline"
              onClick={() => {
                onConvert(log);
                onClose();
              }}
            >
              <ArrowRight className="h-4 w-4 mr-sm" />
              Convert to Task
            </Button>
          )}

          <Button onClick={() => {
            onEdit(log);
            onClose();
          }}>
            <Edit className="h-4 w-4 mr-sm" />
            Edit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
