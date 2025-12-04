import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CreateAuditLogDialog } from "@/components/operations/CreateAuditLogDialog";
import { DeleteAuditLogDialog } from "@/components/operations/DeleteAuditLogDialog";
import { OperationFilters } from "@/components/operations/OperationFilters";
import { PageContainer, PageHeader, EmptyState, DataCard } from "@/components/layout";
import { useOperationLogs, useOperationStats } from "@/hooks/useOperationLogs";
import { useAuth } from "@/hooks/useAuth";
import { CardSkeleton } from "@/components/skeletons/CardSkeleton";

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

  const logs = teamFilter === "all" 
    ? allLogs 
    : allLogs.filter(log => {
        if (teamFilter === "PPC") return ppcPlatforms.includes(log.platform);
        if (teamFilter === "SocialUA") return socialPlatforms.includes(log.platform);
        return true;
      });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'archived': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Operations Audit Logs"
        description="Document and track account optimizations and action items"
        actions={<CreateAuditLogDialog />}
      />

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Logs", value: stats.totalLogs },
            { label: "In Progress", value: stats.inProgress },
            { label: "Pending Items", value: stats.pendingItems },
            { label: "Completed Items", value: stats.completedItems },
          ].map((stat) => (
            <DataCard key={stat.label} className="p-4">
              <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
              <div className="text-3xl font-semibold text-foreground">{stat.value}</div>
            </DataCard>
          ))}
        </div>
      )}

      <OperationFilters
        platformFilter={platformFilter}
        statusFilter={statusFilter}
        teamFilter={teamFilter}
        onPlatformChange={setPlatformFilter}
        onStatusChange={setStatusFilter}
        onTeamChange={setTeamFilter}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton count={3} />
        </div>
      ) : logs.length === 0 ? (
        <DataCard>
          <EmptyState
            icon={FileText}
            title="No audit logs yet"
            description="Create your first audit log to start tracking optimizations"
            action={{
              label: "Create Audit Log",
              onClick: () => {}
            }}
          >
            <CreateAuditLogDialog />
          </EmptyState>
        </DataCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {logs.map(log => {
            const isPPC = ppcPlatforms.includes(log.platform);
            return (
              <DataCard
                key={log.id}
                interactive
                onClick={() => navigate(`/operations/${log.id}`)}
                className="p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {isPPC ? "PPC" : "SocialUA"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{log.platform}</span>
                    </div>
                    <h3 className="text-sm font-medium text-foreground mb-1 truncate">{log.title}</h3>
                    {log.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {log.description.replace(/<[^>]*>/g, '').substring(0, 100)}
                        {log.description.replace(/<[^>]*>/g, '').length > 100 && '...'}
                      </p>
                    )}
                  </div>
                  <div className="flex items-start gap-2 flex-shrink-0 ml-2">
                    <Badge variant={getStatusColor(log.status)} className="text-xs">
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

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {log.entity?.map(e => (
                    <Badge key={e} variant="secondary" className="text-xs">
                      {e}
                    </Badge>
                  ))}
                  {log.deadline && (
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(log.deadline).toLocaleDateString()}
                    </Badge>
                  )}
                  {log.task_id && (
                    <Badge variant="default" className="text-xs gap-1">
                      <ExternalLink className="h-3 w-3" />
                      Task
                    </Badge>
                  )}
                </div>
              </DataCard>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
