import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Activity, User, FileText, Briefcase, Flag, AlertCircle, CheckSquare, FolderKanban, Megaphone, Rocket } from "lucide-react";
import { PageContainer, PageHeader, DataCard, DataCardHeader } from "@/components/layout";
import { AssigneeFilterBar } from "@/components/AssigneeFilterBar";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ActivityLogEntry {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  metadata?: any;
  created_at: string;
  user_name?: string;
  user_username?: string;
}

const ENTITY_ICONS = {
  task: CheckSquare,
  project: FolderKanban,
  campaign: Megaphone,
  blocker: AlertCircle,
  launch_campaign: Rocket,
  ad: Megaphone,
};

const ACTION_COLORS = {
  created: "bg-success/10 text-success",
  updated: "bg-primary/10 text-primary",
  deleted: "bg-destructive/10 text-destructive",
  assigned: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  unassigned: "bg-warning/10 text-warning",
  commented: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
};

export default function ActivityLog() {
  const { userRole, loading: authLoading, roleLoading } = useAuth();
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"member" | "admin">("member");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const LOGS_PER_PAGE = 50;

  useEffect(() => {
    if (!authLoading && !roleLoading && userRole === 'admin') {
      fetchLogs();
    }
  }, [authLoading, roleLoading, userRole]);

  if (authLoading || roleLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading activity log...</div>
        </div>
      </PageContainer>
    );
  }

  if (userRole !== 'admin') {
    console.warn('❌ Access denied - not admin');
    return <Navigate to="/" replace />;
  }

  const fetchLogs = async (pageNum = 1) => {
    setLoading(true);
    const from = (pageNum - 1) * LOGS_PER_PAGE;
    const to = from + LOGS_PER_PAGE - 1;
    
    const { data, error, count } = await supabase
      .from("activity_logs")
      .select("*", { count: 'exact' })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching activity logs:", error);
      toast.error("Failed to load activity logs");
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setLogs([]);
      setHasMore(false);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(data.map(log => log.user_id).filter(Boolean))];
    
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, username")
      .in("user_id", userIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
    
    const logsWithUserInfo = data.map((log: any) => ({
      ...log,
      user_name: profileMap.get(log.user_id)?.name,
      user_username: profileMap.get(log.user_id)?.username,
    }));
    
    if (pageNum === 1) {
      setLogs(logsWithUserInfo);
    } else {
      setLogs(prev => [...prev, ...logsWithUserInfo]);
    }
    
    setHasMore(data.length === LOGS_PER_PAGE);
    setLoading(false);
  };

  const filteredLogs = logs.filter((log) => {
    const userMatch = selectedAssignees.length === 0 || selectedAssignees.includes(log.user_id);
    const entityMatch = entityFilter === "all" || log.entity_type === entityFilter;
    const actionMatch = actionFilter === "all" || log.action === actionFilter;
    
    if (viewMode === "member") {
      const memberRelevantActions = ["created", "commented", "assigned", "unassigned"];
      const isStatusUpdate = log.action === "updated" && (log.field_name === "status" || log.field_name === "approval_status");
      
      if (!memberRelevantActions.includes(log.action) && !isStatusUpdate) {
        return false;
      }
    }
    
    return userMatch && entityMatch && actionMatch;
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusEmoji = (status: string) => {
    const emojiMap: Record<string, string> = {
      'Pending': '⏳',
      'Ongoing': '🔄',
      'Completed': '✅',
      'Failed': '❌',
      'Blocked': '🚫',
      'pending': '⏳',
      'approved': '✅',
      'rejected': '❌',
    };
    return emojiMap[status] || '';
  };

  const formatLogMessage = (log: ActivityLogEntry) => {
    const entityName = log.entity_type.charAt(0).toUpperCase() + log.entity_type.slice(1);
    
    if (log.action === "created") {
      return `Created ${entityName.toLowerCase()}`;
    }
    if (log.action === "commented") {
      const preview = log.new_value ? `"${log.new_value}"` : '';
      return `Commented on ${entityName.toLowerCase()} ${preview}`;
    }
    if (log.action === "assigned") {
      return `Assigned user to ${entityName.toLowerCase()}`;
    }
    if (log.action === "unassigned") {
      return `Unassigned user from ${entityName.toLowerCase()}`;
    }
    if (log.action === "updated" && log.field_name) {
      if (log.field_name === "status" || log.field_name === "approval_status") {
        const oldEmoji = getStatusEmoji(log.old_value || "");
        const newEmoji = getStatusEmoji(log.new_value || "");
        return `Changed status ${oldEmoji} ${log.old_value || "none"} → ${newEmoji} ${log.new_value || "none"}`;
      }
      return `Updated ${log.field_name} from "${log.old_value}" to "${log.new_value}"`;
    }
    return `${log.action} ${entityName.toLowerCase()}`;
  };

  return (
    <PageContainer>
      <PageHeader
        icon={Activity}
        title="Activity Log"
        description="Track all changes and activities across your workspace"
      />

      {/* Filters */}
      <DataCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[18px] font-medium text-foreground">Filters</h3>
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as "member" | "admin")}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">👥 Member View</SelectItem>
              <SelectItem value="admin">🔧 Admin View</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-4">
          <AssigneeFilterBar
            selectedAssignees={selectedAssignees}
            onAssigneesChange={setSelectedAssignees}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block text-[13px] text-muted-foreground">Entity Type</Label>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="task">Tasks</SelectItem>
                  <SelectItem value="project">Projects</SelectItem>
                  <SelectItem value="campaign">Campaigns</SelectItem>
                  <SelectItem value="blocker">Blockers</SelectItem>
                  <SelectItem value="launch_campaign">Launch Campaigns</SelectItem>
                  <SelectItem value="ad">Ads</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block text-[13px] text-muted-foreground">Action</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="updated">Updated</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  <SelectItem value="commented">Commented</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </DataCard>

      {/* Activity Timeline */}
      <DataCard>
        <DataCardHeader 
          title={`Recent Activity (${filteredLogs.length})`}
          description={
            filteredLogs.length === 0
              ? "No activity found"
              : `Showing ${filteredLogs.length} of ${logs.length} activities`
          }
        />
        
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => {
              const EntityIcon = ENTITY_ICONS[log.entity_type as keyof typeof ENTITY_ICONS] || FileText;
              const actionColor = ACTION_COLORS[log.action as keyof typeof ACTION_COLORS] || "bg-muted text-muted-foreground";

              return (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs bg-muted">
                      {log.user_name ? getInitials(log.user_name) : <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[14px] font-medium text-foreground">
                        {log.user_username || log.user_name || "Unknown User"}
                      </span>
                      <Badge variant="outline" className={`text-xs ${actionColor}`}>
                        {log.action}
                      </Badge>
                      <EntityIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {log.entity_type}
                      </span>
                    </div>
                    
                    <p className="text-[13px] text-muted-foreground">
                      {formatLogMessage(log)}
                    </p>
                  </div>

                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(log.created_at), "MMM dd, HH:mm")}
                  </div>
                </div>
              );
            })}
            
            {hasMore && !loading && (
              <div className="flex justify-center pt-4">
                <Button
                  onClick={() => {
                    const nextPage = page + 1;
                    setPage(nextPage);
                    fetchLogs(nextPage);
                  }}
                  variant="outline"
                  className="rounded-full"
                >
                  Load More ({logs.length} loaded)
                </Button>
              </div>
            )}
          </div>
        )}
      </DataCard>
    </PageContainer>
  );
}
