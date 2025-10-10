import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, User, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function AdminPanel() {
  const { userRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userRole !== "admin") {
      navigate("/");
      return;
    }
    fetchData();
  }, [userRole, navigate]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch pending approval tasks
    const { data: pending } = await supabase
      .from("tasks")
      .select(`
        *,
        profiles:created_by(name),
        assignee:assignee_id(name)
      `)
      .eq("status", "Pending Approval")
      .order("created_at", { ascending: false });

    // Fetch all members with their task counts
    const { data: profiles } = await supabase
      .from("profiles")
      .select(`
        *,
        user_roles!inner(role),
        tasks_assigned:tasks!assignee_id(id, status)
      `);

    setPendingTasks(pending || []);
    setMembers(profiles || []);
    setLoading(false);
  };

  const handleApproval = async (taskId: string, approved: boolean) => {
    const { error } = await supabase
      .from("tasks")
      .update({ 
        status: approved ? "In Progress" : "Archived",
        pending_approval: !approved
      })
      .eq("id", taskId);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: approved ? "Task Approved" : "Task Rejected",
        description: `Task has been ${approved ? "approved and moved to In Progress" : "rejected and archived"}.`,
      });
      fetchData();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Admin Panel</h1>
        <p className="text-muted-foreground">Manage approvals and monitor team performance</p>
      </div>

      <Tabs defaultValue="approvals" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="approvals">
            Pending Approvals
            {pendingTasks.length > 0 && (
              <Badge className="ml-2 bg-gradient-primary">{pendingTasks.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="team">Team Overview</TabsTrigger>
        </TabsList>

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

        <TabsContent value="team" className="mt-6 space-y-4">
          <div className="grid gap-4">
            {members.map((member) => {
              const completedTasks = member.tasks_assigned?.filter((t: any) => t.status === "Completed").length || 0;
              const inProgressTasks = member.tasks_assigned?.filter((t: any) => t.status === "In Progress").length || 0;
              const totalTasks = member.tasks_assigned?.length || 0;

              return (
                <Card key={member.id} className="p-6 transition-all hover:shadow-medium animate-slide-up">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-foreground">{member.name}</h3>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          {member.user_roles[0]?.role || "member"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">{member.email}</p>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Total Tasks</p>
                          <p className="text-2xl font-bold text-foreground">{totalTasks}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">In Progress</p>
                          <p className="text-2xl font-bold text-warning">{inProgressTasks}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Completed</p>
                          <p className="text-2xl font-bold text-success">{completedTasks}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
