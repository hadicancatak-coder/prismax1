import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CreateAuditLogDialog } from "@/components/operations/CreateAuditLogDialog";
import { DeleteAuditLogDialog } from "@/components/operations/DeleteAuditLogDialog";
import { OperationFilters } from "@/components/operations/OperationFilters";
import { PageContainer, PageHeader, EmptyState, DataCard } from "@/components/layout";
import { getStatusBadgeVariant } from "@/lib/constants";
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

  // Status color now centralized in constants.ts

  return (
    <PageContainer>
      <PageHeader
        title="Operations Audit Logs"
        description="Document and track account optimizations and action items"
        actions={<CreateAuditLogDialog />}
      />

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-md">
          {[
            { label: "Total Logs", value: stats.totalLogs },
            { label: "In Progress", value: stats.inProgress },
            { label: "Pending Items", value: stats.pendingItems },
            { label: "Completed Items", value: stats.completedItems },
          ].map((stat) => (
            <DataCard key={stat.label} className="p-md">
              <div className="text-metadata text-muted-foreground mb-1">{stat.label}</div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          <CardSkeleton count={3} />
        </div>
      ) : logs.length === 0 ? (
        <DataCard>
          <EmptyState
            icon={FileText}
            title="No audit logs yet"
            description="Create your first audit log to start tracking optimizations"
          >
            <CreateAuditLogDialog />
          </EmptyState>
        </DataCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
          {logs.map(log => {
            const isPPC = ppcPlatforms.includes(log.platform);
            return (
              <DataCard
                key={log.id}
                interactive
                onClick={() => navigate(`/operations/${log.id}`)}
                className="p-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-sm mb-sm">
                      <Badge variant="outline" className="text-metadata">
                        {isPPC ? "PPC" : "SocialUA"}
                      </Badge>
                      <span className="text-metadata text-muted-foreground">{log.platform}</span>
                    </div>
                    <h3 className="text-body-sm font-medium text-foreground mb-1 truncate">{log.title}</h3>
                    {log.description && (
                      <p className="text-metadata text-muted-foreground line-clamp-2">
                        {log.description.replace(/<[^>]*>/g, '').substring(0, 100)}
                        {log.description.replace(/<[^>]*>/g, '').length > 100 && '...'}
                      </p>
                    )}
                  </div>
                  <div className="flex items-start gap-sm flex-shrink-0 ml-sm">
                    <Badge variant={getStatusBadgeVariant(log.status)} className="text-metadata">
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

                <div className="flex flex-wrap gap-xs mt-sm">
                  {log.entity?.map(e => (
                    <Badge key={e} variant="secondary" className="text-metadata">
                      {e}
                    </Badge>
                  ))}
                  {log.deadline && (
                    <Badge variant="outline" className="text-metadata">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(log.deadline).toLocaleDateString()}
                    </Badge>
                  )}
                  {log.task_id && (
                    <Badge variant="default" className="text-metadata gap-xs">
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
