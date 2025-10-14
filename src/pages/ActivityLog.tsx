import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Activity, User, FileText, Briefcase, Flag, AlertCircle } from "lucide-react";
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
  task: FileText,
  project: Briefcase,
  campaign: Flag,
  blocker: AlertCircle,
};

const ACTION_COLORS = {
  created: "bg-green-500/10 text-green-500",
  updated: "bg-blue-500/10 text-blue-500",
  deleted: "bg-red-500/10 text-red-500",
  assigned: "bg-purple-500/10 text-purple-500",
  unassigned: "bg-orange-500/10 text-orange-500",
};

export default function ActivityLog() {
  const { userRole, loading: authLoading, roleLoading } = useAuth();
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");

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

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("activity_logs")
      .select(`
        *,
        user:profiles!activity_logs_user_id_fkey(name, username)
      `)
      .order("created_at", { ascending: false })
      .limit(200);

    if (!error && data) {
      const logsWithUserInfo = data.map((log: any) => ({
        ...log,
        user_name: log.user?.name,
        user_username: log.user?.username,
      }));
      setLogs(logsWithUserInfo);
    }
    setLoading(false);
  };

  const filteredLogs = logs.filter((log) => {
    const userMatch = selectedAssignees.length === 0 || selectedAssignees.includes(log.user_id);
    const entityMatch = entityFilter === "all" || log.entity_type === entityFilter;
    const actionMatch = actionFilter === "all" || log.action === actionFilter;
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

  const formatLogMessage = (log: ActivityLogEntry) => {
    const entityName = log.entity_type.charAt(0).toUpperCase() + log.entity_type.slice(1);
    
    if (log.action === "created") {
      return `Created ${entityName.toLowerCase()}`;
    }
    if (log.action === "assigned") {
      return `Assigned user to ${entityName.toLowerCase()}`;
    }
    if (log.action === "unassigned") {
      return `Unassigned user from ${entityName.toLowerCase()}`;
    }
    if (log.action === "updated" && log.field_name) {
      return `Updated ${log.field_name} from "${log.old_value}" to "${log.new_value}"`;
    }
    return `${log.action} ${entityName.toLowerCase()}`;
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Activity className="h-8 w-8" />
          Activity Log
        </h1>
        <p className="text-muted-foreground mt-1">
          Track all changes and activities across your workspace
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
