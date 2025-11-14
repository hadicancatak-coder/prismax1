import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
      issue: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      blocker: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
      plan: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      update: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      note: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    };
    return <Badge className={colors[type as keyof typeof colors]}>{type}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      resolved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      archived: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    };
    return <Badge className={colors[status as keyof typeof colors]}>{status}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl">{log.title}</DialogTitle>
              <div className="flex gap-2 mt-2">
                {getLogTypeBadge(log.log_type)}
                {getStatusBadge(log.status)}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {log.description && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Description</h4>
              <div 
                className="text-sm text-muted-foreground prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(log.description) }}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Entity</h4>
              <div className="flex gap-1 flex-wrap">
                {log.entity?.map((e) => (
                  <Badge key={e} variant="outline">{e}</Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Platform</h4>
              <p className="text-sm text-muted-foreground">{log.platform || "-"}</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Campaign</h4>
              <p className="text-sm text-muted-foreground">{log.campaign_name || "-"}</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Created</h4>
              <p className="text-sm text-muted-foreground">
                {format(new Date(log.created_at), "MMM dd, yyyy 'at' HH:mm")}
              </p>
            </div>

            {log.task_id && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1">Linked Task</h4>
                <Badge variant="secondary">Task #{log.task_id}</Badge>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
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
              <CheckCircle className="h-4 w-4 mr-2" />
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
              <ArrowRight className="h-4 w-4 mr-2" />
              Convert to Task
            </Button>
          )}

          <Button onClick={() => {
            onEdit(log);
            onClose();
          }}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
