import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Activity, User, FileText, Briefcase, Flag, AlertCircle, CheckSquare, FolderKanban, Megaphone, Rocket } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
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
  created: "bg-green-500/10 text-green-500",
  updated: "bg-blue-500/10 text-blue-500",
  deleted: "bg-red-500/10 text-red-500",
  assigned: "bg-purple-500/10 text-purple-500",
  unassigned: "bg-orange-500/10 text-orange-500",
  commented: "bg-cyan-500/10 text-cyan-500",
};

export default function ActivityLog() {
  const { userRole, loading: authLoading, roleLoading } = useAuth();
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"member" | "admin">("member");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const LOGS_PER_PAGE = 50;

  // Move useEffect BEFORE early returns to follow Rules of Hooks
  useEffect(() => {
    if (!authLoading && !roleLoading && userRole === 'admin') {
      fetchLogs();
    }
  }, [authLoading, roleLoading, userRole]);

  // Wait for BOTH auth AND role to load
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading activity log...</div>
      </div>
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
    
    // Query 1: Fetch activity logs
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

    // Query 2: Fetch user profiles
    const userIds = [...new Set(data.map(log => log.user_id).filter(Boolean))];
    
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, username")
      .in("user_id", userIds);

    // Join in memory
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
    
    // Member view filter: only show relevant actions
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
    <div className="p-8 space-y-6">
      <PageHeader
        title="Activity Log"
        description="Track all changes and activities across your workspace"
      />

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Filters</CardTitle>
            <Select value={viewMode} onValueChange={(v) => setViewMode(v as "member" | "admin")}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">👥 Member View</SelectItem>
                <SelectItem value="admin">🔧 Admin View (All)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <AssigneeFilterBar
            selectedAssignees={selectedAssignees}
            selectedTeams={selectedTeams}
            onAssigneesChange={setSelectedAssignees}
            onTeamsChange={setSelectedTeams}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">Entity Type</Label>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
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
              <Label className="mb-2 block">Action</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
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
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Recent Activity ({filteredLogs.length})
          </CardTitle>
          <CardDescription>
            {filteredLogs.length === 0
              ? "No activity found"
              : `Showing ${filteredLogs.length} of ${logs.length} activities`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => {
                const EntityIcon = ENTITY_ICONS[log.entity_type as keyof typeof ENTITY_ICONS] || FileText;
                const actionColor = ACTION_COLORS[log.action as keyof typeof ACTION_COLORS] || "bg-gray-500/10 text-gray-500";

                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {log.user_name ? getInitials(log.user_name) : <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium">
                          {log.user_username || log.user_name || "Unknown User"}
                        </span>
                        <Badge variant="outline" className={`text-xs ${actionColor}`}>
                          {log.action}
                        </Badge>
                        <EntityIcon className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {log.entity_type}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
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
                <div className="flex justify-center mt-6">
                  <Button
                    onClick={() => {
                      const nextPage = page + 1;
                      setPage(nextPage);
                      fetchLogs(nextPage);
                    }}
                    variant="outline"
                  >
                    Load More ({logs.length} loaded)
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
