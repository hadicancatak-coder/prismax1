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
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [teamFilter, setTeamFilter] = useState<string>("all");

  const { data: allLogs = [], isLoading } = useOperationLogs({
    platform: platformFilter && platformFilter !== "all" ? platformFilter : undefined,
    status: statusFilter && statusFilter !== "all" ? statusFilter : undefined,
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
    <div className="px-4 sm:px-6 lg:px-12 py-6 lg:py-8 space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-page-title">Operations Audit Logs</h1>
          <p className="text-body text-muted-foreground">
            Document and track account optimizations and action items
          </p>
        </div>
        <CreateAuditLogDialog />
      </div>

      {stats && (
        <div className="flex items-center gap-6 lg:gap-8 py-6 border-b border-border overflow-x-auto">
          <div className="flex-1 min-w-[120px]">
            <div className="text-metadata mb-1">Total Logs</div>
            <div className="text-4xl font-semibold text-foreground">{stats.totalLogs}</div>
          </div>
          <div className="w-px h-12 bg-border" />
          <div className="flex-1 min-w-[120px]">
            <div className="text-metadata mb-1">In Progress</div>
            <div className="text-4xl font-semibold text-foreground">{stats.inProgress}</div>
          </div>
          <div className="w-px h-12 bg-border" />
          <div className="flex-1 min-w-[120px]">
            <div className="text-metadata mb-1">Pending Items</div>
            <div className="text-4xl font-semibold text-foreground">{stats.pendingItems}</div>
          </div>
          <div className="w-px h-12 bg-border" />
          <div className="flex-1">
            <div className="text-metadata mb-1">Completed Items</div>
            <div className="text-4xl font-semibold text-foreground">{stats.completedItems}</div>
          </div>
        </div>
      )}

      <div className="border border-border rounded">
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-section-title">Audit Logs</h2>
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
                  <SelectItem value="all">All Platforms</SelectItem>
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
        </div>
        <div className="p-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-section-title mb-2">No audit logs yet</p>
              <p className="text-body text-muted-foreground mb-4">
                Create your first audit log to start tracking optimizations
              </p>
              <CreateAuditLogDialog />
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map(log => {
                const isPPC = ppcPlatforms.includes(log.platform);
                return (
                  <div
                    key={log.id}
                    className="border border-border rounded p-4 hover:border-primary transition-smooth cursor-pointer"
                    onClick={() => navigate(`/operations/${log.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">
                            {isPPC ? "PPC" : "SocialUA"}
                          </Badge>
                          <span className="text-metadata">{log.platform}</span>
                        </div>
                        <h3 className="text-body font-medium mb-1">{log.title}</h3>
                        {log.description && (
                          <p className="text-body text-muted-foreground">
                            {log.description}
                          </p>
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
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
