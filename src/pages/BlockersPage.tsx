import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

export default function BlockersPage() {
  const { userRole } = useAuth();
  const [blockers, setBlockers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlockers();

    const channel = supabase
      .channel('blockers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blockers' }, () => fetchBlockers())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchBlockers())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchBlockers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("blockers")
      .select(`
        *,
        tasks (
          id,
          title,
          status,
          priority,
          assignee_id
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      // Fetch assignee profiles
      const blockersWithProfiles = await Promise.all(
        (data || []).map(async (blocker) => {
          if (blocker.tasks?.assignee_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("name")
              .eq("user_id", blocker.tasks.assignee_id)
              .single();
            return { ...blocker, assignee_name: profile?.name };
          }
          return blocker;
        })
      );
      setBlockers(blockersWithProfiles);
    }
    setLoading(false);
  };

  const handleResolve = async (blockerId: string, taskId: string) => {
    const { error: blockerError } = await supabase
      .from("blockers")
      .update({ resolved: true })
      .eq("id", blockerId);

    const { error: taskError } = await supabase
      .from("tasks")
      .update({ status: "Ongoing", blocker_reason: null })
      .eq("id", taskId);

    if (blockerError || taskError) {
      toast({ title: "Error", description: "Failed to resolve blocker", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Blocker resolved" });
      await fetchBlockers();
    }
  };

  if (loading) return <div className="p-8">Loading blockers...</div>;

  const activeBlockers = blockers.filter(b => !b.resolved);
  const resolvedBlockers = blockers.filter(b => b.resolved);

  return (
    <div className="p-8 space-y-6">
      <PageHeader
        title="Task Blockers"
        description="Manage and resolve task blockers"
      />

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Active Blockers ({activeBlockers.length})</h2>
          <div className="grid gap-4">
            {activeBlockers.length > 0 ? (
              activeBlockers.map((blocker) => (
                <Card key={blocker.id} className="border-destructive">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{blocker.tasks?.title}</CardTitle>
                        <CardDescription className="mt-2">
                          <span className="font-medium">Blocker: </span>
                          {blocker.description}
                        </CardDescription>
                      </div>
                      <Badge variant="destructive">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Blocked
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="text-muted-foreground">Priority: </span>
                          <Badge variant={blocker.tasks?.priority === "High" ? "destructive" : "secondary"}>
                            {blocker.tasks?.priority}
                          </Badge>
                        </div>
                        {blocker.assignee_name && (
                          <div>
                            <span className="text-muted-foreground">Assigned to: </span>
                            {blocker.assignee_name}
                          </div>
                        )}
                        <div className="text-muted-foreground">
                          Blocked since: {format(new Date(blocker.created_at), "MMM dd, yyyy")}
                        </div>
                      </div>
                      {userRole === "admin" && (
                        <Button onClick={() => handleResolve(blocker.id, blocker.tasks.id)} variant="outline">
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Mark Resolved
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No active blockers
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Resolved Blockers ({resolvedBlockers.length})</h2>
          <div className="grid gap-4">
            {resolvedBlockers.length > 0 ? (
              resolvedBlockers.map((blocker) => (
                <Card key={blocker.id} className="opacity-60">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{blocker.tasks?.title}</CardTitle>
                        <CardDescription className="mt-2">{blocker.description}</CardDescription>
                      </div>
                      <Badge variant="outline">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Resolved
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No resolved blockers
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}