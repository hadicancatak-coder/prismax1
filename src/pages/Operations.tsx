import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, FileText, ListChecks, AlertCircle, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CreateAuditLogDialog } from "@/components/operations/CreateAuditLogDialog";
import { DeleteAuditLogDialog } from "@/components/operations/DeleteAuditLogDialog";
import { useOperationLogs, useOperationStats } from "@/hooks/useOperationLogs";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

const ppcPlatforms = ["Google", "Search", "DGen", "PMax", "Display", "GDN", "YouTube"];
const socialPlatforms = ["Meta", "Facebook", "Instagram", "X", "TikTok", "Snap", "Reddit"];

export default function Operations() {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const isAdmin = userRole === 'admin';
  const [platformFilter, setPlatformFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [teamFilter, setTeamFilter] = useState<string>("all");

  const { data: allLogs = [], isLoading } = useOperationLogs({
    platform: platformFilter || undefined,
    status: statusFilter || undefined,
  });

  const { data: stats } = useOperationStats();

  // Filter by team
  const logs = teamFilter === "all" 
    ? allLogs 
    : allLogs.filter(log => {
        if (teamFilter === "PPC") return ppcPlatforms.includes(log.platform);
        if (teamFilter === "SocialUA") return socialPlatforms.includes(log.platform);
        return true;
      });

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Operations Audit Logs</h1>
          <p className="text-muted-foreground">
            Document and track account optimizations and action items
          </p>
        </div>
        <CreateAuditLogDialog />
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLogs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <ListChecks className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Items</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingItems}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Items</CardTitle>
              <ListChecks className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedItems}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Audit Logs</CardTitle>
            <div className="flex gap-2">
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  <SelectItem value="PPC">PPC Team</SelectItem>
                  <SelectItem value="SocialUA">SocialUA Team</SelectItem>
                </SelectContent>
              </Select>

              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Platforms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Platforms</SelectItem>
                  {ppcPlatforms.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                  {socialPlatforms.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No audit logs yet</p>
              <p className="text-muted-foreground mb-4">
                Create your first audit log to start tracking optimizations
              </p>
              <CreateAuditLogDialog />
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map(log => {
                const isPPC = ppcPlatforms.includes(log.platform);
                return (
                  <Card
                    key={log.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1" onClick={() => navigate(`/operations/${log.id}`)}>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              variant="outline" 
                              className={isPPC 
                                ? "bg-blue-500/10 text-blue-600 border-blue-200" 
                                : "bg-purple-500/10 text-purple-600 border-purple-200"
                              }
                            >
                              {isPPC ? "PPC" : "SocialUA"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{log.platform}</span>
                          </div>
                          <CardTitle className="text-lg">{log.title}</CardTitle>
                          {log.description && (
                            <CardDescription className="mt-1">
                              {log.description}
                            </CardDescription>
                          )}
                        </div>
                        <div className="flex items-start gap-2">
                          <Badge variant={getStatusColor(log.status)}>
                            {log.status.replace('_', ' ')}
                          </Badge>
                          {isAdmin && (
                            <div onClick={(e) => e.stopPropagation()}>
                              <DeleteAuditLogDialog
                                logId={log.id}
                                logTitle={log.title}
                                hasLinkedTask={!!log.task_id}
                                variant="icon"
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {log.entity && log.entity.length > 0 && (
                          <>
                            {log.entity.map(e => (
                              <Badge key={e} variant="secondary">
                                {e}
                              </Badge>
                            ))}
                          </>
                        )}
                        {log.deadline && (
                          <Badge variant="outline">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(log.deadline).toLocaleDateString()}
                          </Badge>
                        )}
                        {log.task_id && (
                          <Badge variant="default" className="gap-1">
                            <ExternalLink className="h-3 w-3" />
                            Task Linked
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
