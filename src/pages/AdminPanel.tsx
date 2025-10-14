import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, User, Clock, CheckSquare, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { TaskDialog } from "@/components/TaskDialog";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { UserManagementDialog } from "@/components/UserManagementDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminPanel() {
  const { userRole, loading: authLoading, roleLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [userManagementOpen, setUserManagementOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);

  useEffect(() => {
    // Wait for BOTH auth AND role to load
    if (authLoading || roleLoading) {
      console.log('⏳ Loading...', { authLoading, roleLoading, userRole });
      return;
    }
    
    console.log('✅ Loaded, checking role:', { userRole });
    
    if (userRole !== 'admin') {
      toast({
        title: "Access Denied",
        description: "You need admin privileges to access this page",
        variant: "destructive",
      });
      navigate('/');
      return;
    }
    
    fetchData();

    const channel = supabase
      .channel("admin-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authLoading, roleLoading, userRole, navigate]);

  const fetchData = async () => {
    setLoading(true);
    
    // Parallel queries for better performance
    const [
      { data: allTasksData },
      { data: pendingTasksData },
      { data: profilesWithRoles }
    ] = await Promise.all([
      // Query 1: All tasks with FULL fields
      supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false }),
      
      // Query 2: Pending approval tasks (full data)
      supabase
        .from("tasks")
        .select("*")
        .eq("pending_approval", true)
        .order("approval_requested_at", { ascending: false }),
      
      // Query 3: Profiles with roles
      supabase
        .from("profiles")
        .select(`
          user_id, 
          name, 
          email, 
          username, 
          avatar_url,
          user_roles!inner(role)
        `)
    ]);

    // Query 4: Fetch profiles for task assignees and requesters
    const allUserIds = [
      ...new Set([
        ...(allTasksData || []).map(t => t.assignee_id).filter(Boolean),
        ...(pendingTasksData || []).map(t => t.assignee_id).filter(Boolean),
        ...(pendingTasksData || []).map(t => t.approval_requested_by).filter(Boolean),
      ])
    ];

    const { data: taskProfiles } = await supabase
      .from("profiles")
      .select("user_id, name, avatar_url")
      .in("user_id", allUserIds);

    const profileMap = new Map(taskProfiles?.map(p => [p.user_id, p]) || []);

    // Enrich tasks with assignee data
    const enrichedAllTasks = (allTasksData || []).map(task => ({
      ...task,
      assignee: task.assignee_id ? profileMap.get(task.assignee_id) : null,
    }));

    const enrichedPendingTasks = (pendingTasksData || []).map(task => ({
      ...task,
      requester: task.approval_requested_by ? profileMap.get(task.approval_requested_by) : null,
      assignee: task.assignee_id ? profileMap.get(task.assignee_id) : null,
    }));

    // Build member statistics in memory
    const memberStats = (profilesWithRoles || []).map(profile => {
      const memberTasks = enrichedAllTasks.filter(t => t.assignee_id === profile.user_id);
      const totalTasks = memberTasks.length;
      const completedTasks = memberTasks.filter(t => t.status === "Completed").length;
      const inProgressTasks = memberTasks.filter(t => t.status === "Ongoing").length;
      const blockedTasks = memberTasks.filter(t => t.status === "Blocked");
      const pendingTasks = memberTasks.filter(t => t.status === "Pending").length;
      
      return {
        user_id: profile.user_id,
        name: profile.name,
        email: profile.email,
        username: profile.username,
        avatar_url: profile.avatar_url,
        role: (profile as any).user_roles?.[0]?.role || 'member',
        totalTasks,
        completedTasks,
        inProgressTasks,
        blockedTasks: blockedTasks.length,
        pendingTasks,
        blockerDetails: blockedTasks
      };
    });

    setAllTasks(enrichedAllTasks);
    setPendingTasks(enrichedPendingTasks);
    setMembers(memberStats);
    setLoading(false);
  };

  const handleApproval = async (taskId: string, approved: boolean) => {
    const task = pendingTasks.find(t => t.id === taskId);
    if (!task) return;
    
    if (approved) {
      const { error } = await supabase
        .from("tasks")
        .update({ 
          status: task.requested_status,
          pending_approval: false,
          approval_requested_at: null,
          approval_requested_by: null,
          requested_status: null
        })
        .eq("id", taskId);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }

      if (task.approval_requested_by) {
        await supabase.from("notifications").insert({
          user_id: task.approval_requested_by,
          type: "status_change_approved",
          payload_json: { 
            task_id: taskId, 
            task_title: task.title,
            new_status: task.requested_status,
            message: `Your request to mark "${task.title}" as ${task.requested_status} has been approved`
          }
        });
      }

      toast({ title: "✅ Approved", description: `Task marked as ${task.requested_status}` });
    } else {
      const { error } = await supabase
        .from("tasks")
        .update({ 
          pending_approval: false,
          approval_requested_at: null,
          approval_requested_by: null,
          requested_status: null
        })
        .eq("id", taskId);

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }

      if (task.approval_requested_by) {
        await supabase.from("notifications").insert({
          user_id: task.approval_requested_by,
          type: "status_change_rejected",
          payload_json: { 
            task_id: taskId, 
            task_title: task.title,
            requested_status: task.requested_status,
            message: `Your request to mark "${task.title}" as ${task.requested_status} was rejected`
          }
        });
      }

      toast({ title: "❌ Rejected", description: "Status change request rejected" });
    }
    
    await fetchData();
  };

  const handleRoleChange = async (userId: string, newRole: "admin" | "member") => {
    const { error } = await supabase
      .from("user_roles")
      .update({ role: newRole })
      .eq("user_id", userId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Role Updated",
      description: `User role has been updated to ${newRole}`,
    });

    await fetchData();
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;

    try {
      // Delete from user_roles
      await supabase.from("user_roles").delete().eq("user_id", memberToRemove);
      
      // Delete from profiles
      await supabase.from("profiles").delete().eq("user_id", memberToRemove);

      toast({
        title: "Member Removed",
        description: "User has been removed successfully",
      });

      setMemberToRemove(null);
      setRemoveDialogOpen(false);
      await fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove member",
        variant: "destructive",
      });
    }
  };

  // Show loading while checking permissions
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading admin panel...</div>
      </div>
    );
  }
  
  // Don't render if not admin (though useEffect should redirect)
  if (userRole !== "admin") {
    return null;
  }

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="bg-gradient-primary p-4 rounded-lg mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">🛡️ Admin Panel</h1>
        <p className="text-white/90">Manage approvals and monitor team performance</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Tabs defaultValue="tasks" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tasks">All Tasks</TabsTrigger>
              <TabsTrigger value="approvals">
                Pending Approvals
                {pendingTasks.length > 0 && (
                  <Badge className="ml-2 bg-gradient-primary">{pendingTasks.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

        <TabsContent value="tasks" className="mt-6">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Title</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Priority</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Assignee</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allTasks.map((task) => (
                    <tr
                      key={task.id}
                      className="hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedTaskId(task.id);
                        setTaskDialogOpen(true);
                      }}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{task.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">{task.description || "No description"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={
                            task.status === "Ongoing"
                              ? "bg-warning/10 text-warning border-warning/20"
                              : task.status === "Pending"
                              ? "bg-pending/10 text-pending border-pending/20"
                              : task.status === "Completed"
                              ? "bg-success/10 text-success border-success/20"
                              : task.status === "Failed"
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : "bg-muted text-muted-foreground border-border"
                          }
                        >
                          {task.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={
                            task.priority === "High"
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : task.priority === "Medium"
                              ? "bg-warning/10 text-warning border-warning/20"
                              : "bg-muted text-muted-foreground border-border"
                          }
                        >
                          {task.priority}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {task.assignee ? (
                            <>
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={task.assignee.avatar_url || ""} />
                                <AvatarFallback className="text-xs">
                                  {task.assignee.name?.[0] || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-foreground">{task.assignee.name}</span>
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">Unassigned</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {task.due_at ? new Date(task.due_at).toLocaleDateString() : "No due date"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="mt-6 space-y-4">
          {pendingTasks.length > 0 ? (
            pendingTasks.map((task) => (
              <Card key={task.id} className="p-6 transition-all hover:shadow-medium animate-scale-in">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">{task.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{task.description}</p>
                    <div className="flex gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>Created by {task.profiles?.name || "Unknown"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(task.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Badge variant="outline" className={
                        task.priority === "High" ? "bg-destructive/10 text-destructive border-destructive/20" :
                        task.priority === "Medium" ? "bg-warning/10 text-warning border-warning/20" :
                        "bg-muted text-muted-foreground"
                      }>
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 hover:bg-success/10 hover:text-success hover:border-success/20"
                      onClick={() => handleApproval(task.id, true)}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
                      onClick={() => handleApproval(task.id, false)}
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No pending approvals</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
        </div>

        <div className="col-span-1">
          <div className="sticky top-24">
            <Card className="p-6 max-h-[calc(100vh-12rem)] overflow-y-auto bg-card/50 backdrop-blur border-2">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button
                  className="w-full justify-start gap-2"
                  variant="outline"
                  onClick={() => setCreateTaskDialogOpen(true)}
                >
                  <CheckSquare className="h-4 w-4" />
                  Create Task
                </Button>
                <Button
                  className="w-full justify-start gap-2"
                  variant="outline"
                  onClick={() => setUserManagementOpen(true)}
                >
                  <User className="h-4 w-4" />
                  Manage Users
                </Button>
              </div>

              {pendingTasks.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Approvals Needed ({pendingTasks.length})
                  </h3>
                  <div className="space-y-2">
                    {pendingTasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        className="p-3 bg-muted/30 rounded-lg text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          setSelectedTaskId(task.id);
                          setTaskDialogOpen(true);
                        }}
                      >
                        <p className="font-medium text-foreground line-clamp-1">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          by {task.profiles?.name}
                        </p>
                      </div>
                    ))}
                    {pendingTasks.length > 3 && (
                      <p className="text-xs text-center text-muted-foreground pt-2">
                        +{pendingTasks.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {selectedTaskId && (
        <TaskDialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen} taskId={selectedTaskId} />
      )}

      <CreateTaskDialog 
        open={createTaskDialogOpen} 
        onOpenChange={setCreateTaskDialogOpen}
      />

      <UserManagementDialog
        open={userManagementOpen}
        onOpenChange={setUserManagementOpen}
      />

      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member? This will delete their profile and role permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveMember}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
