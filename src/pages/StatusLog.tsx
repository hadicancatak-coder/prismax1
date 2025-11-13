import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, CheckCircle, ArrowRight, FileText } from "lucide-react";
import { useStatusLogs, useDeleteStatusLog, useResolveStatusLog, useStatusLogStats } from "@/hooks/useStatusLogs";
import { CreateStatusLogDialog } from "@/components/statuslog/CreateStatusLogDialog";
import { ConvertToTaskDialog } from "@/components/statuslog/ConvertToTaskDialog";
import { StatusLogFilters } from "@/components/statuslog/StatusLogFilters";
import { StatusLogFilters as Filters, StatusLog as StatusLogType } from "@/lib/statusLogService";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

const StatusLog = () => {
  const [filters, setFilters] = useState<Filters>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<StatusLogType | null>(null);
  const [convertingLog, setConvertingLog] = useState<StatusLogType | null>(null);
  const [deleteLogId, setDeleteLogId] = useState<string | null>(null);

  const { data: logs = [], isLoading } = useStatusLogs(filters);
  const { data: stats } = useStatusLogStats();
  const deleteMutation = useDeleteStatusLog();
  const resolveMutation = useResolveStatusLog();

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

  const handleEdit = (log: StatusLogType) => {
    setEditingLog(log);
    setIsCreateDialogOpen(true);
  };

  const handleConvert = (log: StatusLogType) => {
    setConvertingLog(log);
    setIsConvertDialogOpen(true);
  };

  const handleResolve = (id: string) => {
    resolveMutation.mutate(id);
  };

  const handleDelete = () => {
    if (deleteLogId) {
      deleteMutation.mutate(deleteLogId, {
        onSuccess: () => setDeleteLogId(null),
      });
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-12 py-6 lg:py-8 space-y-6 lg:space-y-8 bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-page-title">Status Log</h1>
            <p className="text-muted-foreground mt-1">
              Track issues, blockers, and updates per entity, platform, and campaign
            </p>
          </div>
        </div>
        <Button onClick={() => {
          setEditingLog(null);
          setIsCreateDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Log
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.issues}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Blockers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.blockers}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <StatusLogFilters filters={filters} onFiltersChange={setFilters} />

      {isLoading ? (
        <TableSkeleton columns={7} rows={8} />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No status logs found. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium max-w-xs">
                      <div className="truncate">{log.title}</div>
                      {log.description && (
                        <div className="text-xs text-muted-foreground truncate">{log.description}</div>
                      )}
                    </TableCell>
                    <TableCell>{getLogTypeBadge(log.log_type)}</TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {log.entity?.map((e) => (
                          <Badge key={e} variant="outline" className="text-xs">{e}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{log.platform || "-"}</TableCell>
                    <TableCell>{log.campaign_name || "-"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(log.created_at), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {!log.task_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleConvert(log)}
                            title="Convert to Task"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        )}
                        {log.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResolve(log.id)}
                            title="Mark Resolved"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(log)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteLogId(log.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      <CreateStatusLogDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        editingLog={editingLog}
      />

      <ConvertToTaskDialog
        open={isConvertDialogOpen}
        onOpenChange={setIsConvertDialogOpen}
        statusLog={convertingLog}
      />

      <AlertDialog open={!!deleteLogId} onOpenChange={() => setDeleteLogId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Status Log</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this status log? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StatusLog;
